import { Test, TestingModule } from '@nestjs/testing';
import { CookiesService } from './cookies.service';
import { Request, Response } from 'express';
import { AuthTokenResponse } from '../auth/auth-token.service';

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
        cookies: { auth_cookie: 'test-token' },
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

      const mockIasResponse: AuthTokenResponse = {
        refresh_token: 'test-refresh-token',
      } as AuthTokenResponse;

      service.setAuthCookie(mockResponse, mockIasResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'auth_cookie',
        'test-refresh-token',
        {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        }
      );
    });
  });

  describe('removeAuthCookie', () => {
    it('should clear the auth cookie', () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      service.removeAuthCookie(mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('auth_cookie');
    });
  });
});
