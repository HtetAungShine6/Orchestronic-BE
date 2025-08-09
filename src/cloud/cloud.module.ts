import { Module } from '@nestjs/common';
import { CloudController } from './cloud.controller';
import { CloudService } from './cloud.service';
import { DatabaseService } from 'src/database/database.service';

@Module({
  controllers: [CloudController],
  providers: [CloudService, DatabaseService],
})
export class CloudModule {}
