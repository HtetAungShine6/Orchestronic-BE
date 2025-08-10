import { IsNotEmpty, IsNumber } from 'class-validator';

export class DBPolicyDto {
  @IsNotEmpty()
  @IsNumber()
  maxStorage: number;
}
