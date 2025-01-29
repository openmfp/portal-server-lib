import { Injectable } from '@nestjs/common';
import { RawServiceProvider } from '../../context/service-provider';
import { LuigiNode } from '../../model/luigi.node';

@Injectable()
export class NodeExtendedDataService {
  addExtendedDataToChildrenRecursively(
    node: LuigiNode,
    provider: RawServiceProvider
  ): LuigiNode {
    const children = node.children as LuigiNode[];
    if (children && children.length > 0) {
      children.map((child, index, originalChildren) => {
        originalChildren[index] = this.addExtendedDataToChildrenRecursively(
          child,
          provider
        );
      });
    }

    this.addNewBadgeIfApplicable(node, provider);

    node.context = {
      ...node.context,
      ...provider.nodeContext,
    };

    return {
      ...node,
      ...provider.nodeExtendedData,
    };
  }

  private addNewBadgeIfApplicable(
    node: LuigiNode,
    serviceProvider: RawServiceProvider
  ): void {
    if (
      serviceProvider.nodeExtendedData.isMandatoryExtension ||
      !serviceProvider.creationTimestamp
    ) {
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const shouldShowNewBadge = !(
      new Date(serviceProvider.creationTimestamp).getTime() <
      yesterday.getTime()
    );

    if (shouldShowNewBadge) {
      node.statusBadge = { label: 'New', type: 'informative' };
    }
  }
}
