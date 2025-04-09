import { AuthTokenService, PortalModule } from '../src';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

describe('AuthController', () => {
  let app: INestApplication;
  let authTokenService: AuthTokenService;
  const acceptLanguage = 'en';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortalModule.create({})],
    }).compile();

    authTokenService = module.get<AuthTokenService>(AuthTokenService);
    authTokenService.exchangeTokenForRefreshToken = jest
      .fn()
      .mockResolvedValue({});
    authTokenService.exchangeTokenForCode = jest.fn().mockResolvedValue({});

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  describe('POST /rest/auth', () => {
    it('should fail due to the lack of auth code param in the query params', async () => {
      await request(app.getHttpServer())
        .post(`/rest/auth?coder=uio`)
        .accept(acceptLanguage)
        .expect(400)
        .expect((response) => {
          expect(response.body.message).toEqual(
            "No 'code' was provided in the query.",
          );
        });
    });

    it('should pass with auth code param', async () => {
      await request(app.getHttpServer())
        .post(`/rest/auth?code=auth_code`)
        .accept(acceptLanguage)
        .expect(201);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
