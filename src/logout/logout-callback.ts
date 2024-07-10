import { Request, Response } from 'express';

export interface LogoutCallback {
  handleLogout(request: Request, response: Response): Promise<any>;
}
