import { INestApplication, Type } from '@nestjs/common';
import request from 'supertest';
import { integrationTestModule } from './integration-test-module';
import { EnvVariablesProvider } from '../src';

describe('AppController (integration)', () => {
  const env = {
    idpNames: ['idp_1'],
    healthCheckInterval: null,
    isLocal: false,
    frontendPort: '4300',
    developmentInstance: false,
    validWebcomponentUrls: ['.?'],
    oauthServerUrl: 'https://oauth.com',
    clientId: '1fd3f7a6-d506-4289-9fcf-fed52eeb4c16',
  };
  let app: INestApplication;

  beforeEach(async () => {
    const envVariablesProvider = {
      getEnv: (hostname: string) => Promise.resolve(env),
    } as unknown as Type<EnvVariablesProvider>;

    const moduleFixture = await integrationTestModule({
      envVariablesProvider,
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async function () {
    await app.close();
  });

  it('/rest/envconfig (GET)', () => {
    return request(app.getHttpServer())
      .get('/rest/envconfig')
      .expect(200)
      .expect(env);
  });

  it('should implement integration-test', () => {
    expect(true).toBeTruthy();
  });
});
