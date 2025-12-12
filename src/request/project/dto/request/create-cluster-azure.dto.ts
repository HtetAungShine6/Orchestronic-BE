import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import { CreateAzureClusterResourceDto } from "src/resource/cluster-resource/dto/create-azure-cluster-resource.dto";
export class CreateAzureClusterDto {
    @IsString()
    @ApiProperty({ example: 'uuid-of-cluster-request' })
    requestId: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: 'Cluster request description',
        description: 'A description of the cluster request',
        required: false,
    })
    description: string;

    @ApiProperty({ type: CreateAzureClusterResourceDto })
    resources: CreateAzureClusterResourceDto;
}