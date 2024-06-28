import { Test, TestingModule } from '@nestjs/testing';
import { LuigiConfigNodesService } from './luigi-config-nodes.service';
import { PortalModule } from '../../../portal.module';
import { LuigiDataService } from '../luigi-data/luigi-data.service';
import { mock } from 'jest-mock-extended';
import { SERVICE_PROVIDER_INJECTION_TOKEN } from '../../../injection-tokens';
import { LuigiNode } from '../../model/luigi.node';
import {
  RawServiceProvider,
  ServiceProviderService,
} from '../../context/service-provider';

describe('LuigiConfigNodesService', () => {
  let service: LuigiConfigNodesService;
  let serviceProviderService: ServiceProviderService;
  let cdmLuigiDataService: LuigiDataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortalModule.create({})],
    })
      .overrideProvider(SERVICE_PROVIDER_INJECTION_TOKEN)
      .useValue(mock<ServiceProviderService>())
      .compile();

    service = module.get<LuigiConfigNodesService>(LuigiConfigNodesService);
    serviceProviderService = module.get<ServiceProviderService>(
      SERVICE_PROVIDER_INJECTION_TOKEN
    );
    cdmLuigiDataService = module.get<LuigiDataService>(LuigiDataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return a service provider for each request', async () => {
    const nodes: LuigiNode[] = [];
    jest
      .spyOn(cdmLuigiDataService, 'getLuigiDataFromCDM')
      .mockReturnValue(Promise.resolve(nodes));
    const rawServiceProviders: RawServiceProvider[] = [
      {
        name: 'a',
        displayName: 'c',
        isMandatoryExtension: true,
        cdm: [{ url: 'microfrontend.com' }],
        config: {},
        creationTimestamp: '2022-05-17T11:37:17Z',
      },
      {
        name: 'b',
        displayName: 'd',
        cdm: [{ url: 'microfrontend2.com' }],
        config: {},
        creationTimestamp: '2021-05-17T11:37:17Z',
      },
    ];
    const token = 'token';
    const getExtensionClassesMock = jest
      .spyOn(serviceProviderService, 'getServiceProviders')
      .mockResolvedValue({
        serviceProviders: rawServiceProviders,
      });

    // Act
    const serviceProvidersForTenant = await service.getNodes(
      token,
      ['TENANT'],
      'en',
      {
        key: 'val',
      }
    );

    // Assert
    expect(serviceProvidersForTenant.length).toBe(2);
    expect(serviceProvidersForTenant[0].creationTimestamp).toBe(
      '2022-05-17T11:37:17Z'
    );
    expect(getExtensionClassesMock).toHaveBeenCalledWith(token, ['TENANT'], {
      key: 'val',
    });

    getExtensionClassesMock.mockClear();

    // Act 2
    const serviceProvidersForProject = await service.getNodes(
      token,
      ['PROJECT'],
      'en',
      { key: 'val' }
    );

    // Assert 2
    expect(serviceProvidersForProject.length).toBe(2);
    expect(getExtensionClassesMock).toHaveBeenCalledWith(token, ['PROJECT'], {
      key: 'val',
    });
  });
});
