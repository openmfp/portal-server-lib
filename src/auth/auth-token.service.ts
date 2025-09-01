import { EnvService } from '../env/env.service.js';
import { AUTH_CONFIG_INJECTION_TOKEN } from '../injection-tokens.js';
import { CookiesService } from '../services/index.js';
import {
  AuthConfigService,
  ServerAuthVariables,
} from './auth-config.service.js';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import type { Request, Response } from 'express';
import { catchError, firstValueFrom } from 'rxjs';

export interface AuthTokenData {
  access_token: string;
  expires_in: string;
  refresh_token: string;
  refresh_expires_in: string;
  id_token?: string;
  token_type: string;
  scope: string;
}

@Injectable()
export class AuthTokenService {
  constructor(
    @Inject(AUTH_CONFIG_INJECTION_TOKEN)
    private authConfigService: AuthConfigService,
    private envService: EnvService,
    private httpService: HttpService,
    private cookiesService: CookiesService,
  ) {}

  /**
   * Requests a token from the auth token server and sets the cookies
   * @param request
   * @param response
   * @param code
   */
  public async exchangeTokenForCode(
    request: Request,
    response: Response,
    code: string,
  ): Promise<AuthTokenData> {
    const authConfig = await this.authConfigService.getAuthConfig(request);
    const redirectUri = this.getRedirectUri(request, authConfig);

    const body = new URLSearchParams({
      client_id: authConfig.clientId,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code,
    });
    return this.requestToken(request, response, authConfig, body);
  }

  /**
   * Requests a token from the auth token server and sets the cookies
   * @param request
   * @param response
   * @param refreshToken
   */
  public async exchangeTokenForRefreshToken(
    request: Request,
    response: Response,
    refreshToken: string,
  ): Promise<AuthTokenData> {
    const authConfig = await this.authConfigService.getAuthConfig(request);

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    return this.requestToken(request, response, authConfig, body);
  }

  private async requestToken(
    request: Request,
    response: Response,
    authConfig: ServerAuthVariables,
    body: URLSearchParams,
  ): Promise<AuthTokenData> {
    const authorization = `${Buffer.from(
      `${authConfig.clientId}:${authConfig.clientSecret}`,
    ).toString('base64')}`;

    const redirectUriMsg =
      body.get('grant_type') === 'authorization_code'
        ? `Redirect URI: ${body.get('redirect_uri')}`
        : '';
    const tokenFetchResult = await firstValueFrom(
      this.httpService
        .post<AuthTokenData>(authConfig.oauthTokenUrl, body, {
          headers: {
            Authorization: `Basic ${authorization}`,
            'content-type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        })
        .pipe(
          catchError((e: AxiosError) => {
            throw new Error(
              `Error response from auth token server: ${e.toString()}.
              ${e.response.data['error']}: ${e.response.data['error_description']}.
              ${redirectUriMsg}`,
            );
          }),
        ),
    );

    if (tokenFetchResult.status === 200) {
      this.cookiesService.setAuthCookie(
        request,
        response,
        tokenFetchResult.data,
      );
      return tokenFetchResult.data;
    }

    throw new Error(
      `Unexpected response code from auth token server: ${tokenFetchResult.status}, ${tokenFetchResult.statusText}`,
    );
  }

  /**
   *  Redirection URL is calculated based on the ENVIRONMENT system variable.
   *  When running locally after executing token retrieval the call will be redirected to localhost and port set in FRONTEND_PORT system variable,
   *  otherwise to the host of the initiating request
   */
  private getRedirectUri(
    request: Request,
    currentAuthEnv: ServerAuthVariables,
  ) {
    let redirectionUrl: string;
    const env = this.envService.getEnv();
    const isStandardOrEmptyPort =
      env.frontendPort === '80' ||
      env.frontendPort === '443' ||
      !env.frontendPort;
    const port = isStandardOrEmptyPort ? '' : ':' + env.frontendPort;
    if (env.isLocal) {
      redirectionUrl = `http://localhost${port}`;
    } else {
      redirectionUrl = `https://${currentAuthEnv.baseDomain}${port}`;
    }
    return `${redirectionUrl}/callback?storageType=none`;
  }
}
