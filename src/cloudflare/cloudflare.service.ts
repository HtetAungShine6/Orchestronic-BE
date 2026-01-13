/**
 * Cloudflare DNS automation for delegated resource-group subzones.
 *
 * Required env vars:
 * - CLOUDFLARE_API_TOKEN
 * - CLOUDFLARE_BASE_URL            (e.g. https://api.cloudflare.com/client/v4)
 * - CLOUDFLARE_ACCOUNT_ID
 * - CLOUDFLARE_PARENT_ZONE_ID      (zone id for orchestronic.dev)
 *
 * Example usage:
 *   await ensureDelegatedResourceGroup({ resourceGroup: "ninja", edgePublicIp: "123.196.12.16", proxied: true })
 */

import type { AxiosError } from 'axios';
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

type CfRecordType = 'A' | 'CNAME' | 'NS';

type CfApiError = {
  code: number;
  message: string;
};

type CfApiResponse<T> = {
  success: boolean;
  errors?: CfApiError[];
  messages?: unknown[];
  result: T;
};

type CfZone = {
  id: string;
  name: string;
  name_servers?: string[];
};

type CfDnsRecord = {
  id: string;
  type: CfRecordType;
  name: string;
  content: string;
  ttl: number;
  proxied?: boolean;
};

type DnsRecordUpsertAction = 'created' | 'updated' | 'unchanged';

type UpsertDnsRecordResult = {
  action: DnsRecordUpsertAction;
  record: CfDnsRecord;
  deletedDuplicateIds?: string[];
};

type ReconcileNsRecordsResult = {
  name: string;
  desiredTargets: string[];
  existingTargets: string[];
  created: CfDnsRecord[];
  updated: CfDnsRecord[];
  deleted: { id: string; content: string }[];
  unchanged: CfDnsRecord[];
};

@Injectable()
export class CloudflareService {
  constructor(private readonly http: HttpService) {}

  private readonly parentZoneName = 'orchestronic.dev';

  private getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
      throw new Error(`Missing required env var: ${name}`);
    }
    return value.trim();
  }

  private get baseUrl(): string {
    const raw = this.getRequiredEnv('CLOUDFLARE_BASE_URL');
    return raw.endsWith('/') ? raw.slice(0, -1) : raw;
  }

  private get apiToken(): string {
    return this.getRequiredEnv('CLOUDFLARE_API_TOKEN');
  }

  private get accountId(): string {
    return this.getRequiredEnv('CLOUDFLARE_ACCOUNT_ID');
  }

  private get parentZoneId(): string {
    return this.getRequiredEnv('CLOUDFLARE_PARENT_ZONE_ID');
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json',
    };
  }

  private formatCfErrors(errors?: CfApiError[]): string {
    if (!errors || errors.length === 0) {
      return '(no Cloudflare errors provided)';
    }
    return errors.map((e) => `[${e.code}] ${e.message}`).join('; ');
  }

  private isAxiosError(err: unknown): err is AxiosError {
    return (
      typeof err === 'object' &&
      err !== null &&
      'isAxiosError' in err &&
      (err as { isAxiosError?: unknown }).isAxiosError === true
    );
  }

  private async cfRequest<T>(params: {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    data?: unknown;
  }): Promise<T> {
    const url = `${this.baseUrl}${params.path}`;

    try {
      const res = await firstValueFrom(
        this.http.request<CfApiResponse<T>>({
          method: params.method,
          url,
          headers: this.headers,
          params: params.query,
          data: params.data,
        }),
      );

      const body = res.data;
      if (!body?.success) {
        throw new Error(
          `Cloudflare API error (${params.method} ${params.path}): ${this.formatCfErrors(
            body?.errors,
          )}`,
        );
      }

      return body.result;
    } catch (err: unknown) {
      if (!this.isAxiosError(err)) {
        throw new Error(
          `Cloudflare request failed (${params.method} ${params.path}): ${String(err)}`,
        );
      }

      const status = err.response?.status;
      const statusText = err.response?.statusText;
      const body = err.response?.data as CfApiResponse<unknown> | undefined;
      const cfErrors = body?.errors
        ? this.formatCfErrors(body.errors)
        : undefined;

      const httpPart = status
        ? `HTTP ${status}${statusText ? ` ${statusText}` : ''}`
        : undefined;
      const cfPart = cfErrors ? `Cloudflare: ${cfErrors}` : undefined;
      const details = [httpPart, cfPart].filter(Boolean).join(' | ');

      throw new Error(
        `Cloudflare request failed (${params.method} ${params.path})${
          details ? `: ${details}` : ''
        }`,
      );
    }
  }

  private normalizeResourceGroup(input: string): string {
    const trimmed = (input ?? '').trim().toLowerCase();
    if (!trimmed) throw new Error('resourceGroup is required');
    return trimmed.startsWith('rg-') ? trimmed : `rg-${trimmed}`;
  }

  async getZoneByName(zoneName: string): Promise<CfZone | null> {
    const name = zoneName.trim();
    if (!name) throw new Error('zoneName is required');

    const zones = await this.cfRequest<CfZone[]>({
      method: 'GET',
      path: '/zones',
      query: { name },
    });

    return zones[0] ?? null;
  }

  async ensureZone(
    zoneName: string,
  ): Promise<{ action: 'created' | 'reused'; zone: CfZone }> {
    const existing = await this.getZoneByName(zoneName);
    if (existing) return { action: 'reused', zone: existing };

    const zone = await this.cfRequest<CfZone>({
      method: 'POST',
      path: '/zones',
      data: {
        name: zoneName,
        account: { id: this.accountId },
        jump_start: false,
      },
    });

    return { action: 'created', zone };
  }

  private async listDnsRecords(params: {
    zoneId: string;
    type: CfRecordType;
    name: string;
  }): Promise<CfDnsRecord[]> {
    return this.cfRequest<CfDnsRecord[]>({
      method: 'GET',
      path: `/zones/${params.zoneId}/dns_records`,
      query: {
        type: params.type,
        name: params.name,
      },
    });
  }

  private async createDnsRecord(params: {
    zoneId: string;
    type: CfRecordType;
    name: string;
    content: string;
    ttl: number;
    proxied?: boolean;
  }): Promise<CfDnsRecord> {
    return this.cfRequest<CfDnsRecord>({
      method: 'POST',
      path: `/zones/${params.zoneId}/dns_records`,
      data: {
        type: params.type,
        name: params.name,
        content: params.content,
        ttl: params.ttl,
        ...(params.type === 'A' || params.type === 'CNAME'
          ? { proxied: params.proxied ?? true }
          : {}),
      },
    });
  }

  private async updateDnsRecord(params: {
    zoneId: string;
    recordId: string;
    type: CfRecordType;
    name: string;
    content: string;
    ttl: number;
    proxied?: boolean;
  }): Promise<CfDnsRecord> {
    return this.cfRequest<CfDnsRecord>({
      method: 'PUT',
      path: `/zones/${params.zoneId}/dns_records/${params.recordId}`,
      data: {
        type: params.type,
        name: params.name,
        content: params.content,
        ttl: params.ttl,
        ...(params.type === 'A' || params.type === 'CNAME'
          ? { proxied: params.proxied ?? true }
          : {}),
      },
    });
  }

  private async deleteDnsRecord(params: {
    zoneId: string;
    recordId: string;
  }): Promise<void> {
    await this.cfRequest<{ id: string }>({
      method: 'DELETE',
      path: `/zones/${params.zoneId}/dns_records/${params.recordId}`,
    });
  }

  /**
   * Generic single-record upsert for A/CNAME/NS.
   * - Searches by type+name.
   * - Creates if missing.
   * - Updates via PUT if content/ttl/proxied differ.
   * - If duplicates exist for A/CNAME, deletes extras to stay idempotent.
   */
  async upsertDnsRecord(params: {
    zoneId: string;
    type: CfRecordType;
    name: string;
    content: string;
    ttl?: number; // Cloudflare Auto is ttl=1
    proxied?: boolean; // only for A/CNAME
  }): Promise<UpsertDnsRecordResult> {
    const ttl = params.ttl ?? 1;
    const existing = await this.listDnsRecords({
      zoneId: params.zoneId,
      type: params.type,
      name: params.name,
    });

    if (existing.length === 0) {
      const record = await this.createDnsRecord({
        zoneId: params.zoneId,
        type: params.type,
        name: params.name,
        content: params.content,
        ttl,
        proxied: params.proxied,
      });
      return { action: 'created', record };
    }

    // If duplicates exist for a type that should be unique, keep the first and delete the rest.
    const deletedDuplicateIds: string[] = [];
    if (params.type === 'A' || params.type === 'CNAME') {
      for (const dup of existing.slice(1)) {
        await this.deleteDnsRecord({ zoneId: params.zoneId, recordId: dup.id });
        deletedDuplicateIds.push(dup.id);
      }
    }

    const current = existing[0];
    const desiredProxied =
      params.type === 'A' || params.type === 'CNAME'
        ? (params.proxied ?? true)
        : undefined;

    const needsUpdate =
      current.content !== params.content ||
      current.ttl !== ttl ||
      (params.type === 'A' || params.type === 'CNAME'
        ? (current.proxied ?? false) !== (desiredProxied ?? true)
        : false);

    if (!needsUpdate) {
      return {
        action: 'unchanged',
        record: current,
        ...(deletedDuplicateIds.length ? { deletedDuplicateIds } : {}),
      };
    }

    const record = await this.updateDnsRecord({
      zoneId: params.zoneId,
      recordId: current.id,
      type: params.type,
      name: params.name,
      content: params.content,
      ttl,
      proxied: desiredProxied,
    });

    return {
      action: 'updated',
      record,
      ...(deletedDuplicateIds.length ? { deletedDuplicateIds } : {}),
    };
  }

  /**
   * Ensures the NS delegation in the parent zone matches exactly the given targets.
   * - Creates missing NS records
   * - Deletes stale NS records (targets not in desired list)
   * - Updates ttl when needed
   */
  private async reconcileNsRecords(params: {
    zoneId: string;
    name: string;
    targets: string[];
    ttl?: number;
  }): Promise<ReconcileNsRecordsResult> {
    const ttl = params.ttl ?? 1;
    const desiredTargets = [
      ...new Set(params.targets.map((t) => t.trim()).filter(Boolean)),
    ];
    if (desiredTargets.length === 0) {
      throw new Error(
        `Cannot delegate ${params.name}: no name_servers provided by Cloudflare zone`,
      );
    }

    const existing = await this.listDnsRecords({
      zoneId: params.zoneId,
      type: 'NS',
      name: params.name,
    });

    const existingTargets = existing.map((r) => r.content);
    const desiredSet = new Set(desiredTargets);

    const created: CfDnsRecord[] = [];
    const updated: CfDnsRecord[] = [];
    const unchanged: CfDnsRecord[] = [];
    const deleted: { id: string; content: string }[] = [];

    // Delete stale targets
    for (const record of existing) {
      if (!desiredSet.has(record.content)) {
        await this.deleteDnsRecord({
          zoneId: params.zoneId,
          recordId: record.id,
        });
        deleted.push({ id: record.id, content: record.content });
      }
    }

    // Create missing targets
    const existingAfterDelete = existing.filter((r) =>
      desiredSet.has(r.content),
    );
    const existingAfterDeleteSet = new Set(
      existingAfterDelete.map((r) => r.content),
    );

    for (const target of desiredTargets) {
      if (!existingAfterDeleteSet.has(target)) {
        created.push(
          await this.createDnsRecord({
            zoneId: params.zoneId,
            type: 'NS',
            name: params.name,
            content: target,
            ttl,
          }),
        );
      }
    }

    // Ensure ttl is correct for kept records
    for (const record of existingAfterDelete) {
      if (record.ttl !== ttl) {
        updated.push(
          await this.updateDnsRecord({
            zoneId: params.zoneId,
            recordId: record.id,
            type: 'NS',
            name: params.name,
            content: record.content,
            ttl,
          }),
        );
      } else {
        unchanged.push(record);
      }
    }

    return {
      name: params.name,
      desiredTargets,
      existingTargets,
      created,
      updated,
      deleted,
      unchanged,
    };
  }

  /**
   * End-to-end idempotent workflow:
   * 1) Ensure delegated sub-zone exists (rg-<rg>.orchestronic.dev)
   * 2) In parent zone, reconcile NS delegation to match sub-zone name_servers
   * 3) In sub-zone, upsert wildcard A record (*.rg-<rg>.orchestronic.dev -> edgePublicIp) as proxied
   */
  async ensureDelegatedResourceGroup(params: {
    resourceGroup: string;
    edgePublicIp: string;
    proxied?: boolean;
  }) {
    const rg = this.normalizeResourceGroup(params.resourceGroup);
    const edgePublicIp = params.edgePublicIp?.trim();
    if (!edgePublicIp) throw new Error('edgePublicIp is required');

    // Force env validation early (descriptive errors)
    const parentZoneId = this.parentZoneId;
    void this.apiToken;
    void this.baseUrl;
    void this.accountId;

    const subZoneName = `${rg}.${this.parentZoneName}`;
    const wildcardName = `*.${subZoneName}`;
    const proxied = params.proxied ?? true;

    const ensuredZone = await this.ensureZone(subZoneName);
    const subZone = ensuredZone.zone;

    const nameservers = subZone.name_servers ?? [];
    if (nameservers.length < 2) {
      throw new Error(
        `Sub-zone ${subZoneName} is missing name_servers from Cloudflare; cannot create NS delegation`,
      );
    }

    const delegation = await this.reconcileNsRecords({
      zoneId: parentZoneId,
      name: subZoneName,
      targets: nameservers,
      ttl: 1,
    });

    const wildcard = await this.upsertDnsRecord({
      zoneId: subZone.id,
      type: 'A',
      name: wildcardName,
      content: edgePublicIp,
      proxied,
      ttl: 1,
    });

    return {
      parentZone: { id: parentZoneId, name: this.parentZoneName },
      subZone: {
        id: subZone.id,
        name: subZoneName,
        action: ensuredZone.action,
        nameServers: nameservers,
      },
      delegation,
      wildcard,
    };
  }

  /**
   * Backward-compatible wrapper for existing controller route.
   * Previously this created `*.${rg}.orchestronic.dev` in the parent zone.
   * Now it follows the delegated-subzone approach required for HTTPS+proxied.
   */
  async ensureResourceGroupWildcard(params: {
    resourceGroup: string;
    lbPublicIp: string;
    proxied?: boolean;
  }) {
    return this.ensureDelegatedResourceGroup({
      resourceGroup: params.resourceGroup,
      edgePublicIp: params.lbPublicIp,
      proxied: params.proxied ?? true,
    });
  }
}
