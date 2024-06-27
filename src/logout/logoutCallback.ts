import { Response } from 'express';

export interface LogoutCallback {
  handleLogout(response: Response): Promise<any>;
}
