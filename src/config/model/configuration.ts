import { HelpContext } from './luigi.node';
import { BreadcrumbBadge } from './breadcrumb-badge';

export interface Dictionary {
  locale: string;
  textDictionary: Record<string, string>;
}

export interface CDMExtendedData {
  isMissingMandatoryData?: boolean;
  extensionClassName?: string;
  helpContext?: HelpContext;
  breadcrumbBadge?: BreadcrumbBadge;
}

export interface CDM {
  //either data or url has to be set
  url?: string;
  data?: Record<any, any>;
}
