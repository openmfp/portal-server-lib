import { Test, TestingModule } from '@nestjs/testing';
import { ServiceProviderService } from './service-provider.interfaces';
import { EmptyServiceProviderService } from './empty-service-provider.service';

describe('EmptyServiceProviderService', () => {
  let service: ServiceProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmptyServiceProviderService],
    }).compile();

    service = module.get<ServiceProviderService>(EmptyServiceProviderService);
  });

  it('should return an empty serviceProviders', async () => {
    const response = await service.getServiceProviders('token', [], {});

    expect(response).toEqual({ serviceProviders: [] });
  });
});
