import { Injectable } from '@nestjs/common';
import { RawServiceProvider } from '../../context/service-provider';
import {
  ExtendedData,
  LuigiConfigData,
  LuigiNodeDefaults,
  LuigiAppConfig,
} from '../../model/content-configuration';
import { LuigiNode } from '../../model/luigi.node';
import { ConfigTransferNodeService } from './config-transfer-node.service';
import { LuigiDataService } from './luigi-data.service';
import * as URI from 'uri-js';
import { URIComponents } from 'uri-js';
import { NodeExtendedDataService } from './node-extended-data.service';
import { TextsTranslateService } from './texts-translate.service';

@Injectable()
export class ContentConfigurationLuigiDataService implements LuigiDataService {
  constructor(
    private textsTranslateService: TextsTranslateService,
    private configTransferNodeService: ConfigTransferNodeService,
    private nodeExtendedDataService: NodeExtendedDataService
  ) {}

  async getLuigiData(
    provider: RawServiceProvider,
    language: string,
    extendedData?: ExtendedData
  ): Promise<LuigiNode[]> {
    const nodeArrays: LuigiNode[] = provider.contentConfiguration
      .map((config) => {
        this.textsTranslateService.translateTexts(
          config.luigiConfigFragment,
          language
        );

        return this.createNodes(
          config.luigiConfigFragment.data,
          config.devUrl != undefined ? URI.parse(config.devUrl) : undefined
        );
      })
      .flat();

    const nodes: LuigiNode[] = nodeArrays.map((node) =>
      this.nodeExtendedDataService.addExtendedDataToChildrenRecursively(
        node,
        extendedData
      )
    );
    return nodes;
  }

  private createNodes(
    luigiConfigData: LuigiConfigData,
    localContentConfigurationUri: URIComponents | undefined
  ): LuigiNode[] {
    const appConfig: LuigiAppConfig = {
      navMode: 'inplace',
      urlTemplateId: 'urltemplate.url',
      urlTemplateParams: {
        query: {},
      },
    };

    if (luigiConfigData && luigiConfigData.nodes) {
      let urlTemplateUrl = '';
      if (localContentConfigurationUri != undefined) {
        const schemeAndHost = `${localContentConfigurationUri.scheme}://${localContentConfigurationUri.host}`;
        const localUrl = localContentConfigurationUri.port
          ? `${schemeAndHost}:${localContentConfigurationUri.port}`
          : schemeAndHost;
        urlTemplateUrl = appConfig?.urlTemplateParams?.url || localUrl;
      }

      const nodes: LuigiNode[] = luigiConfigData.nodes.map((node) =>
        this.createNode(
          node,
          appConfig,
          urlTemplateUrl,
          luigiConfigData.nodeDefaults
        )
      );

      this.configTransferNodeService.transferConfig(
        nodes,
        luigiConfigData,
        urlTemplateUrl
      );

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
}
