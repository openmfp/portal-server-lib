import { Request, Response } from 'express';

export interface FrameContextProvider {
  getContextValues(
    request: Request,
    response: Response
  ): Promise<Record<string, any>>;
}
