import { ApiProperty } from '@nestjs/swagger';
import { CreateDatabaseInstanceDto } from './db-instance.dto';
import { CreateStorageInstanceDto } from './storage-instance.dto';
import { CreateVMInstanceDto } from './vm-instance.dto';
import { IsArray, IsOptional } from 'class-validator';

export class CreateResourceConfigDto {
  @ApiProperty({
    type: [CreateVMInstanceDto],
    description: 'List of virtual machine instances to be created',
  })
  @IsOptional()
  @IsArray()
  vms: CreateVMInstanceDto[];

  @ApiProperty({
    type: [CreateDatabaseInstanceDto],
    description: 'List of database instances to be created',
  })
  @IsOptional()
  @IsArray()
  dbs: CreateDatabaseInstanceDto[];

  @ApiProperty({
    type: [CreateStorageInstanceDto],
    description: 'List of storage instances to be created',
  })
  @IsOptional()
  @IsArray()
  sts: CreateStorageInstanceDto[];
}
