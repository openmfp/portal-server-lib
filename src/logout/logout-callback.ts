import type { Request, Response } from 'express';

export interface LogoutCallback {
  handleLogout(request: Request, response: Response): Promise<string | void>;
}
