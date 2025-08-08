import { Body, Controller, Get, Post } from '@nestjs/common';
import { RequestDto } from './dto/request.dto';
import { RabbitmqService } from './rabbitmq.service';

@Controller('rabbitmq')
export class RabbitmqController {
  constructor(private readonly queueService: RabbitmqService) {}

  @Get()
  getQueueRequest() {
    return this.queueService.getRequest();
  }

  @Post('queue')
  queueRequest(@Body() requestDto: RequestDto) {
    return this.queueService.queueRequest(requestDto.requestId);
  }
}
