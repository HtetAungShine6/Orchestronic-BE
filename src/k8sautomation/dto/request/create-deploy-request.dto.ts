import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class CreateClusterDeploymentRequestDto {
    @ApiProperty({
        example: 'image-name',
    })
    name: string;
    
    @ApiProperty({
        example: 'repository/image:tag',
    })
    image: string;

    @ApiProperty({
        example: 8080,
    })
    port: number;

    @IsOptional()
    @ApiProperty({
        description: 'Indicates whether image is on a private registry',
        example: false,
        required: false,
    })
    usePrivateRegistry?: boolean;

    @ApiProperty({
        description: 'Kubeconfig content for the target Kubernetes cluster',
        example: 'apiVersion: v1\nclusters:\n- cluster:\n    certificate-authority-data: ...',
    })
    kubeConfig: string;
}