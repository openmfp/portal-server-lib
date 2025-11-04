import { DEFAULT_SERVICE_PROVIDERS } from './service-provider-default.js';
import {
  DefaultServiceProviderService,
  ServiceProviderService,
} from './service-provider.js';
import { Test, TestingModule } from '@nestjs/testing';

describe('DefaultServiceProviderService', () => {
  let service: ServiceProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DefaultServiceProviderService],
    }).compile();

    service = module.get<ServiceProviderService>(DefaultServiceProviderService);
  });

  it('should return an default serviceProviders', async () => {
    const response = await service.getServiceProviders('token', [], {});

    expect(response).toEqual({
      rawServiceProviders: DEFAULT_SERVICE_PROVIDERS,
    });
  });
});
