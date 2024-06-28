import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthTokenResponse } from './auth-token.service';

export interface AuthCallback {
  handleSuccess(
    request: Request,
    response: Response,
    iasResponse: AuthTokenResponse
  ): Promise<any>;

  handleFailure(request: Request, response: Response): Promise<any>;
}

@Injectable()
export class NoopAuthCallback implements AuthCallback {
  handleSuccess(
    request: Request,
    response: Response,
    iasResponse: AuthTokenResponse
  ): Promise<void> {
    return Promise.resolve();
  }

  handleFailure(request: Request, response: Response): Promise<void> {
    return Promise.resolve();
  }
}
