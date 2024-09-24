import { Injectable } from '@nestjs/common';
import { RawServiceProvider } from '../../context/service-provider';
import {
  ExtendedData,
  LuigiConfigData,
  LuigiNodeDefaults,
  LuigiAppConfig,
} from '../../model/content-configuration';
import { CrossNavigationInbounds, LuigiNode } from '../../model/luigi.node';
import { IntentResolveService } from './intent-resolve.service';
import { LuigiDataService } from './luigi-data.service';
import * as URI from 'uri-js';
import { URIComponents } from 'uri-js';

@Injectable()
export class ContentConfigurationLuigiDataService implements LuigiDataService {
  constructor(private intentResolveService: IntentResolveService) {}

  async getLuigiData(
    provider: RawServiceProvider,
    language: string,
    extendedData?: ExtendedData,
    url?: string
  ): Promise<LuigiNode[]> {
    const nodeArrays = provider.contentConfiguration.map((config) => {
      let luigiConfigData: LuigiConfigData = config.luigiConfigFragment.data;

      if (luigiConfigData.texts && luigiConfigData.texts.length > 0) {
        luigiConfigData = this.translateTexts(luigiConfigData, language);
      }

      return this.processLuigiConfigData(luigiConfigData, url);
    });

    const nodes: LuigiNode[] = [];
    for (const nodeArray of nodeArrays) {
      nodeArray.map((node) => {
        nodes.push(
          this.addExtendedCdmDataToChildrenRecursively(node, extendedData)
        );
      });
    }
    return nodes;
  }

  private processLuigiConfigData(
    luigiConfigData: LuigiConfigData,
    url: string | undefined
  ): LuigiNode[] {
    const luigiAppConfig: LuigiAppConfig = {
      navMode: 'inplace',
      urlTemplateId: 'urltemplate.url',
      urlTemplateParams: {
        query: {},
      },
    };

    const luigiIntentInboundList: CrossNavigationInbounds =
      luigiConfigData.targetAppConfig?.appCrossNavigation?.crossNavigation
        ?.inbounds;

    return this.createNodes(
      luigiConfigData,
      luigiAppConfig,
      luigiIntentInboundList,
      url != undefined ? URI.parse(url) : undefined
    );
  }

  private createNodes(
    luigiConfigData: LuigiConfigData,
    appConfig: LuigiAppConfig,
    luigiIntentInboundList: CrossNavigationInbounds,
    cdmUri: URIComponents | undefined
  ): LuigiNode[] {
    if (luigiConfigData && luigiConfigData.nodes) {
      const nodes: LuigiNode[] = [];
      let urlTemplateUrl = '';
      if (cdmUri != undefined) {
        const schemeAndHost = `${cdmUri.scheme}://${cdmUri.host}`;
        const localUrl = cdmUri.port
          ? `${schemeAndHost}:${cdmUri.port}`
          : schemeAndHost;
        urlTemplateUrl = appConfig?.urlTemplateParams?.url || localUrl;
      }

      luigiConfigData.nodes.forEach((node) => {
        nodes.push(
          this.createNode(
            node,
            appConfig,
            urlTemplateUrl,
            luigiConfigData.nodeDefaults
          )
        );
      });

      if (nodes.length > 0) {
        const configTransferNode = nodes[0];

        if (luigiConfigData.viewGroup?.preloadSuffix) {
          configTransferNode._preloadUrl = `${urlTemplateUrl}${luigiConfigData.viewGroup.preloadSuffix}`;
        }
        configTransferNode._requiredIFramePermissionsForViewGroup =
          luigiConfigData.viewGroup?.requiredIFramePermissions;

        configTransferNode._userSettingsConfig = luigiConfigData?.userSettings;
        if (configTransferNode._userSettingsConfig?.groups) {
          Object.keys(configTransferNode._userSettingsConfig.groups).forEach(
            (key) => {
              const group = configTransferNode._userSettingsConfig.groups[key];
              if (group.viewUrl && !this.isAbsoluteUrl(group.viewUrl)) {
                group.viewUrl = `${urlTemplateUrl}${group.viewUrl}`;
              }
            }
          );
        }

        // Resolve intentMapping information and pass through with the config transfer node
        this.intentResolveService.resolve(nodes, luigiIntentInboundList);
      }

      return nodes;
    } else {
      return [];
    }
  }

  private createNode(
    nodeCfg: LuigiNode,
    appConfig: LuigiAppConfig,
    urlTemplateUrl: string,
    nodeDefaults?: LuigiNodeDefaults
  ): LuigiNode {
    const node: LuigiNode = {
      ...(nodeDefaults || {}),
      ...nodeCfg,
    };

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
        return this.createNode(child, appConfig, urlTemplateUrl, nodeDefaults);
      });
    }

    return {
      ...node,
      children,
      viewGroup,
      viewUrl,
    };
  }

  private processCompoundChildrenUrls(compound: any, urlTemplateUrl: string) {
    compound?.children?.forEach((element) => {
      if (element.url) {
        element.viewUrl = element.url;
      } else if (element.urlSuffix) {
        const urlSuffix = element.urlSuffix as string;
        element.viewUrl = `${urlTemplateUrl}${urlSuffix}`;
      }
    });
  }

  private addExtendedCdmDataToChildrenRecursively(
    node: LuigiNode,
    cdmExtendedData: ExtendedData
  ): LuigiNode {
    const children = node.children as LuigiNode[];
    if (children && children.length > 0) {
      children.map((child, index, originalChildren) => {
        originalChildren[index] = this.addExtendedCdmDataToChildrenRecursively(
          child,
          cdmExtendedData
        );
      });
    }

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
  }

  // Only add the extension class name to a node if it's missing mandatory data
  // because we need it for navigation purposes
  private getExtensionClassNameForNode(
    cdmExtendedData: ExtendedData
  ): string | undefined {
    if (
      cdmExtendedData?.isMissingMandatoryData &&
      cdmExtendedData?.extensionClassName
    ) {
      return cdmExtendedData?.extensionClassName;
    }

    return undefined;
  }

  private translateTexts(
    data: LuigiConfigData,
    language: string
  ): LuigiConfigData {
    let configurationString = JSON.stringify(data);
    const { textDictionary } = this.findMatchedDictionary(data.texts, language);

    textDictionary &&
      Object.entries(textDictionary).forEach(([key, value]) => {
        const searchRegExp = new RegExp(`{{${key}}}`, 'g');
        configurationString = configurationString.replace(
          searchRegExp,
          value.toString()
        );
      });

    return JSON.parse(configurationString) as LuigiConfigData;
  }

  private findMatchedDictionary(
    textsObject: any,
    language: string
  ): Record<string, string> {
    const defaultDict = textsObject.find((obj) => obj.locale === '') as Record<
      string,
      string
    >;
    const matchedDict = textsObject.find((obj) => {
      const locale = obj.locale;
      const isNotEmpty = locale !== '' && language !== '';

      if (isNotEmpty && locale === language) {
        return true;
      } else if (isNotEmpty && locale.startsWith(language)) {
        return true;
      }

      return false;
    }) as Record<string, string>;

    return matchedDict || defaultDict;
  }

  private isAbsoluteUrl(url: string) {
    const testBase = 'http://test.url.tld';
    return (
      url.trim().startsWith(testBase) ||
      new URL(testBase).origin !== new URL(url, testBase).origin
    );
  }
}
