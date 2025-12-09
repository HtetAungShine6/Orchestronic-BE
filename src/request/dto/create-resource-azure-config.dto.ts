import { ApiProperty } from '@nestjs/swagger';
import { CreateAzureDatabaseInstanceDto } from './db-instance-azure.dto';
import { CreateAzureStorageInstanceDto } from './storage-instance-azure.dto';
import { CreateAzureVMInstanceDto } from './vm-instance-azure.dto';
import { IsArray, IsOptional } from 'class-validator';
import { CreateAzureK8sClusterDto } from './k8s-cluster-azure.dto';

export class CreateResourceAzureConfigDto {
  @ApiProperty({
    type: [CreateAzureVMInstanceDto],
    description: 'List of virtual machine instances to be created',
  })
  @IsOptional()
  @IsArray()
  vms: CreateAzureVMInstanceDto[];

  @ApiProperty({
    type: [CreateAzureDatabaseInstanceDto],
    description: 'List of database instances to be created',
  })
  @IsOptional()
  @IsArray()
  dbs: CreateAzureDatabaseInstanceDto[];

  @ApiProperty({
    type: [CreateAzureStorageInstanceDto],
    description: 'List of storage instances to be created',
  })
  @IsOptional()
  @IsArray()
  sts: CreateAzureStorageInstanceDto[];

  @ApiProperty({
    type: [CreateAzureK8sClusterDto],
    description: 'List of AKS clusters to be created',
  })
  @IsOptional()
  @IsArray()
  aks: CreateAzureK8sClusterDto[];
}
