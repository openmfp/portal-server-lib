import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { AuthTokenResponse, AuthTokenService } from './auth-token.service';
import { Request, Response } from 'express';
import nock from 'nock';
import { EnvService } from '../env/env.service';
import { AUTH_CALLBACK_INJECTION_TOKEN } from '../injection-tokens';
import { AuthCallback } from './auth.callback';
import { PortalModule } from '../portal.module';

describe('AuthTokenService', () => {
  let service: AuthTokenService;
  let responseMock: Response;
  let requestMock: Request;
  let envService: EnvService;
  let authCallbackMock: AuthCallback;

  beforeEach(async () => {
    process.env['IDP_NAMES'] = 'sap';
    process.env['BASE_DOMAINS_SAP'] = 'example.com';
    process.env['AUTH_SERVER_URL_SAP'] =
      'https://ametqb0em.accounts400.ondemand.com/auth';
    process.env['TOKEN_URL_SAP'] =
      'https://ametqb0em.accounts400.ondemand.com/token';
    process.env['OIDC_CLIENT_ID_SAP'] = '1fd3f7a6-d506-4289-9fcf-fed52eeb4c16';
    process.env['OIDC_CLIENT_SECRET_SAP'] = 'test secret';
    process.env['ENVIRONMENT'] = 'local';

    authCallbackMock = mock<AuthCallback>();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortalModule.create({})],
    })
      .overrideProvider(AUTH_CALLBACK_INJECTION_TOKEN)
      .useValue(authCallbackMock)
      .compile();

    service = module.get<AuthTokenService>(AuthTokenService);
    envService = module.get<EnvService>(EnvService);
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
    });

    function assertResponseAndCookies(authTokenResponse: AuthTokenResponse) {
      expect(authTokenResponse.refresh_token).toBe(refreshTokenValue);
      expect(authTokenResponse.id_token).toBe(idTokenValue);
      expect(authTokenResponse.access_token).toBe(accessTokenValue);
      expect(authTokenResponse.expires_in).toBe(12345);

      expect(responseMock.cookie).toHaveBeenCalledWith(
        'openmfp_auth_cookie',
        refreshTokenValue,
        {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        }
      );
    }

    describe('token for refresh token - refresh_token flow', () => {
      const refreshToken = 'refresh me';

      it('should set the cookies', async () => {
        // Arrange
        nock(envService.getCurrentAuthEnv(requestMock).oauthTokenUrl)
          .post('', {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          })
          .reply(200, serverResponse);

        // Act
        const authTokenResponse = await service.exchangeTokenForRefreshToken(
          requestMock,
          responseMock,
          refreshToken
        );

        // Assert
        assertResponseAndCookies(authTokenResponse);
      });

      it('should not set the cookies, authorization exception', async () => {
        // Arrange
        nock(envService.getCurrentAuthEnv(requestMock).oauthTokenUrl)
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
            refreshToken
          )
        ).rejects.toThrowError(
          'Unexpected response code from auth token server: 206, null'
        );
      });
    });

    describe('token for code - authorization_code flow', () => {
      it('should set the cookies', async () => {
        // Arrange
        const env = envService.getCurrentAuthEnv(requestMock);
        const code = 'secret code';

        nock(env.oauthTokenUrl)
          .post('', {
            client_id: env.clientId,
            grant_type: 'authorization_code',
            redirect_uri: `http://localhost:4300/callback?storageType=none`,
            code: code,
          })
          .reply(200, serverResponse);

        // Act
        const authTokenResponse = await service.exchangeTokenForCode(
          requestMock,
          responseMock,
          code
        );

        // Assert
        assertResponseAndCookies(authTokenResponse);
      });

      it('should set the cookies for none local env', async () => {
        // Arrange
        process.env['ENVIRONMENT'] = 'prod';
        const env = envService.getCurrentAuthEnv(requestMock);
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
          code
        );

        // Assert
        assertResponseAndCookies(authTokenResponse);
      });
    });

    it('handles an auth server error', async () => {
      // Arrange
      const env = envService.getCurrentAuthEnv(requestMock);
      const code = 'secret code';

      nock(env.oauthTokenUrl)
        .post('', {
          client_id: env.clientId,
          grant_type: 'authorization_code',
          redirect_uri: `http://localhost:4300/callback?storageType=none`,
          code: code,
        })
        .reply(500, 'oh nose');

      // Act
      const authTokenResponsePromise = service.exchangeTokenForCode(
        requestMock,
        responseMock,
        code
      );

      await expect(authTokenResponsePromise).rejects.toThrowError(
        'Error response from auth token server: AxiosError: Request failed with status code 500'
      );
    });
  });
});
