import { EnvVariablesServiceImpl } from './env-variables.service';
import { AuthDataService, AuthTokenData } from '../auth';
import { Request, Response } from 'express';
import { EnvService } from './env.service';

describe('EnvVariablesServiceImpl', () => {
  let envVariablesService: EnvVariablesServiceImpl;
  let envServiceMock: EnvService;
  let authDataServiceMock: jest.Mocked<AuthDataService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  const currentAuthEnv = {
    oauthServerUrl: 'oauthServerUrl',
    oauthTokenUrl: 'oauthTokenUrl',
    clientId: 'clientId',
  };

  beforeEach(() => {
    authDataServiceMock = {
      provideAuthData: jest.fn(),
    } as any;

    envServiceMock = {
      getCurrentAuthEnv: jest.fn().mockReturnValue(currentAuthEnv),
    } as any;

    envVariablesService = new EnvVariablesServiceImpl(
      authDataServiceMock,
      envServiceMock
    );

    mockRequest = {};
    mockResponse = {};
  });

  describe('getEnv', () => {
    it('should call authDataService.provideAuthData', async () => {
      const result = await envVariablesService.getEnv(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(authDataServiceMock.provideAuthData).toHaveBeenCalledWith(
        mockRequest,
        mockResponse
      );
    });

    it('should return the result from authDataService.provideAuthData and current auth envs', async () => {
      const mockAuthData = {
        access_token: 'testAccessToken',
        refresh_token: 'testRefreshToken',
      } as AuthTokenData;
      authDataServiceMock.provideAuthData.mockResolvedValue(mockAuthData);

      const result = await envVariablesService.getEnv(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(result).toEqual({ authData: mockAuthData, ...currentAuthEnv });
    });

    it('should handle errors from authDataService.provideAuthData', async () => {
      const mockError = new Error('Auth data error');
      authDataServiceMock.provideAuthData.mockRejectedValue(mockError);

      await expect(
        envVariablesService.getEnv(
          mockRequest as Request,
          mockResponse as Response
        )
      ).rejects.toThrow('Auth data error');
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
