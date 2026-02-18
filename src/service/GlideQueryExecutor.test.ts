import { GlideQueryExecutor } from './GlideQueryExecutor.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { ScriptExecutionResult } from '../types/interfaces.js';

// Mock ServiceNowClient
jest.mock('../client/ServiceNowClient.js');

describe('GlideQueryExecutor', () => {
  let executor: GlideQueryExecutor;
  let mockClient: jest.Mocked<ServiceNowClient>;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      executeScript: jest.fn()
    } as any;

    executor = new GlideQueryExecutor(mockClient);
  });

  describe('constructor', () => {
    it('should accept ServiceNowClient', () => {
      expect(executor).toBeInstanceOf(GlideQueryExecutor);
    });
  });

  describe('execute', () => {
    it('should reject empty script', async () => {
      const result = await executor.execute('');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Script cannot be empty');
      expect(mockClient.executeScript).not.toHaveBeenCalled();
    });

    it('should reject script with only whitespace', async () => {
      const result = await executor.execute('   \n\t  ');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Script cannot be empty');
      expect(mockClient.executeScript).not.toHaveBeenCalled();
    });

    it('should reject script exceeding maximum length', async () => {
      const longScript = 'a'.repeat(10001);
      const result = await executor.execute(longScript);

      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
      expect(mockClient.executeScript).not.toHaveBeenCalled();
    });

    it('should execute valid GlideQuery script', async () => {
      const script = "new GlideQuery('incident').where('active', true).select('number')";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: [{ number: 'INC0010001' }],
        executionTime: 100
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ number: 'INC0010001' }]);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(mockClient.executeScript).toHaveBeenCalledWith({
        script,
        timeout: undefined
      });
    });

    it('should pass timeout option to client', async () => {
      const script = "new GlideQuery('incident').count()";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: 42,
        executionTime: 50
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      await executor.execute(script, { timeout: 5000 });

      expect(mockClient.executeScript).toHaveBeenCalledWith({
        script,
        timeout: 5000
      });
    });

    it('should handle script execution failure', async () => {
      const script = "new GlideQuery('incident').invalidMethod()";
      const mockResponse: ScriptExecutionResult = {
        success: false,
        error: {
          message: 'invalidMethod is not a function',
          type: 'TypeError',
          line: 1
        },
        executionTime: 10
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalidMethod is not a function');
    });

    it('should format array results with record count', async () => {
      const script = "new GlideQuery('incident').select('number')";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: [
          { number: 'INC0010001' },
          { number: 'INC0010002' },
          { number: 'INC0010003' }
        ],
        executionTime: 150
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.recordCount).toBe(3);
      expect(result.truncated).toBe(false);
    });

    it('should truncate large result sets and set truncated flag', async () => {
      const script = "new GlideQuery('incident').select()";
      // Create array with 1500 records (exceeds MAX_RESULTS of 1000)
      const largeResultSet = Array.from({ length: 1500 }, (_, i) => ({
        sys_id: `id_${i}`,
        number: `INC${String(i).padStart(7, '0')}`
      }));
      
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: largeResultSet,
        executionTime: 200
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1000); // Truncated to MAX_RESULTS
      expect(result.recordCount).toBe(1000);
      expect(result.truncated).toBe(true);
      expect(result.logs).toBeDefined();
      expect(result.logs!.some(log => log.includes('Results truncated'))).toBe(true);
      expect(result.logs!.some(log => log.includes('1000 of 1500'))).toBe(true);
    });

    it('should format primitive number results with type information', async () => {
      const script = "new GlideQuery('incident').count()";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: 42,
        executionTime: 50
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ value: 42, type: 'number' });
    });

    it('should format primitive string results with type information', async () => {
      const script = "new GlideQuery('incident').selectOne('number').get().number";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: 'INC0010001',
        executionTime: 50
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ value: 'INC0010001', type: 'string' });
    });

    it('should format primitive boolean results with type information', async () => {
      const script = "new GlideQuery('incident').selectOne('active').get().active";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: true,
        executionTime: 50
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ value: true, type: 'boolean' });
    });

    it('should format aggregate results with rowCount', async () => {
      const script = "new GlideQuery('incident').where('active', true).updateMultiple({state: 6})";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: { rowCount: 15 },
        executionTime: 200
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ rowCount: 15 });
      expect(result.recordCount).toBe(15);
    });

    it('should handle null results with appropriate message', async () => {
      const script = "new GlideQuery('incident').get('nonexistent_id')";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: null,
        executionTime: 50
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.logs).toBeDefined();
      expect(result.logs).toContain('No records found - query returned empty result');
    });

    it('should handle undefined results with appropriate message', async () => {
      const script = "new GlideQuery('incident').selectOne('number')";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: undefined,
        executionTime: 50
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.logs).toBeDefined();
      expect(result.logs).toContain('No records found - query returned empty result');
    });

    it('should handle empty array results', async () => {
      const script = "new GlideQuery('incident').where('number', 'NONEXISTENT').select()";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: [],
        executionTime: 50
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
      expect(result.recordCount).toBe(0);
      expect(result.truncated).toBe(false);
    });

    it('should include logs from execution', async () => {
      const script = "gs.info('test'); new GlideQuery('incident').count()";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: 10,
        logs: ['test'],
        executionTime: 60
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(result.logs).toEqual(['test']);
    });
  });

  describe('script sanitization', () => {
    it('should reject script with gs.executeNow', async () => {
      const script = "gs.executeNow('malicious code')";
      const result = await executor.execute(script);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Security violation');
      expect(result.error).toContain('Blacklisted pattern');
      expect(mockClient.executeScript).not.toHaveBeenCalled();
    });

    it('should reject script with gs.eval', async () => {
      const script = "gs.eval('malicious code')";
      const result = await executor.execute(script);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Security violation');
      expect(mockClient.executeScript).not.toHaveBeenCalled();
    });

    it('should reject script with eval', async () => {
      const script = "eval('malicious code')";
      const result = await executor.execute(script);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Security violation');
      expect(mockClient.executeScript).not.toHaveBeenCalled();
    });

    it('should reject script with Function constructor', async () => {
      const script = "new Function('return 1')()";
      const result = await executor.execute(script);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Security violation');
      expect(mockClient.executeScript).not.toHaveBeenCalled();
    });

    it('should reject script with GlideRecord', async () => {
      const script = "var gr = new GlideRecord('incident')";
      const result = await executor.execute(script);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Security violation');
      expect(mockClient.executeScript).not.toHaveBeenCalled();
    });

    it('should allow safe GlideQuery script', async () => {
      const script = "new GlideQuery('incident').where('active', true).count()";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: 10,
        executionTime: 50
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(true);
      expect(mockClient.executeScript).toHaveBeenCalled();
    });
  });

  describe('test mode', () => {
    it('should wrap script in test mode', async () => {
      const script = "new GlideQuery('incident').select('number')";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: {
          __testMode: true,
          __truncated: false,
          data: [{ number: 'INC0010001' }]
        },
        executionTime: 100
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script, { testMode: true });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([{ number: 'INC0010001' }]);
      expect(result.truncated).toBe(false);
      
      // Verify script was wrapped
      const calledScript = mockClient.executeScript.mock.calls[0][0].script;
      expect(calledScript).toContain('__testMode');
      expect(calledScript).toContain('__testModeMaxResults');
    });

    it('should indicate truncation in test mode', async () => {
      const script = "new GlideQuery('incident').select('number')";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: {
          __testMode: true,
          __truncated: true,
          __originalCount: 150,
          data: new Array(100).fill({ number: 'INC0010001' })
        },
        executionTime: 200
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script, { testMode: true });

      expect(result.success).toBe(true);
      expect(result.truncated).toBe(true);
      expect(result.recordCount).toBe(100);
      expect(result.logs).toContain('Results truncated: showing 100 of 150 records');
    });

    it('should use custom maxResults in test mode', async () => {
      const script = "new GlideQuery('incident').select('number')";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: {
          __testMode: true,
          __truncated: false,
          data: []
        },
        executionTime: 50
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      await executor.execute(script, { testMode: true, maxResults: 50 });

      const calledScript = mockClient.executeScript.mock.calls[0][0].script;
      expect(calledScript).toContain('__testModeMaxResults = 50');
    });

    it('should warn about insert operations in test mode', async () => {
      const script = "new GlideQuery('incident').insert({short_description: 'test'})";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: { sys_id: '123', short_description: 'test' },
        executionTime: 100
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script, { testMode: true });

      expect(result.success).toBe(true);
      expect(result.logs).toBeDefined();
      expect(result.logs?.some(log => log.includes('WARNING') && log.includes('insert'))).toBe(true);
    });

    it('should warn about update operations in test mode', async () => {
      const script = "new GlideQuery('incident').where('number', 'INC0010001').update({state: 6})";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: { sys_id: '123', state: 6 },
        executionTime: 100
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script, { testMode: true });

      expect(result.success).toBe(true);
      expect(result.logs).toBeDefined();
      expect(result.logs?.some(log => log.includes('WARNING') && log.includes('update'))).toBe(true);
    });

    it('should warn about updateMultiple operations in test mode', async () => {
      const script = "new GlideQuery('incident').where('active', true).updateMultiple({state: 6})";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: { rowCount: 15 },
        executionTime: 200
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script, { testMode: true });

      expect(result.success).toBe(true);
      expect(result.logs).toBeDefined();
      expect(result.logs?.some(log => log.includes('WARNING') && log.includes('updateMultiple'))).toBe(true);
    });

    it('should warn about deleteMultiple operations in test mode', async () => {
      const script = "new GlideQuery('incident').where('state', 7).deleteMultiple()";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: { rowCount: 5 },
        executionTime: 150
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script, { testMode: true });

      expect(result.success).toBe(true);
      expect(result.logs).toBeDefined();
      expect(result.logs?.some(log => log.includes('WARNING') && log.includes('deleteMultiple'))).toBe(true);
    });

    it('should warn about insertOrUpdate operations in test mode', async () => {
      const script = "new GlideQuery('incident').insertOrUpdate({sys_id: '123', state: 6})";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: { sys_id: '123', state: 6 },
        executionTime: 100
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script, { testMode: true });

      expect(result.success).toBe(true);
      expect(result.logs).toBeDefined();
      expect(result.logs?.some(log => log.includes('WARNING') && log.includes('insertOrUpdate'))).toBe(true);
    });

    it('should warn about multiple write operations in test mode', async () => {
      const script = `
        new GlideQuery('incident').insert({short_description: 'test'});
        new GlideQuery('incident').where('number', 'INC0010001').update({state: 6});
      `;
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: null,
        executionTime: 150
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script, { testMode: true });

      expect(result.success).toBe(true);
      expect(result.logs).toBeDefined();
      const warningLog = result.logs?.find(log => log.includes('WARNING'));
      expect(warningLog).toBeDefined();
      expect(warningLog).toContain('insert');
      expect(warningLog).toContain('update');
    });

    it('should not warn about write operations when not in test mode', async () => {
      const script = "new GlideQuery('incident').insert({short_description: 'test'})";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: { sys_id: '123', short_description: 'test' },
        executionTime: 100
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script, { testMode: false });

      expect(result.success).toBe(true);
      expect(result.logs?.some(log => log.includes('WARNING'))).toBeFalsy();
    });

    it('should not warn about read operations in test mode', async () => {
      const script = "new GlideQuery('incident').where('active', true).select('number')";
      const mockResponse: ScriptExecutionResult = {
        success: true,
        result: {
          __testMode: true,
          __truncated: false,
          data: [{ number: 'INC0010001' }]
        },
        executionTime: 100
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script, { testMode: true });

      expect(result.success).toBe(true);
      expect(result.logs?.some(log => log.includes('WARNING'))).toBeFalsy();
    });
  });

  describe('error handling', () => {
    it('should handle client errors gracefully', async () => {
      const script = "new GlideQuery('incident').count()";
      mockClient.executeScript.mockRejectedValue(new Error('Network error'));

      const result = await executor.execute(script);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should handle timeout errors', async () => {
      const script = "new GlideQuery('incident').count()";
      const mockResponse: ScriptExecutionResult = {
        success: false,
        error: {
          message: 'Script execution timed out',
          type: 'TIMEOUT'
        },
        executionTime: 30000
      };

      mockClient.executeScript.mockResolvedValue(mockResponse);

      const result = await executor.execute(script);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });

    it('should handle permission errors when user lacks script execution permissions', async () => {
      const script = "new GlideQuery('incident').count()";
      const permissionError = {
        code: 'FORBIDDEN',
        message: 'Access forbidden. User does not have script execution permissions.'
      };

      mockClient.executeScript.mockRejectedValue(permissionError);

      const result = await executor.execute(script);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access forbidden');
      expect(result.error).toContain('script execution permissions');
    });

    it('should propagate permission errors from ServiceNowClient', async () => {
      const script = "new GlideQuery('incident').where('active', true).select()";
      const permissionError = {
        code: 'FORBIDDEN',
        message: 'Access forbidden. User does not have script execution permissions.',
        detail: 'User role does not include script execution rights'
      };

      mockClient.executeScript.mockRejectedValue(permissionError);

      const result = await executor.execute(script);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access forbidden. User does not have script execution permissions.');
      expect(mockClient.executeScript).toHaveBeenCalledWith({
        script,
        timeout: undefined
      });
    });
  });

  describe('validate', () => {
    it('should reject empty script', () => {
      const result = executor.validate('');

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toBe('Script cannot be empty');
    });

    it('should reject script with only whitespace', () => {
      const result = executor.validate('   \n\t  ');

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toBe('Script cannot be empty');
    });

    it('should reject script exceeding maximum length', () => {
      const longScript = 'a'.repeat(10001);
      const result = executor.validate(longScript);

      expect(result.valid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.message.includes('exceeds maximum length'))).toBe(true);
    });

    it('should accept valid GlideQuery script', () => {
      const script = "new GlideQuery('incident').where('active', true).select('number')";
      const result = executor.validate(script);

      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    describe('undefined methods detection', () => {
      it('should detect .selectAll() method', () => {
        const script = "new GlideQuery('incident').selectAll()";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('selectAll'))).toBe(true);
        expect(result.errors?.some(e => e.message.includes('Use .select() instead'))).toBe(true);
      });

      it('should detect .findOne() method', () => {
        const script = "new GlideQuery('incident').findOne()";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('findOne'))).toBe(true);
        expect(result.errors?.some(e => e.message.includes('Use .selectOne() or .get() instead'))).toBe(true);
      });

      it('should detect .query() method', () => {
        const script = "new GlideQuery('incident').query()";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('query'))).toBe(true);
        expect(result.errors?.some(e => e.message.includes('Use .select() instead'))).toBe(true);
      });

      it('should detect .next() method', () => {
        const script = "var result = new GlideQuery('incident').select(); result.next()";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('next'))).toBe(true);
        expect(result.errors?.some(e => e.message.includes('Use .forEach() or .toArray()'))).toBe(true);
      });

      it('should detect .getValue() method', () => {
        const script = "record.getValue('field')";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('getValue'))).toBe(true);
        expect(result.errors?.some(e => e.message.includes('Use direct field access'))).toBe(true);
      });

      it('should detect .addQuery() method', () => {
        const script = "new GlideQuery('incident').addQuery('active', true)";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('addQuery'))).toBe(true);
        expect(result.errors?.some(e => e.message.includes('Use .where() instead'))).toBe(true);
      });

      it('should detect .addEncodedQuery() method', () => {
        const script = "new GlideQuery('incident').addEncodedQuery('active=true')";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('addEncodedQuery'))).toBe(true);
        expect(result.errors?.some(e => e.message.includes('Use GlideQuery.parse() instead'))).toBe(true);
      });

      it('should detect .setValue() method', () => {
        const script = "record.setValue('field', 'value')";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('setValue'))).toBe(true);
        expect(result.errors?.some(e => e.message.includes('Use .update() or .insert()'))).toBe(true);
      });
    });

    describe('incorrect chaining detection', () => {
      it('should detect chaining select after select', () => {
        const script = "new GlideQuery('incident').select('number').select('state')";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('Cannot chain terminal operations'))).toBe(true);
      });

      it('should detect chaining count after select', () => {
        const script = "new GlideQuery('incident').select('number').count()";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('Cannot chain terminal operations'))).toBe(true);
      });

      it('should detect chaining selectOne after count', () => {
        const script = "new GlideQuery('incident').count().selectOne('number')";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('Cannot chain terminal operations'))).toBe(true);
      });

      it('should allow chaining non-terminal operations', () => {
        const script = "new GlideQuery('incident').where('active', true).orderBy('number').limit(10).select('number')";
        const result = executor.validate(script);

        expect(result.valid).toBe(true);
      });
    });

    describe('missing parentheses detection', () => {
      it('should warn about missing parentheses on method calls', () => {
        const script = "new GlideQuery('incident').where('active', true).select";
        const result = executor.validate(script);

        expect(result.warnings).toBeDefined();
        expect(result.warnings?.some(w => w.includes('select'))).toBe(true);
        expect(result.warnings?.some(w => w.includes('missing parentheses'))).toBe(true);
      });

      it('should warn about missing parentheses on count', () => {
        const script = "new GlideQuery('incident').count";
        const result = executor.validate(script);

        expect(result.warnings).toBeDefined();
        expect(result.warnings?.some(w => w.includes('count'))).toBe(true);
        expect(result.warnings?.some(w => w.includes('missing parentheses'))).toBe(true);
      });

      it('should not warn when parentheses are present', () => {
        const script = "new GlideQuery('incident').where('active', true).select()";
        const result = executor.validate(script);

        expect(result.warnings?.some(w => w.includes('missing parentheses'))).toBeFalsy();
      });
    });

    describe('invalid operators detection', () => {
      it('should detect invalid operator', () => {
        const script = "new GlideQuery('incident').where('priority', 'INVALID_OP', 3)";
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.some(e => e.message.includes('Invalid operator'))).toBe(true);
        expect(result.errors?.some(e => e.message.includes('INVALID_OP'))).toBe(true);
      });

      it('should accept valid operators', () => {
        const validOperators = ['=', '!=', '>', '>=', '<', '<=', 'IN', 'CONTAINS', 'STARTSWITH'];
        
        for (const op of validOperators) {
          const script = `new GlideQuery('incident').where('field', '${op}', 'value').select()`;
          const result = executor.validate(script);

          expect(result.valid).toBe(true);
        }
      });
    });

    describe('invalid field flags detection', () => {
      it('should warn about invalid field flag', () => {
        const script = "new GlideQuery('incident').select('assigned_to$INVALID')";
        const result = executor.validate(script);

        expect(result.warnings).toBeDefined();
        expect(result.warnings?.some(w => w.includes('Unknown field flag'))).toBe(true);
        expect(result.warnings?.some(w => w.includes('$INVALID'))).toBe(true);
      });

      it('should accept valid field flags', () => {
        const script = "new GlideQuery('incident').select('assigned_to$DISPLAY', 'price$CURRENCY_CODE')";
        const result = executor.validate(script);

        expect(result.warnings?.some(w => w.includes('Unknown field flag'))).toBeFalsy();
      });
    });

    describe('GlideRecord pattern detection', () => {
      it('should warn about GlideRecord usage', () => {
        const script = "var gr = new GlideRecord('incident')";
        const result = executor.validate(script);

        expect(result.warnings).toBeDefined();
        expect(result.warnings?.some(w => w.includes('GlideRecord detected'))).toBe(true);
        expect(result.warnings?.some(w => w.includes('consider using GlideQuery'))).toBe(true);
      });
    });

    describe('Optional handling detection', () => {
      it('should warn about .get() without safety checks', () => {
        const script = "new GlideQuery('incident').selectOne('number').get()";
        const result = executor.validate(script);

        expect(result.warnings).toBeDefined();
        expect(result.warnings?.some(w => w.includes('.get() on Optional'))).toBe(true);
        expect(result.warnings?.some(w => w.includes('.isPresent() or using .orElse()'))).toBe(true);
      });

      it('should not warn when using .isPresent()', () => {
        const script = `
          var opt = new GlideQuery('incident').selectOne('number');
          if (opt.isPresent()) {
            opt.get();
          }
        `;
        const result = executor.validate(script);

        expect(result.warnings?.some(w => w.includes('.get() on Optional'))).toBeFalsy();
      });

      it('should not warn when using .orElse()', () => {
        const script = "new GlideQuery('incident').selectOne('number').orElse(null)";
        const result = executor.validate(script);

        expect(result.warnings?.some(w => w.includes('.get() on Optional'))).toBeFalsy();
      });
    });

    describe('line number tracking', () => {
      it('should report correct line numbers for errors', () => {
        const script = `
new GlideQuery('incident')
  .where('active', true)
  .selectAll()
        `.trim();
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        
        const selectAllError = result.errors?.find(e => e.message.includes('selectAll'));
        expect(selectAllError?.line).toBe(3);
      });

      it('should report correct line numbers for chaining errors', () => {
        const script = `
new GlideQuery('incident')
  .where('active', true)
  .select('number')
  .count()
        `.trim();
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        
        const chainingError = result.errors?.find(e => e.message.includes('Cannot chain terminal operations'));
        expect(chainingError?.line).toBeDefined();
        expect(chainingError?.line).toBeGreaterThan(0);
      });
    });

    describe('complex validation scenarios', () => {
      it('should detect multiple errors in one script', () => {
        const script = `
          new GlideQuery('incident')
            .where('priority', 'INVALID_OP', 3)
            .selectAll()
            .count()
        `;
        const result = executor.validate(script);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(1);
      });

      it('should validate complex valid script', () => {
        const script = `
          new GlideQuery('incident')
            .where('active', true)
            .where('priority', '<=', 3)
            .whereNotNull('assigned_to')
            .orderByDesc('sys_created_on')
            .limit(10)
            .withAcls()
            .select('number', 'short_description', 'assigned_to$DISPLAY')
        `;
        const result = executor.validate(script);

        expect(result.valid).toBe(true);
      });
    });
  });
});
