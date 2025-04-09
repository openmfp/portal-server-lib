import {
  CrossNavigationInbounds,
  LuigiIntent,
  LuigiNode,
} from '../../model/luigi.node';
import { Injectable } from '@nestjs/common';

@Injectable()
export class IntentResolveService {
  public resolve(
    nodes: LuigiNode[],
    luigiIntentInboundList: CrossNavigationInbounds,
  ) {
    if (nodes.length === 0 || !luigiIntentInboundList) {
      return;
    }

    const configTransferNode = nodes[0];
    const intentData = this.resolveIntentTargetsAndEntityPath(
      nodes,
      luigiIntentInboundList,
    );
    configTransferNode._intentMappings = intentData?.intentMappings;
    configTransferNode._entityRelativePaths = intentData?.entityRelativePaths;
  }

  /**
   * Iterates over the given list of nodes and builds the intent target information recursively for each node.
   * @param nodes list of nodes to traverse
   * @param inbounds list of semanticObject + action coming as an input from the Content Configuration ["crossNavigation.inbounds"] configuration
   * @returns a list of LuigiIntents (intentMappings) and 'entityRelativePaths' built after the nodes recursive traversal.
   */
  private resolveIntentTargetsAndEntityPath(
    nodes: LuigiNode[],
    inbounds: CrossNavigationInbounds,
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
          tempListObject,
        );
        listOfIntentMappings = listOfIntentMappings.concat(
          tempListObject.intentMappings,
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
  private prebuildIntentTargetsRecursively(
    node: LuigiNode,
    inbounds,
    parentEntity,
    pathSegment = '',
    targetParentEntity = '',
    intentKnowledge: {
      intentMappings: LuigiIntent[];
      entityRelativePaths: Record<string, any>;
    },
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
          intentKnowledge,
        );
      }
    }
  }
}
