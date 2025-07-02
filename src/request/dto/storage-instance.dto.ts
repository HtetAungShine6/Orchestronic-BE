import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class CreateStorageInstanceDto {
  @IsString()
  @ApiProperty({
    example: 'SSD',
    description: 'The type of the storage instance',
  })
  type: string;

  @IsInt()
  @ApiProperty({
    example: '100',
    description: 'The capacity of the storage instance (in GB)',
  })
  capacityGB: number;
}
