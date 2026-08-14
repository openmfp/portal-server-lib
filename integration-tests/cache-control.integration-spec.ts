import { integrationTestModule } from './integration-test-module.js';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('Cache-Control (integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await integrationTestModule({}).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async function () {
    await app.close();
  });

  it('sets no-store on /rest/* through the real middleware mount', () => {
    return request(app.getHttpServer())
      .get('/rest/health')
      .expect(200)
      .expect('Cache-Control', 'no-store');
  });

  it('does not touch caching outside the auth-critical paths', async () => {
    const res = await request(app.getHttpServer()).get('/some-frontend-route');

    expect(res.headers['cache-control']).toBeUndefined();
  });
});
