import { Module } from '@nestjs/common';
import { AwsPolicyService } from './aws-policy.service';
import { AwsPolicyController } from './aws-policy.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AwsPolicyController],
  providers: [AwsPolicyService],
})
export class AwsPolicyModule {}
