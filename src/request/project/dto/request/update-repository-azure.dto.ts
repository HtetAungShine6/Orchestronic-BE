import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class AddRepositoryToAzureClusterDto {
    @IsString()
    @ApiProperty({
        example: "uuid-of-cluster",
    })
    clusterId: string;
    @IsString()
    @ApiProperty({
        example: "uuid-of-repository",
    })
    repositoryId: string;
}