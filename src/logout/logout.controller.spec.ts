import { DiscoveryService, EnvService } from '../env';
import { LOGOUT_CALLBACK_INJECTION_TOKEN } from '../injection-tokens';
import { CookiesService } from '../services';
import { LogoutCallback } from './logout-callback';
import { LogoutController } from './logout.controller.js';
import { NoopLogoutService } from './noop-logout.service';
import { HttpModule } from '@nestjs/axios';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { MockProxy, mock } from 'jest-mock-extended';

describe('LogoutController', () => {
  let controller: LogoutController;
  let envServiceMock: EnvService;
  let discoveryServiceMock: DiscoveryService;
  let cookiesServiceMock: CookiesService;
  let requestMock: Request;
  let responseMock: Response;
  let logoutCallbackMock: MockProxy<LogoutCallback>;

  beforeEach(async () => {
    logoutCallbackMock = mock<NoopLogoutService>();
    cookiesServiceMock = mock<CookiesService>();
    discoveryServiceMock = mock<DiscoveryService>();
    envServiceMock = mock<EnvService>({
      getEnv: jest.fn().mockReturnValue({
        logoutRedirectUrl: '\test',
      }),
    });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogoutController],
      providers: [
        { provide: EnvService, useValue: envServiceMock },
        { provide: DiscoveryService, useValue: discoveryServiceMock },
        { provide: CookiesService, useValue: cookiesServiceMock },
        {
          provide: LOGOUT_CALLBACK_INJECTION_TOKEN,
          useValue: logoutCallbackMock,
        },
      ],
      imports: [HttpModule],
    }).compile();

    controller = module.get<LogoutController>(LogoutController);
    requestMock = mock<Request>();
    responseMock = mock<Response>();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return response', async () => {
    // Act
    const result = await controller.logout(requestMock, responseMock);

    // Assert
    expect(result).toBeUndefined();
  });

  it('should clear cookies when logout controller is called', async () => {
    // Act
    await controller.logout(requestMock, responseMock);

    // Assert
    expect(cookiesServiceMock.removeAuthCookie).toHaveBeenCalledWith(
      responseMock,
    );
  });

  it('should execute handleLogout when logout controller is called', async () => {
    // Act
    await controller.logout(requestMock, responseMock);

    // Assert
    expect(logoutCallbackMock.handleLogout).toHaveBeenCalledWith(
      requestMock,
      responseMock,
    );
  });

  describe('getLogoutRedirectUrl', function () {
    it('should redirect to the client logout site when the backend is done and no error', async () => {
      // Act
      await controller.logout(requestMock, responseMock);

      // Assert
      expect(responseMock.redirect).toHaveBeenCalledWith('\test');
    });

    it('should redirect to the client logout site when the backend is done and error', async () => {
      //Arrange
      requestMock.query.error = 'Something_Important';

      // Act
      await controller.logout(requestMock, responseMock);

      // Assert
      expect(responseMock.redirect).toHaveBeenCalledWith(
        '\test?error=Something_Important',
      );
    });
  });
});
