import { Module } from '@nestjs/common';
import { CloudProvidersService } from './cloud-providers.service';
import { CloudProvidersController } from './cloud-providers.controller';
import { DatabaseModule } from 'src/database/database.module';
import { RequestService } from 'src/request/request.service';

@Module({
  imports: [DatabaseModule],
  controllers: [CloudProvidersController],
  providers: [CloudProvidersService, RequestService],
})
export class CloudProvidersModule {}
