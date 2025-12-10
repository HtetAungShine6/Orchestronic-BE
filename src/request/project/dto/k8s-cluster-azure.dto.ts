import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";

export class CreateAzureK8sClusterDto {
    @ApiProperty({
        example: 'my-aks-cluster',
        description: 'The name of the AKS cluster',
    })
    @IsString()
    clusterName: string;

    @ApiProperty({
        example: 3,
        description: 'The number of nodes in the AKS cluster',
    })
    @IsInt()
    nodeCount: number;

    @ApiProperty({
        example: 'Standard_D2s_v3',
        description: 'The size of the nodes in the AKS cluster',
    })
    @IsString()
    nodeSize: string;
}