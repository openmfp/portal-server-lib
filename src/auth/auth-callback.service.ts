import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { IasResponse } from './ias.service';

export interface AuthCallbackService {
  handleSuccess(
    request: Request,
    response: Response,
    iasResponse: IasResponse
  ): Promise<any>;

  handleFailure(request: Request, response: Response): Promise<any>;
}

@Injectable()
export class NoopAuthCallback implements AuthCallbackService {
  handleSuccess(
    request: Request,
    response: Response,
    iasResponse: IasResponse
  ): Promise<void> {
    return Promise.resolve();
  }

  handleFailure(request: Request, response: Response): Promise<void> {
    return Promise.resolve();
  }
}
