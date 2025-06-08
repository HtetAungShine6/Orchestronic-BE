import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequestService } from './request.service';

@Controller('request')
export class RequestController {
  /*
    GET /request
    GET /request/:id
    POST /request
    PATCH /request/:id
    DELETE /request/:id

    Order is matter
    */

  constructor(private readonly requestService: RequestService) {}

  @Get()
  // GET /request
  // GET /request?status=Pending | Approved | Rejected
  findAll(@Query('status') status?: 'Pending' | 'Approved' | 'Rejected') {
    return this.requestService.findAll(status);
  }

  @Get(':id') // GET /request/:id
  findById(@Param('id') id: string) {
    // id is a string, but we want to convert it to a number
    return this.requestService.findById(+id);
  }

  @Post() // POST /request
  createRequest(
    @Body()
    request: {
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
    },
  ) {
    return this.requestService.createRequest(request);
  }

  @Patch(':id') // PATCH /request/:id
  updateRequestInfo(
    @Param('id') id: string,
    @Body()
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
    return this.requestService.updateRequestInfo(+id, requestUpdate);
  }

  @Delete(':id') // DELETE /request/:id
  removeRequest(@Param('id') id: string) {
    return this.requestService.removeRequest(+id);
  }
}
