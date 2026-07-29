import { NextFunction, Request, Response } from 'express';

/**
 * Auth-critical API responses must never be cached or revalidated back into
 * service: a transient 401/500 from /rest/* (config, auth, logout) or
 * /callback that a browser or shared cache re-serves turns an intermittent
 * upstream failure into a sticky one that only a hard reload clears.
 * Static assets are handled separately by the ServeStaticModule cache
 * policy in portal.module.ts.
 *
 * Path matching must use req.originalUrl: under Nest's forRoutes('*') mount
 * (Express 5), the matched path moves into req.baseUrl and req.path
 * collapses to '/', so a req.path check never matches anything.
 * req.originalUrl keeps the full request path in every mount context.
 */
export function cacheControlNoStore(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const path = (req.originalUrl ?? req.path).split('?')[0];
  if (path === '/callback' || path === '/rest' || path.startsWith('/rest/')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
}
