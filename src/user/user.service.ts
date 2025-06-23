import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(user: CreateUserDto) {
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
    return await this.databaseService.user.findMany({
      where: {
        email: {
          contains: email,
          mode: 'insensitive',
        },
      },
      take: 5,
    });
  }
}
