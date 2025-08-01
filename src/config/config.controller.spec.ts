import { EnvService } from '../env/index.js';
import {
  ENTITY_CONTEXT_INJECTION_TOKEN,
  FEATURE_TOGGLES_INJECTION_TOKEN,
  PORTAL_CONTEXT_INJECTION_TOKEN,
} from '../injection-tokens.js';
import { PortalModule } from '../portal.module.js';
import { HeaderParserService } from '../services/index.js';
import { ConfigController } from './config.controller.js';
import {
  EntityAccessForbiddenException,
  EntityNotFoundException,
} from './context/entity-context-provider.js';
import { FeatureTogglesProvider } from './context/feature-toggles-provider.js';
import { PortalContextProvider } from './context/portal-context-provider.js';
import { LuigiConfigNodesService } from './luigi/luigi-config-nodes/luigi-config-nodes.service.js';
import { ServiceProvider } from './model/luigi.node.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';

const MockEntityProvider = 'MockEntityProvider';
const entityContext = { abc: 'def' };

const token = 'token';

describe('ConfigController', () => {
  let controller: ConfigController;
  let luigiConfigNodesService: LuigiConfigNodesService;
  let getEntityContextMock: jest.Mock;
  let requestMock: Request;
  let responseMock: Response;
  let portalContextProvider: PortalContextProvider;
  let headerParserService: HeaderParserService;
  let featureTogglesProvider: FeatureTogglesProvider;
  let envService: EnvService;
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
      LuigiConfigNodesService,
    );
    envService = module.get<EnvService>(EnvService);
    headerParserService = module.get<HeaderParserService>(HeaderParserService);
    featureTogglesProvider = module.get<FeatureTogglesProvider>(
      FEATURE_TOGGLES_INJECTION_TOKEN,
    );
    portalContextProvider = module.get<PortalContextProvider>(
      PORTAL_CONTEXT_INJECTION_TOKEN,
    );

    jest
      .spyOn(featureTogglesProvider, 'getFeatureToggles')
      .mockResolvedValue({});

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

      jest.spyOn(envService, 'getDomain').mockReturnValue({ idpName: 'app' });

      const config = await controller.getConfig(
        requestMock,
        responseMock,
        acceptLanguage,
      );

      expect(config.providers).toBe(resultingNodes);
      expect(getNodesMock).toHaveBeenCalledWith(token, [], acceptLanguage, {
        key: 'val',
      });
    });

    it('should handle portalContextProvider error', async () => {
      // Arrange
      const error = new Error('this is a test error');

      jest.spyOn(luigiConfigNodesService, 'getNodes').mockResolvedValue([]);

      jest
        .spyOn(featureTogglesProvider, 'getFeatureToggles')
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 0)),
        );

      jest
        .spyOn(portalContextProvider, 'getContextValues')
        .mockRejectedValue(error);

      // Act
      const result = controller.getConfig(
        requestMock,
        responseMock,
        acceptLanguage,
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
              setTimeout(reject.bind(reject, error), 0),
            ),
        );

      jest
        .spyOn(portalContextProvider, 'getContextValues')
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 0)),
        );

      // Act
      const result = controller.getConfig(
        requestMock,
        responseMock,
        acceptLanguage,
      );

      await expect(result).rejects.toEqual(error);
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
        acceptLanguage,
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
              setTimeout(reject.bind(reject, error), 0),
            ),
        );

      // Act
      const result = controller.getEntityConfig(
        requestMock,
        responseMock,
        { entity: 'project' },
        acceptLanguage,
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
      try {
        const result = await controller.getEntityConfig(
          requestMock,
          responseMock,
          { entity },
          acceptLanguage,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundException);
      }
    });

    it('should handle EntityAccessForbiddenException', async () => {
      // Arrange
      const entity = 'project';
      const entityAccessForbiddenException = new EntityAccessForbiddenException(
        entity,
        'id',
      );
      getEntityContextMock.mockRejectedValue(entityAccessForbiddenException);

      jest.spyOn(luigiConfigNodesService, 'getNodes').mockResolvedValue([]);

      // Act
      try {
        const result = await controller.getEntityConfig(
          requestMock,
          responseMock,
          { entity },
          acceptLanguage,
        );
      } catch (e) {
        expect(e).toBeInstanceOf(ForbiddenException);
      }
    });
  });
});
