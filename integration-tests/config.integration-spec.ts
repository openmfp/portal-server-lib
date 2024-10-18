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
      const { body } = await request(app.getHttpServer())
        .get(`/rest/config/${validEntity}`)
        .set('Cookie', 'openmfp_auth_cookie=openmfp_auth_cookie_value')
        .accept(acceptLanguage)
        .expect(200);

      expect(getNodesMock).toBeCalled();
      expect(getEntityContextMock).toBeCalled();
      expect(body).toStrictEqual({ providers: resultingNodes, entityContext });
    });

    it('should fail due to the call not being authorized, no openmfp_auth_cookie', async () => {
      const getNodesMock = jest.spyOn(nodesService, 'getNodes');

      await request(app.getHttpServer())
        .get(`/rest/config/project`)
        .accept(acceptLanguage)
        .expect(400)
        .expect((response) => {
          expect(response.body.message).toEqual('User is not logged in.');
        });

      expect(getNodesMock).not.toHaveBeenCalled();
      expect(getEntityContextMock).not.toHaveBeenCalled();
    });

    it('should fail due to the call not being authorized, no proper cookie', async () => {
      const getNodesMock = jest.spyOn(nodesService, 'getNodes');

      await request(app.getHttpServer())
        .get(`/rest/config/project`)
        .set('Cookie', 'auth_cookie=some_cookie_value')
        .accept(acceptLanguage)
        .expect(400)
        .expect((response) => {
          expect(response.body.message).toEqual('User is not logged in.');
        });

      expect(getNodesMock).not.toHaveBeenCalled();
      expect(getEntityContextMock).not.toHaveBeenCalled();
    });
  });

  describe('GET /rest/config', () => {
    it('should fail due to the call not being authorized, no openmfp_auth_cookie', async () => {
      await request(app.getHttpServer())
        .get(`/rest/config`)
        .accept(acceptLanguage)
        .expect(400)
        .expect((response) => {
          expect(response.body.message).toEqual('User is not logged in.');
        });
    });

    it('should fail due to the call not being authorized, no proper cookie', async () => {
      await request(app.getHttpServer())
        .get(`/rest/config`)
        .set('Cookie', 'auth_cookie=some_cookie_value')
        .accept(acceptLanguage)
        .expect(400)
        .expect((response) => {
          expect(response.body.message).toEqual('User is not logged in.');
        });
    });

    it('should pass with proper openmfp cookie', async () => {
      await request(app.getHttpServer())
        .get(`/rest/config`)
        .set('Cookie', 'auth_cookie=some_cookie_value')
        .set('Cookie', 'openmfp_auth_cookie=openmfp_auth_cookie_value')
        .accept(acceptLanguage)
        .expect(200);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
