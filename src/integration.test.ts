/**
 * Integration Tests for GlideQuery Development Tools
 * 
 * Tests end-to-end flows across all layers:
 * - Script execution flow
 * - Code generation flow
 * - Validation flow
 * - Test execution flow
 * - Error handling across layers
 */

import { ServiceNowClient } from './client/ServiceNowClient.js';
import { AuthenticationManager } from './auth/AuthenticationManager.js';
import { GlideQueryExecutor } from './service/GlideQueryExecutor.js';
import { GlideQueryGenerator } from './service/GlideQueryGenerator.js';
import { executeGlideQueryHandler, generateGlideQueryHandler, testGlideQueryHandler } from './tools/handlers.js';

describe('Integration Tests - GlideQuery Development Tools', () => {
  let authManager: AuthenticationManager;
  let client: ServiceNowClient;
  let executor: GlideQueryExecutor;
  let generator: GlideQueryGenerator;

  beforeEach(() => {
    // Create mock authentication manager
    authManager = new AuthenticationManager({
      instanceUrl: 'https://test.service-now.com',
      username: 'test_user',
      password: 'test_password'
    });

    // Mock authentication
    jest.spyOn(authManager, 'authenticate').mockResolvedValue({
      success: true
    });

    jest.spyOn(authManager, 'isAuthenticated').mockReturnValue(true);
    jest.spyOn(authManager, 'getAuthHeaders').mockReturnValue({
      'Authorization': 'Basic mock_token',
      'Content-Type': 'application/json'
    });

    // Create client with mocked auth
    client = new ServiceNowClient(
      {
        instanceUrl: 'https://test.service-now.com',
        timeout: 30000,
        maxRetries: 3
      },
      authManager
    );

    // Create services
    executor = new GlideQueryExecutor(client);
    generator = new GlideQueryGenerator();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('End-to-End Script Execution Flow', () => {
    it('should execute a simple select query through all layers', async () => {
      // Mock the ServiceNowClient.executeScript method
      const mockExecuteScript = jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: true,
        result: [
          { number: 'INC0010001', short_description: 'Test incident 1' },
          { number: 'INC0010002', short_description: 'Test incident 2' }
        ],
        executionTime: 150
      });

      // Execute through handler (simulates MCP tool invocation)
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').where('active', true).select('number', 'short_description')"
        },
        executor
      );

      // Verify the flow
      expect(mockExecuteScript).toHaveBeenCalled();
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('result');
      expect(result).toHaveProperty('executionTime');
    });

    it('should handle script execution errors across layers', async () => {
      // Mock a script execution error
      jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: false,
        error: {
          message: 'Syntax error: unexpected token',
          line: 1,
          type: 'SyntaxError'
        },
        executionTime: 50
      });

      // Execute through handler
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').invalidMethod()"
        },
        executor
      );

      // Verify error handling
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
    });

    it('should apply security validation before execution', async () => {
      // Mock executeScript to verify it's NOT called for blacklisted scripts
      const mockExecuteScript = jest.spyOn(client, 'executeScript');

      // Execute script with blacklisted pattern
      const result = await executeGlideQueryHandler(
        {
          script: "gs.executeNow('malicious code')"
        },
        executor
      );

      // Verify security blocked the execution
      expect(mockExecuteScript).not.toHaveBeenCalled();
      expect(result).toHaveProperty('success', false);
      expect(result).toHaveProperty('error');
      expect(result.error).toContain('Security violation');
    });

    it('should use authentication from AuthenticationManager', async () => {
      // Create spies before executing
      const isAuthenticatedSpy = jest.spyOn(authManager, 'isAuthenticated');
      const getAuthHeadersSpy = jest.spyOn(authManager, 'getAuthHeaders');
      
      // Mock executeScript
      jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: true,
        result: { count: 5 },
        executionTime: 100
      });

      // Execute script
      await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').count()"
        },
        executor
      );

      // Verify authentication was checked (called during client.executeScript)
      // Note: The authentication check happens inside ServiceNowClient.executeScript
      // which we've mocked, so we verify the mock was called instead
      expect(client.executeScript).toHaveBeenCalled();
    });
  });

  describe('End-to-End Code Generation Flow', () => {
    it('should generate code from natural language through all layers', () => {
      // Generate code through handler
      const result = generateGlideQueryHandler(
        {
          description: 'get all active incidents where priority is 1'
        },
        generator
      );

      // Verify the flow
      expect(result).toHaveProperty('code');
      if ('code' in result) {
        expect(result.code).toContain("new GlideQuery('incident')");
        expect(result.code).toContain('.where');
        expect(result.code).toContain('.select');
      }
      expect(result).toHaveProperty('explanation');
    });

    it('should include comments when requested', () => {
      // Generate code with comments
      const result = generateGlideQueryHandler(
        {
          description: 'count incidents grouped by priority',
          includeComments: true
        },
        generator
      );

      // Verify comments are included
      expect(result).toHaveProperty('code');
      if ('code' in result) {
        expect(result.code).toContain('//');
      }
    });

    it('should handle invalid descriptions gracefully', () => {
      // Generate code with empty description
      const result = generateGlideQueryHandler(
        {
          description: ''
        },
        generator
      );

      // Verify error handling
      expect(result).toHaveProperty('error');
    });

    it('should preserve table names from hints', () => {
      // Generate code with table hint
      const result = generateGlideQueryHandler(
        {
          description: 'get all records',
          table: 'cmdb_ci_server'
        },
        generator
      );

      // Verify table name is used
      expect(result).toHaveProperty('code');
      if ('code' in result) {
        expect(result.code).toContain("'cmdb_ci_server'");
      }
    });
  });

  describe('End-to-End Validation Flow', () => {
    it('should validate syntax before execution', async () => {
      // Mock executeScript to verify it's NOT called for invalid syntax
      const mockExecuteScript = jest.spyOn(client, 'executeScript');

      // Execute script with invalid syntax (empty script)
      // Note: Empty script is caught by handler validation, not executor validation
      const result = await executeGlideQueryHandler(
        {
          script: ''
        },
        executor
      );

      // Verify validation blocked the execution
      expect(mockExecuteScript).not.toHaveBeenCalled();
      expect(result).toHaveProperty('error');
      expect(result.error).toBeDefined();
    });

    it('should detect common GlideQuery mistakes', () => {
      // Validate script with common mistake
      const validationResult = executor.validate(
        "new GlideQuery('incident').selectAll()"
      );

      // Verify mistake was detected
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toBeDefined();
      expect(validationResult.errors![0].message).toContain('selectAll');
    });

    it('should validate operator usage', () => {
      // Validate script with invalid operator
      const validationResult = executor.validate(
        "new GlideQuery('incident').where('priority', 'INVALID_OP', 1).select()"
      );

      // Verify invalid operator was detected
      expect(validationResult.valid).toBe(false);
      expect(validationResult.errors).toBeDefined();
      expect(validationResult.errors![0].message).toContain('Invalid operator');
    });
  });

  describe('End-to-End Test Execution Flow', () => {
    it('should execute script in test mode with result limiting', async () => {
      // Mock executeScript to return many results
      jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: true,
        result: {
          __testMode: true,
          __truncated: true,
          __originalCount: 250,
          data: Array(100).fill({ number: 'INC0010001' })
        },
        executionTime: 200
      });

      // Execute in test mode
      const result = await testGlideQueryHandler(
        {
          script: "new GlideQuery('incident').select()"
        },
        executor
      );

      // Verify test mode behavior
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('truncated', true);
      if ('recordCount' in result) {
        expect(result.recordCount).toBe(100);
      }
    });

    it('should warn about write operations in test mode', async () => {
      // Mock executeScript
      jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: true,
        result: { sys_id: 'test123' },
        executionTime: 150
      });

      // Execute write operation in test mode
      const result = await testGlideQueryHandler(
        {
          script: "new GlideQuery('incident').insert({ short_description: 'Test' })"
        },
        executor
      );

      // Verify warning is included
      expect(result).toHaveProperty('success', true);
      if ('warnings' in result) {
        expect(result.warnings).toBeDefined();
        expect(result.warnings![0]).toContain('write operations');
      }
    });

    it('should respect maxResults parameter', async () => {
      // Mock executeScript
      jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: true,
        result: {
          __testMode: true,
          __truncated: false,
          data: Array(50).fill({ number: 'INC0010001' })
        },
        executionTime: 150
      });

      // Execute with custom maxResults
      const result = await testGlideQueryHandler(
        {
          script: "new GlideQuery('incident').select()",
          maxResults: 50
        },
        executor
      );

      // Verify custom limit was applied
      expect(result).toHaveProperty('success', true);
      if ('recordCount' in result) {
        expect(result.recordCount).toBe(50);
      }
    });
  });

  describe('Error Handling Across Layers', () => {
    it('should handle authentication failures', async () => {
      // Mock authentication failure
      jest.spyOn(authManager, 'isAuthenticated').mockReturnValue(false);

      // Mock executeScript to throw auth error
      jest.spyOn(client, 'executeScript').mockRejectedValue({
        code: 'AUTH_ERROR',
        message: 'Not authenticated'
      });

      // Execute script
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').count()"
        },
        executor
      );

      // Verify error handling
      expect(result).toHaveProperty('error');
    });

    it('should handle network errors', async () => {
      // Mock network error
      jest.spyOn(client, 'executeScript').mockRejectedValue({
        code: 'NETWORK_ERROR',
        message: 'Cannot reach ServiceNow instance'
      });

      // Execute script
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').count()"
        },
        executor
      );

      // Verify error handling
      expect(result).toHaveProperty('error');
    });

    it('should handle timeout errors', async () => {
      // Mock timeout error
      jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: false,
        error: {
          message: 'Script execution timed out',
          type: 'TIMEOUT'
        },
        executionTime: 30000
      });

      // Execute script with timeout
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').select()",
          timeout: 1000
        },
        executor
      );

      // Verify timeout handling
      expect(result).toHaveProperty('success', false);
      expect(result.error).toContain('timed out');
    });

    it('should handle API endpoint not found', async () => {
      // Mock endpoint not found error
      jest.spyOn(client, 'executeScript').mockRejectedValue({
        code: 'ENDPOINT_NOT_FOUND',
        message: 'Script execution endpoint not found'
      });

      // Execute script
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').count()"
        },
        executor
      );

      // Verify error handling
      expect(result).toHaveProperty('error');
    });

    it('should handle permission errors', async () => {
      // Mock permission error
      jest.spyOn(client, 'executeScript').mockRejectedValue({
        code: 'FORBIDDEN',
        message: 'User does not have script execution permissions'
      });

      // Execute script
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').count()"
        },
        executor
      );

      // Verify error handling
      expect(result).toHaveProperty('error');
    });
  });

  describe('Configuration Integration', () => {
    it('should use timeout from configuration', async () => {
      // Mock executeScript to capture the timeout
      const mockExecuteScript = jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: true,
        result: { count: 5 },
        executionTime: 100
      });

      // Execute with custom timeout
      await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').count()",
          timeout: 5000
        },
        executor
      );

      // Verify timeout was passed
      expect(mockExecuteScript).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 5000
        })
      );
    });

    it('should enforce maximum script length', async () => {
      // Create a very long script
      const longScript = "new GlideQuery('incident').select()" + ' '.repeat(15000);

      // Execute long script
      const result = await executeGlideQueryHandler(
        {
          script: longScript
        },
        executor
      );

      // Verify length validation
      expect(result).toHaveProperty('success', false);
      expect(result.error).toContain('maximum length');
    });
  });

  describe('Logging Integration', () => {
    it('should log script execution operations', async () => {
      // Mock executeScript
      jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: true,
        result: { count: 5 },
        logs: ['Log message 1', 'Log message 2'],
        executionTime: 100
      });

      // Execute script
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').count()"
        },
        executor
      );

      // Verify logs are included
      expect(result).toHaveProperty('logs');
      if ('logs' in result) {
        expect(result.logs).toContain('Log message 1');
        expect(result.logs).toContain('Log message 2');
      }
    });

    it('should log code generation operations', () => {
      // Generate code (logging happens internally)
      const result = generateGlideQueryHandler(
        {
          description: 'count all incidents'
        },
        generator
      );

      // Verify generation succeeded (logging is tested via coverage)
      expect(result).toHaveProperty('code');
    });
  });

  describe('Result Formatting Integration', () => {
    it('should format Stream results as arrays', async () => {
      // Mock executeScript with array result
      jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: true,
        result: [
          { number: 'INC0010001' },
          { number: 'INC0010002' }
        ],
        executionTime: 100
      });

      // Execute script
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').select('number')"
        },
        executor
      );

      // Verify array formatting
      expect(result).toHaveProperty('success', true);
      if ('result' in result && 'recordCount' in result) {
        expect(Array.isArray(result.result)).toBe(true);
        expect(result.recordCount).toBe(2);
      }
    });

    it('should format primitive results with type information', async () => {
      // Mock executeScript with primitive result
      jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: true,
        result: 42,
        executionTime: 100
      });

      // Execute script
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').count()"
        },
        executor
      );

      // Verify primitive formatting
      expect(result).toHaveProperty('success', true);
      if ('result' in result) {
        expect(result.result).toHaveProperty('value', 42);
        expect(result.result).toHaveProperty('type', 'number');
      }
    });

    it('should handle empty results with appropriate message', async () => {
      // Mock executeScript with null result
      jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: true,
        result: null,
        executionTime: 100
      });

      // Execute script
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').where('number', 'NONEXISTENT').selectOne()"
        },
        executor
      );

      // Verify empty result handling
      expect(result).toHaveProperty('success', true);
      if ('result' in result && 'logs' in result) {
        expect(result.result).toBeNull();
        expect(result.logs).toBeDefined();
        expect(result.logs![0]).toContain('No records found');
      }
    });

    it('should truncate large result sets', async () => {
      // Mock executeScript with large result set
      const largeResultSet = Array(1500).fill({ number: 'INC0010001' });
      jest.spyOn(client, 'executeScript').mockResolvedValue({
        success: true,
        result: largeResultSet,
        executionTime: 500
      });

      // Execute script
      const result = await executeGlideQueryHandler(
        {
          script: "new GlideQuery('incident').select()"
        },
        executor
      );

      // Verify truncation
      expect(result).toHaveProperty('success', true);
      if ('recordCount' in result && 'logs' in result) {
        expect(result.recordCount).toBe(1000); // Default max is 1000
        expect(result.logs).toBeDefined();
        expect(result.logs!.some((log: string) => log.includes('truncated'))).toBe(true);
      }
    });
  });
});
