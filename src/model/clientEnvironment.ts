export interface AuthEnvironment {
  authData?: IasAuthData;
  oauthServerUrl: string;
  clientId: string;
}

export interface ServerAuthEnvironment extends AuthEnvironment {
  clientSecret: string;
}

export interface IasAuthData {
  expires_in: string;
  access_token: string;
}
