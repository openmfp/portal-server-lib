import {
  RequestContextProvider,
} from '../../config/index.js';
import { IAMService } from './models/iam-service.js';
import { MUTATION_LOGIN } from './queries.js';
import { Injectable } from '@nestjs/common';
import { GraphQLClient } from 'graphql-request';


@Injectable()
export class IAMGraphQlService implements IAMService {
  private client: GraphQLClient;

  constructor(requestContextProvider: RequestContextProvider) {
    const requestContext = requestContextProvider.getContextValues({});
    const iamUrl = ''

    this.client = new GraphQLClient(iamUrl);
  }

  async addUser(token: string): Promise<void> {
    this.client.setHeader('authorization', `Bearer ${token}`);
    this.client.request(MUTATION_LOGIN).catch((e) => {
      console.error(e);
    });
    return undefined;
  }
}
