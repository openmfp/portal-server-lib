import { Test, TestingModule } from '@nestjs/testing';
import { EnvController } from './env.controller.js';
import { mock, MockProxy } from 'jest-mock-extended';
import { Request, Response } from 'express';
import { EnvVariablesService } from './env-variables.service.js';
import { ENV_VARIABLES_PROVIDER_INJECTION_TOKEN } from '../injection-tokens.js';

describe('EnvController', () => {
  let controller: EnvController;
  let envVariablesProvider: MockProxy<EnvVariablesService>;

  beforeEach(async () => {
    envVariablesProvider = mock<EnvVariablesService>();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EnvController],
      providers: [
        {
          provide: ENV_VARIABLES_PROVIDER_INJECTION_TOKEN,
          useValue: envVariablesProvider,
        },
      ],
    }).compile();
    controller = module.get<EnvController>(EnvController);
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

    beforeEach(function () {
      envVariablesProvider.getEnv.mockReturnValue(Promise.resolve(env));
    });

    it('should get the env variables from the controller', async () => {
      const requestMock = mock<Request>();
      const responseMock = mock<Response>();

      const envVariables = await controller.getEnv(requestMock, responseMock);

      expect(envVariables).toMatchObject(env);
    });
  });
});
