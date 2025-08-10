import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { extractToken } from '../lib/extract-token';
import { BackendJwtPayload, RequestWithHeaders } from '../lib/types';
import * as jwt from 'jsonwebtoken';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('resource')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new resource',
  })
  create(@Body() createResourceDto: CreateResourceDto) {
    return this.resourceService.create(createResourceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Find all resources for the authenticated user',
  })
  findAll(@Request() req: RequestWithHeaders) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;
      return this.resourceService.findAll(decoded);
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Find a resource by ID',
  })
  findOne(@Param('id') id: string) {
    return this.resourceService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a resource by ID',
  })
  update(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return this.resourceService.update(+id, updateResourceDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a resource by ID',
  })
  remove(@Param('id') id: string) {
    return this.resourceService.remove(+id);
  }
}
