import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateDatabaseInstanceDto {
  @ApiProperty({
    example: 'postgres',
    description: 'The database engine for the database instance',
  })
  @IsString()
  engine: string;

  @ApiProperty({
    example: '100',
    description: 'The amount of storage (in GB) for the database instance',
  })
  @IsInt()
  storageGB: number;
}
