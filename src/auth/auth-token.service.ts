import { Injectable } from '@nestjs/common';
import { EnvService, ServerAuthVariables } from '../env/env.service';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { CookiesService } from '../services/cookies.service';

export interface AuthTokenResponse {
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
    private envService: EnvService,
    private httpService: HttpService,
    private cookiesService: CookiesService
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
    code: string
  ): Promise<AuthTokenResponse> {
    const currentAuthEnv = this.envService.getCurrentAuthEnv(request);
    const redirectUri = this.getRedirectUri(request);

    const body = new URLSearchParams({
      client_id: currentAuthEnv.clientId,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code,
    });
    return this.requestToken(request, response, currentAuthEnv, body);
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
    refreshToken: string
  ): Promise<AuthTokenResponse> {
    const currentAuthEnv = this.envService.getCurrentAuthEnv(request);

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });
    return this.requestToken(request, response, currentAuthEnv, body);
  }

  private async requestToken(
    request: Request,
    response: Response,
    currentAuthEnv: ServerAuthVariables,
    body: URLSearchParams
  ): Promise<AuthTokenResponse> {
    const authorization = `${Buffer.from(
      `${currentAuthEnv.clientId}:${currentAuthEnv.clientSecret}`
    ).toString('base64')}`;

    const tokenFetchResult = await firstValueFrom(
      this.httpService
        .post<AuthTokenResponse>(currentAuthEnv.oauthTokenUrl, body, {
          headers: {
            Authorization: `Basic ${authorization}`,
            'content-type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        })
        .pipe(
          catchError((e: AxiosError) => {
            throw new Error(
              `Error response from auth token server: ${e.toString()}`
            );
          })
        )
    );

    if (tokenFetchResult.status === 200) {
      this.cookiesService.setAuthCookie(response, tokenFetchResult.data);
      return tokenFetchResult.data;
    }

    throw new Error(
      `Unexpected response code from auth token server: ${tokenFetchResult.status}, ${tokenFetchResult.statusText}`
    );
  }

  /**
   *  Redirection URL is calculated based on the ENVIRONMENT system variable.
   *  When running locally after executing token retrieval the call will be redirected to localhost and port set in FRONTEND_PORT system variable,
   *  otherwise to the host of the initiating request
   */
  private getRedirectUri(request: Request) {
    let redirectionUrl: string;
    const env = this.envService.getEnv();
    if (env.isLocal) {
      redirectionUrl = `http://localhost:${env.localFrontendPort}`;
    } else {
      redirectionUrl = `https://${request.hostname}`;
    }
    return `${redirectionUrl}/callback?storageType=none`;
  }
}
