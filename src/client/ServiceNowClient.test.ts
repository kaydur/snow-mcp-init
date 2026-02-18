import axios from 'axios';
import { ServiceNowClient } from './ServiceNowClient.js';
import { AuthenticationManager } from '../auth/AuthenticationManager.js';
import { ClientConfig, AuthConfig, ServiceNowResponse, ServiceNowRecord, ScriptExecutionRequest } from '../types/interfaces.js';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ServiceNowClient', () => {
  const authConfig: AuthConfig = {
    instanceUrl: 'https://dev12345.service-now.com',
    username: 'testuser',
    password: 'testpass'
  };

  const clientConfig: ClientConfig = {
    instanceUrl: 'https://dev12345.service-now.com',
    timeout: 5000
  };

  let authManager: AuthenticationManager;
  let client: ServiceNowClient;

  beforeEach(() => {
    jest.clearAllMocks();
    authManager = new AuthenticationManager(authConfig);
    client = new ServiceNowClient(clientConfig, authManager);
  });

  describe('get', () => {
    it('should execute GET request with query parameters', async () => {
      // Mock authentication
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 }) // authenticate
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            result: [
              { sys_id: '123', number: 'INC0001', short_description: 'Test incident' }
            ]
          })
        });

      await authManager.authenticate();

      const response = await client.get('incident', {
        sysparm_query: 'state=1',
        sysparm_limit: 10
      });

      expect(response.result).toHaveLength(1);
      expect(response.result[0].sys_id).toBe('123');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://dev12345.service-now.com/api/now/table/incident?sysparm_query=state%3D1&sysparm_limit=10',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic ')
          })
        })
      );
    });

    it('should handle empty query parameters', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ result: [] })
        });

      await authManager.authenticate();

      const response = await client.get('incident');

      expect(response.result).toEqual([]);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://dev12345.service-now.com/api/now/table/incident',
        expect.any(Object)
      );
    });

    it('should throw error when not authenticated', async () => {
      await expect(client.get('incident')).rejects.toMatchObject({
        code: 'AUTH_ERROR',
        message: expect.stringContaining('Not authenticated')
      });
    });

    it('should handle 401 authentication errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => 'Unauthorized'
        });

      await authManager.authenticate();

      await expect(client.get('incident')).rejects.toMatchObject({
        code: 'AUTH_EXPIRED',
        message: expect.stringContaining('Session expired')
      });

      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should handle 403 forbidden errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => 'Forbidden'
        });

      await authManager.authenticate();

      await expect(client.get('incident')).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('Access forbidden')
      });
    });

    it('should handle 404 not found errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Not Found'
        });

      await authManager.authenticate();

      await expect(client.get('invalid_table')).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining("Table 'invalid_table' not found")
      });
    });

    it('should handle other HTTP errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error details'
        });

      await authManager.authenticate();

      await expect(client.get('incident')).rejects.toMatchObject({
        code: 'API_ERROR',
        message: expect.stringContaining('500'),
        detail: 'Server error details'
      });
    });

    it('should handle timeout errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockRejectedValueOnce(Object.assign(new Error('Aborted'), { name: 'AbortError' }));

      await authManager.authenticate();

      await expect(client.get('incident')).rejects.toMatchObject({
        code: 'TIMEOUT',
        message: expect.stringContaining('timed out')
      });
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockRejectedValueOnce(new TypeError('fetch failed'));

      await authManager.authenticate();

      await expect(client.get('incident')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: expect.stringContaining('Network error')
      });
    });

    it('should include all query parameters in URL', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ result: [] })
        });

      await authManager.authenticate();

      await client.get('incident', {
        sysparm_query: 'state=1^priority=1',
        sysparm_limit: 25,
        sysparm_offset: 10,
        sysparm_fields: 'sys_id,number,short_description',
        sysparm_display_value: true
      });

      const callUrl = (global.fetch as jest.Mock).mock.calls[1][0];
      expect(callUrl).toContain('sysparm_query=state%3D1%5Epriority%3D1');
      expect(callUrl).toContain('sysparm_limit=25');
      expect(callUrl).toContain('sysparm_offset=10');
      expect(callUrl).toContain('sysparm_fields=sys_id%2Cnumber%2Cshort_description');
      expect(callUrl).toContain('sysparm_display_value=true');
    });
  });

  describe('getById', () => {
    it('should retrieve a specific record by sys_id', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '123abc',
        number: 'INC0001',
        short_description: 'Test incident',
        state: '1'
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ result: mockRecord })
        });

      await authManager.authenticate();

      const record = await client.getById('incident', '123abc');

      expect(record.sys_id).toBe('123abc');
      expect(record.number).toBe('INC0001');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://dev12345.service-now.com/api/now/table/incident/123abc',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic ')
          })
        })
      );
    });

    it('should throw error when not authenticated', async () => {
      await expect(client.getById('incident', '123')).rejects.toMatchObject({
        code: 'AUTH_ERROR',
        message: expect.stringContaining('Not authenticated')
      });
    });

    it('should handle 404 not found errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Not Found'
        });

      await authManager.authenticate();

      await expect(client.getById('incident', 'nonexistent')).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: expect.stringContaining("Record with sys_id 'nonexistent' not found")
      });
    });

    it('should handle 401 authentication errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => 'Unauthorized'
        });

      await authManager.authenticate();

      await expect(client.getById('incident', '123')).rejects.toMatchObject({
        code: 'AUTH_EXPIRED',
        message: expect.stringContaining('Session expired')
      });

      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should handle 403 forbidden errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => 'Forbidden'
        });

      await authManager.authenticate();

      await expect(client.getById('incident', '123')).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('Access forbidden')
      });
    });

    it('should handle other HTTP errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error'
        });

      await authManager.authenticate();

      await expect(client.getById('incident', '123')).rejects.toMatchObject({
        code: 'API_ERROR',
        message: expect.stringContaining('500')
      });
    });

    it('should handle timeout errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockRejectedValueOnce(Object.assign(new Error('Aborted'), { name: 'AbortError' }));

      await authManager.authenticate();

      await expect(client.getById('incident', '123')).rejects.toMatchObject({
        code: 'TIMEOUT',
        message: expect.stringContaining('timed out')
      });
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockRejectedValueOnce(new TypeError('fetch failed'));

      await authManager.authenticate();

      await expect(client.getById('incident', '123')).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: expect.stringContaining('Network error')
      });
    });
  });

  describe('error handling', () => {
    it('should format unknown errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockRejectedValueOnce('Unknown error string');

      await authManager.authenticate();

      await expect(client.get('incident')).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: expect.stringContaining('unknown error')
      });
    });

    it('should preserve ServiceNowError objects', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Not Found'
        });

      await authManager.authenticate();

      try {
        await client.get('invalid_table');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toHaveProperty('code');
        expect(error).toHaveProperty('message');
        expect((error as any).code).toBe('NOT_FOUND');
      }
    });
  });

  describe('timeout configuration', () => {
    it('should use default timeout when not specified', async () => {
      const clientWithoutTimeout = new ServiceNowClient(
        { instanceUrl: 'https://dev12345.service-now.com' },
        authManager
      );

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ result: [] })
        });

      await authManager.authenticate();
      await clientWithoutTimeout.get('incident');

      // Should not throw timeout error with default timeout
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should use custom timeout when specified', async () => {
      const clientWithCustomTimeout = new ServiceNowClient(
        { instanceUrl: 'https://dev12345.service-now.com', timeout: 1000 },
        authManager
      );

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ result: [] })
        });

      await authManager.authenticate();
      await clientWithCustomTimeout.get('incident');

      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe('executeScript', () => {
    it('should execute a valid script successfully', async () => {
      const mockResult = {
        result: {
          success: true,
          value: { count: 5 },
          logs: ['Execution started', 'Query completed']
        }
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 }) // authenticate
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResult
        });

      await authManager.authenticate();

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').where('active', true).count()"
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(true);
      expect(result.result).toEqual({ count: 5 });
      expect(result.logs).toEqual(['Execution started', 'Query completed']);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://dev12345.service-now.com/api/now/v1/script/execute',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining(request.script)
        })
      );
    });

    it('should handle script execution errors', async () => {
      const mockError = {
        result: {
          success: false,
          error: {
            message: 'ReferenceError: undefined_variable is not defined',
            line: 5,
            type: 'ReferenceError'
          },
          logs: ['Execution started']
        }
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockError
        });

      await authManager.authenticate();

      const request: ScriptExecutionRequest = {
        script: "undefined_variable.doSomething()"
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('undefined_variable');
      expect(result.error?.line).toBe(5);
      expect(result.error?.type).toBe('ReferenceError');
      expect(result.logs).toEqual(['Execution started']);
    });

    it('should throw error when script is empty', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 });

      await authManager.authenticate();

      const request: ScriptExecutionRequest = {
        script: ''
      };

      await expect(client.executeScript(request)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('Script cannot be empty')
      });
    });

    it('should throw error when not authenticated', async () => {
      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').count()"
      };

      await expect(client.executeScript(request)).rejects.toMatchObject({
        code: 'AUTH_ERROR',
        message: expect.stringContaining('Not authenticated')
      });
    });

    it('should handle 401 authentication errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
          text: async () => 'Unauthorized'
        });

      await authManager.authenticate();

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').count()"
      };

      await expect(client.executeScript(request)).rejects.toMatchObject({
        code: 'AUTH_EXPIRED',
        message: expect.stringContaining('Session expired')
      });

      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should handle 403 forbidden errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 403,
          text: async () => 'Forbidden'
        });

      await authManager.authenticate();

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').count()"
      };

      await expect(client.executeScript(request)).rejects.toMatchObject({
        code: 'FORBIDDEN',
        message: expect.stringContaining('script execution permissions')
      });
    });

    it('should handle 404 endpoint not found errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Not Found'
        });

      await authManager.authenticate();

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').count()"
      };

      await expect(client.executeScript(request)).rejects.toMatchObject({
        code: 'ENDPOINT_NOT_FOUND',
        message: expect.stringContaining('Script execution endpoint not found')
      });
    });

    it('should handle timeout errors with ETIMEDOUT code', async () => {
      // Mock successful authentication
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { result: [] }
      });

      await authManager.authenticate();

      // Mock timeout error - create a proper axios error
      const timeoutError = new Error('timeout of 5000ms exceeded') as any;
      timeoutError.code = 'ETIMEDOUT';
      timeoutError.isAxiosError = true;
      timeoutError.config = {};
      timeoutError.toJSON = () => ({});
      
      // Spy on axios.isAxiosError to return true for our error
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      
      mockedAxios.post.mockRejectedValueOnce(timeoutError);

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').count()",
        timeout: 5000
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain('timed out');
      expect(result.error?.type).toBe('TIMEOUT');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle timeout errors with ECONNABORTED code', async () => {
      // Mock successful authentication
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { result: [] }
      });

      await authManager.authenticate();

      // Mock timeout error - create a proper axios error
      const timeoutError = new Error('timeout of 30000ms exceeded') as any;
      timeoutError.code = 'ECONNABORTED';
      timeoutError.isAxiosError = true;
      timeoutError.config = {};
      timeoutError.toJSON = () => ({});
      
      // Spy on axios.isAxiosError to return true for our error
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      
      mockedAxios.post.mockRejectedValueOnce(timeoutError);

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').where('active', true).select()",
        timeout: 30000
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Script execution timed out');
      expect(result.error?.type).toBe('TIMEOUT');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('should use default timeout of 30 seconds when not specified', async () => {
      const mockResult = {
        result: {
          success: true,
          value: 10
        }
      };

      // Mock successful authentication
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { result: [] }
      });

      await authManager.authenticate();

      // Mock successful script execution
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockResult
      });

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').count()"
        // No timeout specified - should use default 30000ms
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(true);
      expect(result.result).toBe(10);
      
      // Verify the axios call was made with default timeout
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 30000 // Default timeout
        })
      );
    });

    it('should enforce maximum timeout of 60 seconds', async () => {
      const mockResult = {
        result: {
          success: true,
          value: 10
        }
      };

      // Mock successful authentication
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { result: [] }
      });

      await authManager.authenticate();

      // Mock successful script execution
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockResult
      });

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').count()",
        timeout: 120000 // Request 120 seconds, should be capped at 60
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(true);
      expect(result.result).toBe(10);
      
      // Verify the timeout was capped at 60000ms
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 60000 // Maximum timeout cap
        })
      );
    });

    it('should handle custom timeout values within valid range', async () => {
      const mockResult = {
        result: {
          success: true,
          value: 10
        }
      };

      // Mock successful authentication
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { result: [] }
      });

      await authManager.authenticate();

      // Mock successful script execution
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockResult
      });

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').count()",
        timeout: 45000 // Custom timeout within valid range
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(true);
      expect(result.result).toBe(10);
      
      // Verify the custom timeout was used
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 45000 // Custom timeout
        })
      );
    });

    it('should handle minimum timeout values', async () => {
      const mockResult = {
        result: {
          success: true,
          value: 5
        }
      };

      // Mock successful authentication
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { result: [] }
      });

      await authManager.authenticate();

      // Mock successful script execution
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: mockResult
      });

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').count()",
        timeout: 1000 // Minimum timeout of 1 second
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(true);
      expect(result.result).toBe(5);
      
      // Verify the minimum timeout was used
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          timeout: 1000 // Minimum timeout
        })
      );
    });

    it('should handle timeout at exactly 30 seconds (default)', async () => {
      // Mock successful authentication
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { result: [] }
      });

      await authManager.authenticate();

      // Mock timeout error - create a proper axios error
      const timeoutError = new Error('timeout of 30000ms exceeded') as any;
      timeoutError.code = 'ETIMEDOUT';
      timeoutError.isAxiosError = true;
      timeoutError.config = {};
      timeoutError.toJSON = () => ({});
      
      // Spy on axios.isAxiosError to return true for our error
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      
      mockedAxios.post.mockRejectedValueOnce(timeoutError);

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').where('active', true).select()"
        // Using default 30 second timeout
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Script execution timed out');
      expect(result.error?.type).toBe('TIMEOUT');
    });

    it('should handle timeout at exactly 60 seconds (maximum)', async () => {
      // Mock successful authentication
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: { result: [] }
      });

      await authManager.authenticate();

      // Mock timeout error - create a proper axios error
      const timeoutError = new Error('timeout of 60000ms exceeded') as any;
      timeoutError.code = 'ECONNABORTED';
      timeoutError.isAxiosError = true;
      timeoutError.config = {};
      timeoutError.toJSON = () => ({});
      
      // Spy on axios.isAxiosError to return true for our error
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      
      mockedAxios.post.mockRejectedValueOnce(timeoutError);

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').select()",
        timeout: 60000 // Maximum timeout
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Script execution timed out');
      expect(result.error?.type).toBe('TIMEOUT');
    });

    it('should handle other HTTP errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => 'Server error details'
        });

      await authManager.authenticate();

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').count()"
      };

      await expect(client.executeScript(request)).rejects.toMatchObject({
        code: 'API_ERROR',
        message: expect.stringContaining('500'),
        detail: 'Server error details'
      });
    });

    it('should handle network errors', async () => {
      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockRejectedValueOnce(new TypeError('fetch failed'));

      await authManager.authenticate();

      const request: ScriptExecutionRequest = {
        script: "new GlideQuery('incident').count()"
      };

      await expect(client.executeScript(request)).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
        message: expect.stringContaining('Network error')
      });
    });

    it('should parse direct value responses', async () => {
      const mockResult = {
        result: 42
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockResult
        });

      await authManager.authenticate();

      const request: ScriptExecutionRequest = {
        script: "42"
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(true);
      expect(result.result).toBe(42);
    });

    it('should handle alternative error response formats', async () => {
      const mockError = {
        result: {
          errorMessage: 'Script execution failed',
          errorLine: 10,
          errorType: 'SyntaxError'
        }
      };

      global.fetch = jest.fn()
        .mockResolvedValueOnce({ ok: true, status: 200 })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => mockError
        });

      await authManager.authenticate();

      const request: ScriptExecutionRequest = {
        script: "invalid syntax here"
      };

      const result = await client.executeScript(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Script execution failed');
      expect(result.error?.line).toBe(10);
      expect(result.error?.type).toBe('SyntaxError');
    });
  });
});
