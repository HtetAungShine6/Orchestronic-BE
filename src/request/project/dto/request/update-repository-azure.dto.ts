import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddRepositoryToAzureClusterDto {
  @IsString()
  @ApiProperty({
    example: 'uuid-of-cluster',
  })
  clusterId: string;

  @IsString()
  @ApiProperty({
    example: 'uuid-of-repository',
  })
  repositoryId: string;

  @IsNumber()
  @ApiProperty({
    example: 3000,
  })
  port: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Indicates whether the image is hosted on a private registry',
    example: false,
    required: false,
  })
  usePrivateRegistry?: boolean;
}
