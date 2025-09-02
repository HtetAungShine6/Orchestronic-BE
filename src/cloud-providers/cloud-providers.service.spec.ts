import { Test, TestingModule } from '@nestjs/testing';
import { CloudProvidersService } from './cloud-providers.service';

describe('CloudProvidersService', () => {
  let service: CloudProvidersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CloudProvidersService],
    }).compile();

    service = module.get<CloudProvidersService>(CloudProvidersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
