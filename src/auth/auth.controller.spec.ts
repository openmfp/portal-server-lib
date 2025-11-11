import {
  AUTH_CALLBACK_INJECTION_TOKEN,
  AUTH_CONFIG_INJECTION_TOKEN,
} from '../injection-tokens.js';
import { PortalModule } from '../portal.module.js';
import { CookiesService } from '../services/index.js';
import { AuthConfigService } from './auth-config.service.js';
import { AuthTokenData, AuthTokenService } from './auth-token.service.js';
import { AuthCallback } from './auth.callback.js';
import { AuthController } from './auth.controller.js';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';

describe('AuthController', () => {
  let controller: AuthController;
  const authCallbackMock: jest.Mocked<AuthCallback> = mock<Response>();
  const requestMock: Request = mock<Request>();
  const responseMock: Response = mock<Response>();
  const authTokenServiceMock: jest.Mocked<AuthTokenService> =
    mock<AuthTokenService>();
  const authConfigServicekMock: jest.Mocked<AuthConfigService> =
    mock<AuthConfigService>();
  const cookiesServiceMock: jest.Mocked<CookiesService> =
    mock<CookiesService>();

  beforeEach(async () => {
    jest.resetAllMocks();
    (responseMock.redirect as any) = jest.fn((href: string) => href);

    const module: TestingModule = await Test.createTestingModule({
      imports: [PortalModule.create({})],
    })
      .overrideProvider(AUTH_CALLBACK_INJECTION_TOKEN)
      .useValue(authCallbackMock)
      .overrideProvider(AUTH_CONFIG_INJECTION_TOKEN)
      .useValue(authConfigServicekMock)
      .overrideProvider(AuthTokenService)
      .useValue(authTokenServiceMock)
      .overrideProvider(CookiesService)
      .useValue(cookiesServiceMock)
      .compile();
    controller = module.get<AuthController>(AuthController);
    process.env.BASE_DOMAINS_DEFAULT = 'localhost';
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('auth', () => {
    it('redirects to decoded state URL after successful token exchange', async () => {
      const decodedUrl = 'http://sub.localhost:4300/';
      requestMock.query = {
        code: 'foo',
        state: encodeURIComponent(btoa(`${decodedUrl}_luigiNonce=SOME_NONCE`)),
      } as any;
      authConfigServicekMock.getAuthConfig.mockResolvedValue({
        baseDomain: 'localhost',
      });

      const authTokenResponse = {
        id_token: 'id',
        refresh_token: 'ref',
        access_token: 'acc',
        expires_in: '111',
      } as AuthTokenData;
      authTokenServiceMock.exchangeTokenForCode.mockResolvedValue(
        authTokenResponse,
      );

      const result = await controller.auth(requestMock, responseMock);

      expect(authTokenServiceMock.exchangeTokenForCode).toHaveBeenCalledWith(
        requestMock,
        responseMock,
        'foo',
      );
      expect(authCallbackMock.handleSuccess).toHaveBeenCalledWith(
        requestMock,
        responseMock,
        authTokenResponse,
      );
      expect(responseMock.redirect).toHaveBeenCalledWith(decodedUrl);
      expect(result).toBe(decodedUrl);
    });

    it('redirects to /logout with error when token exchange fails', async () => {
      const origin = 'http://sub.localhost:4300';
      const stateUrl = `${origin}/path?x=1#frag`;
      requestMock.query = {
        code: 'foo',
        state: encodeURIComponent(btoa(`${stateUrl}_luigiNonce=N`)),
      } as any;

      authTokenServiceMock.exchangeTokenForCode.mockRejectedValue(
        new Error('boom'),
      );

      const result = await controller.auth(requestMock, responseMock);

      expect(authCallbackMock.handleFailure).toHaveBeenCalledWith(
        requestMock,
        responseMock,
      );
      expect(responseMock.redirect).toHaveBeenCalledWith(
        `${origin}/logout?error=loginError`,
      );
      expect(result).toBe(`${origin}/logout?error=loginError`);
    });

    it('redirects to /logout with error when state URL domain is not allowed', async () => {
      const badOrigin = 'http://malicious.example.com';
      const stateUrl = `${badOrigin}/`;
      requestMock.query = {
        code: 'foo',
        state: encodeURIComponent(btoa(`${stateUrl}_luigiNonce=N`)),
      } as any;

      const result = await controller.auth(requestMock, responseMock);

      expect(authTokenServiceMock.exchangeTokenForCode).not.toHaveBeenCalled();
      expect(authCallbackMock.handleFailure).toHaveBeenCalledWith(
        requestMock,
        responseMock,
      );
      expect(responseMock.redirect).toHaveBeenCalledWith(
        `${badOrigin}/logout?error=loginError`,
      );
      expect(result).toBe(`${badOrigin}/logout?error=loginError`);
    });
  });

  describe('refresh', () => {
    it('should return undefined if there is no refresh token in the request', async () => {
      // arrange
      cookiesServiceMock.getAuthCookie.mockReturnValue(null);

      // act
      const response = await controller.refresh(requestMock, responseMock);

      //
      expect(response).toBeUndefined();
      expect(
        authTokenServiceMock.exchangeTokenForRefreshToken,
      ).not.toHaveBeenCalled();
    });

    it('should refresh the token', async () => {
      // arrange
      const exchangeTokenForRefreshToken = jest.spyOn(
        authTokenServiceMock,
        'exchangeTokenForRefreshToken',
      );
      const getAuthCookie = jest.spyOn(cookiesServiceMock, 'getAuthCookie');
      getAuthCookie.mockReturnValue('authCookie');
      const callback = jest.spyOn(authCallbackMock, 'handleSuccess');
      const idToken = 'id_token';
      const authTokenResponse = {
        id_token: idToken,
        refresh_token: 'ref',
        expires_in: '12312',
        access_token: 'access',
      } as AuthTokenData;
      exchangeTokenForRefreshToken.mockResolvedValue(authTokenResponse);

      // act
      const tokenResponse = await controller.refresh(requestMock, responseMock);

      // assert
      expect(callback).toHaveBeenCalledWith(
        requestMock,
        responseMock,
        authTokenResponse,
      );
      expect(exchangeTokenForRefreshToken).toHaveBeenCalledWith(
        requestMock,
        responseMock,
        'authCookie',
      );
      expect((tokenResponse as AuthTokenData).refresh_token).toBeUndefined();
    });

    it('should remove the auth cookies on auth server error', async () => {
      // arrange
      cookiesServiceMock.getAuthCookie.mockReturnValue('authCookie');
      authTokenServiceMock.exchangeTokenForRefreshToken.mockRejectedValue(
        new Error('error'),
      );
      authCallbackMock.handleFailure.mockRejectedValue(
        new Error('handleFailure'),
      );

      // act
      const response = await controller.refresh(requestMock, responseMock);

      // assert
      expect(response).toBeUndefined();
      expect(authCallbackMock.handleSuccess).not.toHaveBeenCalled();
      expect(authCallbackMock.handleFailure).toHaveBeenCalledWith(
        requestMock,
        responseMock,
      );
      expect(
        authTokenServiceMock.exchangeTokenForRefreshToken,
      ).toHaveBeenCalledWith(requestMock, responseMock, 'authCookie');
      expect(cookiesServiceMock.removeAuthCookie).toHaveBeenCalledWith(
        requestMock,
        responseMock,
      );
    });
  });
});
