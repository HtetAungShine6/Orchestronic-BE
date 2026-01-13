import { Module } from '@nestjs/common';
import { CloudflareController } from './cloudflare.controller';
import { CloudflareService } from './cloudflare.service';
import { DatabaseModule } from 'src/database/database.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [DatabaseModule, HttpModule],
  controllers: [CloudflareController],
  providers: [CloudflareService],
})
export class CloudflareModule {}
