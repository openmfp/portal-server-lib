import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { AuthGuard } from './auth.guard';
import { CookiesService } from '../cookies.service';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let cookiesService: CookiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: CookiesService,
          useValue: {
            getAuthCookie: jest.fn(),
          },
        },
      ],
    }).compile();

    authGuard = module.get<AuthGuard>(AuthGuard);
    cookiesService = module.get<CookiesService>(CookiesService);
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;

    beforeEach(() => {
      mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({}),
        }),
      } as unknown as ExecutionContext;
    });

    it('should return true when auth cookie is present', () => {
      jest
        .spyOn(cookiesService, 'getAuthCookie')
        .mockReturnValue('valid-auth-cookie');

      expect(authGuard.canActivate(mockExecutionContext)).toBe(true);
    });

    it('should throw HttpException when auth cookie is not present', () => {
      jest.spyOn(cookiesService, 'getAuthCookie').mockReturnValue(null);

      expect(() => authGuard.canActivate(mockExecutionContext)).toThrow(
        HttpException
      );
    });

    it('should throw HttpException with correct status and message when auth cookie is not present', () => {
      jest.spyOn(cookiesService, 'getAuthCookie').mockReturnValue(null);

      try {
        authGuard.canActivate(mockExecutionContext);
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
        expect(error.message).toBe('User is not logged in.');
      }
    });

    it('should call cookiesService.getAuthCookie with the request object', () => {
      const mockRequest = { cookies: {} };
      jest
        .spyOn(mockExecutionContext.switchToHttp(), 'getRequest')
        .mockReturnValue(mockRequest);
      jest
        .spyOn(cookiesService, 'getAuthCookie')
        .mockReturnValue('valid-auth-cookie');

      authGuard.canActivate(mockExecutionContext);

      expect(cookiesService.getAuthCookie).toHaveBeenCalledWith(mockRequest);
    });
  });
});
