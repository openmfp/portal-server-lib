import { Request, Response } from 'express';

export interface IasResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  refresh_expires_in: number;
  id_token: string;
  token_type: string;
  scope: string;
}

export interface IasService {
  exchangeTokenForCode: (
    request: Request,
    response: Response,
    code: string
  ) => Promise<IasResponse>;

  exchangeTokenForRefreshToken: (
    request: Request,
    response: Response,
    refreshToken: string
  ) => Promise<IasResponse>;
}
