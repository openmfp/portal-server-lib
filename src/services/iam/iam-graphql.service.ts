import { RequestContextProvider } from '../../config/index.js';
import { EnvService } from '../../env/index.js';
import { IAMService } from './models/iam-service.js';
import { MUTATION_LOGIN } from './queries.js';
import { Injectable } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';

@Injectable()
export class IAMGraphQlService implements IAMService {
  constructor(
    private requestContextProvider: RequestContextProvider,
    private envService: EnvService,
  ) {}

  async addUser(token: string): Promise<void> {
    const serverAuthVariables = await this.envService.getCurrentAuthEnv({});
    const requestContext = await this.requestContextProvider.getContextValues(
      {},
    );
    const iamUrl = serverAuthVariables.oauthServerUrl;
    const client = new GraphQLClient(iamUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    try {
      const response = await client.request(MUTATION_LOGIN);
    } catch (e) {
      console.error(e);
    }
  }
}
