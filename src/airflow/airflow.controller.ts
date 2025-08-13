import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AirflowService } from './airflow.service';
import { BackendJwtPayload, RequestWithHeaders } from '../lib/types';
import { extractToken } from '../lib/extract-token';
import * as jwt from 'jsonwebtoken';
import { DagDto } from './dto/dag.dto';

@UseGuards()
@ApiBearerAuth('access-token')
@Controller('airflow')
export class AirflowController {
  constructor(private readonly airflowService: AirflowService) {}

  @Post(':dagId/dagRuns')
  @ApiOperation({
    summary: 'Trigger a new DAG run',
    description:
      'Triggers a specified Airflow DAG with the provided configuration.',
  })
  triggerDag(
    @Request() req: RequestWithHeaders,
    @Param('dagId') dagId: string,
    @Body() body: DagDto,
  ) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      return this.airflowService.triggerDag(decoded, dagId, body);
    } catch (error) {
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }
}
