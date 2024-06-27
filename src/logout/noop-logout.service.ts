import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { LogoutCallback } from './logoutCallback';

@Injectable()
export class NoopLogoutService implements LogoutCallback {
  handleLogout(response: Response): Promise<any> {
    return Promise.resolve();
  }
}
