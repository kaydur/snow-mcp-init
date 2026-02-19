/**
 * Unit tests for Script Include handlers
 */

import { ScriptIncludeService } from '../service/ScriptIncludeService.js';
import {
  createScriptIncludeHandler,
  getScriptIncludeHandler,
  updateScriptIncludeHandler,
  deleteScriptIncludeHandler,
  queryScriptIncludesHandler,
  listRecentScriptIncludesHandler,
  validateScriptIncludeHandler,
  testScriptIncludeHandler
} from './scriptIncludeHandlers.js';

// Mock ScriptIncludeService
jest.mock('../service/ScriptIncludeService.js');

describe('Script Include Handlers', () => {
  let mockService: jest.Mocked<ScriptIncludeService>;

  beforeEach(() => {
    mockService = {
      createScriptInclude: jest.fn(),
      getScriptInclude: jest.fn(),
      updateScriptInclude: jest.fn(),
      deleteScriptInclude: jest.fn(),
      queryScriptIncludes: jest.fn(),
      listRecentScriptIncludes: jest.fn(),
      validateScript: jest.fn(),
      testScriptInclude: jest.fn()
    } as any;
  });

  describe('createScriptIncludeHandler', () => {
    it('should return error when name is missing', async () => {
      const params = {
        api_name: 'TestScript',
        script: 'var test = 1;'
      } as any;

      const result = await createScriptIncludeHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('name');
    });

    it('should return error when api_name is missing', async () => {
      const params = {
        name: 'Test Script',
        script: 'var test = 1;'
      } as any;

      const result = await createScriptIncludeHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('api_name');
    });

    it('should return error when script is missing', async () => {
      const params = {
        name: 'Test Script',
        api_name: 'TestScript'
      } as any;

      const result = await createScriptIncludeHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('script');
    });

    it('should create Script Include with valid parameters', async () => {
      const params = {
        name: 'Test Script',
        api_name: 'TestScript',
        script: 'var TestScript = Class.create();'
      };

      mockService.createScriptInclude.mockResolvedValue('test-sys-id-123');

      const result = await createScriptIncludeHandler(params, mockService);

      expect(result).not.toHaveProperty('error');
      expect((result as any).sys_id).toBe('test-sys-id-123');
      expect((result as any).message).toContain('created successfully');
      expect(mockService.createScriptInclude).toHaveBeenCalledWith(params);
    });
  });

  describe('getScriptIncludeHandler', () => {
    it('should return error when identifier is missing', async () => {
      const params = {} as any;

      const result = await getScriptIncludeHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('identifier');
    });

    it('should return error when identifier is empty', async () => {
      const params = { identifier: '   ' }; // Use whitespace-only string

      const result = await getScriptIncludeHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('cannot be empty');
    });

    it('should return found: false when Script Include does not exist', async () => {
      const params = { identifier: 'NonExistent' };

      mockService.getScriptInclude.mockResolvedValue(null);

      const result = await getScriptIncludeHandler(params, mockService);

      expect(result).not.toHaveProperty('error');
      expect((result as any).found).toBe(false);
      expect((result as any).script_include).toBeNull();
    });

    it('should return Script Include when found', async () => {
      const params = { identifier: 'TestScript' };
      const mockScriptInclude = {
        sys_id: 'test-sys-id',
        name: 'Test Script',
        api_name: 'TestScript',
        script: 'var test = 1;',
        active: true,
        access: 'public',
        client_callable: false,
        description: null,
        sys_created_on: '2024-01-01',
        sys_created_by: 'admin',
        sys_updated_on: '2024-01-01',
        sys_updated_by: 'admin',
        sys_mod_count: 0
      };

      mockService.getScriptInclude.mockResolvedValue(mockScriptInclude);

      const result = await getScriptIncludeHandler(params, mockService);

      expect(result).not.toHaveProperty('error');
      expect((result as any).found).toBe(true);
      expect((result as any).script_include).toEqual(mockScriptInclude);
    });
  });

  describe('updateScriptIncludeHandler', () => {
    it('should return error when sys_id is missing', async () => {
      const params = { name: 'Updated Name' } as any;

      const result = await updateScriptIncludeHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('sys_id');
    });

    it('should return error when no update fields provided', async () => {
      const params = { sys_id: 'test-sys-id' };

      const result = await updateScriptIncludeHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('No update fields');
    });

    it('should update Script Include with valid parameters', async () => {
      const params = {
        sys_id: 'test-sys-id',
        name: 'Updated Name',
        active: false
      };

      mockService.updateScriptInclude.mockResolvedValue('test-sys-id');

      const result = await updateScriptIncludeHandler(params, mockService);

      expect(result).not.toHaveProperty('error');
      expect((result as any).sys_id).toBe('test-sys-id');
      expect((result as any).message).toContain('updated successfully');
    });
  });

  describe('deleteScriptIncludeHandler', () => {
    it('should return error when sys_id is missing', async () => {
      const params = {} as any;

      const result = await deleteScriptIncludeHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('sys_id');
    });

    it('should delete Script Include with valid sys_id', async () => {
      const params = { sys_id: 'test-sys-id' };

      mockService.deleteScriptInclude.mockResolvedValue();

      const result = await deleteScriptIncludeHandler(params, mockService);

      expect(result).not.toHaveProperty('error');
      expect((result as any).success).toBe(true);
      expect((result as any).message).toContain('deleted successfully');
    });
  });

  describe('queryScriptIncludesHandler', () => {
    it('should query Script Includes with filters', async () => {
      const params = {
        name: 'Test',
        active: true,
        limit: 10
      };

      const mockResults = [
        {
          sys_id: 'test-1',
          name: 'Test Script 1',
          api_name: 'TestScript1',
          active: true,
          access: 'public',
          client_callable: false,
          sys_updated_on: '2024-01-01'
        }
      ];

      mockService.queryScriptIncludes.mockResolvedValue(mockResults);

      const result = await queryScriptIncludesHandler(params, mockService);

      expect(result).not.toHaveProperty('error');
      expect((result as any).script_includes).toEqual(mockResults);
      expect((result as any).count).toBe(1);
    });

    it('should return error when limit is out of range', async () => {
      const params = { limit: 150 };

      const result = await queryScriptIncludesHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('limit');
    });
  });

  describe('listRecentScriptIncludesHandler', () => {
    it('should list recent Script Includes', async () => {
      const params = { limit: 25 };

      const mockResults = [
        {
          sys_id: 'test-1',
          name: 'Recent Script',
          api_name: 'RecentScript',
          active: true,
          access: 'public',
          client_callable: false,
          sys_updated_on: '2024-01-01'
        }
      ];

      mockService.listRecentScriptIncludes.mockResolvedValue(mockResults);

      const result = await listRecentScriptIncludesHandler(params, mockService);

      expect(result).not.toHaveProperty('error');
      expect((result as any).script_includes).toEqual(mockResults);
      expect((result as any).count).toBe(1);
    });
  });

  describe('validateScriptIncludeHandler', () => {
    it('should return error when script is missing', async () => {
      const params = {} as any;

      const result = await validateScriptIncludeHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('script');
    });

    it('should validate script and return results', async () => {
      const params = { script: 'var test = 1;' };

      const mockValidationResult = {
        valid: true,
        warnings: [],
        errors: []
      };

      mockService.validateScript.mockResolvedValue(mockValidationResult);

      const result = await validateScriptIncludeHandler(params, mockService);

      expect(result).not.toHaveProperty('error');
      expect((result as any).valid).toBe(true);
      expect((result as any).warnings).toEqual([]);
      expect((result as any).errors).toEqual([]);
    });
  });

  describe('testScriptIncludeHandler', () => {
    it('should return error when sys_id is missing', async () => {
      const params = { method_name: 'testMethod' } as any;

      const result = await testScriptIncludeHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('sys_id');
    });

    it('should return error when method_name is missing', async () => {
      const params = { sys_id: 'test-sys-id' } as any;

      const result = await testScriptIncludeHandler(params, mockService);

      expect(result).toHaveProperty('error');
      expect((result as any).error.code).toBe('INVALID_PARAMETER');
      expect((result as any).error.message).toContain('method_name');
    });

    it('should test Script Include method', async () => {
      const params = {
        sys_id: 'test-sys-id',
        method_name: 'testMethod',
        parameters: { param1: 'value1' }
      };

      const mockTestResult = {
        success: true,
        result: 'test result',
        executionTime: 100,
        logs: []
      };

      mockService.testScriptInclude.mockResolvedValue(mockTestResult);

      const result = await testScriptIncludeHandler(params, mockService);

      expect((result as any).error).toBeUndefined();
      expect((result as any).success).toBe(true);
      expect((result as any).result).toBe('test result');
      expect((result as any).executionTime).toBe(100);
      expect((result as any).logs).toEqual([]);
    });
  });
});
