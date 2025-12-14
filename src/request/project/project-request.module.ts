import { Module } from '@nestjs/common';
import { GitlabService } from 'src/gitlab/gitlab.service';
import { RepositoriesService } from 'src/repositories/repositories.service';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { AirflowService } from 'src/airflow/airflow.service';
import { HttpModule } from '@nestjs/axios';
import { DatabaseModule } from 'src/database/database.module';
import { ProjectRequestController } from './project-request.controller';
import { ProjectRequestService } from './project-request.service';
import { K8sAutomationModule } from 'src/k8sautomation/k8sautomation.module';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE_1',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://airflow:airflow@20.2.248.253:5672'],
          queue: 'request',
        },
      },
      {
        name: 'RABBITMQ_SERVICE_2',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://airflow:airflow@20.2.248.253:5672'],
          queue: 'destroy',
        },
      },
      {
        name: 'RABBITMQ_SERVICE_3',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://airflow:airflow@20.2.248.253:5672'],
          queue: 'resource',
        },
      },
    ]),
    PassportModule.register({
      defaultStrategy: 'AzureAD',
    }),
    K8sAutomationModule,
  ],
  controllers: [ProjectRequestController],
  providers: [
    ProjectRequestService,
    GitlabService,
    RepositoriesService,
    RabbitmqService,
    AirflowService,
  ],
})
export class ProjectRequestModule {}
