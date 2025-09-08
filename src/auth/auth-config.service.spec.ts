import { DiscoveryService, EnvService } from '../env/index.js';
import { EnvAuthConfigService } from './auth-config.service.js';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request } from 'express';
import { mock } from 'jest-mock-extended';

describe('EnvAuthConfigService', () => {
  let service: EnvAuthConfigService;
  let discoveryServiceMock: DiscoveryService;

  beforeEach(async () => {
    discoveryServiceMock = mock<DiscoveryService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [EnvService, DiscoveryService, EnvAuthConfigService],
    })
      .overrideProvider(DiscoveryService)
      .useValue(discoveryServiceMock)
      .compile();

    service = module.get<EnvAuthConfigService>(EnvAuthConfigService);
  });

  describe('getAuthConfig', () => {
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

    describe('getAuthConfig', () => {
      it('should throw when no identity providers are configured', async () => {
        delete process.env['IDP_NAMES'];

        const request = mock<Request>();
        request.hostname = 'app.k8s.ondemand.com';

        try {
          await service.getAuthConfig(request);
          fail('Expected HttpException to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
          expect(error.getResponse()).toEqual({
            message: 'Identity provider not found nor configured',
            error: 'The identity provider is not present!',
            statusCode: HttpStatus.NOT_FOUND,
          });
        }
      });

      it('should throw when IDP_NAMES is empty string', async () => {
        process.env['IDP_NAMES'] = '';

        const request = mock<Request>();
        request.hostname = 'app.k8s.ondemand.com';

        try {
          await service.getAuthConfig(request);
          fail('Expected HttpException to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
          expect(error.getResponse()).toEqual({
            message: 'Identity provider not found nor configured',
            error: 'The identity provider is not present!',
            statusCode: HttpStatus.NOT_FOUND,
          });
        }
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
        const envWithAuth = await service.getAuthConfig(request);

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
        const envWithAuth = await service.getAuthConfig(request);

        expect(envWithAuth.oauthServerUrl).toEqual('www.app.com');
        expect(envWithAuth.oauthTokenUrl).toEqual('www.app.token.com');
      });

      it('should map the idp to the url for foo', async () => {
        const request = mock<Request>();
        request.hostname = 'foo.hyper.space';

        const envWithAuth = await service.getAuthConfig(request);

        expect(envWithAuth.clientId).toBe(clientIdFoo);
        expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlFoo);
      });

      it('should map the idp to the token url for foo', async () => {
        const request = mock<Request>();
        request.hostname = 'foo.hyper.space';

        const envWithAuth = await service.getAuthConfig(request);

        expect(envWithAuth.clientId).toBe(clientIdFoo);
        expect(envWithAuth.oauthTokenUrl).toBe(oauthTokenUrlFoo);
      });

      it('should map the idp to the token url for app', async () => {
        const request = mock<Request>();
        request.hostname = 'app.k8s.ondemand.com';

        const envWithAuth = await service.getAuthConfig(request);

        expect(envWithAuth.clientId).toBe(clientIdApp);
        expect(envWithAuth.oauthTokenUrl).toBe(oauthTokenUrlAPP);
        expect(envWithAuth.idpName).toBe('app');
        expect(envWithAuth.baseDomain).toBe('app.k8s.ondemand.com');
      });

      it('should map the idp of foo to its domain, the foo is configured', async () => {
        const request = mock<Request>();
        request.hostname = 'foo.app.k8s.ondemand.com';

        const envWithAuth = await service.getAuthConfig(request);

        expect(envWithAuth.clientId).toBe(clientIdFoo);
        expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlFoo);
        expect(envWithAuth.clientSecret).toBe(clientSecretFoo);
        expect(envWithAuth.baseDomain).toBe('foo.app.k8s.ondemand.com');
      });

      it('should map the idp of test to an existing its base domain', async () => {
        const request = mock<Request>();
        request.hostname = 'test.app.k8s.ondemand.com';

        const envWithAuth = await service.getAuthConfig(request);

        expect(envWithAuth.clientId).toBe(clientIdApp);
        expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlAPP);
        expect(envWithAuth.clientSecret).toBe(clientSecretApp);
        expect(envWithAuth.baseDomain).toBe('app.k8s.ondemand.com');
      });

      it('should return the default tenant, if a host name is directly matched', async () => {
        const request = mock<Request>();
        request.hostname = 'app.k8s.ondemand.com';

        const envWithAuth = await service.getAuthConfig(request);

        expect(envWithAuth.clientId).toBe(clientIdApp);
        expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlAPP);
        expect(envWithAuth.clientSecret).toBe(clientSecretApp);
      });

      it('should return the default tenant, for a different host with multiple names is directly matched', async () => {
        const request = mock<Request>();
        request.hostname = 'hyper.space';

        const envWithAuth = await service.getAuthConfig(request);

        expect(envWithAuth.clientId).toBe(clientIdHyperspace);
        expect(envWithAuth.oauthServerUrl).toBe(oauthServerUrlHyperspace);
        expect(envWithAuth.clientSecret).toBe(clientSecretHyperspace);
      });

      it('should throw when the idp is not existing, neither base domain is present', async () => {
        const request = mock<Request>();
        request.hostname = 'not-existing.app.k8s.ondemand2.com';

        try {
          await service.getAuthConfig(request);
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
          expect(error.getResponse()).toEqual({
            message: 'Domain not supported',
            error:
              "not-existing.app.k8s.ondemand2.com is not listed in the portal's base urls: 'app.k8s.ondemand.com,hyper.space,localhost'",
            statusCode: HttpStatus.NOT_FOUND,
          });
        }
      });

      it('should return the base domain in case the idp is not existing in the env variables, and the organization indicated by the sub domain', async () => {
        const request = mock<Request>();
        request.hostname = 'not-existing.app.k8s.ondemand.com';

        const envWithAuth = await service.getAuthConfig(request);

        expect(envWithAuth.baseDomain).toBe('app.k8s.ondemand.com');
        // the idp value here is used to retrieve the auth configuration from env variables, for the idp not-existing there are no env variables
        expect(envWithAuth.idpName).toBe('app');
      });

      it('should throw when the token url is not configured is not existing', async () => {
        const request = mock<Request>();
        request.hostname = 'app.k8s.ondemand.com';
        delete process.env[`TOKEN_URL_APP`];

        try {
          await service.getAuthConfig(request);
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
          expect(error.getResponse()).toEqual(
            expect.objectContaining({
              message: 'Identity provider configuration incomplete',
              statusCode: HttpStatus.NOT_FOUND,
            }),
          );
        }
      });

      it('should throw when the domain is not existing', async () => {
        const request = mock<Request>();
        request.hostname = 'app-too.foo.com';

        try {
          await service.getAuthConfig(request);
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
          expect(error.getResponse()).toEqual({
            message: 'Domain not supported',
            error:
              "app-too.foo.com is not listed in the portal's base urls: 'app.k8s.ondemand.com,hyper.space,localhost'",
            statusCode: HttpStatus.NOT_FOUND,
          });
        }
      });

      it('should throw when the idp is not properly configured', async () => {
        const request = mock<Request>();
        request.hostname = 'not-configured.app.k8s.ondemand.com';

        try {
          await service.getAuthConfig(request);
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect(error.getStatus()).toBe(HttpStatus.NOT_FOUND);
          expect(error.getResponse()).toEqual(
            expect.objectContaining({
              message: 'Identity provider configuration incomplete',
              error:
                "the idp not-configured is not properly configured. oauthServerUrl: 'undefined' oauthTokenUrl: 'undefined' clientId: 'undefined', has client secret (OIDC_CLIENT_SECRET_NOT_CONFIGURED): false",
              statusCode: HttpStatus.NOT_FOUND,
            }),
          );
        }
      });
    });
  });
});
