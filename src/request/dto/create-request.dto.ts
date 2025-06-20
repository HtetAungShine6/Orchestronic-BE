import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class createRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
    description: 'The ID of the user creating the request',
  })
  team: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'repo-name',
    description: 'The name of the repository',
  })
  repository: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'resource-group-name',
    description: 'The name of the resource group',
  })
  resourceGroup: string;

  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    example: { VM: 1, DB: 0, ST: 0 },
    description: 'The resources requested',
  })
  resources: {
    VM: number;
    DB: number;
    ST: number;
  };

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'us-east-1',
    description: 'The region for the resources',
  })
  region: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'AWS',
    description: 'The cloud provider for the resources',
  })
  cloudProvider: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'user-id',
    description: 'The ID of the user making the request',
  })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'user-name',
    description: 'The name of the user making the request',
  })
  userName: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'Request description',
    description: 'A description of the request',
    required: false,
  })
  description?: string;
}
