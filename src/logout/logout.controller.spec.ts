import { Test, TestingModule } from '@nestjs/testing';
import { LogoutController } from './logout.controller';
import { mock } from 'jest-mock-extended';
import { Request, Response } from 'express';
import { IasService } from '../auth/ias.service';

describe('LogoutController', () => {
  let controller: LogoutController;
  let iasServiceMock: IasService;
  let requestMock: Request;
  let responseMock: Response;

  beforeEach(async () => {
    iasServiceMock = mock<IasService>();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogoutController],
      providers: [
        {
          provide: IasService,
          useValue: iasServiceMock,
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
    expect(responseMock.redirect).toHaveBeenCalledWith('/logout');
  });

  it('should redirect to the client logout site with error parameter', async () => {
    // Act
    requestMock.query = { error: 'errorMsg' };
    await controller.logout(requestMock, responseMock);

    // Assert
    expect(responseMock.redirect).toHaveBeenCalledWith(
      '/logout?error=errorMsg'
    );
  });

  it('should clear the auth cookie', async () => {
    // Act
    await controller.logout(requestMock, responseMock);

    // Assert
    expect(iasServiceMock.removeAuthCookies).toHaveBeenCalledWith(responseMock);
  });
});
