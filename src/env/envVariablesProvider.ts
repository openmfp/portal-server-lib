export interface EnvVariablesProviderParameters {
  requestHostName: string;
}

export interface EnvVariablesProvider {
  getEnv: (
    params: EnvVariablesProviderParameters
  ) => Promise<Record<string, any>>;
}

export class EmptyEnvVariablesProvider implements EnvVariablesProvider {
  getEnv(params: EnvVariablesProviderParameters): Promise<Record<string, any>> {
    return Promise.resolve({});
  }
}
