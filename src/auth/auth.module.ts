import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule],
  providers: [JwtStrategy],
  exports: [],
})
export class AuthModule {}

// @Module({
//   imports: [
//     UserModule,
//     PassportModule,
//     JwtModule.registerAsync({
//       useFactory: (configService: ConfigService) => ({
//         import: [ConfigModule],
//         secret: configService.get<string>('JWT_SECRET') || 'defaultSecret',
//         signOptions: { expiresIn: '60m' },
//       }),
//       inject: [ConfigService],
//     }),
//   ],
//   providers: [AuthService, LocalStrategy, JwtStrategy],
//   exports: [AuthService],
// })
// export class AuthModule {}
