import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { LogoutCallback } from './logout-callback.js';

@Injectable()
export class NoopLogoutService implements LogoutCallback {
  handleLogout(request: Request, response: Response): Promise<any> {
    return Promise.resolve();
  }
}
