import { Injectable } from '@nestjs/common';
import { EnvService, ServerAuthVariables } from '../env/env.service';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { CookiesService } from '../services/cookies.service';

export interface IasResponse {
  access_token: string;
  expires_in: number | string;
  refresh_token: string;
  refresh_expires_in: number;
  id_token?: string;
  token_type: string;
  scope: string;
}

@Injectable()
export class IasService {
  constructor(
    private envService: EnvService,
    private httpService: HttpService,
    private cookiesService: CookiesService
  ) {}

  /**
   * Requests a token from the ias and sets the dxp cookies
   * @param request
   * @param response
   * @param code
   */
  public async exchangeTokenForCode(
    request: Request,
    response: Response,
    code: string
  ): Promise<IasResponse> {
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
   * Requests a token from the ias and sets the dxp cookies
   * @param request
   * @param response
   * @param refreshToken
   */
  public async exchangeTokenForRefreshToken(
    request: Request,
    response: Response,
    refreshToken: string
  ): Promise<IasResponse> {
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
  ): Promise<IasResponse> {
    const authorization = `${Buffer.from(
      `${currentAuthEnv.clientId}:${currentAuthEnv.clientSecret}`
    ).toString('base64')}`;

    let iasEndPoint = '/oauth2/token/';
    if (currentAuthEnv.keycloakRealm) {
      iasEndPoint = `/realms/${currentAuthEnv.keycloakRealm}/protocol/openid-connect/token/`;
    }

    const tokenFetchResult = await firstValueFrom(
      this.httpService
        .post<IasResponse>(
          `${currentAuthEnv.oauthServerUrl}${iasEndPoint}`,
          body,
          {
            headers: {
              Authorization: `Basic ${authorization}`,
              'content-type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
            },
          }
        )
        .pipe(
          catchError((e: AxiosError) => {
            throw new Error(`Error response from ias: ${e.toString()}`);
          })
        )
    );

    if (tokenFetchResult.status === 200) {
      this.cookiesService.setAuthCookie(response, tokenFetchResult.data);
      return tokenFetchResult.data;
    }

    throw new Error(
      `Unexpected response code from ias: ${tokenFetchResult.status}, ${tokenFetchResult.statusText}`
    );
  }

  private getRedirectUri(request: Request) {
    let hostAndProto: string;
    const env = this.envService.getEnv();
    if (env.isLocal) {
      hostAndProto = `http://localhost:${env.frontendPort}`;
    } else {
      hostAndProto = `https://${request.hostname}`;
    }
    return `${hostAndProto}/callback?storageType=none`;
  }
}
