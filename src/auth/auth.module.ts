import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { AzureTokenService } from './azure-token.service';
import { ShortTokenService } from './short-token.service';
import { DatabaseService } from 'src/database/database.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AzureTokenService,
    ShortTokenService,
    JwtStrategy,
    DatabaseService,
  ],
})
export class AuthModule {}
