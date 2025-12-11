import { ApiProperty } from '@nestjs/swagger';
import { CreateClusterResourceAzureConfigDto } from '../../../request/project/dto/request/create-cluster-resource-azure-config.dto';
export class CreateAzureClusterResourceDto {
  @ApiProperty({
    example: 'rg-repository-name',
    description: 'The name of the resource group',
  })
  name: string;

  @ApiProperty({
    example: 'azure',
    description: 'The cloud provider for the resources',
    required: false,
  })
  cloudProvider: string;

  @ApiProperty({
    example: 'eastasia',
    description: 'The region where the resources are located',
    required: false,
  })
  region: string;

  @ApiProperty({
    type: CreateClusterResourceAzureConfigDto })
  resourceConfig: CreateClusterResourceAzureConfigDto;
}