import { GitlabService } from "src/gitlab/gitlab.service";
import { ProjectRequestService } from "./project-request.service";
import { CreateAzureClusterDto } from "./dto/request/create-cluster-azure.dto";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Param, Patch, Post, Request, UnauthorizedException } from "@nestjs/common";
import { BackendJwtPayload, RequestWithCookies } from "src/lib/types";
import * as jwt from 'jsonwebtoken';
import { CloudProvider } from "@prisma/client";
import { CreateProjectRequestDto } from "./dto/request/create-project-request.dto";
import { AddRepositoryToAzureClusterDto } from "./dto/request/update-repository-azure.dto";
import { GetClusterByIdResponseDto } from "./dto/response/get-cluster-by-id-response-azure.dto";
import { GetClusterByUserIdResponseDto } from "./dto/response/get-cluster-by-user-id-response.dto";
import { CreateProjectResponseDto } from "./dto/response/create-project-response.dto";
import { AzureK8sClusterDto } from "./dto/response/cluster-response-azure.dto";

@Controller('project')
export class ProjectRequestController {
  constructor(
    private readonly clusterRequestService: ProjectRequestService,
    private readonly gitlabService: GitlabService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new project request',
  })
  @ApiBody({ type: CreateProjectRequestDto })
  async createProjectRequest(
    @Request() req: RequestWithCookies,
    @Body() request: CreateProjectRequestDto,
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
      const response = await this.clusterRequestService.createProjectRequest(payload, request);

      if(!response) return new Error('Failed to create project request');
      const project: CreateProjectResponseDto = {
        statuscode: 201,
        message: response,
      };
      return project;

    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

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
      return this.clusterRequestService.createCluster(payload, request);
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
      if(!response) {
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

  @Get('user/:userid')
  async getAzureClustersByUserId(@Param('userid') userid: string) {
    try {
      const response = (await this.clusterRequestService.findClusterByUserId(
        userid,
        CloudProvider.AZURE,
      )) as AzureK8sClusterDto[];
      if(!response) {
        throw new Error('Azure cluster not found');
      }
      
      const cluster: GetClusterByUserIdResponseDto = {
        statuscode: 200,
        message: response,
      };
      return cluster;
    } catch (error) {
      throw new Error('Failed to get Azure cluster by ID');
    }
  }

  @Patch('repository/azure')
  @ApiOperation({
    summary: 'Add repository to Azure cluster',
  })
  @ApiBody({ type: AddRepositoryToAzureClusterDto })
  async addRepositoryToAzureCluster(
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
      const response = await this.clusterRequestService.addRepositoryToAzureCluster(request);

      if(!response) {
        throw new Error('No response from adding repository to Azure cluster');
      }

      return response;
    } catch(error) {
      throw new Error('Failed to add repository to Azure cluster');
    }
    
  }
}