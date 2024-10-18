import { EnvVariablesServiceImpl } from './env-variables.service';
import { AuthTokenData } from '../auth';
import { Request, Response } from 'express';
import { EnvService } from './env.service';

describe('EnvVariablesServiceImpl', () => {
  let envVariablesService: EnvVariablesServiceImpl;
  let envServiceMock: EnvService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const currentAuthEnv = {
    oauthServerUrl: 'oauthServerUrl',
    oauthTokenUrl: 'oauthTokenUrl',
    clientId: 'clientId',
  };

  const env = {
    validWebcomponentUrls: 'validWebcomponentUrls',
    logoutRedirectUrl: 'logoutRedirectUrl',
    isLocal: true,
    developmentInstance: true,
  };

  beforeEach(() => {
    envServiceMock = {
      getCurrentAuthEnv: jest.fn().mockReturnValue(currentAuthEnv),
      getEnv: jest.fn().mockReturnValue(env),
    } as any;

    envVariablesService = new EnvVariablesServiceImpl(envServiceMock);

    mockRequest = {};
    mockResponse = {};
  });

  describe('getEnv', () => {
    it('should return the result from authDataService.provideAuthData and current auth envs', async () => {
      const result = await envVariablesService.getEnv(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(result).toEqual({
        ...currentAuthEnv,
        validWebcomponentUrls: 'validWebcomponentUrls',
        logoutRedirectUrl: 'logoutRedirectUrl',
        isLocal: true,
        developmentInstance: true,
      });
    });

    it('should return a promise', () => {
      const result = envVariablesService.getEnv(
        mockRequest as Request,
        mockResponse as Response
      );
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
