import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseService } from '../database/database.service';
import { AuthService } from './auth.service';
import { ShortTokenService } from './short-token.service';
import { AuthController } from './auth.controller';
import { AzureTokenService } from './azure-token.service';
import { PassportModule } from '@nestjs/passport';
import { AzureStrategy } from './strategies/azure-ad.strategy';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'azure-ad',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    UserModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    DatabaseService,
    ShortTokenService,
    AzureTokenService,
    DatabaseService,
    AzureStrategy,
  ],
  controllers: [AuthController],
  exports: [JwtStrategy],
})
export class AuthModule {}
