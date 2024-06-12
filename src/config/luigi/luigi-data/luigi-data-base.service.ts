/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call*/
import {
  CrossNavigationInbounds,
  LuigiIntent,
  LuigiNode,
} from '../../model/luigi.node';
import * as URI from 'uri-js';
import { URIComponents } from 'uri-js';
import { LuigiAppConfig, LuigiNavConfig } from '../../model/luigi-app-config';
import {
  CDM,
  ContentConfiguration,
  Dictionary,
  ExtendedData,
} from '../../model/configuration';
import { ContentConfigurationLuigiDataService } from './content-configuration-luigi-data.service';

export class LuigiDataBaseService {
  constructor(
    protected httpService: any,
    protected contentConfigurationLuigiDataService: ContentConfigurationLuigiDataService
  ) {
    this.httpService = httpService;
    this.contentConfigurationLuigiDataService =
      contentConfigurationLuigiDataService;
  }

  async getLuigiData(
    cdm: CDM[],
    contentConfiguration: ContentConfiguration[],
    language: string,
    extendedData?: ExtendedData
  ): Promise<LuigiNode[]> {
    if (cdm) {
      return this.processCDM(cdm, language, extendedData);
    } else {
      return this.contentConfigurationLuigiDataService.processContentConfiguration(
        contentConfiguration,
        language,
        extendedData
      );
    }
  }

  private async processCDM(
    cdm: CDM[],
    language: string,
    cdmExtendedData?: ExtendedData
  ): Promise<LuigiNode[]> {
    const nodeArrays = await Promise.allSettled(
      cdm.map(async (c) => {
        let data: Record<any, any>;
        if (c.data) {
          data = c.data;
        } else {
          const response = await this.httpService.get(c.url).toPromise();
          data = response.data || response;
        }

        if (data.texts) {
          data = this.localizeDataIntoLanguage(
            { ...data, texts: data.texts },
            language
          );
        }

        return this.processCdmJson(data, c.url);
      })
    );

    const nodes: LuigiNode[] = [];
    for (const nodeArray of nodeArrays) {
      if (nodeArray.status == 'rejected') {
        let error = nodeArray.reason;
        error = error.message || error;
        console.warn('failed to load luigi config', error);
        continue;
      }
      const checkedNodes = nodeArray.value.map((node) => {
        const isMissingMandatoryData =
          cdmExtendedData?.isMissingMandatoryData || undefined;
        const helpContext = cdmExtendedData?.helpContext || undefined;
        const breadcrumbBadge = cdmExtendedData?.breadcrumbBadge || undefined;
        const extensionClassName =
          this.getExtensionClassNameForNode(cdmExtendedData);
        const context =
          node.context || extensionClassName
            ? { ...node.context, extensionClassName }
            : undefined;
        return {
          ...node,
          helpContext,
          isMissingMandatoryData,
          breadcrumbBadge,
          context,
        };
      });
      nodes.push(...checkedNodes);
    }
    return nodes;
  }

  // Only add the extension class name to a node if it's missing mandatory data
  // because we need it for navigation purposes
  private getExtensionClassNameForNode(
    extendedData: ExtendedData
  ): string | undefined {
    if (
      extendedData?.isMissingMandatoryData &&
      extendedData?.extensionClassName
    ) {
      return extendedData?.extensionClassName;
    }

    return undefined;
  }

  private localizeDataIntoLanguage<T extends { texts: Dictionary[] }>(
    data: T,
    language: string
  ): T {
    let dataAsString = JSON.stringify(data);
    const { textDictionary } = this.findMatchedDictionary(data.texts, language);

    textDictionary &&
      Object.entries(textDictionary).forEach(([key, value]) => {
        const searchRegExp = new RegExp(`{{${key}}}`, 'g');
        dataAsString = dataAsString.replace(searchRegExp, value.toString());
      });

    return JSON.parse(dataAsString) as T;
  }

  private findMatchedDictionary(
    textsObject: Dictionary[],
    language: string
  ): Dictionary {
    const defaultDict = textsObject.find((obj) => obj.locale === '');
    const matchedDict = textsObject.find((obj) => {
      const locale = obj.locale;
      const isNotEmpty = locale !== '' && language !== '';

      if (isNotEmpty && locale === language) {
        return true;
      } else if (isNotEmpty && locale.startsWith(language)) {
        return true;
      }

      return false;
    });

    return matchedDict || defaultDict;
  }

  private processCdmJson(data, cdmUri: string | undefined): LuigiNode[] {
    if (
      data.payload &&
      data.payload.visualizations &&
      data.payload.visualizations.LuigiNavConfig &&
      data.payload.targetAppConfig
    ) {
      const luigiVisConf = data.payload.visualizations
        .LuigiNavConfig as LuigiNavConfig;
      const luigiAppConfig: LuigiAppConfig =
        data.payload.targetAppConfig['sap.integration'];
      const luigiIntentInboundList: CrossNavigationInbounds =
        data.payload.targetAppConfig['sap.app']?.crossNavigation?.inbounds;
      return this._createNodes(
        luigiVisConf,
        luigiAppConfig,
        luigiIntentInboundList,
        cdmUri != undefined ? URI.parse(cdmUri) : undefined
      );
    } else {
      throw new Error(
        'Ignoring data model because data is missing. Make sure that visualization and targetAppConfig properties are set properly.'
      );
    }
  }

  private _createNodes(
    cfg: LuigiNavConfig,
    appConfig: LuigiAppConfig,
    luigiIntentInboundList: CrossNavigationInbounds,
    cdmUri: URIComponents | undefined
  ): LuigiNode[] {
    if (cfg && cfg.vizConfig && cfg.vizConfig.nodes) {
      const nodes: LuigiNode[] = [];
      let urlTemplateUrl = '';
      if (cdmUri != undefined) {
        const schemeAndHost = `${cdmUri.scheme}://${cdmUri.host}`;
        const localUrl = cdmUri.port
          ? `${schemeAndHost}:${cdmUri.port}`
          : schemeAndHost;
        urlTemplateUrl = appConfig.urlTemplateParams.url || localUrl;
      }

      cfg.vizConfig.nodes.forEach((node) => {
        nodes.push(this._createNode(node, cfg, appConfig, urlTemplateUrl));
      });

      if (nodes.length > 0) {
        const configTransferNode = nodes[0];

        if (cfg.vizConfig?.viewGroup?.preloadSuffix) {
          configTransferNode._dxpPreloadUrl = `${urlTemplateUrl}${cfg.vizConfig.viewGroup.preloadSuffix}`;
        }
        configTransferNode._requiredIFramePermissionsForViewGroup =
          cfg.vizConfig?.viewGroup?.requiredIFramePermissions;

        configTransferNode._dxpUserSettingsConfig = cfg.vizConfig?.userSettings;
        if (configTransferNode._dxpUserSettingsConfig?.groups) {
          Object.keys(configTransferNode._dxpUserSettingsConfig.groups).forEach(
            (key) => {
              const group =
                configTransferNode._dxpUserSettingsConfig.groups[key];
              if (group.viewUrl && !this.isAbsoluteUrl(group.viewUrl)) {
                group.viewUrl = `${urlTemplateUrl}${group.viewUrl}`;
              }
            }
          );
        }

        // Resolve intentMapping information and pass through with the config transfer node
        const intentData = this.resolveIntentTargetsAndEntityPath(
          nodes,
          luigiIntentInboundList
        );
        configTransferNode._intentMappings = intentData?.intentMappings;
        configTransferNode._entityRelativePaths =
          intentData?.entityRelativePaths;
      }

      return nodes;
    } else {
      return [];
    }
  }

  private isAbsoluteUrl(url: string) {
    const testBase = 'http://test.url.tld';
    return (
      url.trim().startsWith(testBase) ||
      new URL(testBase).origin !== new URL(url, testBase).origin
    );
  }

  private _createNode(
    nodeCfg: LuigiNode,
    cfg: LuigiNavConfig,
    appConfig: LuigiAppConfig,
    urlTemplateUrl: string
  ): LuigiNode {
    const nodeDefaults = cfg.vizConfig.nodeDefaults || {};
    const node: LuigiNode = {
      ...nodeDefaults,
      ...nodeCfg,
    };

    const {
      pathSegment,
      externalLink,
      icon,
      testId,
      link,
      hideFromNav,
      useHashRouting,
      visibleForFeatureToggles,
      visibleForEntityContext,
      visibleForContext,
      visibleForPlugin,
      isolateView,
      networkVisibility,
      virtualTree,
      hideFromBreadcrumb,
      hideSideNav,
      tabNav,
      loadingIndicator,
      requiredPolicies,
      category,
      dxpOrder,
      entityType,
      label,
      context,
      keepSelectedForChildren,
      requiredIFramePermissions,
      userSettingsGroup,
      defineEntity,
      webcomponent,
      navigationContext,
      compound,
      layoutConfig,
      navHeader,
      titleResolver,
      clientPermissions,
      showBreadcrumbs,
      target,
      ignoreInDocumentTitle,
      navSlot,
      defineSlot,
      decodeViewUrl,
      statusBadge,

      configurationMissing,
      configurationHint,
      configurationLink,
    } = node;

    let viewGroup: string,
      viewUrl: string,
      children = [];

    if (urlTemplateUrl && node.urlSuffix && !node.isolateView) {
      viewGroup = urlTemplateUrl;
    } else if (node.url && node.viewGroup) {
      try {
        const nodeUrl = new URL(node.url);
        viewGroup =
          urlTemplateUrl + '#' + nodeUrl.origin + '#' + node.viewGroup;
      } catch (e) {
        console.warn('Invalid URL: ', node.url);
      }
    }

    if (node.urlSuffix && urlTemplateUrl) {
      viewUrl = `${urlTemplateUrl}${node.urlSuffix}`;
    }

    if (node.compound && urlTemplateUrl) {
      this.processCompoundChildrenUrls(node.compound, urlTemplateUrl);
    }

    if (node.url) {
      viewUrl = `${node.url}`;
    }

    if (node.children) {
      const directChildren = node.children as LuigiNode[];
      children = directChildren.map((child) => {
        return this._createNode(child, cfg, appConfig, urlTemplateUrl);
      });
    }

    return {
      label,
      children,
      viewGroup,
      icon,
      testId,
      link,
      userSettingsGroup,
      pathSegment,
      externalLink,
      hideFromNav,
      useHashRouting,
      visibleForFeatureToggles,
      visibleForEntityContext,
      visibleForContext,
      visibleForPlugin,
      isolateView,
      networkVisibility,
      virtualTree,
      hideFromBreadcrumb,
      hideSideNav,
      tabNav,
      loadingIndicator,
      requiredPolicies,
      viewUrl,
      context,
      category,
      dxpOrder,
      entityType,
      keepSelectedForChildren,
      requiredIFramePermissions,
      defineEntity,
      webcomponent,
      navigationContext,
      compound,
      layoutConfig,
      navHeader,
      titleResolver,
      clientPermissions,
      showBreadcrumbs,
      target,
      ignoreInDocumentTitle,
      navSlot,
      defineSlot,
      decodeViewUrl,
      statusBadge,

      configurationMissing,
      configurationHint,
      configurationLink,
    };
  }

  processCompoundChildrenUrls(compound: any, urlTemplateUrl: string) {
    compound?.children?.forEach((element) => {
      if (element.url) {
        element.viewUrl = element.url;
      } else if (element.urlSuffix) {
        const urlSuffix = element.urlSuffix as string;
        element.viewUrl = `${urlTemplateUrl}${urlSuffix}`;
      }
    });
  }

  /**
   * Iterates over the given list of nodes and builds the intent target information recursively for each node.
   * @param nodes list of nodes to traverse
   * @param inbounds list of semanticObject + action coming as an input from the CDM ["crossNavigation.inbounds"] configuration
   * @returns a list of LuigiIntents (intentMappings) and 'entityRelativePaths' built after the nodes recursive traversal.
   */
  resolveIntentTargetsAndEntityPath(
    nodes: LuigiNode[],
    inbounds: CrossNavigationInbounds
  ): {
    intentMappings?: LuigiIntent[];
    entityRelativePaths?: Record<string, any>;
  } {
    let listOfIntentMappings = [];
    const listOfEntityPaths = {};
    nodes.forEach((node) => {
      // skip parent nodes with no entities defined
      if (node.entityType) {
        const tempListObject = { intentMappings: [], entityRelativePaths: {} };
        this.prebuildIntentTargetsRecursively(
          node,
          inbounds,
          node.entityType,
          '',
          node.entityType,
          tempListObject
        );
        listOfIntentMappings = listOfIntentMappings.concat(
          tempListObject.intentMappings
        );
        Object.assign(listOfEntityPaths, tempListObject.entityRelativePaths);
      }
    });
    return {
      intentMappings: listOfIntentMappings,
      entityRelativePaths: listOfEntityPaths,
    };
  }

  /**
   * Traverses the given node recursively in order to find all nodes which define a target.
   * Upon successful search it pushes the defined target with its matched information to a separate list - 'intentKnowledge.intentMappings'
   * The list is extended as it traverses the rest of the tree.
   * Within the same recursion the function also builds the entity's path by appending them separately -  'intentKnowledge.entityRelativePaths'
   * Data knowledge collected is then stiched together to form the complete absolute path for the intents on client side.
   * @param node node to traverse
   * @param inbounds defines the semantic inbound representation that comes from ["crossNavigation.inbounds"] configuration
   * @param parentEntity the entity of the parent node, used as a reference in child nodes as they inherit the entityType
   * @param pathSegment a recursive parameter to accumulate the pathSegment of all nodes down to the target node
   * @param targetParentEntity the parentEntity data saved upon each recursive traversal to build the target intents parent entity id
   * @param intentKnowledge the knowledge object, whose properties are modified by reference
   */
  prebuildIntentTargetsRecursively(
    node: LuigiNode,
    inbounds,
    parentEntity,
    pathSegment = '',
    targetParentEntity = '',
    intentKnowledge: {
      intentMappings: LuigiIntent[];
      entityRelativePaths: Record<string, any>;
    }
  ) {
    // parent entity for building 'entityRelativePaths' knowledge
    let currentParentEntity = parentEntity;
    let currentPathSegment = pathSegment;
    // parent entity for building intentMappings' baseEntityId
    let currentTargetParentEntity = targetParentEntity;
    // predicate value checking whether a node has composition of both 'entityType' and 'defineEntity' defined
    const isComposedEntityNode =
      node.defineEntity?.id && node.entityType && node.entityType !== 'global';
    const entityIdDefined = node.defineEntity?.id;

    // if entity id is defined, build entity relative path knowledge
    if (entityIdDefined) {
      // update parent so it's inherited further down the tree levels of recursion
      currentParentEntity = entityIdDefined;
      intentKnowledge.entityRelativePaths[currentParentEntity] = {
        pathSegment: currentPathSegment + '/' + node.pathSegment,
        parentEntity,
      };
      // update parentEntity for entityRelativePaths & intentMappings knowledge
      currentParentEntity = isComposedEntityNode
        ? node.entityType + '.' + entityIdDefined
        : currentParentEntity;
      currentTargetParentEntity =
        currentTargetParentEntity + '.' + entityIdDefined;
    }
    // concatenate the pathSegment depending on the entity definition.
    currentPathSegment = entityIdDefined
      ? ''
      : currentPathSegment + '/' + node.pathSegment;

    // find if target exists and add it to list of targets based on inbounds list, adjacent to relativePath to baseEntity
    if (node.target && node.target.inboundId) {
      const id = node.target.inboundId;
      if (inbounds[id]) {
        const semantic: LuigiIntent = inbounds[id];
        intentKnowledge.intentMappings.push({
          semanticObject: semantic.semanticObject,
          baseEntityId: currentTargetParentEntity,
          relativePath: currentPathSegment,
          action: semantic.action,
        });
      }
    }

    // recursively iterate on children
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        this.prebuildIntentTargetsRecursively(
          child,
          inbounds,
          currentParentEntity,
          currentPathSegment,
          currentTargetParentEntity,
          intentKnowledge
        );
      }
    }
  }
}
