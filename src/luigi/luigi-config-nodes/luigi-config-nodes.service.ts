import { Inject, Injectable } from '@nestjs/common';
import {
  ServiceProviderResponse,
  ServiceProviderService,
} from '../../service-providers/service-provider.interfaces';
import { CdmLuigiDataService } from '../cdm-luigi-data/cdm-luigi-data.service';
import { SERVICE_PROVIDER_INJECTION_TOKEN } from '../../injection-tokens';
import { ServiceProvider } from '../../model/luigi.node';

@Injectable()
export class LuigiConfigNodesService {
  constructor(
    @Inject(SERVICE_PROVIDER_INJECTION_TOKEN)
    private serviceProviderService: ServiceProviderService,
    private cdmLuigiData: CdmLuigiDataService
  ) {}

  async getNodes(
    token: string,
    entities: string[],
    acceptLanguage: string,
    context?: Record<string, any>
  ): Promise<ServiceProvider[]> {
    const serviceProviders =
      await this.serviceProviderService.getServiceProviders(
        token,
        entities,
        context
      );
    return this.getNodesFromProvider(serviceProviders, acceptLanguage);
  }

  async getNodesFromProvider(
    fetchedProvider: ServiceProviderResponse,
    acceptLanguage: string
  ): Promise<ServiceProvider[]> {
    const serviceProviders: ServiceProvider[] = [];
    const rawServiceProviders = fetchedProvider.serviceProviders;
    const promises = rawServiceProviders.map((provider) =>
      this.cdmLuigiData
        .getLuigiDataFromCDM(provider.cdm, acceptLanguage, {
          isMissingMandatoryData: provider.isMissingMandatoryData,
          extensionClassName: provider.extensionClassName,
          helpContext: {
            displayName: provider.displayName,
            ...provider.helpCenterData,
            documentation: provider.documentation,
          },
          breadcrumbBadge: provider?.breadcrumbBadge,
        })
        .then(
          (nodes) => ({ nodes, provider }),
          (error) =>
            console.error("[ERROR] Couldn't create nodes", provider.cdm, error)
        )
    );

    const luigiDataPromises = await Promise.allSettled(promises);

    for (const luigiData of luigiDataPromises) {
      if (luigiData.status === 'rejected') {
        continue;
      }
      const value = luigiData.value;
      if (value) {
        const rawProvider = value.provider;
        serviceProviders.push({
          config: rawProvider.config,
          installationData: rawProvider.installationData,
          isMandatoryExtension: rawProvider.isMandatoryExtension,
          nodes: value.nodes,
          creationTimestamp: rawProvider.creationTimestamp,
        });
      }
    }
    return serviceProviders;
  }
}
