import { AuthTokenData } from './auth-token.service';
import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

export interface AuthCallback {
  handleSuccess(
    request: Request,
    response: Response,
    authTokenResponse: AuthTokenData,
  ): Promise<any>;

  handleFailure(request: Request, response: Response): Promise<any>;
}

@Injectable()
export class NoopAuthCallback implements AuthCallback {
  handleSuccess(
    request: Request,
    response: Response,
    authTokenResponse: AuthTokenData,
  ): Promise<void> {
    return Promise.resolve();
  }

  handleFailure(request: Request, response: Response): Promise<void> {
    return Promise.resolve();
  }
}
