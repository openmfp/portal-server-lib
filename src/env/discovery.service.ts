import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

interface OIDC {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
}

@Injectable()
export class DiscoveryService {
  private oidcResultPerUrl: Record<string, OIDC> = {};

  constructor(private httpService: HttpService) {}

  public async getOIDC(oidcUrl: string): Promise<OIDC> {
    if (!oidcUrl) return null;

    if (this.oidcResultPerUrl[oidcUrl]) {
      return this.oidcResultPerUrl[oidcUrl];
    }

    const oidcResult = await firstValueFrom(
      this.httpService.get<OIDC>(oidcUrl).pipe(
        catchError((e: AxiosError) => {
          throw new Error(
            `Error response from discovery service: ${e.toString()}, OIDC endpoint: ${oidcUrl}`,
          );
        }),
      ),
    );

    if (oidcResult.status === 200) {
      const oidc = oidcResult.data;

      if (oidc.authorization_endpoint && oidc.token_endpoint) {
        this.oidcResultPerUrl[oidcUrl] = oidc;
        return oidc;
      }
    }

    throw new Error(
      `Invalid response from discovery service: Response status: ${oidcResult.status}, OIDC endpoint: ${oidcUrl}`,
    );
  }
}
