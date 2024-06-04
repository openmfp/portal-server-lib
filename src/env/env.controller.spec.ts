import { Test, TestingModule } from '@nestjs/testing';
import { EnvController } from './env.controller';
import { EnvService } from './env.service';
import { mock, MockProxy } from 'jest-mock-extended';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';

describe('EnvController', () => {
  let controller: EnvController;
  let envService: EnvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnvController],
      providers: [EnvService, Logger],
    }).compile();
    controller = module.get<EnvController>(EnvController);
    envService = module.get<EnvService>(EnvService);
  });

  it('should be defined', () => {
    expect(true).toEqual(true);
    expect(controller).toBeDefined();
  });

  describe('getEnv', function () {
    const env = {
      validWebcomponentUrls: ['ab', 'cd'],
      developmentInstance: false,
      isLocal: false,
      idpNames: [],
      frontendPort: '',
    };

    const authEnv = {
      ...env,
      oauthServerUrl: 'authorizeUrl',
      clientId: '',
    };

    beforeEach(function () {
      jest.spyOn(envService, 'getEnv').mockReturnValue(env);
      jest.spyOn(envService, 'getCurrentAuthEnv').mockReturnValue(authEnv);
    });

    it('should get the env', () => {
      const requestMock = mock<Request>();
      const responseMock = mock<Response>();

      const env = controller.getEnv(requestMock, responseMock);

      expect(env).toMatchObject(authEnv);
    });
  });
});
