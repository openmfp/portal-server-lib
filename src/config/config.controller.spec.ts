import { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigController } from './config.controller';
import { PortalModule } from '../portal.module';
import { LuigiConfigNodesService } from './luigi/luigi-config-nodes/luigi-config-nodes.service';
import { TenantService } from '../auth/tenant.service';
import {
  FEATURE_TOGGLES_INJECTION_TOKEN,
  PORTAL_CONTEXT_INJECTION_TOKEN,
  TENANT_PROVIDER_INJECTION_TOKEN,
} from '../injection-tokens';
import { FeatureTogglesProvider } from './context/feature-toggles-provider';
import { HeaderParserService } from '../services/header-parser.service';
import { ServiceProvider } from './model/luigi.node';
import { PortalContextProvider } from './context/portal-context-provider';
import {
  EntityContextProviders,
  EntityNotFoundException,
} from './context/entity-context-provider';
import { ForbiddenException, HttpStatus } from '@nestjs/common';

const MockEntityProvider = 'MockEntityProvider';
const entityContext = { abc: 'def' };

const token = 'token';

describe('ConfigController', () => {
  let controller: ConfigController;
  let luigiConfigNodesService: LuigiConfigNodesService;
  let getEntityContextMock: jest.Mock;
  let requestMock: Request;
  let responseMock: Response;
  let tenantProvider: TenantService;
  let frameContextProvider: PortalContextProvider;
  let headerParserService: HeaderParserService;
  let featureTogglesProvider: FeatureTogglesProvider;
  let entityContextProviders: EntityContextProviders;
  const mockTenant = '01emp2m3v3batersxj73qhm5zq';
  const acceptLanguage = 'en';

  beforeEach(async () => {
    getEntityContextMock = jest.fn().mockResolvedValue(entityContext);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PortalModule.create({
          entityContextProviders: {
            project: MockEntityProvider,
          },
          additionalProviders: [
            {
              provide: MockEntityProvider,
              useValue: { getContextValues: getEntityContextMock },
            },
          ],
        }),
      ],
    }).compile();
    controller = module.get<ConfigController>(ConfigController);
    luigiConfigNodesService = module.get<LuigiConfigNodesService>(
      LuigiConfigNodesService
    );
    headerParserService = module.get<HeaderParserService>(HeaderParserService);
    featureTogglesProvider = module.get<FeatureTogglesProvider>(
      FEATURE_TOGGLES_INJECTION_TOKEN
    );
    tenantProvider = module.get<TenantService>(TENANT_PROVIDER_INJECTION_TOKEN);
    frameContextProvider = module.get<PortalContextProvider>(
      PORTAL_CONTEXT_INJECTION_TOKEN
    );

    jest
      .spyOn(featureTogglesProvider, 'getFeatureToggles')
      .mockResolvedValue({});

    jest
      .spyOn(tenantProvider, 'provideTenant')
      .mockReturnValue(Promise.resolve(mockTenant));

    jest
      .spyOn(headerParserService, 'extractBearerToken')
      .mockReturnValue(token);

    requestMock = mock<Request>();
    requestMock.query = { key: 'val' };
    requestMock.hostname = 'lokal.horst';
    responseMock = mock<Response>();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getConfig', () => {
    it('should get the config for tenant', async () => {
      const resultingNodes: ServiceProvider[] = [];
      const getNodesMock = jest
        .spyOn(luigiConfigNodesService, 'getNodes')
        .mockReturnValue(Promise.resolve(resultingNodes));

      const config = await controller.getConfig(
        requestMock,
        responseMock,
        acceptLanguage
      );

      expect(config.providers).toBe(resultingNodes);
      expect(getNodesMock).toHaveBeenCalledWith(token, [], acceptLanguage, {
        tenant: mockTenant,
      });
    });

    it('should handle frameContextProvider error', async () => {
      // Arrange
      const error = new Error('this is a test error');

      jest.spyOn(luigiConfigNodesService, 'getNodes').mockResolvedValue([]);

      jest
        .spyOn(featureTogglesProvider, 'getFeatureToggles')
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 0))
        );

      jest
        .spyOn(frameContextProvider, 'getContextValues')
        .mockRejectedValue(error);

      // Act
      const result = controller.getConfig(
        requestMock,
        responseMock,
        acceptLanguage
      );

      // Assert
      await expect(result).rejects.toEqual(error);
    });

    it('should handle featureTogglesProvider error', async () => {
      // Arrange
      const error = new Error('this is a test error');

      jest.spyOn(luigiConfigNodesService, 'getNodes').mockResolvedValue([]);

      jest
        .spyOn(featureTogglesProvider, 'getFeatureToggles')
        .mockImplementation(
          () =>
            new Promise((resolve, reject) =>
              setTimeout(reject.bind(reject, error), 0)
            )
        );

      jest
        .spyOn(frameContextProvider, 'getContextValues')
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 0))
        );

      // Act
      const result = controller.getConfig(
        requestMock,
        responseMock,
        acceptLanguage
      );

      // Assert
      await expect(result).rejects.toEqual(error);
    });

    it('should handle tenantProvider error', async () => {
      // Arrange
      const forbiddenException = new ForbiddenException('you shall not pass');

      jest.spyOn(luigiConfigNodesService, 'getNodes').mockResolvedValue([]);

      jest
        .spyOn(tenantProvider, 'provideTenant')
        .mockImplementation(
          () =>
            new Promise((resolve, reject) =>
              setTimeout(reject.bind(reject, forbiddenException), 0)
            )
        );

      jest
        .spyOn(featureTogglesProvider, 'getFeatureToggles')
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 0))
        );

      jest
        .spyOn(frameContextProvider, 'getContextValues')
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 0))
        );

      // Act
      const result = controller.getConfig(
        requestMock,
        responseMock,
        acceptLanguage
      );

      // Assert
      await expect(result).resolves.toBeUndefined();
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    });
  });

  describe('getEntityConfig', () => {
    it('should get the config for a not registered entity provider', async () => {
      // Arrange
      jest.spyOn(luigiConfigNodesService, 'getNodes').mockResolvedValue([]);

      // Act
      const result = controller.getEntityConfig(
        requestMock,
        responseMock,
        { entity: 'no-provider' },
        acceptLanguage
      );

      // Assert
      await expect(result).resolves.toEqual({
        entityContext: {},
        providers: [],
      });
    });

    it('should handle getNodes error', async () => {
      // Arrange
      const error = new Error('this is a test error');

      jest
        .spyOn(luigiConfigNodesService, 'getNodes')
        .mockImplementation(
          () =>
            new Promise((resolve, reject) =>
              setTimeout(reject.bind(reject, error), 0)
            )
        );

      // Act
      const result = controller.getEntityConfig(
        requestMock,
        responseMock,
        { entity: 'project' },
        acceptLanguage
      );

      // Assert
      await expect(result).rejects.toEqual(error);
    });

    it('should handle EntityNotFoundException', async () => {
      // Arrange
      const entity = 'project';
      const entityNotFoundException = new EntityNotFoundException(entity, 'id');
      getEntityContextMock.mockRejectedValue(entityNotFoundException);

      jest.spyOn(luigiConfigNodesService, 'getNodes').mockResolvedValue([]);

      // Act
      const result = controller.getEntityConfig(
        requestMock,
        responseMock,
        { entity },
        acceptLanguage
      );

      // Assert
      await expect(result).resolves.toBeUndefined();
      expect(responseMock.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    });
  });
});
