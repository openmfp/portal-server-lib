import { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { EnvService } from '../env';
import { CookiesService } from '../services';
import { AuthController } from './auth.controller';
import { PortalModule } from '../portal.module';
import { AuthCallback } from './auth.callback';
import { AUTH_CALLBACK_INJECTION_TOKEN } from '../injection-tokens';
import { AuthTokenData, AuthTokenService } from './auth-token.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authCallbackMock: jest.Mocked<AuthCallback> = mock<Response>();
  let requestMock: Request = mock<Request>();
  let responseMock: Response = mock<Response>();
  let authTokenServiceMock: jest.Mocked<AuthTokenService> =
    mock<AuthTokenService>();
  let cookiesServiceMock: jest.Mocked<CookiesService> = mock<CookiesService>();
  const logoutRedirectUrl = 'logoutRedirectUrl';

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [PortalModule.create({})],
    })
      .overrideProvider(AUTH_CALLBACK_INJECTION_TOKEN)
      .useValue(authCallbackMock)
      .overrideProvider(AuthTokenService)
      .useValue(authTokenServiceMock)
      .overrideProvider(CookiesService)
      .useValue(cookiesServiceMock)
      .compile();
    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('auth', () => {
    it('should get the config for tenant', async () => {
      // arrange
      const callback = jest.spyOn(authCallbackMock, 'handleSuccess');
      const getTokenForCode = jest.spyOn(
        authTokenServiceMock,
        'exchangeTokenForCode'
      );
      requestMock.query = { code: 'foo' };
      const idToken = 'id_token';
      const authTokenResponse = {
        id_token: idToken,
        refresh_token: 'ref',
        expires_in: '12312',
        access_token: 'access',
      } as AuthTokenData;
      getTokenForCode.mockResolvedValue(authTokenResponse);

      // act
      const tokenResponse = await controller.auth(requestMock, responseMock);

      // assert
      expect(callback).toHaveBeenCalledWith(
        requestMock,
        responseMock,
        authTokenResponse
      );
      expect(getTokenForCode).toHaveBeenCalledWith(
        requestMock,
        responseMock,
        'foo'
      );
      expect((tokenResponse as AuthTokenData).refresh_token).toBeUndefined();
    });

    it('should log the error if there is a problem retrieving the token', async () => {
      // arrange
      const getTokenForCode = jest.spyOn(
        authTokenServiceMock,
        'exchangeTokenForCode'
      );
      requestMock.query = { code: 'foo' };
      getTokenForCode.mockRejectedValue(new Error('error'));

      // act
      const response = await controller.auth(requestMock, responseMock);

      // assert
      expect(response).toBeUndefined();
      expect(getTokenForCode).toHaveBeenCalledWith(
        requestMock,
        responseMock,
        'foo'
      );
    });

    it('should ', () => {});
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
        authTokenServiceMock.exchangeTokenForRefreshToken
      ).not.toHaveBeenCalled();
    });

    it('should refresh the token', async () => {
      // arrange
      const exchangeTokenForRefreshToken = jest.spyOn(
        authTokenServiceMock,
        'exchangeTokenForRefreshToken'
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
        authTokenResponse
      );
      expect(exchangeTokenForRefreshToken).toHaveBeenCalledWith(
        requestMock,
        responseMock,
        'authCookie'
      );
      expect((tokenResponse as AuthTokenData).refresh_token).toBeUndefined();
    });

    it('should remove the auth cookies on auth server error', async () => {
      // arrange
      const logoutRedirectUrl = 'logoutRedirectUrl';
      cookiesServiceMock.getAuthCookie.mockReturnValue('authCookie');
      authTokenServiceMock.exchangeTokenForRefreshToken.mockRejectedValue(
        new Error('error')
      );
      authCallbackMock.handleFailure.mockRejectedValue(
        new Error('handleFailure')
      );

      // act
      const response = await controller.refresh(requestMock, responseMock);

      // assert
      expect(response).toBeUndefined();
      expect(authCallbackMock.handleSuccess).not.toHaveBeenCalled();
      expect(authCallbackMock.handleFailure).toHaveBeenCalledWith(
        requestMock,
        responseMock
      );
      expect(
        authTokenServiceMock.exchangeTokenForRefreshToken
      ).toHaveBeenCalledWith(requestMock, responseMock, 'authCookie');
      expect(cookiesServiceMock.removeAuthCookie).toHaveBeenCalledWith(
        responseMock
      );
    });
  });
});
