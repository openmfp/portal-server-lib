import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

interface OIDC {
  authorization_endpoint: string;
  token_endpoint: string;
}

@Injectable()
export class DiscoveryService {
  private oidcResult: OIDC;

  constructor(private httpService: HttpService) {}

  public async getOIDC(idpEnvName: string): Promise<OIDC> {
    const oidcUrl = process.env[`DISCOVERY_ENDPOINT_${idpEnvName}`];
    if (!oidcUrl) return null;

    if (this.oidcResult) {
      return this.oidcResult;
    }

    const oidcResult = await firstValueFrom(
      this.httpService.get<OIDC>(oidcUrl).pipe(
        catchError((e: AxiosError) => {
          throw new Error(
            `Error response from discovery service: ${e.toString()}, OIDC endpoint: ${oidcUrl}`
          );
        })
      )
    );

    if (oidcResult.status === 200) {
      const oidc = oidcResult.data;

      if (oidc.authorization_endpoint && oidc.token_endpoint) {
        this.oidcResult = oidc;
        return oidc;
      }
    }

    throw new Error(
      `Invalid response from discovery service: Response status: ${oidcResult.status}, OIDC endpoint: ${oidcUrl}`
    );
  }
}
