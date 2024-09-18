import { Request } from 'express';
import { mock } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import {
  LuigiConfigNodesService,
  HeaderParserService,
  FeatureTogglesProvider,
  ServiceProvider,
  FEATURE_TOGGLES_INJECTION_TOKEN,
  PortalModule,
} from '../src';

const MockEntityProvider = 'MockEntityProvider';
const entityContext = { abc: 'def' };

const token = 'token';

describe('ConfigController', () => {
  let app: INestApplication;
  let nodesService: LuigiConfigNodesService;
  let getEntityContextMock: jest.Mock;
  let requestMock: Request;
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

    nodesService = module.get<LuigiConfigNodesService>(LuigiConfigNodesService);
    headerParserService = module.get<HeaderParserService>(HeaderParserService);
    featureTogglesProvider = module.get<FeatureTogglesProvider>(
      FEATURE_TOGGLES_INJECTION_TOKEN
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
