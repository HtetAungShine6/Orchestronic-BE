import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { PolicyController } from './policy.controller';
import { PolicyService } from './policy.service';

@Module({
  imports: [DatabaseModule],
  controllers: [PolicyController],
  providers: [PolicyService],
})
export class PolicyModule {}
