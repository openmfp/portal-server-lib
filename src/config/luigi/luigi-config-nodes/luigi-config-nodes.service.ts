import {
  SERVICE_PROVIDER_INJECTION_TOKEN,
  LUIGI_DATA_SERVICE_INJECTION_TOKEN,
} from '../../../injection-tokens.js';
import {
  RawServiceProvider,
  ServiceProviderService,
} from '../../context/service-provider.js';
import { ServiceProvider } from '../../model/luigi.node.js';
import { LuigiDataService } from '../luigi-data/luigi-data.service.js';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class LuigiConfigNodesService {
  constructor(
    @Inject(SERVICE_PROVIDER_INJECTION_TOKEN)
    private serviceProviderService: ServiceProviderService,
    @Inject(LUIGI_DATA_SERVICE_INJECTION_TOKEN)
    private luigiDataService: LuigiDataService,
  ) {}

  async getNodes(
    token: string,
    entities: string[],
    acceptLanguage: string,
    context?: Record<string, any>,
  ): Promise<ServiceProvider[]> {
    const providerResponse =
      await this.serviceProviderService.getServiceProviders(
        token,
        entities,
        context,
      );
    return this.getNodesFromProvider(
      providerResponse.rawServiceProviders,
      acceptLanguage,
    );
  }

  async getNodesFromProvider(
    rawServiceProviders: RawServiceProvider[],
    acceptLanguage: string,
  ): Promise<ServiceProvider[]> {
    const promises = rawServiceProviders.map((rawProvider) =>
      this.luigiDataService.getLuigiData(rawProvider, acceptLanguage).then(
        (nodes) => ({ nodes, rawProvider }),
        (error) =>
          console.error("[ERROR] Couldn't create nodes", rawProvider, error),
      ),
    );

    const luigiDataPromises = await Promise.allSettled(promises);

    const serviceProviders: ServiceProvider[] = [];
    for (const luigiData of luigiDataPromises) {
      if (luigiData.status === 'rejected') {
        continue;
      }
      const value = luigiData.value;
      if (value) {
        const rawProvider = value.rawProvider;
        serviceProviders.push({
          name: rawProvider.name,
          displayName: rawProvider.displayName,
          creationTimestamp: rawProvider.creationTimestamp,
          nodes: value.nodes,
        });
      }
    }
    return serviceProviders;
  }
}
