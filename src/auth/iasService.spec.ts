import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { IasResponse, IasService } from './ias.service';
import { Request, Response } from 'express';
import nock from 'nock';
import { EnvService } from '../env/env.service';
import { AUTH_CALLBACK_INJECTION_TOKEN } from '../injectionTokens';
import { AuthCallback } from './authCallback';
import { PortalModule } from '../portal.module';

describe('IasService', () => {
  let service: IasService;
  let responseMock: Response;
  let requestMock: Request;
  let envService: EnvService;
  let authCallbackMock: AuthCallback;

  beforeEach(async () => {
    process.env['IDP_NAMES'] = 'sap';
    process.env['BASE_DOMAINS_SAP'] = 'example.com';
    process.env['IAS_TENANT_URL_SAP'] =
      'https://ametqb0em.accounts400.ondemand.com';
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

    service = module.get<IasService>(IasService);
    envService = module.get<EnvService>(EnvService);
    responseMock = mock<Response>();
    requestMock = mock<Request>();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should clear the cookies', async () => {
    await service.removeAuthCookies(responseMock);

    expect(responseMock.clearCookie).toHaveBeenCalledWith('auth_cookie');
    expect(authCallbackMock.clearCookies).toHaveBeenCalled();
  });

  describe('get auth cookie', () => {
    it('should return undefined if there are no cookies in the request', () => {
      const authCookie = service.getAuthCookie(requestMock);

      expect(authCookie).toBeUndefined();
    });

    it('should return a value if there is an auth cookie', () => {
      requestMock.cookies = { auth_cookie: 'foo' };

      const authCookie = service.getAuthCookie(requestMock);

      expect(authCookie).toEqual('foo');
    });
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

    function assertResponseAndCookies(iasResponse: IasResponse) {
      expect(iasResponse.refresh_token).toBe(refreshTokenValue);
      expect(iasResponse.id_token).toBe(idTokenValue);
      expect(iasResponse.access_token).toBe(accessTokenValue);
      expect(iasResponse.expires_in).toBe(12345);

      expect(responseMock.cookie).toHaveBeenCalledWith(
        'auth_cookie',
        refreshTokenValue,
        {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        }
      );
      expect(authCallbackMock.setCookies).toHaveBeenCalledWith(
        requestMock,
        responseMock,
        idTokenValue
      );
    }

    describe('refresh token - refresh_token flow', () => {
      const refreshToken = 'refresh me';

      it('should set the cookies', async () => {
        // Arrange
        nock(envService.getCurrentAuthEnv(requestMock).oauthServerUrl)
          .post('/oauth2/token/', {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
          })
          .reply(200, serverResponse);

        // Act
        const iasResponse = await service.exchangeTokenForRefreshToken(
          requestMock,
          responseMock,
          refreshToken
        );

        // Assert
        assertResponseAndCookies(iasResponse);
      });
    });

    describe('token for code - authorization_code flow', () => {
      it('should set the cookies', async () => {
        // Arrange
        const env = envService.getCurrentAuthEnv(requestMock);
        const code = 'secret code';

        nock(env.oauthServerUrl)
          .post('/oauth2/token/', {
            client_id: env.clientId,
            grant_type: 'authorization_code',
            redirect_uri: `http://localhost:4300/callback?storageType=none`,
            code: code,
          })
          .reply(200, serverResponse);

        // Act
        const iasResponse = await service.exchangeTokenForCode(
          requestMock,
          responseMock,
          code
        );

        // Assert
        assertResponseAndCookies(iasResponse);
      });
    });

    it('handles an ias error', async () => {
      // Arrange
      const env = envService.getCurrentAuthEnv(requestMock);
      const code = 'secret code';

      nock(env.oauthServerUrl)
        .post('/oauth2/token/', {
          client_id: env.clientId,
          grant_type: 'authorization_code',
          redirect_uri: `http://localhost:4300/callback?storageType=none`,
          code: code,
        })
        .reply(500, 'oh nose');

      // Act
      const iasResponse = service.exchangeTokenForCode(
        requestMock,
        responseMock,
        code
      );

      await expect(iasResponse).rejects.toThrowError(
        'Error response from ias: AxiosError: Request failed with status code 500'
      );
    });
  });
});
