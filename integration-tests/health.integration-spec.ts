// import '../src/bootstrapEnv';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { integrationTestModule } from './integration-test-module';

describe('Health (integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // process.env['OIDC_CLIENT_SECRET_SAP'] = 'fakeSecretForTesting';
    const moduleFixture = await integrationTestModule().compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async function () {
    await app.close();
  });

  it('/rest/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/rest/health')
      .expect(200)
      .expect({});
  });
});
