import { INestApplication, Type } from '@nestjs/common';
import request from 'supertest';
import { integrationTestModule } from './integration-test-module';
import { mock } from 'jest-mock-extended';
import { EnvVariablesProvider } from '../src';

describe('AppController (integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const envVariablesProvider = {
      getEnv: (hostname: string) =>
        Promise.resolve({
          idpNames: ['sap'],
          healthCheckInterval: null,
          isLocal: false,
          frontendPort: '4300',
          developmentInstance: false,
          validWebcomponentUrls: ['.?'],
          oauthServerUrl: 'https://ametqb0em.accounts400.ondemand.com',
          clientId: '1fd3f7a6-d506-4289-9fcf-fed52eeb4c16',
        }),
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
      .expect({
        idpNames: ['sap'],
        healthCheckInterval: null,
        isLocal: false,
        frontendPort: '4300',
        developmentInstance: false,
        validWebcomponentUrls: ['.?'],
        oauthServerUrl: 'https://ametqb0em.accounts400.ondemand.com',
        clientId: '1fd3f7a6-d506-4289-9fcf-fed52eeb4c16',
      });
  });

  it('should implement integration-test', () => {
    expect(true).toBeTruthy();
  });
});
