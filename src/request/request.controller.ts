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
import { Prisma, Status } from '@prisma/client';
import { ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateRequestDto } from './dto/create-request.dto';

@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get()
  findAll() {
    return this.requestService.findAll();
  }

  @Get('status')
  @ApiQuery({ name: 'status', enum: Status })
  findByStatus(@Query('status') status: Status) {
    return this.requestService.findByStatus(status);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.requestService.findById(+id);
  }

  @Post()
  @ApiBody({ type: CreateRequestDto })
  createRequest(@Body() request: CreateRequestDto) {
    return this.requestService.createRequest(request);
  }

  @Patch(':id')
  updateRequestInfo(
    @Param('id') id: string,
    @Body() requestUpdate: Prisma.RequestUpdateInput,
  ) {
    return this.requestService.updateRequestInfo(+id, { ...requestUpdate });
  }

  @Delete(':id')
  removeRequest(@Param('id') id: string) {
    return this.requestService.removeRequest(+id);
  }
}
