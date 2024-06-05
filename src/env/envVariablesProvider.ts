export interface EnvVariablesProvider {
  getEnv: (host: string) => Promise<Record<string, any>>;
}

export class EmptyEnvVariablesProvider implements EnvVariablesProvider {
  getEnv(host: string): Promise<Record<string, any>> {
    return Promise.resolve({});
  }
}
