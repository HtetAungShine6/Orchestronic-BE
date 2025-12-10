import { GitlabService } from "src/gitlab/gitlab.service";
import { ProjectRequestService } from "./project-request.service";
import { CreateAzureClusterRequestDto } from "./dto/create-cluster-request-azure.dto";
import { ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Body, Controller, Get, Param, Post, Request, UnauthorizedException } from "@nestjs/common";
import { BackendJwtPayload, RequestWithCookies } from "src/lib/types";
import * as jwt from 'jsonwebtoken';
import { CloudProvider } from "@prisma/client";

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
  createProjectRequest(
    @Request() req: RequestWithCookies
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
      const clusterRequest = this.clusterRequestService.createProjectRequest(payload);
      return clusterRequest;
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Post('/azure')
  @ApiOperation({
    summary: 'Create a new Azure cluster',
  })
  @ApiBody({ type: CreateAzureClusterRequestDto })
  createClusterRequest(
    @Request() req: RequestWithCookies,
    @Body() request: CreateAzureClusterRequestDto,
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
      return this.clusterRequestService.createCluster(payload, request.clusterRequestId, request);
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Get('cluster/:clusterid')
  getAzureClusterRequestById(@Param('clusterid') clusterid: string) {
    return this.clusterRequestService.findClusterById(clusterid, CloudProvider.AZURE);
  }

  @Get('user/:userid')
  getAzureClustersByUserId(@Param('userid') userid: string) {
    return this.clusterRequestService.findClusterByUserId(userid, CloudProvider.AZURE);
  }
}