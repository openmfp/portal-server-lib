import { Request, Response } from 'express';
import { mock } from 'jest-mock-extended';
import { Test, TestingModule } from '@nestjs/testing';
import { CookiesService } from '../services/cookies.service';
import { AuthController } from './auth.controller';
import { PortalModule } from '../portal.module';
import { AuthCallback } from './auth.callback';
import { AUTH_CALLBACK_INJECTION_TOKEN } from '../injection-tokens';
import { AuthTokenData, AuthTokenService } from './auth-token.service';
import { HttpException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authCallback: AuthCallback;
  let requestMock: Request;
  let responseMock: Response;
  let authTokenService: AuthTokenService;
  let cookiesService: CookiesService;

  beforeEach(async () => {
    authTokenService = mock<AuthTokenService>();
    cookiesService = mock<CookiesService>();
    const module: TestingModule = await Test.createTestingModule({
      imports: [PortalModule.create({})],
    })
      .overrideProvider(AuthTokenService)
      .useValue(authTokenService)
      .overrideProvider(CookiesService)
      .useValue(cookiesService)
      .compile();
    controller = module.get<AuthController>(AuthController);
    authCallback = module.get<AuthCallback>(AUTH_CALLBACK_INJECTION_TOKEN);
    requestMock = mock<Request>();
    responseMock = mock<Response>();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get the config for tenant', async () => {
    // arrange
    const callback = jest.spyOn(authCallback, 'handleSuccess');
    const getTokenForCode = jest.spyOn(
      authTokenService,
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
    expect(tokenResponse.refresh_token).toBeUndefined();
  });

  it('should log the error if there is a problem retrieving the token', async () => {
    // arrange
    const getTokenForCode = jest.spyOn(
      authTokenService,
      'exchangeTokenForCode'
    );
    requestMock.query = { code: 'foo' };
    getTokenForCode.mockRejectedValue(new Error('error'));

    // act
    await expect(controller.auth(requestMock, responseMock)).rejects.toThrow(
      Error
    );

    // assert
    expect(getTokenForCode).toHaveBeenCalledWith(
      requestMock,
      responseMock,
      'foo'
    );
  });

  it('should return a bad request when there was no code provided', async () => {
    // arrange
    const callback = jest.spyOn(authCallback, 'handleSuccess');
    const getTokenForCode = jest.spyOn(
      authTokenService,
      'exchangeTokenForCode'
    );
    requestMock.query = {};

    // act
    const response = controller.auth(requestMock, responseMock);

    // assert
    await expect(response).rejects.toThrow(HttpException);
    await expect(response).rejects.toThrow(
      "no 'code' was provided in the query"
    );
    expect(callback).not.toHaveBeenCalledWith(requestMock);
    expect(getTokenForCode).not.toHaveBeenCalledWith(
      requestMock,
      responseMock,
      'foo'
    );
  });

  it('should refresh the token', async () => {
    // arrange
    const exchangeTokenForRefreshToken = jest.spyOn(
      authTokenService,
      'exchangeTokenForRefreshToken'
    );
    const getAuthCookie = jest.spyOn(cookiesService, 'getAuthCookie');
    getAuthCookie.mockReturnValue('authCookie');
    const callback = jest.spyOn(authCallback, 'handleSuccess');
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
    expect(tokenResponse.refresh_token).toBeUndefined();
  });

  it('should return a bad request when there was no auth cookie provided', async () => {
    // arrange
    const exchangeTokenForRefreshToken = jest.spyOn(
      authTokenService,
      'exchangeTokenForRefreshToken'
    );
    const getAuthCookie = jest.spyOn(cookiesService, 'getAuthCookie');
    getAuthCookie.mockReturnValue(undefined);
    const callback = jest.spyOn(authCallback, 'handleSuccess');

    // act
    const response = controller.refresh(requestMock, responseMock);

    // assert
    await expect(response).rejects.toThrow(HttpException);
    await expect(response).rejects.toThrow('the user is not logged in');
    expect(callback).not.toHaveBeenCalledWith(requestMock);
    expect(exchangeTokenForRefreshToken).not.toHaveBeenCalled();
  });

  it('should remove the auth cookies on auth server error', async () => {
    // arrange
    const exchangeTokenForRefreshToken = jest.spyOn(
      authTokenService,
      'exchangeTokenForRefreshToken'
    );
    const removeAuthCookies = jest.spyOn(cookiesService, 'removeAuthCookie');
    const getAuthCookie = jest.spyOn(cookiesService, 'getAuthCookie');
    getAuthCookie.mockReturnValue('authCookie');
    const handleFailure = jest.spyOn(authCallback, 'handleFailure');
    const handleSuccess = jest.spyOn(authCallback, 'handleSuccess');
    exchangeTokenForRefreshToken.mockRejectedValue(new Error('error'));

    // act
    const response = controller.refresh(requestMock, responseMock);

    // assert
    await expect(response).rejects.toThrow(Error);
    await expect(response).rejects.toThrow('error');
    expect(handleSuccess).not.toHaveBeenCalled();
    expect(handleFailure).toHaveBeenCalledWith(requestMock, responseMock);
    expect(exchangeTokenForRefreshToken).toHaveBeenCalledWith(
      requestMock,
      responseMock,
      'authCookie'
    );
    expect(removeAuthCookies).toHaveBeenCalledWith(responseMock);
  });
});
