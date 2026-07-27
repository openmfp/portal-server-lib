import { NextFunction, Request, Response } from 'express';
import { cacheControlNoStore } from './cache-control.middleware';

describe('cacheControlNoStore', () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    res = { setHeader: jest.fn() } as unknown as Response;
    next = jest.fn();
  });

  const request = (path: string): Request => ({ path }) as Request;

  it.each(['/rest/config', '/rest/auth', '/rest/config/showroom', '/callback'])(
    'sets Cache-Control: no-store on %s',
    (path) => {
      cacheControlNoStore(request(path), res, next);
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
      expect(next).toHaveBeenCalled();
    },
  );

  it.each([
    '/',
    '/index.html',
    '/main-ABCD1234.js',
    '/ui/marketplace/ui/',
    '/restart',
    '/restore.png',
  ])(
    'does not touch caching for %s',
    (path) => {
      cacheControlNoStore(request(path), res, next);
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    },
  );
});
