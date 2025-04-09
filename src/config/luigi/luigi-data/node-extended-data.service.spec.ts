import { RawServiceProvider } from '../../context/service-provider';
import { BreadcrumbBadge } from '../../model/breadcrumb-badge';
import { HelpContext, LuigiNode } from '../../model/luigi.node';
import { NodeExtendedDataService } from './node-extended-data.service';

describe('NodeExtendedDataService', () => {
  let service: NodeExtendedDataService;

  beforeEach(() => {
    service = new NodeExtendedDataService();
  });

  describe('addExtendedDataToChildrenRecursively', () => {
    it('should add extended data to a node without children', () => {
      const node: LuigiNode = { label: 'Node' };
      const helpContext: HelpContext = {
        displayName: 'Help Display Name',
        documentation: { url: 'https://example.com/docs' },
      };
      const breadcrumbBadge: BreadcrumbBadge = {
        text: 'Badge Text',
        colorSchema: '8',
        hint: 'Badge Hint',
      };
      const rawProvider: RawServiceProvider = {
        name: 'name',
        displayName: 'display name',
        creationTimestamp: 'time',
        contentConfiguration: [],
        nodeExtendedData: {
          isMissingMandatoryData: true,
          helpContext,
          breadcrumbBadge,
          extensionClassName: 'ExtensionClass',
        },
      };

      const result = service.addExtendedDataToChildrenRecursively(
        node,
        rawProvider,
      );

      expect(result).toEqual({
        label: 'Node',
        isMissingMandatoryData: true,
        helpContext,
        breadcrumbBadge,
        context: {},
        extensionClassName: 'ExtensionClass',
      });
    });

    it('should add extended data to a node with children', () => {
      const helpContext: HelpContext = {
        displayName: 'Help Display Name',
        documentation: { url: 'https://example.com/docs' },
      };
      const breadcrumbBadge: BreadcrumbBadge = {
        text: 'Badge Text',
        colorSchema: '10',
        hint: 'Badge Hint',
      };
      const node: LuigiNode = {
        label: 'Parent',
        children: [
          { label: 'Child1' },
          { label: 'Child2', children: [{ label: 'Grandchild' }] },
        ],
      };
      const rawProvider: RawServiceProvider = {
        name: 'name',
        displayName: 'display name',
        creationTimestamp: 'time',
        contentConfiguration: [],
        nodeExtendedData: {
          isMissingMandatoryData: true,
          helpContext,
          breadcrumbBadge,
          extensionClassName: 'ExtensionClass',
        },
      };

      const result = service.addExtendedDataToChildrenRecursively(
        node,
        rawProvider,
      );

      expect(result).toEqual({
        label: 'Parent',
        isMissingMandatoryData: true,
        helpContext,
        breadcrumbBadge,
        context: {},
        extensionClassName: 'ExtensionClass',
        children: [
          {
            label: 'Child1',
            isMissingMandatoryData: true,
            helpContext,
            breadcrumbBadge,
            context: {},
            extensionClassName: 'ExtensionClass',
          },
          {
            label: 'Child2',
            isMissingMandatoryData: true,
            helpContext,
            breadcrumbBadge,
            context: {},
            extensionClassName: 'ExtensionClass',
            children: [
              {
                label: 'Grandchild',
                isMissingMandatoryData: true,
                helpContext,
                breadcrumbBadge,
                context: {},
                extensionClassName: 'ExtensionClass',
              },
            ],
          },
        ],
      });
    });

    it('should not add extension class name when isMissingMandatoryData is false', () => {
      const node: LuigiNode = { label: 'Node' };
      const rawProvider: RawServiceProvider = {
        name: 'name',
        displayName: 'display name',
        creationTimestamp: 'time',
        contentConfiguration: [],
        nodeExtendedData: {
          isMissingMandatoryData: false,
          extensionClassName: 'ExtensionClass',
        },
      };

      const result = service.addExtendedDataToChildrenRecursively(
        node,
        rawProvider,
      );

      expect(result).toEqual({
        context: {},
        extensionClassName: 'ExtensionClass',
        isMissingMandatoryData: false,
        label: 'Node',
      });
    });

    it('should merge context when node already has a context', () => {
      const node: LuigiNode = {
        label: 'Node',
        context: { existingKey: 'existingValue' },
      };
      const rawProvider: RawServiceProvider = {
        name: 'name',
        displayName: 'display name',
        creationTimestamp: 'time',
        contentConfiguration: [],
        nodeExtendedData: {
          isMissingMandatoryData: false,
          extensionClassName: 'ExtensionClass',
        },
        nodeContext: {
          contextValueFromProvider: 'contextValueFromProvider',
        },
      };

      const result = service.addExtendedDataToChildrenRecursively(
        node,
        rawProvider,
      );

      expect(result).toEqual({
        label: 'Node',
        isMissingMandatoryData: false,
        extensionClassName: 'ExtensionClass',
        context: {
          existingKey: 'existingValue',
          contextValueFromProvider: 'contextValueFromProvider',
        },
      });
    });

    it('should handle undefined extendedData', () => {
      const node: LuigiNode = { label: 'Node' };
      const rawProvider: RawServiceProvider = {
        name: 'name',
        displayName: 'display name',
        creationTimestamp: 'time',
        contentConfiguration: [],
      };
      const result = service.addExtendedDataToChildrenRecursively(
        node,
        rawProvider,
      );

      expect(result).toEqual({ label: 'Node', context: {} });
    });

    it('should add extended data to nodes', () => {
      const node = {
        pathSegment: 'home',
        label: 'Home',
        context: { existingKey: 'existingValue' },
      };
      const rawProvider: RawServiceProvider = {
        name: 'name',
        displayName: 'display name',
        creationTimestamp: 'time',
        contentConfiguration: [],
        nodeExtendedData: {
          isMissingMandatoryData: true,
          helpContext: { displayName: 'some-help-context' },
          breadcrumbBadge: { text: 'New', hint: 'positive' },
          extensionClassName: 'MyExtensionClass',
        },
      };

      const result = service.addExtendedDataToChildrenRecursively(
        node,
        rawProvider,
      );

      expect(result.isMissingMandatoryData).toBe(true);
      expect(result.helpContext).toEqual({
        displayName: 'some-help-context',
      });
      expect(result.breadcrumbBadge).toEqual({
        text: 'New',
        hint: 'positive',
      });
      expect(result.extensionClassName).toBe('MyExtensionClass');
    });
  });
});
