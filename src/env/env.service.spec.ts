import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { EnvService } from './env.service';
import { Request } from 'express';

describe('EnvService', () => {
  let service: EnvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvService],
    }).compile();

    service = module.get<EnvService>(EnvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  [
    {
      envVarName: 'HEALTH_CHECK_INTERVAL',
      resultName: 'healthCheckInterval',
      value: '123',
      expected: 123,
    },
    {
      envVarName: 'HEALTH_CHECK_INTERVAL',
      resultName: 'healthCheckInterval',
      value: '',
      expected: NaN,
    },
    {
      envVarName: 'HEALTH_CHECK_INTERVAL',
      resultName: 'healthCheckInterval',
      value: 'aaaa',
      expected: NaN,
    },
  ].forEach(function ({ envVarName, resultName, value, expected }) {
    it('should get ' + resultName, () => {
      process.env[envVarName] = value;

      expect(service.getEnv()[resultName]).toStrictEqual(expected);

      delete process.env[envVarName];
    });
  });

  it('should get if its a development instance', () => {
    process.env['DEVELOPMENT_INSTANCE'] = 'true';

    expect(service.getEnv().developmentInstance).toBe(true);

    delete process.env['DEVELOPMENT_INSTANCE'];
  });

  it('should get if it is not a local instance', () => {
    process.env['ENVIRONMENT'] = 'prod';

    expect(service.getEnv().isLocal).toBe(false);

    delete process.env['ENVIRONMENT'];
  });

  it('should get if it is a local instance', () => {
    process.env['ENVIRONMENT'] = 'local';

    expect(service.getEnv().isLocal).toBe(true);

    delete process.env['ENVIRONMENT'];
  });

  it('should the idp names', () => {
    process.env['IDP_NAMES'] = 'a,b.c,d';

    expect(service.getEnv().idpNames).toEqual(['a', 'b.c', 'd']);

    delete process.env['IDP_NAMES'];
  });

  it('should the validWebcomponentUrls', () => {
    process.env['VALID_WEBCOMPONENT_URLS'] = 'ab,cd';

    expect(service.getEnv().validWebcomponentUrls).toEqual(['ab', 'cd']);

    delete process.env['VALID_WEBCOMPONENT_URLS'];
  });

  describe('getEnvWithAuth', () => {
    const oauthServerUrlSAP = 'www.sap.com';
    const oauthTokenUrlSAP = 'www.sap.token.com';
    const oauthServerUrlFoo = 'www.foo.com';
    const oauthTokenUrlFoo = 'www.foo.token.com';
    const oauthServerUrlHyperspace = 'www.btp.com';
    const oauthTokenUrlHyperspace = 'www.btp.com/token';
    const clientIdFoo = '12134aads';
    const clientIdHyperspace = 'bbbtttppp';
    const clientIdSap = 'asqrfr';
    const clientSecretHyperspace = 'topSecret';
    const clientSecretFoo = 'topSecretFoo';
    const clientSecretSap = 'topSecretSap';

    beforeEach(() => {
      process.env['IDP_NAMES'] = 'sap,foo,hyperspace,not-configured';
      process.env['BASE_DOMAINS_SAP'] = 'dxp.k8s.ondemand.com';
      process.env['AUTH_SERVER_URL_SAP'] = oauthServerUrlSAP;
      process.env['TOKEN_URL_SAP'] = oauthTokenUrlSAP;
      process.env['OIDC_CLIENT_ID_SAP'] = clientIdSap;
      process.env['OIDC_CLIENT_SECRET_SAP'] = clientSecretSap;
      process.env['BASE_DOMAINS_HYPERSPACE'] = 'hyper.space,localhost';
      process.env['BASE_DOMAINS_FOO'] = '';
      process.env['AUTH_SERVER_URL_FOO'] = oauthServerUrlFoo;
      process.env['TOKEN_URL_FOO'] = oauthTokenUrlFoo;
      process.env['OIDC_CLIENT_ID_FOO'] = clientIdFoo;
      process.env['OIDC_CLIENT_SECRET_FOO'] = clientSecretFoo;
      process.env['AUTH_SERVER_URL_HYPERSPACE'] = oauthServerUrlHyperspace;
      process.env['TOKEN_URL_HYPERSPACE'] = oauthTokenUrlHyperspace;
      process.env['OIDC_CLIENT_ID_HYPERSPACE'] = clientIdHyperspace;
      process.env['OIDC_CLIENT_SECRET_HYPERSPACE'] = clientSecretHyperspace;
    });

    it('should map the idp to the url for foo', () => {
      const request = mock<Request>();
      request.hostname = 'foo.hyper.space';

      const envWithAuth = service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdFoo);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlFoo);
    });

    it('should map the idp to the token url for foo', () => {
      const request = mock<Request>();
      request.hostname = 'foo.hyper.space';

      const envWithAuth = service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdFoo);
      expect(envWithAuth.oauthTokenUrl).toBe(oauthTokenUrlFoo);
    });

    it('should map the idp to the token url for sap', () => {
      const request = mock<Request>();
      request.hostname = 'dxp.k8s.ondemand.com';

      const envWithAuth = service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdSap);
      expect(envWithAuth.oauthTokenUrl).toBe(oauthTokenUrlSAP);
    });

    it('should map the idp of foo to a different base url', () => {
      const request = mock<Request>();
      request.hostname = 'foo.dxp.k8s.ondemand.com';

      const envWithAuth = service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdFoo);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlFoo);
      expect(envWithAuth.clientSecret).toBe(clientSecretFoo);
    });

    it('should return the default tenant, if a host name is directly matched', () => {
      const request = mock<Request>();
      request.hostname = 'dxp.k8s.ondemand.com';

      const envWithAuth = service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdSap);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlSAP);
      expect(envWithAuth.clientSecret).toBe(clientSecretSap);
    });

    it('should return the default tenant, for a different host with multiple names is directly matched', () => {
      const request = mock<Request>();
      request.hostname = 'hyper.space';

      const envWithAuth = service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdHyperspace);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlHyperspace);
      expect(envWithAuth.clientSecret).toBe(clientSecretHyperspace);
    });

    it('should throw when the idp is not existing', () => {
      const request = mock<Request>();
      request.hostname = 'not-existing.dxp.k8s.ondemand.com';

      expect(function () {
        service.getCurrentAuthEnv(request);
      }).toThrow("the idp 'not-existing' is not configured!");
    });

    it('should throw when the token url is not configured is not existing', () => {
      const request = mock<Request>();
      request.hostname = 'dxp.k8s.ondemand.com';
      delete process.env[`TOKEN_URL_SAP`];

      expect(function () {
        service.getCurrentAuthEnv(request);
      }).toThrow(Error);
    });

    it('should throw when the domain is not existing', () => {
      const request = mock<Request>();
      request.hostname = 'sap-btp.foo.com';

      expect(function () {
        service.getCurrentAuthEnv(request);
      }).toThrow(
        "sap-btp.foo.com is not listed in the portal's base urls: 'dxp.k8s.ondemand.com,hyper.space,localhost'"
      );
    });

    it('should throw when the idp is not properly configured', () => {
      const request = mock<Request>();
      request.hostname = 'not-configured.dxp.k8s.ondemand.com';

      expect(function () {
        service.getCurrentAuthEnv(request);
      }).toThrow(
        "the idp not-configured is not properly configured. oauthServerUrl: 'undefined' oauthTokenUrl: 'undefined' clientId: 'undefined', has client secret (OIDC_CLIENT_SECRET_NOT_CONFIGURED): false"
      );
    });
  });

  describe('getFeatureToggles', function () {
    [
      {
        featureString: '',
        expectedObject: {},
      },
      {
        featureString: 'a=true',
        expectedObject: {
          a: true,
        },
      },
      {
        featureString: 'b=foo,a=TrUe',
        expectedObject: {
          a: true,
          b: false,
        },
      },
      {
        featureString: 'b = foo, a=TrUe ',
        expectedObject: {
          a: true,
          b: false,
        },
      },
    ].forEach((testCase) => {
      it(`should parse features fo '${testCase.featureString}'`, () => {
        process.env.FEATURE_TOGGLES = testCase.featureString;
        const features = service.getFeatureToggles();
        expect(features).toEqual(testCase.expectedObject);
      });
    });
  });
});
