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
  constructor(private httpService: HttpService) {}

  public async getOIDC(idpEnvName: string): Promise<OIDC> {
    const oidcUrl = process.env[`DISCOVERY_ENDPOINT_${idpEnvName}`];
    if (!oidcUrl) return null;

    const oidcResult = await firstValueFrom(
      this.httpService.get<OIDC>(oidcUrl).pipe(
        catchError((e: AxiosError) => {
          throw new Error(
            `Error response from discovery service: ${e.toString()}`
          );
        })
      )
    );

    if (oidcResult.status === 200) {
      const oidc = oidcResult.data;

      if (oidc.authorization_endpoint && oidc.token_endpoint) {
        return oidc;
      }
    }
    return null;
  }
}
