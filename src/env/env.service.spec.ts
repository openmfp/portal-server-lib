import { DiscoveryService } from '.';
import { EnvService } from './env.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { mock } from 'jest-mock-extended';

describe('EnvService', () => {
  let service: EnvService;
  let discoveryServiceMock: DiscoveryService;

  beforeEach(async () => {
    discoveryServiceMock = mock<DiscoveryService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvService, DiscoveryService],
    })
      .overrideProvider(DiscoveryService)
      .useValue(discoveryServiceMock)
      .compile();

    service = module.get<EnvService>(EnvService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get default value from logoutRedirectUrl', () => {
    expect(service.getEnv()['logoutRedirectUrl']).toStrictEqual('/logout');
  });

  it('should get logoutRedirectUrl', () => {
    const envVarName = 'LOGOUT_REDIRECT_URL';
    process.env[envVarName] = '/test';

    expect(service.getEnv()['logoutRedirectUrl']).toStrictEqual('/test');

    delete process.env[envVarName];
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
      if (value !== undefined && value !== null) {
        process.env[envVarName] = value;
      }

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
    const oauthServerUrlAPP = 'www.app.com';
    const oauthTokenUrlAPP = 'www.app.token.com';
    const oauthServerUrlFoo = 'www.foo.com';
    const oauthTokenUrlFoo = 'www.foo.token.com';
    const oauthServerUrlHyperspace = 'www.too.com';
    const oauthTokenUrlHyperspace = 'www.too.com/token';
    const clientIdFoo = '12134aads';
    const clientIdHyperspace = 'bbbtttppp';
    const clientIdApp = 'asqrfr';
    const clientSecretHyperspace = 'topSecret';
    const clientSecretFoo = 'topSecretFoo';
    const clientSecretApp = 'topSecretApp';

    const setEnvVariables = () => {
      process.env['IDP_NAMES'] = 'app,foo,hyperspace,not-configured';
      process.env['BASE_DOMAINS_APP'] = 'app.k8s.ondemand.com';
      process.env['AUTH_SERVER_URL_APP'] = oauthServerUrlAPP;
      process.env['TOKEN_URL_APP'] = oauthTokenUrlAPP;
      process.env['OIDC_CLIENT_ID_APP'] = clientIdApp;
      process.env['OIDC_CLIENT_SECRET_APP'] = clientSecretApp;
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
    };

    beforeEach(() => setEnvVariables());
    afterEach(() => {
      setEnvVariables();
      discoveryServiceMock = mock<DiscoveryService>();
    });

    it('should get oauthServerUrl and oauthTokenUrl form DISCOVERY_ENDPOINT when discoveryService returns proper values', async () => {
      const request = mock<Request>();
      request.hostname = 'app.hyper.space';

      const discoveryServiceMockGetOIDC = jest.spyOn(
        discoveryServiceMock,
        'getOIDC',
      );
      discoveryServiceMockGetOIDC.mockResolvedValue({
        authorization_endpoint: 'example.com/authorization_endpoint',
        token_endpoint: 'example.com/token_endpoint',
      });

      process.env['DISCOVERY_ENDPOINT_APP'] = 'example.com';
      const envWithAuth = await service.getCurrentAuthEnv(request);

      expect(envWithAuth.oauthServerUrl).toEqual(
        'example.com/authorization_endpoint',
      );
      expect(envWithAuth.oauthTokenUrl).toEqual('example.com/token_endpoint');
    });

    it('should get oauthServerUrl and oauthTokenUrl from env when discoveryService returns null ', async () => {
      const request = mock<Request>();
      request.hostname = 'app.hyper.space';

      const discoveryServiceMockGetOIDC = jest.spyOn(
        discoveryServiceMock,
        'getOIDC',
      );
      discoveryServiceMockGetOIDC.mockResolvedValue(null);

      process.env['DISCOVERY_ENDPOINT_APP'] = 'example.com';
      const envWithAuth = await service.getCurrentAuthEnv(request);

      expect(envWithAuth.oauthServerUrl).toEqual('www.app.com');
      expect(envWithAuth.oauthTokenUrl).toEqual('www.app.token.com');
    });

    it('should map the idp to the url for foo', async () => {
      const request = mock<Request>();
      request.hostname = 'foo.hyper.space';

      const envWithAuth = await service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdFoo);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlFoo);
    });

    it('should map the idp to the token url for foo', async () => {
      const request = mock<Request>();
      request.hostname = 'foo.hyper.space';

      const envWithAuth = await service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdFoo);
      expect(envWithAuth.oauthTokenUrl).toBe(oauthTokenUrlFoo);
    });

    it('should map the idp to the token url for app', async () => {
      const request = mock<Request>();
      request.hostname = 'app.k8s.ondemand.com';

      const envWithAuth = await service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdApp);
      expect(envWithAuth.oauthTokenUrl).toBe(oauthTokenUrlAPP);
    });

    it('should map the idp of foo to a different base url', async () => {
      const request = mock<Request>();
      request.hostname = 'foo.app.k8s.ondemand.com';

      const envWithAuth = await service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdFoo);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlFoo);
      expect(envWithAuth.clientSecret).toBe(clientSecretFoo);
    });

    it('should return the default tenant, if a host name is directly matched', async () => {
      const request = mock<Request>();
      request.hostname = 'app.k8s.ondemand.com';

      const envWithAuth = await service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdApp);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlAPP);
      expect(envWithAuth.clientSecret).toBe(clientSecretApp);
    });

    it('should return the default tenant, for a different host with multiple names is directly matched', async () => {
      const request = mock<Request>();
      request.hostname = 'hyper.space';

      const envWithAuth = await service.getCurrentAuthEnv(request);

      expect(envWithAuth.clientId).toBe(clientIdHyperspace);
      expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlHyperspace);
      expect(envWithAuth.clientSecret).toBe(clientSecretHyperspace);
    });

    it('should throw when the idp is not existing', async () => {
      const request = mock<Request>();
      request.hostname = 'not-existing.app.k8s.ondemand.com';

      await expect(service.getCurrentAuthEnv(request)).rejects.toThrow(
        "the idp 'not-existing' is not configured!",
      );
    });

    it('should throw when the token url is not configured is not existing', async () => {
      const request = mock<Request>();
      request.hostname = 'app.k8s.ondemand.com';
      delete process.env[`TOKEN_URL_APP`];

      await expect(service.getCurrentAuthEnv(request)).rejects.toThrow(Error);
    });

    it('should throw when the domain is not existing', async () => {
      const request = mock<Request>();
      request.hostname = 'app-too.foo.com';

      await expect(service.getCurrentAuthEnv(request)).rejects.toThrow(
        "app-too.foo.com is not listed in the portal's base urls: 'app.k8s.ondemand.com,hyper.space,localhost'",
      );
    });

    it('should throw when the idp is not properly configured', async () => {
      const request = mock<Request>();
      request.hostname = 'not-configured.app.k8s.ondemand.com';

      await expect(service.getCurrentAuthEnv(request)).rejects.toThrow(
        "the idp not-configured is not properly configured. oauthServerUrl: 'undefined' oauthTokenUrl: 'undefined' clientId: 'undefined', has client secret (OIDC_CLIENT_SECRET_NOT_CONFIGURED): false",
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
