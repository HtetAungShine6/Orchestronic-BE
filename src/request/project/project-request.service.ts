import { BadRequestException, Injectable } from "@nestjs/common";
import { AirflowService } from "src/airflow/airflow.service";
import { DatabaseService } from "src/database/database.service";
import { GitlabService } from "src/gitlab/gitlab.service";
import { BackendJwtPayload } from "src/lib/types";
import { RabbitmqService } from "src/rabbitmq/rabbitmq.service";
import { CreateAzureClusterRequestDto } from "./dto/create-cluster-request-azure.dto";
import { ApiBody } from "@nestjs/swagger";
import { CloudProvider } from "@prisma/client";

@Injectable()
export class ProjectRequestService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly airflowService: AirflowService,
    private readonly gitlabService: GitlabService,
  ) {}

  async createProjectRequest(
    user: BackendJwtPayload,
  ) {
    const ownerId = user.id;
    const ownerInDb = await this.databaseService.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });

    if( !ownerInDb ) {
      throw new BadRequestException('Authenticated user not found in database');
    }

    const displayCode = `CR-${Date.now()}`;
    const newClusterRequest = await this.databaseService.clusterRequest.create({
      data: {
        owner: { connect: { id: ownerId } },
        description: 'Cluster request initialization',
        displayCode,
      },
    });
    return newClusterRequest;
  }

  @ApiBody({ type: CreateAzureClusterRequestDto })
  async createCluster(
    user: BackendJwtPayload, 
    clusterRequestId: string,
    request: CreateAzureClusterRequestDto
  ) {
    const ownerId = user.id;
    const resources = request.resources;
    const ownerInDb = await this.databaseService.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });

    if (!ownerInDb) {
      throw new BadRequestException('Authenticated user not found in database');
    }

    const clusterRequest = await this.databaseService.clusterRequest.findUnique({
      where: { id: clusterRequestId },
      select: { id: true },
    });
    if (!clusterRequest) {
      throw new BadRequestException('Cluster request not found');
    }

    const resourceConfig = await this.databaseService.resourceConfig.create({
      data: {
        AzureK8sCluster: {
          create: resources.resourceConfig.aks || [],
        },
      },
    });

    const newResource = await this.databaseService.resources.create({
      data: {
        name: resources.name,
        cloudProvider: resources.cloudProvider as CloudProvider,
        region: resources.region,
        resourceConfig: { connect: { id: resourceConfig.id } },
      },
    });

    const lastRequest = await this.databaseService.request.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { displayCode: true },
    });
    const lastNumber = lastRequest
      ? parseInt(lastRequest.displayCode.split('-')[1])
      : 0;
    const displayCode = `R-${lastNumber + 1}`;

    const updatedClusterRequest = await this.databaseService.clusterRequest.update({
      where: { id: clusterRequestId },
      data: {
        displayCode,
        description: request.description,
        owner: { connect: { id: ownerId } },
        resources: { connect: { id: newResource.id } },
      },
      include: {
        resources: {
          include: {
            resourceConfig: {
              include: {
                AzureK8sCluster: true,
              },
            },
          },
        },
        owner: true,
      },
    });

    this.rabbitmqService.queueRequest(updatedClusterRequest.id);
    this.airflowService.triggerDag(user, 'AZURE_Resource_Group');

    return updatedClusterRequest;
;
  }


  async findClusterByUserId(userId: string, provider: CloudProvider) {
    
    if( provider === CloudProvider.AWS ) {
      return this.databaseService.clusterRequest.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          resources: {
            include: {
              resourceConfig: {
                include: {
                  AwsK8sCluster: true,
                },
              },
            },
          },
          repository: true,
        },
      });
    }

    if( provider === CloudProvider.AZURE ) {
      return this.databaseService.clusterRequest.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          resources: {
            include: {
              resourceConfig: {
                include: {
                  AzureK8sCluster: true,
                },
              },
            },
          },
          repository: true,
        },
      });
    }
    
    return null;
  }

  async findClusterById(clusterId: string, provider: CloudProvider) {
    if (provider === CloudProvider.AWS) {
      return this.databaseService.awsK8sCluster.findUnique({
        where: { id: clusterId },
        select: {
          clusterName: true,
          nodeCount: true,
          nodeSize: true,
          kubeConfig: true,
          clusterEndpoint: true,
          terraformState: true,
          ownedRepositories: {
            select: {
              user: true,
              repository: true,
            }
          }
        }
      });
    }
    if (provider === CloudProvider.AZURE) {
      return this.databaseService.azureK8sCluster.findUnique({
        where: { id: clusterId },
        select: {
          clusterName: true,
          nodeCount: true,
          nodeSize: true,
          kubeConfig: true,
          clusterFqdn: true,
          terraformState: true,
          ownedRepositories: {
            select: {
              user: true,
              repository: true,
            }
          }
        }
      });
    }
    return null;
  }    

}