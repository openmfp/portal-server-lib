import { PortalContextProvider } from './portal-context-provider';

export class EmptyPortalContextProvider implements PortalContextProvider {
  getContextValues(): Promise<Record<string, any>> {
    return Promise.resolve({});
  }
}
