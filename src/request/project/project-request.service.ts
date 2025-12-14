import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { AirflowService } from 'src/airflow/airflow.service';
import { DatabaseService } from 'src/database/database.service';
import { GitlabService } from 'src/gitlab/gitlab.service';
import { BackendJwtPayload } from 'src/lib/types';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { CreateAzureClusterDto } from './dto/request/create-cluster-azure.dto';
import { ApiBody } from '@nestjs/swagger';
import { CloudProvider, deployStatus, Status } from '@prisma/client';
import { CreateProjectRequestDto } from './dto/request/create-project-request.dto';
import { AddRepositoryToAzureClusterDto } from './dto/request/update-repository-azure.dto';
import { AzureK8sClusterDto } from './dto/response/cluster-response-azure.dto';
import { NewClusterDto } from './dto/response/new-cluster-azure.dto';
import { K8sAutomationService } from 'src/k8sautomation/k8sautomation.service';
import { CreateClusterDeploymentRequestDto } from 'src/k8sautomation/dto/request/create-deploy-request.dto';
import { UserClustersPayloadDto } from './dto/response/get-cluster-by-user-id-response.dto';
import { CreateClusterAzureResponseDto } from './dto/response/create-cluster-azure-response.dto';

@Injectable()
export class ProjectRequestService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly airflowService: AirflowService,
    private readonly gitlabService: GitlabService,
    private readonly k8sAutomationService: K8sAutomationService,
  ) {}

  // async createProjectRequest(
  //   user: BackendJwtPayload,
  //   request: CreateProjectRequestDto
  // ) {

  //   try {
  //     const ownerId = user.id;
  //     const ownerInDb = await this.databaseService.user.findUnique({
  //       where: { id: ownerId },
  //       select: { id: true },
  //     });
  //     const { repository } = request;
  //     if (!ownerInDb) {
  //       throw new BadRequestException('Authenticated user not found in database');
  //     }

  //     const existingRepo = await this.databaseService.repository.findUnique({
  //       where: { name: repository.name },
  //     });

  //     if (existingRepo)
  //       throw new ConflictException('Repository name already exists');

  //     const newRepository = await this.databaseService.repository.create({
  //       data: {
  //         name: repository.name,
  //         description: repository.description,
  //         RepositoryCollaborator: {
  //           create:
  //             repository.collaborators?.map((c) => ({
  //               userId: c.userId,
  //               gitlabUserId: c.gitlabUserId,
  //             })) || [],
  //         },
  //       },
  //     });

  //     if(!newRepository) {
  //       throw new BadRequestException('Failed to create repository');
  //     }

  //     const gitlabOwner = await this.databaseService.user.findUniqueOrThrow({
  //       where: { id: ownerId },
  //       select: { gitlabName: true },
  //     });

  //     await this.gitlabService.createProjectForAUser(
  //       gitlabOwner.gitlabName ?? '',
  //       {
  //         name: repository.name,
  //         description: repository.description ?? '',
  //       },
  //     );

  //     const lastRequest = await this.databaseService.request.findFirst({
  //       orderBy: { createdAt: 'desc' },
  //       select: { displayCode: true },
  //     });
  //     const lastNumber = lastRequest
  //       ? parseInt(lastRequest.displayCode.split('-')[1])
  //       : 0;
  //     const displayCode = `P-${lastNumber + 1}`;

  //     const projectRequest = await this.databaseService.request.create({
  //       data: {
  //         description: request.description,
  //         displayCode,
  //         owner: { connect: { id: ownerId } },
  //         repository: { connect: { id: newRepository.id } },
  //       },
  //       include: {
  //         repository: true,
  //         owner: true,
  //       },
  //     })

  //     if(!projectRequest) {
  //       throw new BadRequestException('Failed to create project request');
  //     }

  //     // map projectRequest to ProjectRequestDto
  //     const response: ProjectRequestDto = {
  //       id: projectRequest.id,
  //       displayCode: projectRequest.displayCode,
  //       description: projectRequest.description,
  //       status: projectRequest.status,
  //       repositoryId: projectRequest.repositoryId,
  //       azureK8sClusterId: projectRequest.repository?.azureK8sClusterId ?? undefined,
  //       awsK8sClusterId: projectRequest.repository?.awsK8sClusterId ?? undefined,
  //       ownerId: projectRequest.ownerId,
  //       resourceId: projectRequest.resourcesId ?? undefined,
  //       feedback: projectRequest.feedback ?? '',
  //     };

  //     return response;
  //   } catch(error) {
  //     throw new Error('Failed to create project request');
  //   }
  // }

  @ApiBody({ type: CreateAzureClusterDto })
  async createCluster(user: BackendJwtPayload, request: CreateAzureClusterDto) {
    const ownerId = user.id;
    const resources = request.resources;
    const provider = (
      resources.cloudProvider || ''
    ).toUpperCase() as CloudProvider;
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

    // const updatedClusterRequest = await this.databaseService.request.update({
    //   where: { id: request.requestId },
    //   data: {
    //     resources: { connect: { id: newResource.id } },
    //   },
    //   include: {
    //     resources: true,
    //     repository: true,
    //   },
    // });

    // if (!updatedClusterRequest) {
    //   throw new BadRequestException(
    //     'Failed to update cluster request with resources',
    //   );
    // }
    await Promise.all([
      this.rabbitmqService.queueResource(newResource.id),
      this.airflowService.triggerDag(user, 'AZURE_Resource_Group_Cluster'),
    ]);

    // Cannot retrieve cluster ID here, will be updated after workflow is done
    const clusterResponse = new CreateClusterAzureResponseDto();
    clusterResponse.statuscode = 201;
    
    const newClusterDto = new NewClusterDto();
    newClusterDto.resourceId = newResource.id;
    clusterResponse.message = newClusterDto;

    return clusterResponse;
  }

  async findClusterByUserId(userId: string) {
    const awsClusters = await this.databaseService.awsK8sCluster.findMany({
      where: {
        resourceConfig: { resources: { request: { ownerId: userId } } },
      },
      include: { resourceConfig: { include: { resources: true } } },
    });

    const azureClusters = await this.databaseService.azureK8sCluster.findMany({
      where: {
        resourceConfig: { resources: { request: { ownerId: userId } } },
      },
      include: { resourceConfig: { include: { resources: true } } },
    });

    if (
      (!awsClusters || awsClusters.length === 0) &&
      (!azureClusters || azureClusters.length === 0)
    ) {
      throw new BadRequestException('No clusters found for user');
    }

    return {
      awsClusters,
      azureClusters,
    } as UserClustersPayloadDto;
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
          resourceConfigId: true,
        },
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
        },
      });

      if (!response) return null;

      const cluster: AzureK8sClusterDto = {
        id: clusterId,
        clusterName: response.clusterName,
        nodeCount: response.nodeCount,
        nodeSize: response.nodeSize,
        resourceConfigId: response.resourceConfigId,
        ...(response.kubeConfig
          ? { kubeConfig: JSON.stringify(response.kubeConfig) }
          : {}),
        ...(response.clusterFqdn
          ? { clusterFqdn: JSON.stringify(response.clusterFqdn) }
          : {}),
        ...(response.terraformState
          ? { terraformState: JSON.stringify(response.terraformState) }
          : {}),
      };

      return cluster;
    }
    return null;
  }

  async DeployToAzureCluster(request: AddRepositoryToAzureClusterDto) {
    // Check if repository exists
    const repository = await this.databaseService.repository.findUnique({
      where: { id: request.repositoryId },
    });

    if (!repository) {
      throw new BadRequestException('Repository not found');
    }

    // Get image from gitlab
    const project = await this.gitlabService.getProjectByName(
      repository.name,
    );
    if (!project) {
      throw new BadRequestException('Project not found in GitLab');
    }

    let projectDetail;
    try {
      projectDetail = await this.gitlabService.getImageFromRegistry(project.id);
    } catch (error) {
      throw new BadRequestException(
        `Failed to get image from GitLab registry: ${error.message}`,
      );
    }

    if (!projectDetail || !projectDetail.name || !projectDetail.image) {
      throw new BadRequestException('No image found in GitLab registry');
    }

    // Get chosen cluster
    const cluster = await this.databaseService.azureK8sCluster.findUnique({
      where: { id: request.clusterId },
    });

    if (!cluster) {
      throw new BadRequestException('Azure K8s Cluster not found');
    }

    // TODO: add kubeconfig to k8s automation service by cluster id
    const kubeConfig = cluster.kubeConfig;
    if (!kubeConfig) {
      throw new BadRequestException('Kubeconfig not found in cluster');
    }

    // Deploy into cluster
    const deploymentRequest = new CreateClusterDeploymentRequestDto();
    deploymentRequest.name = projectDetail.name;
    deploymentRequest.image = projectDetail.image;
    deploymentRequest.port = request.port;
    deploymentRequest.usePrivateRegistry =
      request.usePrivateRegistry ?? undefined;
    deploymentRequest.kubeConfig = kubeConfig;

    const deploymentResponse =
      await this.k8sAutomationService.automateK8sDeployment(deploymentRequest);
    if (!deploymentResponse || !deploymentResponse.success) {
      throw new BadRequestException('Failed to deploy to Azure K8s Cluster');
    }

    // Add resource to repository
    const resourceConfig = await this.databaseService.resourceConfig.findUnique(
      {
        where: { id: cluster.resourceConfigId },
      },
    );
    if (!resourceConfig) {
      throw new BadRequestException('Resource config not found');
    }

    const resource = await this.databaseService.resources.findFirst({
      where: { resourceConfigId: resourceConfig.id },
    });
    if (!resource) {
      throw new BadRequestException('Resource not found');
    }

    // Add repository to cluster
    const response = await this.databaseService.repository.update({
      where: { id: request.repositoryId },
      data: {
        resourcesId: resource.id,
      },
    });

    await this.databaseService.imageDeployment.create({
      data: {
        repositoryId: request.repositoryId,
        AzureK8sClusterId: cluster.id,
        imageUrl: projectDetail.image, // Add the appropriate image URL
        DeploymentStatus: deployStatus.Deployed,
      },
    });

    return response;
  }
}
