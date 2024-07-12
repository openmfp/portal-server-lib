import { Test, TestingModule } from '@nestjs/testing';
import { EmptyTenantService, TenantService } from './tenant.service';

describe('EmptyTenantService', () => {
  let service: TenantService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmptyTenantService],
    }).compile();

    service = module.get<TenantService>(EmptyTenantService);
  });

  it('should return the empty tenantId', async () => {
    const tenantId = await service.provideTenant({});

    expect(tenantId).toEqual('');
  });
});
