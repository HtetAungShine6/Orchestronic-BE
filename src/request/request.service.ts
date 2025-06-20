import { Injectable } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';
import { Prisma, Status } from '@prisma/client';
import { successResponse } from 'src/common/response.util';
import { DatabaseService } from 'src/database/database.service';
import { createRequestDto } from './dto/create-request.dto';

@Injectable()
export class RequestService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll() {
    return await this.databaseService.request.findMany();
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

  /*
Prisma needs to know what action to perform on this relation.

"create" tells Prisma: "When creating this Request, also create a new Resources record with the following data."
so that's why sent data this format:

"resources": {
  "create": {
    "VM": 2,
    "DB": 1,
    "ST": 3
  }
}

*/

  @ApiBody({ type: createRequestDto })
  async createRequest(request: createRequestDto) {
    const lastRequest = await this.databaseService.request.findFirst({
      where: { id: { startsWith: 'R-' } },
      orderBy: {
        date: 'desc',
      },
    });

    let newId: string;

    if (lastRequest?.id) {
      const lastNumber = parseInt(lastRequest.id.replace('R-', '')) || 0;
      newId = `R-${lastNumber + 1}`;
    } else {
      newId = 'R-1';
    }

    return this.databaseService.request.create({
      data: {
        id: newId,
        ...request,
        resources: {
          create: request.resources,
        },
      },
    });
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
