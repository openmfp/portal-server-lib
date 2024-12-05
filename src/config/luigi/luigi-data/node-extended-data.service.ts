import { Injectable } from '@nestjs/common';
import { ExtendedData } from '../../model/content-configuration';
import { LuigiNode } from '../../model/luigi.node';

@Injectable()
export class NodeExtendedDataService {
  addExtendedDataToChildrenRecursively(
    node: LuigiNode,
    extendedData: ExtendedData
  ): LuigiNode {
    const children = node.children as LuigiNode[];
    if (children && children.length > 0) {
      children.map((child, index, originalChildren) => {
        originalChildren[index] = this.addExtendedDataToChildrenRecursively(
          child,
          extendedData
        );
      });
    }

    const isMissingMandatoryData =
      extendedData?.isMissingMandatoryData || undefined;
    const helpContext = extendedData?.helpContext || undefined;
    const breadcrumbBadge = extendedData?.breadcrumbBadge || undefined;
    const extensionClassName = this.getExtensionClassNameForNode(extendedData);
    const context = { ...node.context, extensionClassName };

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
}
