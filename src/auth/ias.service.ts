import { Inject, Injectable, Logger } from '@nestjs/common';
import { EnvService, ServerAuthVariables } from '../env/env.service';
import { Request, Response } from 'express';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { AuthCallbackService } from './auth-callback.service';
import { AUTH_CALLBACK_INJECTION_TOKEN } from '../injection-tokens';
import { IasAuthData } from './model/auth';

export interface IasResponse extends IasAuthData {
  refresh_token: string;
  id_token: string;
}

const authCookie = 'auth_cookie';

@Injectable()
export class IasService {
  constructor(
    private envService: EnvService,
    private logger: Logger,
    private httpService: HttpService,
    @Inject(AUTH_CALLBACK_INJECTION_TOKEN)
    private authCallback: AuthCallbackService
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

  public getAuthCookie(request: Request): string {
    const cookies = request.cookies as Record<string, string>;
    return cookies && cookies[authCookie];
  }

  private setAuthCookie(response: Response, iasResponse: IasResponse) {
    response.cookie(authCookie, iasResponse.refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    });
  }

  public async removeAuthCookies(response: Response) {
    response.clearCookie(authCookie);
    await this.authCallback.clearCookies(response);
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

    const tokenFetchResult = await firstValueFrom(
      this.httpService
        .post<IasResponse>(
          `${currentAuthEnv.oauthServerUrl}/oauth2/token/`,
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
      const iasResponse = tokenFetchResult.data;
      this.setAuthCookie(response, iasResponse);
      await this.authCallback.setCookies(
        request,
        response,
        iasResponse.id_token
      );

      return iasResponse;
    }

    throw new Error(
      `Unexpected response code from ias: ${tokenFetchResult.status}, ${tokenFetchResult.statusText}`
    );
  }
}
