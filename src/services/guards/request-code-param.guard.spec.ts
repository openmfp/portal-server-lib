import { RequestCodeParamGuard } from './request-code-param.guard.js';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

describe('RequestCodeParamGuard', () => {
  let guard: RequestCodeParamGuard;

  const createContext = (query: any): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ query }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new RequestCodeParamGuard();
  });

  it('returns true when code and state exist', () => {
    const ctx = createContext({ code: 'abc', state: 'xyz' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws 400 when code is missing', () => {
    const ctx = createContext({ state: 'xyz' });
    try {
      guard.canActivate(ctx);
      fail('should throw');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect((e as HttpException).message).toBe(
        "No 'code' was provided in the query.",
      );
    }
  });

  it('throws 400 when state is missing', () => {
    const ctx = createContext({ code: 'abc' });
    try {
      guard.canActivate(ctx);
      fail('should throw');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect((e as HttpException).message).toBe(
        "No 'state' was provided in the query.",
      );
    }
  });

  it('throws 400 when both are missing', () => {
    const ctx = createContext({});
    try {
      guard.canActivate(ctx);
      fail('should throw');
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect((e as HttpException).getStatus()).toBe(HttpStatus.BAD_REQUEST);
    }
  });
});
