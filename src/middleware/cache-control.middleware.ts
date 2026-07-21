import { NextFunction, Request, Response } from 'express';

/**
 * Auth-critical API responses must never be cached or revalidated back into
 * service: a transient 401/500 from /rest/* (config, auth, logout) or
 * /callback that a browser or shared cache re-serves turns an intermittent
 * upstream failure into a sticky one that only a hard reload clears
 * (apeirora/showroom#296). Static assets are handled separately by the
 * ServeStaticModule cache policy in portal.module.ts.
 */
export function cacheControlNoStore(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.path === '/callback' || req.path.startsWith('/rest')) {
    res.setHeader('Cache-Control', 'no-store');
  }
  next();
}
