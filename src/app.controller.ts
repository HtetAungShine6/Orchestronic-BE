import { Controller, Get, Redirect, Req } from '@nestjs/common';
import { Request } from 'express';
import { AppService } from './app.service';

// @ApiTags('Test')
// @ApiBearerAuth('access-token')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect('/api/docs', 302)
  redirectToDocs() {
    return;
  }

  @Get('health')
  getConnection() {
    return this.appService.getConnection();
  }

  // @UseGuards(AuthGuard('jwt'))
  @Get('protected')
  getProtected(@Req() req: Request) {
    return {
      message: '🔒 You have accessed a protected route',
      user: req.user,
    };
  }

  // @EventPattern('request')
  // handleRequest(data: any) {
  //   return this.appService.handleRequest(data);
  // }
}
