import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { integrationTestModule } from './integration-test-module';

describe('Logout (integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await integrationTestModule({}).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async function () {
    await app.close();
  });

  it('/rest/logout (GET)', () => {
    return request(app.getHttpServer())
      .get('/rest/logout')
      .expect(302)
      .expect({});
  });

  it('/rest/logout (GET) with error', () => {
    return request(app.getHttpServer())
      .get('/rest/logout?error=Something_Important')
      .expect(302)
      .expect({});
  });
});
