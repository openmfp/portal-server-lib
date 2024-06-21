import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

export interface AuthCallbackService {
  handleSuccess(
    request: Request,
    response: Response,
    idToken: string
  ): Promise<any>;

  handleFailure(request: Request, response: Response): Promise<any>;
}

@Injectable()
export class NoopAuthCallback implements AuthCallbackService {
  handleSuccess(
    request: Request,
    response: Response,
    idToken: string
  ): Promise<void> {
    return Promise.resolve();
  }

  handleFailure(request: Request, response: Response): Promise<void> {
    return Promise.resolve();
  }
}
