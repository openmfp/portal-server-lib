import { HelpContext } from '../../model/luigi.node';
import { BreadcrumbBadge } from '../../model/breadcrumb-badge';

export interface CDM {
  //either data or url has to be set
  url?: string;
  data?: Record<any, any>;
}

export interface CDMExtendedData {
  isMissingMandatoryData?: boolean;
  extensionClassName?: string;
  helpContext?: HelpContext;
  breadcrumbBadge?: BreadcrumbBadge;
}
