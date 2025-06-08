import { Injectable } from '@nestjs/common';
import { find } from 'rxjs';

@Injectable()
export class RequestService {
  private requests = [
    {
      reqId: 1,
      team: 'IDPGEEKS',
      repository: 'internal-developer-platform',
      resourceGroup: 'idp-prod-rg',
      resources: {
        VM: 2,
        DB: 1,
        ST: 1,
      },
      region: 'East Asia',
      cloudProvider: 'Azure',
      status: 'Pending',
      userId: 'fro45e56m456f34tgd',
      description: 'Provision VM in Azure for the backend service',
      date: 'Sat, 13 Jun 2020 18:30:00 GMT',
    },
    {
      reqId: 2,
      team: 'IDPGEEKS',
      repository: 'internal-developer-platform',
      resourceGroup: 'idp-prod-rg',
      resources: {
        VM: 1,
        DB: 0,
        ST: 0,
      },
      region: 'East Asia',
      cloudProvider: 'Azure',
      status: 'Approved',
      userId: 'fro45e56m456f34tgd',
      description: 'Provision VM in Azure for the frontend service',
      date: 'Sun, 14 Jun 2020 18:30:00 GMT',
    },
    {
      reqId: 3,
      team: 'IDPGEEKS',
      repository: 'internal-developer-platform',
      resourceGroup: 'idp-prod-rg',
      resources: {
        VM: 0,
        DB: 1,
        ST: 0,
      },
      region: 'East Asia',
      cloudProvider: 'Azure',
      status: 'Rejected',
      userId: 'fro45e56m456f34tgd',
      description: 'Provision DB in Azure for the backend service',
      date: 'Mon, 15 Jun 2020 18:30:00 GMT',
    },
  ];

  findAll(status?: 'Pending' | 'Approved' | 'Rejected') {
    if (status) {
      return this.requests.filter((request) => request.status === status);
    }
    return this.requests;
  }

  findById(id: number) {
    return this.requests.find((request) => request.reqId === id);
  }

  createRequest(request: {
    team: string;
    repository: string;
    resourceGroup: string;
    resources: { VM: number; DB: number; ST: number };
    region: string;
    cloudProvider: string;
    status: string;
    userId: string;
    description: string;
    date: string;
  }) {
    const newRequest = {
      reqId: this.requests.length + 1,
      ...request,
    };
    this.requests.push(newRequest);
    return request;
  }

  updateRequestInfo(
    reqId: number,
    requestUpdate: {
      team?: string;
      repository?: string;
      resourceGroup?: string;
      resources?: { VM: number; DB: number; ST: number };
      region?: string;
      cloudProvider?: string;
      status?: string;
      userId?: string;
      description?: string;
      date?: string;
    },
  ) {
    this.requests = this.requests.map((request) => {
      if (request.reqId === reqId) {
        return { ...request, ...requestUpdate };
      }
      return request;
    });
  }

  removeRequest(reqId: number) {
    const removeRequest = this.findById(reqId);

    // Update the request list by removing the request with the given reqId
    this.requests = this.requests.filter((request) => request.reqId !== reqId);

    // Return the removed request
    return removeRequest;
  }
}
