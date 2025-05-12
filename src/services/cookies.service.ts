import { AuthTokenData } from '../auth/auth-token.service.js';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

const authCookie = 'openmfp_auth_cookie';

@Injectable()
export class CookiesService {
  public getAuthCookie(request: Request): string {
    const cookies = request.cookies as Record<string, string>;
    return cookies && cookies[authCookie];
  }

  public setAuthCookie(
    request: Request,
    response: Response,
    authTokenResponse: AuthTokenData,
  ) {
    response.cookie(
      authCookie,
      authTokenResponse.refresh_token,
      this.cookieParams(request),
    );
  }

  public removeAuthCookie(request: Request, response: Response) {
    response.clearCookie(authCookie, this.cookieParams(request));
  }

  private cookieParams(request: Request) {
    return {
      domain: request.hostname,
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
    };
  }
}
