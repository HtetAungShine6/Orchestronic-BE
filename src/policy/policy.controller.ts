import {
  Controller,
  Post,
  UseGuards,
  Request,
  Body,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PolicyService } from './policy.service';
import { BackendJwtPayload, RequestWithHeaders } from '../lib/types';
import { extractToken } from '../lib/extract-token';
import * as jwt from 'jsonwebtoken';
import { VMPolicyDto } from './dto/vm-policy.dto';
import { DBPolicyDto } from './dto/db-policy.dto';
import { STPolicyDto } from './dto/st-policy.dto';

@UseGuards()
@ApiBearerAuth('access-token')
@Controller('policy')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Post('virtual_machine')
  @ApiOperation({
    summary: 'Create a new Virtual Machine Policy',
    description: 'Creates a new policy for managing virtual machines.',
  })
  createPolicy(
    @Request() req: RequestWithHeaders,
    @Body() policyData: VMPolicyDto,
  ) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      return this.policyService.createPolicyVM(decoded, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new Error('Invalid token - unable to process');
    }
  }

  @Post('database')
  @ApiOperation({
    summary: 'Create a new Database Policy',
    description: 'Creates a new policy for managing databases.',
  })
  createPolicyDB(
    @Request() req: RequestWithHeaders,
    @Body() policyData: DBPolicyDto,
  ) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      return this.policyService.createPolicyDB(decoded, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new Error('Invalid token - unable to process');
    }
  }

  @Post('storage')
  @ApiOperation({
    summary: 'Create a new Storage Policy',
    description: 'Creates a new policy for managing storage resources.',
  })
  createPolicyST(
    @Request() req: RequestWithHeaders,
    @Body() policyData: STPolicyDto,
  ) {
    const token = extractToken(req);
    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      return this.policyService.createPolicyST(decoded, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new Error('Invalid token - unable to process');
    }
  }

  @Patch('virtual_machine')
  @ApiOperation({
    summary: 'Update an existing Virtual Machine Policy',
    description: 'Updates an existing policy for managing virtual machines.',
  })
  updatePolicy(
    @Request() req: RequestWithHeaders,
    @Body() policyData: VMPolicyDto,
  ) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      return this.policyService.updatePolicyVM(decoded, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new Error('Invalid token - unable to process');
    }
  }

  @Patch('database')
  @ApiOperation({
    summary: 'Update an existing Database Policy',
    description: 'Updates an existing policy for managing databases.',
  })
  updatePolicyDB(
    @Request() req: RequestWithHeaders,
    @Body() policyData: DBPolicyDto,
  ) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      return this.policyService.updatePolicyDB(decoded, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new Error('Invalid token - unable to process');
    }
  }

  @Patch('storage')
  @ApiOperation({
    summary: 'Update an existing Storage Policy',
    description: 'Updates an existing policy for managing storage resources.',
  })
  updatePolicyST(
    @Request() req: RequestWithHeaders,
    @Body() policyData: STPolicyDto,
  ) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      return this.policyService.updatePolicyST(decoded, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new Error('Invalid token - unable to process');
    }
  }
}
