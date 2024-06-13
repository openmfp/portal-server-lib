import { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigController } from './config.controller';
import { PortalModule } from '../portal.module';
import { LuigiConfigNodesService } from './luigi/luigi-config-nodes/luigi-config-nodes.service';
import { TenantService } from '../auth/tenant.service';
import {
  FEATURE_TOGGLES_INJECTION_TOKEN,
  FRAME_CONTEXT_INJECTION_TOKEN,
  TENANT_PROVIDER_INJECTION_TOKEN,
} from '../injection-tokens';
import { FeatureTogglesRovider } from './context/feature-toggles-rovider';
import { HeaderParserService } from '../request-helper/header-parser.service';
import { ServiceProvider } from './model/luigi.node';
import { FrameContextProvider } from './context/frame-context-provider';

const MockEntityProvider = 'MockEntityProvider';
const entityContext = { abc: 'def' };

const token = 'token';

describe('ConfigController', () => {
  let app: INestApplication;
  let controller: ConfigController;
  let nodesService: LuigiConfigNodesService;
  let getEntityContextMock: jest.Mock;
  let requestMock: Request;
  let responseMock: Response;
  let tenantProvider: TenantService;
  let contextValuesProvider: FrameContextProvider;
  let headerParserService: HeaderParserService;
  let featureTogglesProvider: FeatureTogglesRovider;
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
    nodesService = module.get<LuigiConfigNodesService>(LuigiConfigNodesService);
    headerParserService = module.get<HeaderParserService>(HeaderParserService);
    featureTogglesProvider = module.get<FeatureTogglesRovider>(
      FEATURE_TOGGLES_INJECTION_TOKEN
    );
    tenantProvider = module.get<TenantService>(TENANT_PROVIDER_INJECTION_TOKEN);
    contextValuesProvider = module.get<FrameContextProvider>(
      FRAME_CONTEXT_INJECTION_TOKEN
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

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get the config for tenant', async () => {
    const resultingNodes: ServiceProvider[] = [];
    const getNodesMock = jest
      .spyOn(nodesService, 'getNodes')
      .mockReturnValue(Promise.resolve(resultingNodes));
    const config = await controller.getConfig(
      requestMock,
      responseMock,
      acceptLanguage
    );
    expect(config.providers).toBe(resultingNodes);
    expect(getNodesMock).toHaveBeenCalledWith(
      token,
      ['GLOBAL', 'TENANT'],
      acceptLanguage,
      { tenant: mockTenant }
    );
  });

  it('should add additionalValuesToTheContext', async () => {
    // Arrange
    const expectedObject = {
      foo: 'bar',
    };
    jest.spyOn(nodesService, 'getNodes').mockResolvedValue([
      {
        nodes: [
          {
            context: {
              providesMissingMandatoryDataUrl: true,
            },
            viewUrl: 'foo-url',
          },
        ],
        config: {},
        creationTimestamp: 'baz',
      },
    ]);
    jest
      .spyOn(contextValuesProvider, 'getContextValues')
      .mockResolvedValue({ ...expectedObject });

    // Act
    const config = await controller.getConfig(
      requestMock,
      responseMock,
      acceptLanguage
    );

    // Assert
    expect(config.frameContext).toStrictEqual({
      ...expectedObject,
      extensionManagerMissingMandatoryDataUrl: 'foo-url',
    });
  });

  it('should handle error', async () => {
    // Arrange
    const error = new Error('this is a test error');

    jest.spyOn(nodesService, 'getNodes').mockResolvedValue([]);

    jest
      .spyOn(featureTogglesProvider, 'getFeatureToggles')
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 0))
      );

    jest
      .spyOn(contextValuesProvider, 'getContextValues')
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

  afterAll(async () => {
    await app.close();
  });
});
