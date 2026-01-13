import { Controller, Post, Param, Body } from '@nestjs/common';
import { CloudflareService } from './cloudflare.service';
import { CreateDnsRecordDto } from './request/create-dns-record.dto';

@Controller('cloudflare')
export class CloudflareController {
      constructor(private readonly cf: CloudflareService) {}

  @Post("resource-groups/:rg/wildcard")
  async upsertRgWildcard(
    @Param("rg") rg: string,
    @Body() body: CreateDnsRecordDto,
  ) {
    return this.cf.ensureResourceGroupWildcard({
      resourceGroup: rg,
      lbPublicIp: body.lbPublicIp,
      proxied: body.proxied,
    });
  }
}
