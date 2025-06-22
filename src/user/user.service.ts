import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(user: Prisma.UserCreateInput) {
    return await this.databaseService.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }

  async findAllUsers() {
    return await this.databaseService.user.findMany();
  }

  async findByEmail(email: string) {
    return await this.databaseService.user.findFirst({
      where: {
        email: email,
      },
    });
  }
}
