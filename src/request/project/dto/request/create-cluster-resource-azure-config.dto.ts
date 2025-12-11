import { ApiProperty } from "@nestjs/swagger";
import { CreateAzureK8sClusterDto } from "./k8s-cluster-azure.dto";
import { IsArray, IsOptional } from "class-validator";

export class CreateClusterResourceAzureConfigDto {
  @ApiProperty({
    type: [CreateAzureK8sClusterDto],
    description: 'List of AKS clusters to be created',
  })
  @IsOptional()
  @IsArray()
  aks: CreateAzureK8sClusterDto[];
}