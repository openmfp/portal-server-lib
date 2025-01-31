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

    node.context = {
      ...node.context,
      ...provider.nodeContext,
    };

    return {
      ...node,
      ...provider.nodeExtendedData,
    };
  }
}
