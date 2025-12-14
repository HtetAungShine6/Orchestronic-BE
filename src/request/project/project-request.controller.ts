import { GitlabService } from 'src/gitlab/gitlab.service';
import { ProjectRequestService } from './project-request.service';
import { CreateAzureClusterDto } from './dto/request/create-cluster-azure.dto';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpException,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { BackendJwtPayload, RequestWithCookies } from 'src/lib/types';
import * as jwt from 'jsonwebtoken';
import { CloudProvider } from '@prisma/client';
import { CreateProjectRequestDto } from './dto/request/create-project-request.dto';
import { AddRepositoryToAzureClusterDto } from './dto/request/update-repository-azure.dto';
import { GetClusterByIdResponseDto } from './dto/response/get-cluster-by-id-response-azure.dto';
import { GetClusterByUserIdResponseDto } from './dto/response/get-cluster-by-user-id-response.dto';
import { AzureK8sClusterDto } from './dto/response/cluster-response-azure.dto';
import { AddRepositoryToClusterResponseAzureDto } from './dto/response/add-repository-to-cluster-response-azure.dto';
import { th } from '@faker-js/faker/.';
import { UpdateAzureClusterDto } from './dto/request/update-cluster-azure.dto';

@Controller('project')
export class ProjectRequestController {
  constructor(
    private readonly clusterRequestService: ProjectRequestService,
    private readonly gitlabService: GitlabService,
  ) {}

  // @Post()
  // @ApiOperation({
  //   summary: 'Create a new project request',
  // })
  // @ApiBody({ type: CreateProjectRequestDto })
  // async createProjectRequest(
  //   @Request() req: RequestWithCookies,
  //   @Body() request: CreateProjectRequestDto,
  // ) {
  //   const token = req.cookies?.['access_token'];
  //   if (token === undefined) {
  //     throw new UnauthorizedException('No access token');
  //   }
  //   const secret = process.env.JWT_SECRET;
  //   if (!secret) {
  //     throw new Error('JWT_SECRET not defined');
  //   }

  //   try {
  //     const decoded = jwt.verify(token, secret) as unknown;
  //     const payload = decoded as BackendJwtPayload;
  //     const response = await this.clusterRequestService.createProjectRequest(payload, request);

  //     if(!response) return new Error('Failed to create project request');
  //     const project: CreateProjectResponseDto = {
  //       statuscode: 201,
  //       message: response,
  //     };
  //     return project;

  //   } catch {
  //     console.error('Request Controller: Error decoding token');
  //     throw new Error('Invalid token - unable to process');
  //   }
  // }

  @Post('/azure')
  @ApiOperation({
    summary: 'Create a new Azure cluster',
  })
  @ApiBody({ type: CreateAzureClusterDto })
  async createClusterRequest(
    @Request() req: RequestWithCookies,
    @Body() request: CreateAzureClusterDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      const response = await this.clusterRequestService.createCluster(
        payload,
        request,
      );
      if (!response) {
        throw new Error('Failed to create Azure cluster');
      }

      return response;
    } catch (error) {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Patch('/azure')
  @ApiOperation({
    summary: 'Update an existing Azure cluster',
  })
  @ApiBody({ type: UpdateAzureClusterDto })
  async updateAzureClusterRequest(
    @Request() req: RequestWithCookies,
    @Body() updateClusterDto: UpdateAzureClusterDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      const response =
        await this.clusterRequestService.updateClusterRequestStatus(
          payload,
          updateClusterDto,
        );
      if (!response) {
        throw new Error('Failed to update Azure cluster');
      }

      return response;
    } catch (error) {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Get('cluster/:clusterid')
  async getAzureClusterRequestById(@Param('clusterid') clusterid: string) {
    try {
      const response = (await this.clusterRequestService.findClusterById(
        clusterid,
        CloudProvider.AZURE,
      )) as AzureK8sClusterDto | null;
      if (!response) {
        throw new Error('Azure cluster not found');
      }

      const cluster: GetClusterByIdResponseDto = {
        statuscode: 200,
        message: response,
      };
      return cluster;
    } catch (error) {
      throw new Error('Failed to get Azure cluster by ID');
    }
  }

  @Get('me/cluster')
  async getAzureClustersByUserId(@Request() req: RequestWithCookies) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      const response =
        await this.clusterRequestService.findClustersByUserId(payload);
      if (!response) {
        throw new Error('No Azure clusters found for user');
      }

      return response;
    } catch (error) {
      console.error('Get Cluster by user id error:', error);

      if (error instanceof HttpException) {
        throw error; // preserve status code + message
      }

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to get clusters for user',
      );
    }
  }

  @Patch('deploy/azure')
  @ApiOperation({
    summary: 'Deploy image to Azure cluster',
  })
  @ApiBody({ type: AddRepositoryToAzureClusterDto })
  async deployToAzureCluster(
    @Request() req: RequestWithCookies,
    @Body() request: AddRepositoryToAzureClusterDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const response =
        await this.clusterRequestService.DeployToAzureCluster(request);

      if (!response) {
        throw new Error('No response from deploying to Azure cluster');
      }

      const result: AddRepositoryToClusterResponseAzureDto = {
        statuscode: 200,
        message: 'Deployed to Azure cluster successfully',
      };
      return result;
    } catch (error) {
      console.error('DeployToAzureCluster error:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error?.message ?? 'Failed to deploy to Azure cluster',
      );
    }
  }

  @Get('/pending-clusters')
  @ApiOperation({
    summary: 'Get all pending cluster requests',
  })
  async getAllPendingClusters() {
    const response = await this.clusterRequestService.findAllPendingClusters();
    if (!response) {
      throw new Error('No pending clusters found');
    }

    return response;
  }

  @Get('/resources/:clusterId')
  @ApiOperation({
    summary: 'Get resources by cluster ID',
  })
  async getClusterResourcesById(@Param('clusterId') clusterId: string) {
    const response = await this.clusterRequestService.findClusterResourcesById(clusterId);
    if (!response) {
      throw new Error('No resources found for cluster');
    }

    return response;
  }

  @Get('/resource-config/:clusterId')
  @ApiOperation({
    summary: 'Get resource config by cluster ID',
  })
  async getClusterResourceConfigById(@Param('clusterId') clusterId: string) {
    const response = await this.clusterRequestService.findClusterResourceConfigById(clusterId);
    if (!response) {
      throw new Error('No resource config found for cluster');
    }

    return response;
  }
}