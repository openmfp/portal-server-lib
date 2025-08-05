import { RawServiceProvider } from '../../context/service-provider.js';
import {
  LuigiAppConfig,
  LuigiConfigData,
  LuigiNodeDefaults,
} from '../../model/content-configuration.js';
import { LuigiNode } from '../../model/luigi.node.js';
import { ConfigTransferNodeService } from './config-transfer-node.service.js';
import { LuigiDataService } from './luigi-data.service.js';
import { NodeExtendedDataService } from './node-extended-data.service.js';
import { TextsTranslateService } from './texts-translate.service.js';
import { Injectable } from '@nestjs/common';
import * as URI from 'uri-js';
import { URIComponents } from 'uri-js';

@Injectable()
export class ContentConfigurationLuigiDataService implements LuigiDataService {
  constructor(
    private textsTranslateService: TextsTranslateService,
    private configTransferNodeService: ConfigTransferNodeService,
    private nodeExtendedDataService: NodeExtendedDataService,
  ) {}

  async getLuigiData(
    provider: RawServiceProvider,
    language: string,
  ): Promise<LuigiNode[]> {
    const nodeArrays: LuigiNode[] = provider.contentConfiguration
      .map((contentConfiguration) => {
        this.textsTranslateService.translateTexts(
          contentConfiguration.luigiConfigFragment,
          language,
        );

        return this.createNodes(
          contentConfiguration.luigiConfigFragment.data,
          contentConfiguration.url != undefined
            ? URI.parse(contentConfiguration.url)
            : undefined,
        );
      })
      .flat();

    return nodeArrays.map((node) =>
      this.nodeExtendedDataService.addExtendedDataToChildrenRecursively(
        node,
        provider,
      ),
    );
  }

  private createNodes(
    luigiConfigData: LuigiConfigData,
    contentConfigurationUri: URIComponents | undefined,
  ): LuigiNode[] {
    const appConfig: LuigiAppConfig = {
      navMode: 'inplace',
      urlTemplateId: 'urltemplate.url',
      urlTemplateParams: {
        url: '',
        query: {},
      },
    };

    if (luigiConfigData && luigiConfigData.nodes) {
      let urlTemplateUrl = '';
      if (contentConfigurationUri != undefined) {
        const schemeAndHost = `${contentConfigurationUri.scheme}://${contentConfigurationUri.host}`;
        const url = contentConfigurationUri.port
          ? `${schemeAndHost}:${contentConfigurationUri.port}`
          : schemeAndHost;
        urlTemplateUrl = appConfig?.urlTemplateParams?.url || url;
      }

      const nodes: LuigiNode[] = luigiConfigData.nodes.map((node) =>
        this.createNode(
          node,
          appConfig,
          urlTemplateUrl,
          luigiConfigData.nodeDefaults,
        ),
      );

      this.configTransferNodeService.transferConfig(
        nodes,
        luigiConfigData,
        urlTemplateUrl,
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
    nodeDefaults?: LuigiNodeDefaults,
  ): LuigiNode {
    const node: LuigiNode = {
      ...(nodeDefaults || {}),
      ...nodeCfg,
    };

    let viewGroup: string,
      viewUrl: string,
      children = [];

    if (node.viewGroup) {
      viewGroup = node.viewGroup;
    } else if (
      urlTemplateUrl &&
      (node.url || node.urlSuffix) &&
      !node.isolateView
    ) {
      viewGroup = urlTemplateUrl;
    } else if (node.url) {
      try {
        const nodeUrl = new URL(node.url);
        viewGroup = nodeUrl.origin;
      } catch (e) {
        console.warn('Invalid URL: ', node.url);
      }
    }

    this.processCompoundChildrenUrls(node.compound, urlTemplateUrl);

    if (node.url) {
      viewUrl = `${node.url}`;
    } else if (node.urlSuffix && urlTemplateUrl) {
      viewUrl = `${urlTemplateUrl}${node.urlSuffix}`;
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
