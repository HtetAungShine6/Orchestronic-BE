import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { timeout } from 'rxjs';

@Injectable()
export class RabbitmqService {
  constructor(@Inject('RABBITMQ_SERVICE') private rabbitClient: ClientProxy) {}

  queueRequest(requestId: string) {
    this.rabbitClient.emit('request', { requestId });
    console.log(`Request ID sent to RabbitMQ: ${requestId}`);

    return { message: 'Request queued successfully', requestId };
  }

  getRequest() {
    return this.rabbitClient
      .send('request', {})
      .pipe(timeout(10000))
      .toPromise()
      .catch((err) => {
        console.error('Timeout or error:', err);
      });
  }
}
