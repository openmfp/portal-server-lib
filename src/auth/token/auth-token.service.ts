import type { Request, Response } from 'express';

export interface AuthTokenData {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in?: string;
  id_token?: string;
  token_type?: string;
  scope?: string;
}

export interface AuthTokenService {
  exchangeTokenForCode(
    request: Request,
    response: Response,
    code: string,
  ): Promise<AuthTokenData>;

  exchangeTokenForRefreshToken(
    request: Request,
    response: Response,
    refreshToken: string,
  ): Promise<AuthTokenData>;
}
