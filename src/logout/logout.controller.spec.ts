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
    requestMock = mock<Request>();
    responseMock = mock<Response>();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should redirect to the client logout site when the backend is done', async () => {
    // Act
    await controller.logout(requestMock, responseMock);

    // Assert
    expect(responseMock.redirect).toHaveBeenCalled();
  });

  it('should execute handleLogout when logout controller is called', async () => {
    // Act
    await controller.logout(requestMock, responseMock);

    // Assert
    expect(logoutCallback.handleLogout).toHaveBeenCalledTimes(1);
  });
});
