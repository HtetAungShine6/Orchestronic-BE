import { Controller, Post, Body, Get } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  findAllUsers() {
    return this.userService.findAllUsers();
  }

  @Post()
  createUser(@Body() user: Prisma.UserCreateInput) {
    return this.userService.createUser(user);
  }
}
