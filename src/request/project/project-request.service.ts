import { BadRequestException, ConflictException, Injectable } from "@nestjs/common";
import { AirflowService } from "src/airflow/airflow.service";
import { DatabaseService } from "src/database/database.service";
import { GitlabService } from "src/gitlab/gitlab.service";
import { BackendJwtPayload } from "src/lib/types";
import { RabbitmqService } from "src/rabbitmq/rabbitmq.service";
import { CreateAzureClusterDto } from "./dto/request/create-cluster-azure.dto";
import { ApiBody } from "@nestjs/swagger";
import { CloudProvider } from "@prisma/client";
import { CreateProjectRequestDto } from "./dto/request/create-project-request.dto";
import { AddRepositoryToAzureClusterDto } from "./dto/request/update-repository-azure.dto";
import { AzureK8sClusterDto } from "./dto/response/cluster-response-azure.dto";
import { ProjectRequestDto } from "./dto/response/project-request.dto";

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
    request: CreateProjectRequestDto
  ) {

    try {
      const ownerId = user.id;
      const ownerInDb = await this.databaseService.user.findUnique({
        where: { id: ownerId },
        select: { id: true },
      });
      const { repository } = request;
      if (!ownerInDb) {
        throw new BadRequestException('Authenticated user not found in database');
      }

      const existingRepo = await this.databaseService.repository.findUnique({
        where: { name: repository.name },
      });

      if (existingRepo)
        throw new ConflictException('Repository name already exists');

      const newRepository = await this.databaseService.repository.create({
        data: {
          name: repository.name,
          description: repository.description,
          RepositoryCollaborator: {
            create:
              repository.collaborators?.map((c) => ({
                userId: c.userId,
                gitlabUserId: c.gitlabUserId,
              })) || [],
          },
        },
      });

      if(!newRepository) {
        throw new BadRequestException('Failed to create repository');
      }

      const gitlabOwner = await this.databaseService.user.findUniqueOrThrow({
        where: { id: ownerId },
        select: { gitlabName: true },
      });

      await this.gitlabService.createProjectForAUser(
        gitlabOwner.gitlabName ?? '',
        {
          name: repository.name,
          description: repository.description ?? '',
        },
      );

      const lastRequest = await this.databaseService.projectRequest.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { displayCode: true },
      });
      const lastNumber = lastRequest
        ? parseInt(lastRequest.displayCode.split('-')[1])
        : 0;
      const displayCode = `P-${lastNumber + 1}`;

      const projectRequest = await this.databaseService.projectRequest.create({
        data: {
          description: request.description,
          displayCode,
          owner: { connect: { id: ownerId } },
          repository: { connect: { id: newRepository.id } },
        },
        include: {
          repository: true,
          owner: true,
        },
      })

      if(!projectRequest) {
        throw new BadRequestException('Failed to create project request');
      }

      // map projectRequest to ProjectRequestDto
      const response: ProjectRequestDto = {
        id: projectRequest.id,
        displayCode: projectRequest.displayCode,
        description: projectRequest.description,
        status: projectRequest.status,
        repositoryId: projectRequest.repositoryId,
        azureK8sClusterId: projectRequest.repository?.azureK8sClusterId ?? undefined,
        awsK8sClusterId: projectRequest.repository?.awsK8sClusterId ?? undefined,
        ownerId: projectRequest.ownerId,
        resourceId: projectRequest.resourcesId ?? undefined,
        feedback: projectRequest.feedback ?? '',
      };

      return response;
    } catch(error) {
      throw new Error('Failed to create project request');
    }
  }

  @ApiBody({ type: CreateAzureClusterDto })
  async createCluster(
    user: BackendJwtPayload,
    request: CreateAzureClusterDto
  ) {
    const ownerId = user.id;
    const resources = request.resources;
    const provider = (resources.cloudProvider || '').toUpperCase() as CloudProvider;
    const ownerInDb = await this.databaseService.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });

    if (!ownerInDb) {
      throw new BadRequestException('Authenticated user not found in database');
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
        cloudProvider: provider,
        region: resources.region,
        resourceConfig: { connect: { id: resourceConfig.id } },
      },
    });

    const updatedClusterRequest = await this.databaseService.projectRequest.update({
      where: { id: request.clusterRequestId },
      data: {
        resources: { connect: { id: newResource.id } },
      },
      include: {
        resources: true,
        repository: true,
      },
    });
    
    if(!updatedClusterRequest) {
      throw new BadRequestException('Failed to update cluster request with resources');
    }
    await Promise.all([
      this.rabbitmqService.queueRequest(updatedClusterRequest.id),
      this.airflowService.triggerDag(user, 'AZURE_K8s_Resource_Group'),
    ]);

    return updatedClusterRequest;
  }


  async findClusterByUserId(userId: string, provider: CloudProvider) {
    
    if (provider === CloudProvider.AWS) {
      return this.databaseService.projectRequest.findMany({
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

    if (provider === CloudProvider.AZURE) {
      const response = await this.databaseService.projectRequest.findMany({
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

      if (!response || response.length === 0) {
        throw new BadRequestException('No Azure clusters found for user');
      }

      const clusters: AzureK8sClusterDto[] = response.flatMap((req) => {
        const azureClusters = req.resources?.resourceConfig?.AzureK8sCluster ?? [];
        return azureClusters.map((cluster) => ({
          id: cluster.id,
          clusterName: cluster.clusterName,
          nodeCount: cluster.nodeCount,
          nodeSize: cluster.nodeSize,
          resourceConfigId: cluster.resourceConfigId,
          ...(cluster.kubeConfig ? { kubeConfig: cluster.kubeConfig } : {}),
          ...(cluster.clusterFqdn ? { clusterFqdn: cluster.clusterFqdn } : {}),
          ...(cluster.terraformState
            ? { terraformState: JSON.stringify(cluster.terraformState) }
            : {}),
        }));
      });

      return clusters;
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
          repositories: {
            include: {
              UserRepository: {
                include: { user: true },
              },
            },
          },
        }
      });
    }

    if (provider === CloudProvider.AZURE) {
      const response = await this.databaseService.azureK8sCluster.findUnique({
        where: { id: clusterId },
        select: {
          clusterName: true,
          nodeCount: true,
          nodeSize: true,
          kubeConfig: true,
          clusterFqdn: true,
          terraformState: true,
          resourceConfigId: true,
          repositories: {
            include: {
              UserRepository: {
                include: { user: true },
              },
            },
          },
        }
      });


      if (!response) return null;

      const cluster: AzureK8sClusterDto = {
        id: clusterId,
        clusterName: response.clusterName,
        nodeCount: response.nodeCount,
        nodeSize: response.nodeSize,
        resourceConfigId: response.resourceConfigId,
        ...(response.kubeConfig ? { kubeConfig: JSON.stringify(response.kubeConfig) } : {}),
        ...(response.clusterFqdn ? { clusterFqdn: JSON.stringify(response.clusterFqdn) } : {}),
        ...(response.terraformState
          ? { terraformState: JSON.stringify(response.terraformState) }
          : {}),
      };

      return cluster;
    }
    return null;
  }


  async addRepositoryToAzureCluster(request: AddRepositoryToAzureClusterDto) {
    // get repository
    const repository = await this.databaseService.repository.findUnique({
      where: { id: request.repositoryId },
    });

    if (!repository) {
      throw new BadRequestException('Repository not found');
    }

    const cluster = await this.databaseService.azureK8sCluster.findUnique({
      where: { id: request.clusterId },
    });

    if (!cluster) {
      throw new BadRequestException('Azure K8s Cluster not found');
    }

    // add repository to cluster
    const response = await this.databaseService.repository.update({
      where: { id: request.repositoryId },
      data: {
        azureK8sClusterId: request.clusterId,
      },
    });
    
    return response;
  }

}