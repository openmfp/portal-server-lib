export interface AuthData {
  expires_in?: string;
  access_token: string;
}

export interface ServerAuthEnvironment {
  authData?: AuthData;
  oauthServerUrl: string;
  clientId: string;
  clientSecret?: string;
}
