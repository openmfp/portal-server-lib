import { ExtAuthTokenService, PortalModule } from '../src/index.js';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

describe('AuthController', () => {
  let app: INestApplication;
  let authTokenService: ExtAuthTokenService;
  const acceptLanguage = 'en';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortalModule.create({})],
    }).compile();

    authTokenService = module.get<ExtAuthTokenService>(ExtAuthTokenService);
    authTokenService.exchangeTokenForRefreshToken = jest
      .fn()
      .mockResolvedValue({});
    authTokenService.exchangeTokenForCode = jest.fn().mockResolvedValue({});

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  describe('GET /callback', () => {
    it('should fail due to the lack of auth code param in the query params', async () => {
      await request(app.getHttpServer())
        .get(`/callback?coder=uio`)
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
        .get(
          `/callback?code=auth_code&state=aHR0cDovL3N1Yi5sb2NhbGhvc3Q6NDMwMC9fbHVpZ2lOb25jZT1QUUNWODdlck5uVkZzNE1rMzUxNw==`,
        )
        .accept(acceptLanguage)
        .expect(302);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
