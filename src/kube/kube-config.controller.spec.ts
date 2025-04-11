import { KubeConfigController } from './kube-config.controller.js';
import { KubeConfig } from '@kubernetes/client-node';
import { Test, TestingModule } from '@nestjs/testing';
import { readFileSync } from 'fs';

jest.mock('@kubernetes/client-node', () => ({
  KubeConfig: jest.fn().mockImplementation(() => ({
    loadFromFile: jest.fn(),
    loadFromDefault: jest.fn(),
    getCurrentCluster: jest.fn(),
  })),
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

describe('KubeConfigController', () => {
  let controller: KubeConfigController;
  let mockKubeConfig: jest.Mocked<KubeConfig>;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockKubeConfig = new KubeConfig() as jest.Mocked<KubeConfig>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [KubeConfigController],
    }).compile();

    controller = module.get<KubeConfigController>(KubeConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCaCert', () => {
    it('should load from file when kubeconfigPath is provided', async () => {
      const mockRequest = {
        query: { kubeconfigPath: '/path/to/kubeconfig' },
      };
      const mockResponse = {};

      (mockKubeConfig.getCurrentCluster as jest.Mock).mockReturnValue({
        caData: 'dGVzdENhRGF0YQ==',
      });

      jest.spyOn(KubeConfig.prototype, 'loadFromFile');
      jest.spyOn(KubeConfig.prototype, 'getCurrentCluster').mockReturnValue({
        caData: 'dGVzdENhRGF0YQ==',
      } as any);

      const result = await controller.getCaCert(
        mockRequest as any,
        mockResponse as any,
      );

      expect(KubeConfig.prototype.loadFromFile).toHaveBeenCalledWith(
        '/path/to/kubeconfig',
      );
      expect(KubeConfig.prototype.loadFromDefault).not.toHaveBeenCalled();
      expect(result).toBe('testCaData');
    });

    it('should load from default when kubeconfigPath is not provided', async () => {
      const mockRequest = { query: {} };
      const mockResponse = {};

      jest.spyOn(KubeConfig.prototype, 'loadFromDefault');
      jest.spyOn(KubeConfig.prototype, 'getCurrentCluster').mockReturnValue({
        caData: 'dGVzdENhRGF0YQ==',
      } as any);

      const result = await controller.getCaCert(
        mockRequest as any,
        mockResponse as any,
      );

      expect(KubeConfig.prototype.loadFromFile).not.toHaveBeenCalled();
      expect(KubeConfig.prototype.loadFromDefault).toHaveBeenCalled();
      expect(result).toBe('testCaData');
    });

    it('should return null when no cluster is found', async () => {
      const mockRequest = { query: {} };
      const mockResponse = {};

      jest
        .spyOn(KubeConfig.prototype, 'getCurrentCluster')
        .mockReturnValue(null);
      jest.spyOn(console, 'warn').mockImplementation();

      const result = await controller.getCaCert(
        mockRequest as any,
        mockResponse as any,
      );

      expect(console.warn).toHaveBeenCalledWith(
        'No current cluster found in kubeconfig.',
      );
      expect(result).toBeNull();
    });

    it('should use caData when available', async () => {
      const mockRequest = { query: {} };
      const mockResponse = {};

      jest.spyOn(KubeConfig.prototype, 'getCurrentCluster').mockReturnValue({
        caData: 'dGVzdENhRGF0YQ==',
      } as any);

      const result = await controller.getCaCert(
        mockRequest as any,
        mockResponse as any,
      );

      expect(result).toBe('testCaData');
    });

    it('should use caFile when caData is not available', async () => {
      const mockRequest = { query: {} };
      const mockResponse = {};
      const caFilePath = '/path/to/ca.crt';
      const caFileContent = 'CA_FILE_CONTENT';

      jest.spyOn(KubeConfig.prototype, 'getCurrentCluster').mockReturnValue({
        caFile: caFilePath,
      } as any);

      (readFileSync as jest.Mock).mockReturnValue(caFileContent);

      const result = await controller.getCaCert(
        mockRequest as any,
        mockResponse as any,
      );

      expect(readFileSync).toHaveBeenCalledWith(caFilePath, 'utf-8');
      expect(result).toBe(caFileContent);
    });

    it('should return null when no CA data or file is found', async () => {
      const mockRequest = { query: {} };
      const mockResponse = {};

      jest
        .spyOn(KubeConfig.prototype, 'getCurrentCluster')
        .mockReturnValue({} as any);
      jest.spyOn(console, 'warn').mockImplementation();

      const result = await controller.getCaCert(
        mockRequest as any,
        mockResponse as any,
      );

      expect(console.warn).toHaveBeenCalledWith(
        'No CA data or CA file path found in the kubeconfig.',
      );
      expect(result).toBeNull();
    });
  });
});
