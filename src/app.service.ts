import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getConnection(): { success: boolean; message: string } {
    return {
      success: true,
      message: 'Connection successful',
    };
  }
}
