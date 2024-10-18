import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { AuthCodeGuard } from './auth-code.guard'; // Adjust the import path as needed

describe('AuthCodeGuard', () => {
  let guard: AuthCodeGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthCodeGuard],
    }).compile();

    guard = module.get<AuthCodeGuard>(AuthCodeGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow access when code is provided', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          query: { code: 'validCode' },
        }),
      }),
    } as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw HttpException when code is not provided', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          query: {},
        }),
      }),
    } as ExecutionContext;

    try {
      guard.canActivate(context);
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toBe("No 'code' was provided in the query.");
    }
  });
});
