import { Test, TestingModule } from '@nestjs/testing';
import {
  EmptyServiceProviderService,
  ServiceProviderService,
} from './service-provider';

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

    expect(response).toEqual({ rawServiceProviders: [] });
  });
});
