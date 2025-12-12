import { ApiBody } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class CreateClusterDeploymentRequestDto {
    @ApiBody({
        example: 'image-name',
    })
    name: string;
    
    @ApiBody({
        example: 'repository/image:tag',
    })
    image: string;

    @ApiBody({
        example: 8080,
    })
    port: number;

    @IsOptional()
    @ApiBody({
        description: 'Indicates whether image is on a private registry',
        example: false,
    })
    usePrivateRegistry?: boolean;
}