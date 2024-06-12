import { Test, TestingModule } from '@nestjs/testing';
import { LocalTenantService, TenantService } from './tenant.service';
import { EnvService } from '../env/env.service';

describe('LocalTenantService', () => {
  let service: TenantService;
  let envService: EnvService;

  beforeEach(async () => {
    const mockEnvService = {
      getEnv: jest.fn().mockReturnValue({ tenantId: 'test-tenant' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalTenantService,
        { provide: EnvService, useValue: mockEnvService },
      ],
    }).compile();

    service = module.get<TenantService>(LocalTenantService);
    envService = module.get<EnvService>(EnvService);
  });

  it('should return the tenantId from EnvService', async () => {
    const tenantId = await service.provideTenant({});

    expect(tenantId).toEqual('test-tenant');
    expect(envService.getEnv).toHaveBeenCalledTimes(1);
  });
});
