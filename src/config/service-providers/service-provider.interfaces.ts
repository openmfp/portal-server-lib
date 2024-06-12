import { BreadcrumbBadge } from '../model/breadcrumb-badge';
import { CDM, ContentConfiguration } from '../model/configuration';
import { StackSearch } from '../model/luigi.node';

export interface HelpCenterData {
  stackSearch?: StackSearch;
  issueTracker?: URL;
  feedbackTracker?: URL;
}

export interface RawServiceProvider {
  name: string;
  displayName: string;
  contentConfiguration?: ContentConfiguration[];
  cdm?: CDM[];
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
