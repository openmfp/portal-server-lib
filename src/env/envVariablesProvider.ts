export interface EnvVariablesProvider {
  getEnv: (hostName: string) => Promise<Record<string, any>>;
}

export class EmptyEnvVariablesProvider implements EnvVariablesProvider {
  getEnv(hostName: string): Promise<Record<string, any>> {
    return Promise.resolve({});
  }
}
