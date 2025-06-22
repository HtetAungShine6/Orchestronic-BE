import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserService } from './user.service';
import { UserDto } from './dto/create-user.dto';
import { ApiResponseWrapper } from 'src/common/decorators/api-response-wrapper.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiResponseWrapper(UserDto)
  findAllUsers() {
    return this.userService.findAllUsers();
  }

  @Post()
  createUser(@Body() user: Prisma.UserCreateInput) {
    return this.userService.createUser(user);
  }

  @Get('by-email')
  async findByEmail(@Query('email') email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      return null;
    }

    return user;
  }
}
