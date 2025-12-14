import { ApiProperty } from "@nestjs/swagger";
import { Status } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";
import { CreateAzureClusterResourceDto } from "src/resource/cluster-resource/dto/create-azure-cluster-resource.dto";
export class UpdateAzureClusterDto {
    // @IsString()
    // @ApiProperty({ example: 'uuid-of-cluster-request' })
    // requestId: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: 'Cluster request description',
        description: 'A description of the cluster request',
        required: false,
    })
    clusterRequestId: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: 'Cluster request description',
        description: 'A description of the cluster request',
        required: false,
    })
    status: Status;
}