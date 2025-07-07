import { Injectable } from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { ApiBody } from '@nestjs/swagger';

@Injectable()
export class RequestService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    return await this.databaseService.request.findMany({
      include: {
        resources: true,
      },
    });
  }

  async findByStatus(status: Status) {
    console.log('Finding requests with status:', status);
    return await this.databaseService.request.findMany({
      where: { status },
    });
  }

  async findById(id: number) {
    return await this.databaseService.request.findUnique({
      where: { id: id.toString() },
    });
  }

  @ApiBody({ type: CreateRequestDto })
  async createRequest(dto: CreateRequestDto) {
    const { repository, resources, ...request } = dto;

    const resourceConfig = await this.databaseService.resourceConfig.create({
      data: {
        vms: {
          create: resources.resourceConfig.vms?.map((vm) => ({
            name: vm.name,
            numberOfCores: vm.numberOfCores,
            memory: vm.memory,
            os: vm.os,
          })),
        },
        dbs: {
          create: resources.resourceConfig.dbs?.map((db) => ({
            engine: db.engine,
            storageGB: db.storageGB,
          })),
        },
        sts: {
          create: resources.resourceConfig.sts?.map((st) => ({
            type: st.type,
            capacityGB: st.capacityGB,
          })),
        },
      },
    });

    const newResource = await this.databaseService.resources.create({
      data: {
        name: resources.name,
        cloudProvider: resources.cloudProvider,
        region: resources.region,
        resourceConfig: {
          connect: {
            id: resourceConfig.id,
          },
        },
      },
    });

    const newRepository = await this.databaseService.repository.create({
      data: {
        name: repository.name,
        description: repository.description,
        resources: {
          connect: {
            id: newResource.id,
          },
        },
      },
    });

    const newRequest = await this.databaseService.request.create({
      data: {
        description: request.description,
        owner: {
          connect: {
            id: request.ownerId,
          },
        },
        repository: {
          connect: {
            id: newRepository.id,
          },
        },
        resources: {
          connect: {
            id: newResource.id,
          },
        },
      },
    });

    return newRequest;
  }

  async updateRequestInfo(id: number, updateData: Prisma.RequestUpdateInput) {
    return this.databaseService.request.update({
      where: { id: id.toString() },
      data: updateData,
    });
  }

  async removeRequest(id: number) {
    return this.databaseService.request.delete({
      where: { id: id.toString() },
    });
  }
}
