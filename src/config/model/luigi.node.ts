import { BreadcrumbBadge } from './breadcrumb-badge';

export interface LuigiNodeCategory {
  label: string;
  collapsible?: boolean;
  dxpOrder?: number;
  id?: string;
  icon?: string;
}

export interface LuigiNodeIFramePermissions {
  allow?: string[];
  sandbox?: string[];
}

export interface LuigiUserSettingsConfig {
  groups: Record<string, LuigiUserSettingsGroup>;
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

export interface LuigiUserSettingsGroup {
  label?: string;
  sublabel?: string;
  title?: string;
  icon?: string;
  viewUrl?: string;
  settings?: Record<string, LuigiUserSetting>;
}

export interface LuigiUserSetting {
  type: string;
  label?: string;
  style?: string;
  options?: string[];
  isEditable?: boolean;
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
  // the actual intent and its pathSegment is resolved dynamically after parsing based on inboundId mapped in [sap.app.crossNavigation.inbounds]
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

export interface LuigiNode {
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
  webcomponent?: boolean;

  // undocumented luigi features
  navHeader?: any; // experimental
  titleResolver?: any; // experimental
  decodeViewUrl?: boolean;
  url?: string;
  urlSuffix?: string;
  defineEntity?: EntityDefinition;
  entityType?: string;
  _intentMappings?: LuigiIntent[];
  _entityRelativePaths?: Record<string, any>;
}

export enum NetworkVisibility {
  INTERNAL = 'internal',
  INTERNET = 'internet',
}

export interface ServiceProvider {
  nodes: LuigiNode[];
  config: Record<string, string>;
  installationData?: Record<string, string>;
  isMandatoryExtension?: boolean;
  creationTimestamp: string;
}

export interface PortalConfig {
  providers: ServiceProvider[];
  tenantId: string;
  frameContext: Record<string, any>;
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
