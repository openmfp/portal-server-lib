import { KubeConfigController } from './kube-config.controller.js';
import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'fs';

// Create proper mock implementations for KubeConfig
const mockLoadFromFile = jest.fn();
const mockLoadFromDefault = jest.fn();
const mockGetCurrentCluster = jest.fn();

// Mock the KubeConfig class
jest.mock('@kubernetes/client-node', () => {
  return {
    KubeConfig: jest.fn().mockImplementation(() => {
      return {
        loadFromFile: mockLoadFromFile,
        loadFromDefault: mockLoadFromDefault,
        getCurrentCluster: mockGetCurrentCluster,
      };
    }),
  };
});

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}));

describe('KubeConfigController', () => {
  let controller;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      controllers: [KubeConfigController],
    }).compile();

    controller = module.get(KubeConfigController);
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

      mockGetCurrentCluster.mockReturnValue({
        caData: 'dGVzdENhRGF0YQ==',
      });

      const result = await controller.getCaCert(mockRequest, mockResponse);

      expect(mockLoadFromFile).toHaveBeenCalledWith('/path/to/kubeconfig');
      expect(mockLoadFromDefault).not.toHaveBeenCalled();
      expect(result).toBe('testCaData');
    });

    it('should load from default when kubeconfigPath is not provided', async () => {
      const mockRequest = { query: {} };
      const mockResponse = {};

      mockGetCurrentCluster.mockReturnValue({
        caData: 'dGVzdENhRGF0YQ==',
      });

      const result = await controller.getCaCert(mockRequest, mockResponse);

      expect(mockLoadFromFile).not.toHaveBeenCalled();
      expect(mockLoadFromDefault).toHaveBeenCalled();
      expect(result).toBe('testCaData');
    });

    it('should return null when no cluster is found', async () => {
      const mockRequest = { query: {} };
      const mockResponse = {};

      mockGetCurrentCluster.mockReturnValue(null);
      console.warn = jest.fn();

      const result = await controller.getCaCert(mockRequest, mockResponse);

      expect(console.warn).toHaveBeenCalledWith(
        'No current cluster found in kubeconfig.',
      );
      expect(result).toBeNull();
    });

    it('should use caData when available', async () => {
      const mockRequest = { query: {} };
      const mockResponse = {};

      mockGetCurrentCluster.mockReturnValue({
        caData: 'dGVzdENhRGF0YQ==',
      });

      const result = await controller.getCaCert(mockRequest, mockResponse);

      expect(result).toBe('testCaData');
    });

    it('should use caFile when caData is not available', async () => {
      const mockRequest = { query: {} };
      const mockResponse = {};
      const caFilePath = '/path/to/ca.crt';
      const caFileContent = 'CA_FILE_CONTENT';

      mockGetCurrentCluster.mockReturnValue({
        caFile: caFilePath,
      });

      (readFileSync as any).mockReturnValue(caFileContent);

      const result = await controller.getCaCert(mockRequest, mockResponse);

      expect(readFileSync).toHaveBeenCalledWith(caFilePath, 'utf-8');
      expect(result).toBe(caFileContent);
    });

    it('should return null when no CA data or file is found', async () => {
      const mockRequest = { query: {} };
      const mockResponse = {};

      mockGetCurrentCluster.mockReturnValue({});
      console.warn = jest.fn();

      const result = await controller.getCaCert(mockRequest, mockResponse);

      expect(console.warn).toHaveBeenCalledWith(
        'No CA data or CA file path found in the kubeconfig.',
      );
      expect(result).toBeNull();
    });
  });
});
