import { Test, TestingModule } from '@nestjs/testing';
import { CloudProvidersController } from './cloud-providers.controller';
import { CloudProvidersService } from './cloud-providers.service';

describe('CloudProvidersController', () => {
  let controller: CloudProvidersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CloudProvidersController],
      providers: [CloudProvidersService],
    }).compile();

    controller = module.get<CloudProvidersController>(CloudProvidersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
