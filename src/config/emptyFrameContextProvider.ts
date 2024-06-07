import { FrameContextProvider } from './frameContextProvider';

export class EmptyFrameContextProvider implements FrameContextProvider {
  getContextValues(): Promise<Record<string, any>> {
    return Promise.resolve({});
  }
}
