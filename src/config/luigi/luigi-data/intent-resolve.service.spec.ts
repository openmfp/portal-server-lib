import { IntentResolveService } from './intent-resolve.service';
import { LuigiNode, CrossNavigationInbounds } from '../../model/luigi.node';

describe('IntentResolveService', () => {
  let service: IntentResolveService;

  beforeEach(() => {
    service = new IntentResolveService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolve', () => {
    it('should not modify nodes when input is empty', () => {
      const nodes: LuigiNode[] = [];
      const inbounds: CrossNavigationInbounds = {};

      service.resolve(nodes, inbounds);

      expect(nodes).toEqual([]);
    });

    it('should resolve intent mappings and entity relative paths', () => {
      const nodes: LuigiNode[] = [
        {
          pathSegment: 'root',
          entityType: 'rootEntity',
          children: [
            {
              pathSegment: 'child1',
              defineEntity: { id: 'child1Entity' },
              target: { inboundId: 'inbound1', type: 'type' },
              children: [],
            },
          ],
        },
      ];
      const inbounds: CrossNavigationInbounds = {
        inbound1: { semanticObject: 'Object', action: 'Action' },
      };

      service.resolve(nodes, inbounds);

      expect(nodes[0]._intentMappings).toBeDefined();
      expect(nodes[0]._entityRelativePaths).toBeDefined();
      expect(nodes[0]._intentMappings?.length).toBe(1);
      expect(nodes[0]._intentMappings?.[0]).toEqual({
        semanticObject: 'Object',
        action: 'Action',
        baseEntityId: 'rootEntity.child1Entity',
        relativePath: '',
      });
      expect(nodes[0]._entityRelativePaths?.child1Entity).toEqual({
        pathSegment: '/root/child1',
        parentEntity: 'rootEntity',
      });
    });
  });

  describe('resolveIntentTargetsAndEntityPath', () => {
    it('should return empty objects when no nodes have entityType', () => {
      const nodes: LuigiNode[] = [{ pathSegment: 'test' }];
      const inbounds: CrossNavigationInbounds = {};

      const result = (service as any).resolveIntentTargetsAndEntityPath(
        nodes,
        inbounds
      );

      expect(result).toEqual({ intentMappings: [], entityRelativePaths: {} });
    });

    it('should correctly resolve intent targets and entity paths', () => {
      const nodes: LuigiNode[] = [
        {
          pathSegment: 'root',
          entityType: 'rootEntity',
          children: [
            {
              pathSegment: 'child1',
              defineEntity: { id: 'child1Entity' },
              target: { inboundId: 'inbound1', type: 'type' },
            },
            {
              pathSegment: 'child2',
              entityType: 'child2Entity',
              defineEntity: { id: 'child2Id' },
              target: { inboundId: 'inbound2', type: 'type' },
            },
          ],
        },
      ];
      const inbounds: CrossNavigationInbounds = {
        inbound1: { semanticObject: 'Object1', action: 'Action1' },
        inbound2: { semanticObject: 'Object2', action: 'Action2' },
      };

      const result = (service as any).resolveIntentTargetsAndEntityPath(
        nodes,
        inbounds
      );

      expect(result.intentMappings?.length).toBe(2);
      expect(result.intentMappings).toContainEqual({
        semanticObject: 'Object1',
        action: 'Action1',
        baseEntityId: 'rootEntity.child1Entity',
        relativePath: '',
      });
      expect(result.intentMappings).toContainEqual({
        semanticObject: 'Object2',
        action: 'Action2',
        baseEntityId: 'rootEntity.child2Id',
        relativePath: '',
      });
      expect(result.entityRelativePaths).toEqual({
        child1Entity: {
          pathSegment: '/root/child1',
          parentEntity: 'rootEntity',
        },
        child2Id: {
          pathSegment: '/root/child2',
          parentEntity: 'rootEntity',
        },
      });
    });
  });
});
