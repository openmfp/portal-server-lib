import { LogoutCallback } from './logout-callback.js';
import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

@Injectable()
export class NoopLogoutService implements LogoutCallback {
  handleLogout(request: Request, response: Response): Promise<any> {
    return Promise.resolve();
  }
}
