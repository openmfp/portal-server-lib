import { Injectable } from '@nestjs/common';
import { AuthTokenData } from '../auth';
import { Request, Response } from 'express';

const authCookie = 'openmfp_auth_cookie';

@Injectable()
export class CookiesService {
  public getAuthCookie(request: Request): string {
    const cookies = request.cookies as Record<string, string>;
    return cookies && cookies[authCookie];
  }

  public setAuthCookie(response: Response, authTokenResponse: AuthTokenData) {
    response.cookie(authCookie, authTokenResponse.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  public removeAuthCookie(response: Response) {
    response.clearCookie(authCookie);
  }
}
