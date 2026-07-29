import { NextFunction, Request, Response } from 'express';
import { cacheControlNoStore } from './cache-control.middleware';

describe('cacheControlNoStore', () => {
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    res = { setHeader: jest.fn() } as unknown as Response;
    next = jest.fn();
  });

  // Plain Express mount (app.use at root): req.path carries the full path.
  const expressMounted = (path: string): Request =>
    ({ path, originalUrl: path }) as Request;

  // Nest forRoutes('*') mount (Express 5): the matched path moves into
  // baseUrl, req.path collapses to '/'; only originalUrl keeps the path.
  const nestMounted = (path: string): Request =>
    ({ path: '/', baseUrl: path, originalUrl: path }) as Request;

  describe.each([
    ['express root mount', expressMounted],
    ["nest forRoutes('*') mount", nestMounted],
  ])('%s', (_name, mounted) => {
    it.each([
      '/rest/config',
      '/rest/auth',
      '/rest/config/showroom',
      '/rest/config?lang=en',
      '/callback',
      '/callback?code=abc&state=xyz',
    ])('sets Cache-Control: no-store on %s', (path) => {
      cacheControlNoStore(mounted(path), res, next);
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
      expect(next).toHaveBeenCalled();
    });

    it.each([
      '/',
      '/index.html',
      '/main-ABCD1234.js',
      '/ui/marketplace/ui/',
      '/restart',
      '/restore.png',
    ])('does not touch caching for %s', (path) => {
      cacheControlNoStore(mounted(path), res, next);
      expect(res.setHeader).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  it('falls back to req.path when originalUrl is absent', () => {
    cacheControlNoStore({ path: '/rest/config' } as Request, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
  });
});
