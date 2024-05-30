import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { integrationTestModule } from './integration-test-module';

describe('AppController (integration)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    process.env.IDP_NAMES = 'sap';
    process.env['IAS_TENANT_URL_SAP'] =
      'https://ametqb0em.accounts400.ondemand.com';
    process.env['OIDC_CLIENT_SECRET_SAP'] = 'fakeSecretForTesting';
    process.env['OIDC_CLIENT_ID_SAP'] = '1fd3f7a6-d506-4289-9fcf-fed52eeb4c16';
    process.env.BASE_DOMAINS_SAP = 'localhost,127.0.0.1';
    process.env.DEVELOPMENT_INSTANCE = 'true';
    process.env.QUALTRICS_SITE_INTERCEPT_URL =
      'https://zncwsw32zjedsihi6-sapsandbox.siteintercept.qualtrics.com/SIE/?Q_ZID=ZN_cwsW32zjedSIhi6';
    process.env.QUALTRICS_ID = 'QSI_S_ZN_cwsW32zjedSIhi6';
    process.env.VALID_WEBCOMPONENT_URLS = '.?';

    const moduleFixture = await integrationTestModule().compile();

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
        oauthServerUrl: 'https://ametqb0em.accounts400.ondemand.com',
        clientId: '1fd3f7a6-d506-4289-9fcf-fed52eeb4c16',
        developmentInstance: true,
        qualtricsSiteInterceptUrl:
          'https://zncwsw32zjedsihi6-sapsandbox.siteintercept.qualtrics.com/SIE/?Q_ZID=ZN_cwsW32zjedSIhi6',
        qualtricsId: 'QSI_S_ZN_cwsW32zjedSIhi6',
        validWebcomponentUrls: ['.?'],
        minimalPluginVersion: 2,
      });
  });

  it('should implement integration-test', () => {
    expect(true).toBeTruthy();
  });
});
