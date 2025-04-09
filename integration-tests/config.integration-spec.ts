import {
  EntityNotFoundException,
  FEATURE_TOGGLES_INJECTION_TOKEN,
  FeatureTogglesProvider,
  HeaderParserService,
  LuigiConfigNodesService,
  PortalModule,
  SERVICE_PROVIDER_INJECTION_TOKEN,
  ServiceProvider,
  ServiceProviderService,
} from '../src';
import { EntityAccessForbiddenException } from '../src/config/context/entity-context-provider';
import {
  ForbiddenException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { mock } from 'jest-mock-extended';
import request from 'supertest';

const MockEntityProvider = 'MockEntityProvider';
const entityContext = { abc: 'def' };

const token = 'token';

class ServiceProviderServiceMock implements ServiceProviderService {
  getServiceProviders = jest.fn();
}

describe('ConfigController', () => {
  let app: INestApplication;
  let nodesService: LuigiConfigNodesService;
  let getEntityContextMock: jest.Mock;
  let requestMock: Request;
  let headerParserService: HeaderParserService;
  let featureTogglesProvider: FeatureTogglesProvider;
  let serviceProviderServiceMock: ServiceProviderService;
  const acceptLanguage = 'en';

  beforeEach(async () => {
    getEntityContextMock = jest.fn().mockResolvedValue(entityContext);

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PortalModule.create({
          serviceProviderService: ServiceProviderServiceMock,
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

    serviceProviderServiceMock = module.get<ServiceProviderService>(
      SERVICE_PROVIDER_INJECTION_TOKEN,
    );
    nodesService = module.get<LuigiConfigNodesService>(LuigiConfigNodesService);
    headerParserService = module.get<HeaderParserService>(HeaderParserService);
    featureTogglesProvider = module.get<FeatureTogglesProvider>(
      FEATURE_TOGGLES_INJECTION_TOKEN,
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

  describe('GET /rest/config', () => {
    it('should return 403 forbidden response status', async () => {
      (serviceProviderServiceMock.getServiceProviders as any).mockRejectedValue(
        new ForbiddenException(),
      );

      await request(app.getHttpServer())
        .get(`/rest/config/`)
        .accept(acceptLanguage)
        .expect(403);
    });

    it('should return 404 not found response status', async () => {
      (serviceProviderServiceMock.getServiceProviders as any).mockRejectedValue(
        new NotFoundException(),
      );

      await request(app.getHttpServer())
        .get(`/rest/config/`)
        .accept(acceptLanguage)
        .expect(404);
    });

    it('should return 500 internal error response status', async () => {
      (serviceProviderServiceMock.getServiceProviders as any).mockRejectedValue(
        new Error('any other error'),
      );

      await request(app.getHttpServer())
        .get(`/rest/config/`)
        .accept(acceptLanguage)
        .expect(500);
    });
  });

  describe('GET /rest/config/:entity', () => {
    it('should return 403 forbidden response status', async () => {
      jest
        .spyOn(nodesService, 'getNodes')
        .mockRejectedValue(new EntityAccessForbiddenException('e1', 'id1'));

      await request(app.getHttpServer())
        .get(`/rest/config/project`)
        .accept(acceptLanguage)
        .expect(403);
    });

    it('should return 404 not found response status', async () => {
      jest
        .spyOn(nodesService, 'getNodes')
        .mockRejectedValue(new EntityNotFoundException('e1', 'id1'));

      await request(app.getHttpServer())
        .get(`/rest/config/project`)
        .accept(acceptLanguage)
        .expect(404);
    });

    it('should return 500 internal error response status', async () => {
      jest
        .spyOn(nodesService, 'getNodes')
        .mockRejectedValue(new Error('any other error'));

      await request(app.getHttpServer())
        .get(`/rest/config/project`)
        .accept(acceptLanguage)
        .expect(500);
    });

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
  });

  afterAll(async () => {
    await app.close();
  });
});
