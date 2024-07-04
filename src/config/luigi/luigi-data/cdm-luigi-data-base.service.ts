/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call*/
import { LuigiNode } from '../../model/luigi.node';
import * as URI from 'uri-js';
import { URIComponents } from 'uri-js';
import { LuigiNavConfig } from '../../model/luigi-app-config';
import { CDM, Dictionary, CDMExtendedData } from '../../model/configuration';
import { NodesProcessorService } from './nodes-processor.service';

export class CdmLuigiDataBaseService {
  constructor(
    protected httpService: any,
    protected nodeProcessorService: NodesProcessorService
  ) {
    this.httpService = httpService;
    this.nodeProcessorService = nodeProcessorService;
  }

  async getLuigiDataFromCDM(
    cdm: CDM[],
    language: string,
    cdmExtendedData?: CDMExtendedData
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
    cdmExtendedData: CDMExtendedData
  ): string | undefined {
    if (
      cdmExtendedData?.isMissingMandatoryData &&
      cdmExtendedData?.extensionClassName
    ) {
      return cdmExtendedData?.extensionClassName;
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

      return this._createNodes(
        data.payload,
        luigiVisConf,
        cdmUri != undefined ? URI.parse(cdmUri) : undefined
      );
    } else {
      throw new Error(
        'Ignoring data model because data is missing. Make sure that visualization and targetAppConfig properties are set properly.'
      );
    }
  }

  private _createNodes(
    payload,
    cfg: LuigiNavConfig,
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
        urlTemplateUrl = localUrl;
      }

      cfg.vizConfig.nodes.forEach((node) => {
        nodes.push(this._createNode(node, cfg, urlTemplateUrl));
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
      }

      this.nodeProcessorService.processNodes(payload, nodes, urlTemplateUrl);

      return nodes;
    } else {
      return [];
    }
  }

  private _createNode(
    nodeCfg: LuigiNode,
    cfg: LuigiNavConfig,
    urlTemplateUrl: string
  ): LuigiNode & Record<string, any> {
    const nodeDefaults = cfg.vizConfig.nodeDefaults || {};
    const node: LuigiNode = {
      ...nodeDefaults,
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
        return this._createNode(child, cfg, urlTemplateUrl);
      });
    }

    return {
      ...node,
      viewUrl,
      viewGroup,
      children,
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

  private isAbsoluteUrl(url: string) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}
