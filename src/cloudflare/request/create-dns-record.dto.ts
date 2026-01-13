import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class CreateDnsRecordDto {
  @ApiProperty({
    example: '192.168.1.1',
    description: 'The public IP of the edge load balancer',
  })
  @IsString()
  lbPublicIp: string; 
  
  @ApiProperty({
    example: true,
    description: 'Whether the record should be proxied through Cloudflare',
    required: false,
  })
  proxied?: boolean
}