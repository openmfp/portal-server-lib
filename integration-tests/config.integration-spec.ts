import { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigController } from '../src/config/config.controller';
import { LuigiConfigNodesService } from '../src/config/luigi/luigi-config-nodes/luigi-config-nodes.service';
import { TenantService } from '../src/auth/tenant.service';
import { FrameContextProvider } from '../src/config/context/frame-context-provider';
import { HeaderParserService } from '../src/request-helper/header-parser.service';
import { FeatureTogglesProvider } from '../src/config/context/feature-toggles-provider';
import {
  FEATURE_TOGGLES_INJECTION_TOKEN,
  FRAME_CONTEXT_INJECTION_TOKEN,
  PortalModule,
  TENANT_PROVIDER_INJECTION_TOKEN,
} from '../src';
import { ServiceProvider } from '../src/config/model/luigi.node';

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
  let featureTogglesProvider: FeatureTogglesProvider;
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
    featureTogglesProvider = module.get<FeatureTogglesProvider>(
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

  describe('GET /rest/config/:entity param validation', () => {
    it('should return BadRequest on invalid entity name', async () => {
      const invalidEntity = ':project';

      await request(app.getHttpServer())
        .get(`/rest/config/${invalidEntity}`)
        .accept(acceptLanguage)
        .expect(400);
    });

    it('should call the getNode & getEntityContext method on valid params', async () => {
      const resultingNodes: ServiceProvider[] = [];
      const getNodesMock = jest
        .spyOn(nodesService, 'getNodes')
        .mockReturnValue(Promise.resolve(resultingNodes));

      const validEntity = 'project';
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { body } = await request(app.getHttpServer())
        .get(`/rest/config/${validEntity}`)
        .accept(acceptLanguage)
        .expect(200);

      expect(getNodesMock).toBeCalled();
      expect(getEntityContextMock).toBeCalled();
      expect(body).toStrictEqual({ providers: resultingNodes, entityContext });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
