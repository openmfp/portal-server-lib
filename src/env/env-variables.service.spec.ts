import { EnvVariablesServiceImpl } from './env-variables.service';
import { AuthDataService, AuthTokenResponse } from '../auth';
import { Request, Response } from 'express';

describe('EnvVariablesServiceImpl', () => {
  let envVariablesService: EnvVariablesServiceImpl;
  let authDataServiceMock: jest.Mocked<AuthDataService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    authDataServiceMock = {
      provideAuthData: jest.fn(),
    } as any;

    envVariablesService = new EnvVariablesServiceImpl(authDataServiceMock);

    mockRequest = {};
    mockResponse = {};
  });

  describe('getEnv', () => {
    it('should call authDataService.provideAuthData', async () => {
      await envVariablesService.getEnv(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(authDataServiceMock.provideAuthData).toHaveBeenCalledWith(
        mockRequest,
        mockResponse
      );
    });

    it('should return the result from authDataService.provideAuthData', async () => {
      const mockAuthData = {
        access_token: 'testAccessToken',
        refresh_token: 'testRefreshToken',
      } as AuthTokenResponse;
      authDataServiceMock.provideAuthData.mockResolvedValue(mockAuthData);

      const result = await envVariablesService.getEnv(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(result).toEqual({authData: mockAuthData});
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
