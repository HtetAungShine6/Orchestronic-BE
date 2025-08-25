import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private databaseService: DatabaseService,
  ) {}

  async findOrCreateUser(profile: any) {
    // check DB for user
    let user = await this.getUserByEmail(profile._json.email);
    if (!user) {
      user = await this.createUser({
        email: profile._json.email,
        name: profile.displayName,
      });
    }
    return user;
  }

  login(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  // implement these according to your DB
  async getUserByEmail(email: string) {
    return await this.databaseService.user.findUnique({ where: { email } });
  }
  async createUser(data: any) {
    return await this.databaseService.user.create({ data });
  }
}
