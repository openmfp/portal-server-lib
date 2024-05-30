import { Test, TestingModule } from '@nestjs/testing';
import { EnvController } from './env.controller';
import { EnvService } from './env.service';
import { mock, MockProxy } from 'jest-mock-extended';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';
import { AuthDataService } from '../auth/auth-data.service';

describe('EnvController', () => {
  let controller: EnvController;
  let envService: EnvService;
  let authDataService: MockProxy<AuthDataService>;

  beforeEach(async () => {
    authDataService = mock<AuthDataService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnvController],
      providers: [
        EnvService,
        Logger,
        {
          provide: AuthDataService,
          useValue: authDataService,
        },
      ],
    }).compile();
    controller = module.get<EnvController>(EnvController);
    envService = module.get<EnvService>(EnvService);
  });

  it('should be defined', () => {
    expect(true).toEqual(true);
    expect(controller).toBeDefined();
  });

  describe('getEnv', function () {
    beforeEach(function () {
      jest.spyOn(envService, 'getEnv').mockReturnValue({
        validWebcomponentUrls: ['ab', 'cd'],
        developmentInstance: false,
        qualtricsSiteInterceptUrl: '',
        qualtricsId: '',
        minimalPluginVersion: 0,
        isLocal: false,
        idpNames: [],
        frontendPort: '',
      });
      jest.spyOn(envService, 'getCurrentAuthEnv').mockReturnValue({
        oauthServerUrl: 'authorizeUrl',
        clientSecret: '',
        clientId: '',
      });
    });

    it('should get the env for valid properties', async () => {
      const requestMock = mock<Request>();
      const responseMock = mock<Response>();

      const env = await controller.getEnv(requestMock, responseMock);

      expect(env).toMatchObject({
        oauthServerUrl: 'authorizeUrl',
        validWebcomponentUrls: ['ab', 'cd'],
      });
    });

    it('should get the env with auth data', async () => {
      const requestMock = mock<Request>();
      const responseMock = mock<Response>();
      authDataService.provideAuthData.mockResolvedValue({
        expires_in: '123123',
        access_token: 'aer23r32',
      });

      const env = await controller.getEnv(requestMock, responseMock);

      expect(env).toMatchObject({
        authData: {
          expires_in: '123123',
          access_token: 'aer23r32',
        },
        oauthServerUrl: 'authorizeUrl',
        validWebcomponentUrls: ['ab', 'cd'],
      });
    });
  });
});
