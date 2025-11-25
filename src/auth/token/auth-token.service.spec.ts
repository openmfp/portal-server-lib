import { EnvService } from '../../env/index.js';
import {
  AUTH_CALLBACK_INJECTION_TOKEN,
  AUTH_CONFIG_INJECTION_TOKEN,
} from '../../injection-tokens.js';
import { PortalModule } from '../../portal.module.js';
import {
  AuthConfigProvider,
  EmptyAuthConfigService,
  EnvAuthConfigService,
} from '../auth-config-providers/index.js';
import { AuthCallback } from '../auth.callback.js';
import { AuthTokenData } from './auth-token.service.js';
import { ExtAuthTokenService } from './ext-auth-token.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';
import nock from 'nock';

describe('AuthTokenService', () => {
  let service: ExtAuthTokenService;
  let responseMock: Response;
  let requestMock: Request;
  let envService: EnvService;
  let authCallbackMock: AuthCallback;
  let authConfigProvider: AuthConfigProvider;

  beforeEach(async () => {
    process.env['IDP_NAMES'] = 'app';
    process.env['BASE_DOMAINS_APP'] = 'example.com,localhost';
    process.env['AUTH_SERVER_URL_APP'] = 'https://serv-example.com/auth';
    process.env['TOKEN_URL_APP'] = 'https://serv-example.com/token';
    process.env['OIDC_CLIENT_ID_APP'] = '1fd3f7a6-d506-4289-9fcf';
    process.env['OIDC_CLIENT_SECRET_APP'] = 'test secret';

    authCallbackMock = mock<AuthCallback>();
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PortalModule.create({
          authConfigProvider: EnvAuthConfigService,
        }),
      ],
    })
      .overrideProvider(AUTH_CALLBACK_INJECTION_TOKEN)
      .useValue(authCallbackMock)
      .compile();

    service = module.get<ExtAuthTokenService>(ExtAuthTokenService);
    envService = module.get<EnvService>(EnvService);
    authConfigProvider = module.get<AuthConfigProvider>(
      AUTH_CONFIG_INJECTION_TOKEN,
    );
    responseMock = mock<Response>();
    requestMock = mock<Request>();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('exchange', () => {
    const refreshTokenValue = 'refresh_token_value';
    const idTokenValue = 'id_token_value';
    const accessTokenValue = 'access_token_value';
    const hostname = 'example.com';

    const expiresInValue = 12345;

    const serverResponse = {
      access_token: accessTokenValue,
      refresh_token: refreshTokenValue,
      expires_in: expiresInValue,
      id_token: idTokenValue,
    };
    beforeEach(() => {
      requestMock.hostname = hostname;
      requestMock.protocol = 'https';
    });

    function assertResponseAndCookies(authTokenResponse: AuthTokenData) {
      expect(authTokenResponse.refresh_token).toBe(refreshTokenValue);
      expect(authTokenResponse.id_token).toBe(idTokenValue);
      expect(authTokenResponse.access_token).toBe(accessTokenValue);
      expect(authTokenResponse.expires_in).toBe(12345);

      expect(responseMock.cookie).toHaveBeenCalledWith(
        'openmfp_auth_cookie',
        refreshTokenValue,
        {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        },
      );
    }

    describe('token for refresh token - refresh_token flow', () => {
      const refreshToken = 'refresh me';

      it('should set the cookies', async () => {
        // Arrange
        nock(
          (await authConfigProvider.getAuthConfig(requestMock)).oauthTokenUrl,
        )
          .post('', {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          })
          .reply(200, serverResponse);

        // Act
        const authTokenResponse = await service.exchangeTokenForRefreshToken(
          requestMock,
          responseMock,
          refreshToken,
        );

        // Assert
        assertResponseAndCookies(authTokenResponse);
      });

      it('should not set the cookies, authorization exception', async () => {
        // Arrange
        nock(
          (await authConfigProvider.getAuthConfig(requestMock)).oauthTokenUrl,
        )
          .post('', {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          })
          .reply(206, serverResponse);

        // Act
        // Assert
        await expect(
          service.exchangeTokenForRefreshToken(
            requestMock,
            responseMock,
            refreshToken,
          ),
        ).rejects.toThrow(
          'Unexpected response code from auth token server: 206, Partial Content',
        );
      });

      it('should throw error when clientId is not configured', async () => {
        const module: TestingModule = await Test.createTestingModule({
          imports: [
            PortalModule.create({
              authConfigProvider: EmptyAuthConfigService,
            }),
          ],
        })
          .overrideProvider(AUTH_CALLBACK_INJECTION_TOKEN)
          .useValue(authCallbackMock)
          .compile();

        const emptyService =
          module.get<ExtAuthTokenService>(ExtAuthTokenService);

        await expect(
          emptyService.exchangeTokenForRefreshToken(
            requestMock,
            responseMock,
            refreshToken,
          ),
        ).rejects.toThrow('Client ID is not configured');
      });
    });

    describe('token for code - authorization_code flow', () => {
      it('should set the cookies', async () => {
        // Arrange
        requestMock.hostname = 'localhost';
        requestMock.protocol = 'http';
        const env = await authConfigProvider.getAuthConfig(requestMock);
        const code = 'secret code';

        nock(env.oauthTokenUrl)
          .post('', {
            client_id: env.clientId,
            grant_type: 'authorization_code',
            redirect_uri: `http://localhost/callback?storageType=none`,
            code: code,
          })
          .reply(200, serverResponse);

        // Act
        const authTokenResponse = await service.exchangeTokenForCode(
          requestMock,
          responseMock,
          code,
        );

        // Assert
        assertResponseAndCookies(authTokenResponse);
      });

      it('should set the cookies for none local env', async () => {
        // Arrange
        const env = await authConfigProvider.getAuthConfig(requestMock);
        const code = 'secret code';

        nock(env.oauthTokenUrl)
          .post('', {
            client_id: env.clientId,
            grant_type: 'authorization_code',
            redirect_uri: `https://example.com/callback?storageType=none`,
            code: code,
          })
          .reply(200, serverResponse);

        // Act
        const authTokenResponse = await service.exchangeTokenForCode(
          requestMock,
          responseMock,
          code,
        );

        // Assert
        assertResponseAndCookies(authTokenResponse);
      });

      it('should throw error when clientId is not configured', async () => {
        const module: TestingModule = await Test.createTestingModule({
          imports: [
            PortalModule.create({
              authConfigProvider: EmptyAuthConfigService,
            }),
          ],
        })
          .overrideProvider(AUTH_CALLBACK_INJECTION_TOKEN)
          .useValue(authCallbackMock)
          .compile();

        const emptyService =
          module.get<ExtAuthTokenService>(ExtAuthTokenService);

        await expect(
          emptyService.exchangeTokenForCode(
            requestMock,
            responseMock,
            'test-code',
          ),
        ).rejects.toThrow('Client ID is not configured');
      });
    });

    it('handles an auth server error', async () => {
      // Arrange
      requestMock.hostname = 'localhost';
      requestMock.protocol = 'http';
      requestMock.headers = { host: 'localhost:4700' };
      const env = await authConfigProvider.getAuthConfig(requestMock);
      const code = 'secret code';

      nock(env.oauthTokenUrl)
        .post('', {
          client_id: env.clientId,
          grant_type: 'authorization_code',
          redirect_uri: `http://localhost:4700/callback?storageType=none`,
          code: code,
        })
        .reply(500, 'oh nose');

      // Act
      const authTokenResponsePromise = service.exchangeTokenForCode(
        requestMock,
        responseMock,
        code,
      );

      await expect(authTokenResponsePromise).rejects.toThrow(
        'Error response from auth token server: AxiosError: Request failed with status code 500',
      );
    });
  });
});
