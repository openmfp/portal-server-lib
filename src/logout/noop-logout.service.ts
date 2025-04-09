import { LogoutCallback } from './logout-callback';
import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class NoopLogoutService implements LogoutCallback {
  handleLogout(request: Request, response: Response): Promise<any> {
    return Promise.resolve();
  }
}
