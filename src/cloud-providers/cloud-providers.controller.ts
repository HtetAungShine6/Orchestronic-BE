import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { CloudProvidersService } from './cloud-providers.service';
import { CreateCloudProviderDto } from './dto/create-cloud-provider.dto';
import { UpdateCloudProviderDto } from './dto/update-cloud-provider.dto';
import { CloudProvider } from '@prisma/client';
import { GetVmSizesDto } from 'src/request/dto/get-vm-sizes.dto';

@Controller('cloud-providers')
export class CloudProvidersController {
  constructor(private readonly cloudProvidersService: CloudProvidersService) {}

  @Get('/azure')
  findAzure(@Query() query: GetVmSizesDto) {
    return this.cloudProvidersService.findAzure(query);
  }

  @Get('/aws')
  async findAws(@Query() query: GetVmSizesDto) {
    return this.cloudProvidersService.findAws(query);
  }
}
