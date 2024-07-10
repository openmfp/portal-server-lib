import { Test, TestingModule } from '@nestjs/testing';
import { LogoutController } from './logout.controller';
import { mock, MockProxy } from 'jest-mock-extended';
import { Request, Response } from 'express';
import { NoopLogoutService } from './noop-logout.service';
import { LogoutCallback } from './logout-callback';
import { LOGOUT_CALLBACK_INJECTION_TOKEN } from '../injection-tokens';
import { EnvService } from '../env/env.service';

describe('LogoutController', () => {
  let controller: LogoutController;
  let envService: EnvService;
  let requestMock: Request;
  let responseMock: Response;
  let logoutCallback: MockProxy<LogoutCallback>;

  beforeEach(async () => {
    logoutCallback = mock<NoopLogoutService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogoutController],
      providers: [
        EnvService,
        {
          provide: LOGOUT_CALLBACK_INJECTION_TOKEN,
          useValue: logoutCallback,
        },
      ],
    }).compile();

    controller = module.get<LogoutController>(LogoutController);
    envService = module.get<EnvService>(EnvService);
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
    expect(responseMock.clearCookie).toHaveBeenCalledWith('auth_cookie');
  });

  it('should execute handleLogout when logout controller is called', async () => {
    // Act
    await controller.logout(requestMock, responseMock);

    // Assert
    expect(logoutCallback.handleLogout).toHaveBeenCalledWith(requestMock, responseMock);
  });

  describe('getLogoutRedirectUrl', function () {
    beforeEach(function () {
      jest.spyOn(envService, 'getEnv').mockReturnValue({
        logoutRedirectUrl: '\test',
      });
    });

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
      expect(responseMock.redirect).toHaveBeenCalledWith('\test?error=Something_Important');
    });
  });
});
