import { FrameContextProvider } from './frame-context-provider';

export class EmptyFrameContextProvider implements FrameContextProvider {
  getContextValues(): Promise<Record<string, any>> {
    return Promise.resolve({});
  }
}
