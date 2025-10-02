import { AuthTokenData } from '../auth/index.js';
import { CookiesService } from './cookies.service.js';
import { Test, TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';

describe('CookiesService', () => {
  let service: CookiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CookiesService],
    }).compile();

    service = module.get<CookiesService>(CookiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAuthCookie', () => {
    it('should return the auth cookie value if it exists', () => {
      const mockRequest = {
        cookies: { openmfp_auth_cookie: 'test-token' },
      } as Request;

      expect(service.getAuthCookie(mockRequest)).toBe('test-token');
    });

    it('should return undefined if the auth cookie does not exist', () => {
      const mockRequest = {
        cookies: {},
      } as Request;

      expect(service.getAuthCookie(mockRequest)).toBeUndefined();
    });
  });

  describe('setAuthCookie', () => {
    it('should set the auth cookie with correct options', () => {
      const mockResponse = {
        cookie: jest.fn(),
      } as Response;

      const mockRequest = {
        hostname: 'test-hostname',
      } as Response;

      const mockAuthTokenResponse: AuthTokenData = {
        refresh_token: 'test-refresh-token',
      } as AuthTokenData;

      service.setAuthCookie(mockRequest, mockResponse, mockAuthTokenResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'openmfp_auth_cookie',
        'test-refresh-token',
        {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        },
      );
    });
  });

  describe('removeAuthCookie', () => {
    it('should clear the auth cookie', () => {
      const mockRequest = {
        hostname: 'test-hostname',
      } as Response;

      const mockResponse = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      service.removeAuthCookie(mockRequest, mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'openmfp_auth_cookie',
        {
          httpOnly: true,
          path: '/',
          sameSite: 'strict',
          secure: true,
        },
      );
    });
  });
});
