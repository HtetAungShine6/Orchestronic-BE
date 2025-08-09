import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CloudService } from './cloud.service';
import { Secret } from 'jsonwebtoken';
import { SecretDto } from './dto/secret.dto';
import { RequestWithHeaders } from 'src/lib/types';
import { extractToken } from 'src/lib/extract-token';
import * as jwt from 'jsonwebtoken';
import { BackendJwtPayload } from 'src/lib/types';
import { U } from '@faker-js/faker/dist/airline-BUL6NtOJ';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
@Controller('cloud')
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  @Get()
  getCloudData(@Request() req: RequestWithHeaders) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      if (!decoded) {
        throw new UnauthorizedException('User not authenticated');
      }

      return this.cloudService.getSecretById(decoded);
    } catch (error) {
      console.error('Cloud Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }

  @Post('secret')
  createSecret(
    @Body() secretData: SecretDto,
    @Request() req: RequestWithHeaders,
  ) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      if (!decoded) {
        throw new UnauthorizedException('User not authenticated');
      }

      return this.cloudService.createSecret(decoded, secretData);
    } catch (error) {
      console.error('Cloud Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }
}
