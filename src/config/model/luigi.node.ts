import { BreadcrumbBadge } from './breadcrumb-badge.js';
import { LuigiUserSettings } from './luigi-user-settings.js';

export interface LuigiNodeCategory {
  label: string;
  collapsible?: boolean;
  order?: number;
  id?: string;
  icon?: string;
}

export interface LuigiNodeIFramePermissions {
  allow?: string[];
  sandbox?: string[];
}

export interface EntityDefinition {
  id: string;
  dynamicFetchId?: string;
  contextKey?: string;
  useBack?: boolean;
  label?: string;
  pluralLabel?: string;
  notFoundConfig?: {
    entityListNavigationContext: string;
    sapIllusSVG: string;
  };
}

export interface LuigiIntent {
  baseEntityId?: string;
  relativePath?: string;
  semanticObject: string;
  action: string;
  // path is resolved dynamically after parsing
  pathSegment?: string;
}

export interface IntentSpecification {
  type: string;
  inboundId: string;
  resolvedIntent?: LuigiIntent;
}

export interface CrossNavigationInbounds {
  [name: string]: LuigiIntent;
}

export interface LuigiClientPermissions {
  urlParameters?: Record<string, LuigiUrlParameterPermissions>;
}

export interface LuigiBadgeCounter {
  label: string;
  count: () => Promise<number | string> | number | string;
}

export interface LuigiStatusBadge {
  label: string;
  type: string;
}

export interface LuigiUrlParameterPermissions {
  write?: boolean;
  read?: boolean;
}

export interface PortalLuigiNodeExtensions {
  _preloadUrl?: string;
  // cfg.vizConfig?.userSettings is copied to every node with this parameter
  _userSettingsConfig?: LuigiUserSettings;
  // cfg.vizConfig?.viewGroup?.requiredIFramePermissions; is copied to every node with this parameter
  _requiredIFramePermissionsForViewGroup?: LuigiNodeIFramePermissions;
  // internal navigation ordering
  _portalDirectChildren?: LuigiNode[];
  _entityRootChild?: boolean;
  // intent mapping related private properties
  _intentMappings?: LuigiIntent[];
  _entityRelativePaths?: Record<string, any>;

  // public portal properties

  defineEntity?: EntityDefinition;
  // concatenates the service provider domain with the url of the microfrontend
  urlSuffix?: string;
  hideFromBreadcrumb?: boolean;
  requiredIFramePermissions?: LuigiNodeIFramePermissions;
  order?: number; //experimental
  entityType?: string;
  visibleForEntityContext?: Record<string, any>; // experimental // deprecated
  visibleForContext?: string; // experimental
  ignoreInDocumentTitle?: boolean; //experimental
  helpContext?: HelpContext;
  globalNav?: boolean | string;
  breadcrumbBadge?: BreadcrumbBadge;
  url?: string;
  isMissingMandatoryData?: boolean; // experimental

  // order portal nodes by navigation slots
  navSlot?: string;
  defineSlot?: string;
  requiredPolicies?: string[];
}

export interface LuigiNode extends PortalLuigiNodeExtensions {
  // officially documented by luigi
  badgeCounter?: LuigiBadgeCounter;
  category?: LuigiNodeCategory | string;
  children?:
    | LuigiNode[]
    | { (context?: any): Promise<LuigiNode[]> }
    | { (context?: any): LuigiNode[] };
  clientPermissions?: LuigiClientPermissions;
  compound?: any;
  context?: Record<string, any>;
  externalLink?: string;
  hideSideNav?: boolean;
  icon?: string;
  isolateView?: boolean;
  hideFromNav?: boolean;
  keepSelectedForChildren?: boolean;
  label?: string;
  extensionClassName?: string;
  layoutConfig?: any;
  link?: string;
  loadingIndicator?: { enabled: boolean };
  navigationContext?: string;
  onNodeActivation?: (node: LuigiNode) => boolean;
  openNodeInModal?: any;
  pathSegment?: string;
  showBreadcrumbs?: boolean;
  statusBadge?: LuigiStatusBadge;
  tabNav?: boolean;
  target?: IntentSpecification;
  testId?: string;
  useHashRouting?: boolean;
  userSettingsGroup?: string;
  viewGroup?: string;
  viewUrl?: string;
  visibleForFeatureToggles?: string[];
  virtualTree?: boolean;
  webcomponent?:
    | boolean
    | {
        selfRegistered: boolean;
        type?: string;
        tagName?: string;
      };

  // undocumented luigi features
  navHeader?: any; // experimental
  titleResolver?: any; // experimental
  decodeViewUrl?: boolean;
}

export interface ServiceProvider {
  name: string;
  displayName: string;
  creationTimestamp: string;
  nodes: LuigiNode[];
}

export interface PortalConfig {
  providers: ServiceProvider[];
  portalContext: Record<string, any>;
  featureToggles: Record<string, boolean>;
}

export interface EntityConfig {
  providers: ServiceProvider[];
  entityContext: Record<string, any>;
}

export interface HelpContext {
  displayName: string;
  stackSearch?: StackSearch;
  issueTracker?: URL;
  feedbackTracker?: URL;
  documentation?: URL;
}

export interface URL {
  url: string;
}

export interface StackSearch {
  tags: string[];
}
