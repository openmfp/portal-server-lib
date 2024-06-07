import { HelpCenterData } from './models/help-center-data';
import { CDM } from '../luigi/cdm-luigi-data/cdm';
import { BreadcrumbBadge } from '../model/breadcrumb-badge';

export interface RawServiceProvider {
  name: string;
  displayName: string;
  cdm: CDM[];
  config: Record<string, string>;
  creationTimestamp: string;
  installationData?: Record<string, string>;
  extensionClassName?: string;
  isMissingMandatoryData?: boolean;
  isMandatoryExtension?: boolean;
  helpCenterData?: HelpCenterData;
  documentation?: URL;
  breadcrumbBadge?: BreadcrumbBadge;
}

export interface ServiceProviderResponse {
  serviceProviders: RawServiceProvider[];
}

export interface ServiceProviderService {
  getServiceProviders(
    token: string,
    entities: string[],
    context: Record<string, any>
  ): Promise<ServiceProviderResponse>;
}

export interface URL {
  url: string;
}
