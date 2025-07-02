import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRepositoryDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'repository-name',
    description: 'The name of the repository associated with the request',
  })
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    example: 'repository-description',
    description: 'A description of the repository associated with the request',
    required: false,
  })
  description: string;
}
