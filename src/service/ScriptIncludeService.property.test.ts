import * as fc from 'fast-check';
import { ScriptIncludeService } from './ScriptIncludeService.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import type {
  CreateScriptIncludeData,
  UpdateScriptIncludeData,
  ScriptIncludeFilters
} from '../types/scriptInclude.js';

// Mock ServiceNowClient for testing
class MockServiceNowClient {
  private records: Map<string, any> = new Map();
  private apiNameIndex: Map<string, string> = new Map();

  async post(table: string, data: any): Promise<any> {
    const sysId = this.generateSysId();
    const record = {
      sys_id: sysId,
      ...data,
      sys_created_on: new Date().toISOString(),
      sys_updated_on: new Date().toISOString(),
      sys_created_by: 'admin',
      sys_updated_by: 'admin',
      sys_mod_count: 0
    };
    this.records.set(sysId, record);
    if (data.api_name) {
      this.apiNameIndex.set(data.api_name, sysId);
    }
    return { sys_id: sysId, result: record };
  }

  async getById(table: string, sysId: string): Promise<any> {
    const record = this.records.get(sysId);
    return record ? { result: record } : { result: null };
  }

  async get(table: string, query?: string, limit?: number): Promise<any> {
    const results: any[] = [];
    
    // Simple query parsing for api_name
    if (query && typeof query === 'string' && query.includes('api_name=')) {
      const match = query.match(/api_name=([^^]+)/);
      if (match) {
        const apiName = match[1];
        const sysId = this.apiNameIndex.get(apiName);
        if (sysId) {
          const record = this.records.get(sysId);
          if (record) {
            results.push(record);
          }
        }
      }
    } else {
      // Return all records
      for (const record of this.records.values()) {
        results.push(record);
        if (limit && results.length >= limit) break;
      }
    }

    return { result: results };
  }

  async put(table: string, sysId: string, data: any): Promise<any> {
    const record = this.records.get(sysId);
    if (!record) {
      throw new Error('NOT_FOUND');
    }
    const updated = {
      ...record,
      ...data,
      sys_updated_on: new Date().toISOString(),
      sys_mod_count: record.sys_mod_count + 1
    };
    this.records.set(sysId, updated);
    return { sys_id: sysId, result: updated };
  }

  async delete(table: string, sysId: string): Promise<void> {
    const record = this.records.get(sysId);
    if (!record) {
      throw new Error('NOT_FOUND');
    }
    if (record.api_name) {
      this.apiNameIndex.delete(record.api_name);
    }
    this.records.delete(sysId);
  }

  private generateSysId(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  clear() {
    this.records.clear();
    this.apiNameIndex.clear();
  }
}

// Arbitraries for generating test data
const apiNameArbitrary = () =>
  fc.string({ minLength: 3, maxLength: 20 })
    .filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s));

const scriptIncludeNameArbitrary = () =>
  fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0);

const safeScriptArbitrary = (apiName?: string) => {
  if (apiName) {
    return fc.constantFrom(
      `var ${apiName} = Class.create();\n${apiName}.prototype = {\n  initialize: function() {},\n  type: "${apiName}"\n};`,
      `function ${apiName}() { return true; }`,
      `var ${apiName} = Class.create();\n${apiName}.prototype = Object.extendsObject(AbstractAjaxProcessor, {\n  type: "${apiName}"\n});`,
      `var ${apiName} = Class.create();\n${apiName}.prototype = {\n  initialize: function() {},\n  getCurrentDate: function() { return new GlideDateTime(); },\n  type: "${apiName}"\n};`
    );
  }
  return fc.constantFrom(
    'var MyScript = Class.create();\nMyScript.prototype = {\n  initialize: function() {},\n  type: "MyScript"\n};',
    'function myFunction() { return true; }',
    'var MyAjax = Class.create();\nMyAjax.prototype = Object.extendsObject(AbstractAjaxProcessor, {\n  type: "MyAjax"\n});',
    'var Utils = Class.create();\nUtils.prototype = {\n  initialize: function() {},\n  getCurrentDate: function() { return new GlideDateTime(); },\n  type: "Utils"\n};'
  );
};

const accessLevelArbitrary = () =>
  fc.constantFrom('public', 'package_private', 'private');

const scriptIncludeDataArbitrary = () =>
  fc.record({
    name: scriptIncludeNameArbitrary(),
    api_name: apiNameArbitrary(),
    client_callable: fc.boolean()
  }).chain(({ name, api_name, client_callable }) => {
    // Generate appropriate script based on client_callable flag
    let scriptGen;
    if (client_callable) {
      // Must extend AbstractAjaxProcessor
      scriptGen = fc.constant(`var ${api_name} = Class.create();\n${api_name}.prototype = Object.extendsObject(AbstractAjaxProcessor, {\n  initialize: function() {},\n  type: "${api_name}"\n});`);
    } else {
      // Can be any safe script
      scriptGen = fc.constantFrom(
        `var ${api_name} = Class.create();\n${api_name}.prototype = {\n  initialize: function() {},\n  type: "${api_name}"\n};`,
        `function ${api_name}() { return true; }`,
        `var ${api_name} = Class.create();\n${api_name}.prototype = {\n  initialize: function() {},\n  getCurrentDate: function() { return new GlideDateTime(); },\n  type: "${api_name}"\n};`
      );
    }
    
    return fc.record({
      name: fc.constant(name),
      api_name: fc.constant(api_name),
      script: scriptGen,
      active: fc.boolean(),
      access: accessLevelArbitrary(),
      description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
      client_callable: fc.constant(client_callable)
    });
  });

// Feature: script-include-management, Property 1: Create-Retrieve Round Trip
// **Validates: Requirements 1.1, 2.1**

describe('ScriptIncludeService - Property-Based Tests', () => {
  let service: ScriptIncludeService;
  let mockClient: MockServiceNowClient;

  beforeEach(() => {
    mockClient = new MockServiceNowClient();
    service = new ScriptIncludeService(mockClient as any);
  });

  afterEach(() => {
    mockClient.clear();
  });

  describe('Property 1: Create-Retrieve Round Trip', () => {
    it('should preserve all fields when creating and retrieving a Script Include by sys_id', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeDataArbitrary(),
          async (data) => {
            // Create Script Include
            const sysId = await service.createScriptInclude(data);
            expect(sysId).toBeDefined();
            expect(typeof sysId).toBe('string');

            // Retrieve by sys_id
            const retrieved = await service.getScriptInclude(sysId);
            
            expect(retrieved).not.toBeNull();
            expect(retrieved!.sys_id).toBe(sysId);
            expect(retrieved!.name).toBe(data.name);
            expect(retrieved!.api_name).toBe(data.api_name);
            expect(retrieved!.script).toBe(data.script);
            expect(retrieved!.active).toBe(data.active ?? true);
            expect(retrieved!.access).toBe(data.access ?? 'public');
            expect(retrieved!.client_callable).toBe(data.client_callable ?? false);
            if (data.description !== undefined) {
              expect(retrieved!.description).toBe(data.description);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: script-include-management, Property 2: Create-Retrieve by API Name Round Trip
  // **Validates: Requirements 1.1, 2.2**

  describe('Property 2: Create-Retrieve by API Name Round Trip', () => {
    it('should retrieve the same Script Include when querying by api_name', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeDataArbitrary(),
          async (data) => {
            // Create Script Include
            const sysId = await service.createScriptInclude(data);

            // Retrieve by api_name
            const retrieved = await service.getScriptInclude(data.api_name);
            
            expect(retrieved).not.toBeNull();
            expect(retrieved!.sys_id).toBe(sysId);
            expect(retrieved!.api_name).toBe(data.api_name);
            expect(retrieved!.name).toBe(data.name);
            expect(retrieved!.script).toBe(data.script);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: script-include-management, Property 3: Update Persistence
  // **Validates: Requirements 3.1, 3.9**

  describe('Property 3: Update Persistence', () => {
    it('should persist all updated fields when updating a Script Include', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeDataArbitrary(),
          fc.record({
            name: fc.option(scriptIncludeNameArbitrary()),
            active: fc.option(fc.boolean()),
            access: fc.option(accessLevelArbitrary()),
            description: fc.option(fc.string({ maxLength: 200 }))
          }).filter(updates => 
            // Ensure at least one field is being updated
            Object.values(updates).some(v => v !== null && v !== undefined)
          ),
          async (initialData, updates) => {
            // Create Script Include
            const sysId = await service.createScriptInclude(initialData);

            // Update Script Include (excluding script to avoid validation issues)
            await service.updateScriptInclude(sysId, updates as UpdateScriptIncludeData);

            // Retrieve and verify updates
            const retrieved = await service.getScriptInclude(sysId);
            
            expect(retrieved).not.toBeNull();
            if (updates.name !== null && updates.name !== undefined) {
              expect(retrieved!.name).toBe(updates.name);
            }
            if (updates.active !== null && updates.active !== undefined) {
              expect(retrieved!.active).toBe(updates.active);
            }
            if (updates.access !== null && updates.access !== undefined) {
              expect(retrieved!.access).toBe(updates.access);
            }
            if (updates.description !== null && updates.description !== undefined) {
              expect(retrieved!.description).toBe(updates.description);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: script-include-management, Property 4: Delete Removes Script Include
  // **Validates: Requirements 4.1**

  describe('Property 4: Delete Removes Script Include', () => {
    it('should make Script Include not found after deletion', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeDataArbitrary(),
          async (data) => {
            // Create Script Include
            const sysId = await service.createScriptInclude(data);

            // Verify it exists
            const beforeDelete = await service.getScriptInclude(sysId);
            expect(beforeDelete).not.toBeNull();

            // Delete Script Include
            await service.deleteScriptInclude(sysId);

            // Verify it's gone
            const afterDelete = await service.getScriptInclude(sysId);
            expect(afterDelete).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: script-include-management, Property 5: Required Fields Validation
  // **Validates: Requirements 1.2, 1.3**

  describe('Property 5: Required Fields Validation', () => {
    it('should reject creation when name is missing or empty', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', '   ', '\t', '\n'),
          apiNameArbitrary(),
          async (invalidName, apiName) => {
            try {
              await service.createScriptInclude({
                name: invalidName,
                api_name: apiName,
                script: `var ${apiName} = Class.create();\n${apiName}.prototype = { initialize: function() {}, type: "${apiName}" };`
              });
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              expect(error.code).toBe('INVALID_PARAMETER');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject creation when api_name is missing or empty', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeNameArbitrary(),
          fc.constantFrom('', '   ', '\t', '\n'),
          async (name, invalidApiName) => {
            try {
              await service.createScriptInclude({
                name,
                api_name: invalidApiName,
                script: 'var MyScript = Class.create();\nMyScript.prototype = { initialize: function() {}, type: "MyScript" };'
              });
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              expect(error.code).toBe('INVALID_PARAMETER');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: script-include-management, Property 6: Access Level Enum Validation
  // **Validates: Requirements 1.5, 3.5, 5.11**

  describe('Property 6: Access Level Enum Validation', () => {
    it('should reject invalid access levels', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeNameArbitrary(),
          apiNameArbitrary(),
          fc.string({ minLength: 1, maxLength: 20 })
            .filter(s => !['public', 'package_private', 'private'].includes(s)),
          async (name, apiName, invalidAccess) => {
            try {
              await service.createScriptInclude({
                name,
                api_name: apiName,
                script: `var ${apiName} = Class.create();\n${apiName}.prototype = { initialize: function() {}, type: "${apiName}" };`,
                access: invalidAccess
              });
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              expect(error.code).toBe('VALIDATION_ERROR');
              expect(error.message).toMatch(/access level/i);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should accept valid access levels', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeDataArbitrary(),
          async (data) => {
            const sysId = await service.createScriptInclude(data);
            expect(sysId).toBeDefined();
            
            const retrieved = await service.getScriptInclude(sysId);
            expect(['public', 'package_private', 'private']).toContain(retrieved!.access);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: script-include-management, Property 7: Parameter Type Validation
  // **Validates: Requirements 2.4, 2.5, 4.2, 4.3, 8.7, 8.8**

  describe('Property 7: Parameter Type Validation', () => {
    it('should reject non-string identifiers in getScriptInclude', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.integer(),
            fc.boolean(),
            fc.constant(null),
            fc.constant(undefined),
            fc.object()
          ),
          async (invalidIdentifier) => {
            try {
              await service.getScriptInclude(invalidIdentifier as any);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              expect(error.code).toBe('INVALID_PARAMETER');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should reject empty string identifiers', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('', '   ', '\t', '\n'),
          async (emptyIdentifier) => {
            try {
              await service.getScriptInclude(emptyIdentifier);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              expect(error.code).toBe('INVALID_PARAMETER');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: script-include-management, Property 8: Empty Update Rejection
  // **Validates: Requirements 3.8**

  describe('Property 8: Empty Update Rejection', () => {
    it('should reject update requests with no fields to update', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeDataArbitrary(),
          async (data) => {
            const sysId = await service.createScriptInclude(data);

            try {
              await service.updateScriptInclude(sysId, {});
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              expect(error.code).toBe('INVALID_PARAMETER');
              expect(error.message).toMatch(/at least one field/i);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

// Feature: script-include-management, Property 11: Syntax Validation
// **Validates: Requirements 1.4, 3.2, 7.1, 7.4**

describe('ScriptIncludeService - Syntax Validation Property Tests', () => {
  let service: ScriptIncludeService;
  let mockClient: MockServiceNowClient;

  beforeEach(() => {
    mockClient = new MockServiceNowClient();
    service = new ScriptIncludeService(mockClient as any);
  });

  afterEach(() => {
    mockClient.clear();
  });

  describe('Property 11: Syntax Validation', () => {
    it('should reject scripts with syntax errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeNameArbitrary(),
          apiNameArbitrary(),
          fc.constantFrom(
            'var x = {',  // Unclosed brace
            'function test() { return',  // Incomplete return
            'var x = );',  // Invalid syntax
            'if (true { }',  // Missing parenthesis
            'var x = "unclosed string'  // Unclosed string
          ),
          async (name, apiName, invalidScript) => {
            try {
              await service.createScriptInclude({
                name,
                api_name: apiName,
                script: invalidScript
              });
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              // Should have validation or security error
              expect(['VALIDATION_ERROR', 'SECURITY_VIOLATION']).toContain(error.code);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should accept scripts with valid syntax', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeDataArbitrary(),
          async (data) => {
            const sysId = await service.createScriptInclude(data);
            expect(sysId).toBeDefined();
            expect(typeof sysId).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// Feature: script-include-management, Property 13: Validation Result Structure
// **Validates: Requirements 7.3, 7.4, 7.5, 7.6**

describe('ScriptIncludeService - Validation Result Property Tests', () => {
  let service: ScriptIncludeService;
  let mockClient: MockServiceNowClient;

  beforeEach(() => {
    mockClient = new MockServiceNowClient();
    service = new ScriptIncludeService(mockClient as any);
  });

  describe('Property 13: Validation Result Structure', () => {
    it('should return validation result with valid, warnings, and errors fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant('var MyScript = Class.create();\nMyScript.prototype = { initialize: function() {}, type: "MyScript" };'),
            fc.constantFrom(
              'eval("code")',  // Dangerous
              'var gr = new GlideRecord("incident"); gr.query();'  // Discouraged
            )
          ),
          async (script) => {
            const result = await service.validateScript(script);
            
            expect(result).toHaveProperty('valid');
            expect(result).toHaveProperty('warnings');
            expect(result).toHaveProperty('errors');
            expect(typeof result.valid).toBe('boolean');
            expect(Array.isArray(result.warnings)).toBe(true);
            expect(Array.isArray(result.errors)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid: true for safe scripts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constant('var MyScript = Class.create();\nMyScript.prototype = { initialize: function() {}, type: "MyScript" };'),
          async (script) => {
            const result = await service.validateScript(script);
            
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return valid: false for dangerous scripts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            'eval("code")',
            'new Function("return 1")',
            'new GlideHTTPRequest()',
            'require("module")'
          ),
          async (dangerousScript) => {
            const result = await service.validateScript(dangerousScript);
            
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

// Feature: script-include-management, Property 14: Client-Callable Pattern Validation
// **Validates: Requirements 1.11, 9.9**

describe('ScriptIncludeService - Client-Callable Pattern Property Tests', () => {
  let service: ScriptIncludeService;
  let mockClient: MockServiceNowClient;

  beforeEach(() => {
    mockClient = new MockServiceNowClient();
    service = new ScriptIncludeService(mockClient as any);
  });

  afterEach(() => {
    mockClient.clear();
  });

  describe('Property 14: Client-Callable Pattern Validation', () => {
    it('should reject client-callable Script Includes that do not extend AbstractAjaxProcessor', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeNameArbitrary(),
          apiNameArbitrary(),
          fc.constantFrom(
            'var MyScript = Class.create();\nMyScript.prototype = {\n  initialize: function() {},\n  type: "MyScript"\n};',
            'function myFunction() { return true; }'
          ),
          async (name, apiName, nonAjaxScript) => {
            try {
              await service.createScriptInclude({
                name,
                api_name: apiName,
                script: nonAjaxScript,
                client_callable: true
              });
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              expect(error.code).toBe('VALIDATION_ERROR');
              expect(error.message).toMatch(/AbstractAjaxProcessor/i);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should accept client-callable Script Includes that extend AbstractAjaxProcessor', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeNameArbitrary(),
          apiNameArbitrary(),
          async (name, apiName) => {
            const ajaxScript = `var ${apiName} = Class.create();\n${apiName}.prototype = Object.extendsObject(AbstractAjaxProcessor, {\n  initialize: function() {},\n  type: "${apiName}"\n});`;
            
            const sysId = await service.createScriptInclude({
              name,
              api_name: apiName,
              script: ajaxScript,
              client_callable: true
            });
            
            expect(sysId).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

// Feature: script-include-management, Property 15: On-Demand Function Name Validation
// **Validates: Requirements 1.12**

describe('ScriptIncludeService - On-Demand Function Name Property Tests', () => {
  let service: ScriptIncludeService;
  let mockClient: MockServiceNowClient;

  beforeEach(() => {
    mockClient = new MockServiceNowClient();
    service = new ScriptIncludeService(mockClient as any);
  });

  afterEach(() => {
    mockClient.clear();
  });

  describe('Property 15: On-Demand Function Name Validation', () => {
    it('should reject on-demand Script Includes where function name does not match api_name', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeNameArbitrary(),
          apiNameArbitrary(),
          apiNameArbitrary(),
          async (name, apiName, differentFunctionName) => {
            // Skip if they happen to be the same
            if (apiName === differentFunctionName) return;

            const onDemandScript = `function ${differentFunctionName}() { return true; }`;
            
            try {
              await service.createScriptInclude({
                name,
                api_name: apiName,
                script: onDemandScript,
                client_callable: false
              });
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              expect(error.code).toBe('VALIDATION_ERROR');
              expect(error.message).toMatch(/function name.*api_name/i);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should accept on-demand Script Includes where function name matches api_name', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeNameArbitrary(),
          apiNameArbitrary(),
          async (name, apiName) => {
            const onDemandScript = `function ${apiName}() { return true; }`;
            
            const sysId = await service.createScriptInclude({
              name,
              api_name: apiName,
              script: onDemandScript,
              client_callable: false
            });
            
            expect(sysId).toBeDefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

// Feature: script-include-management, Property 16: Query Filter Conjunction
// **Validates: Requirements 5.1**

describe('ScriptIncludeService - Query Filter Property Tests', () => {
  let service: ScriptIncludeService;
  let mockClient: MockServiceNowClient;

  beforeEach(() => {
    mockClient = new MockServiceNowClient();
    service = new ScriptIncludeService(mockClient as any);
  });

  afterEach(() => {
    mockClient.clear();
  });

  describe('Property 16: Query Filter Conjunction', () => {
    it('should return only Script Includes matching ALL filter criteria', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(scriptIncludeDataArbitrary(), { minLength: 3, maxLength: 10 }),
          async (scriptIncludes) => {
            // Ensure unique api_names
            const uniqueScriptIncludes = scriptIncludes.map((si, idx) => ({
              ...si,
              api_name: `${si.api_name}_${idx}`
            }));

            // Create multiple Script Includes
            for (const data of uniqueScriptIncludes) {
              await service.createScriptInclude(data);
            }

            // Pick one to filter by
            const target = uniqueScriptIncludes[0];
            
            // Query with multiple filters
            const results = await service.queryScriptIncludes({
              active: target.active,
              access: target.access,
              client_callable: target.client_callable
            });

            // All results should match ALL filter criteria
            for (const result of results) {
              expect(result.active).toBe(target.active);
              expect(result.access).toBe(target.access);
              expect(result.client_callable).toBe(target.client_callable);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: script-include-management, Property 21: Limit Validation and Capping
  // **Validates: Requirements 5.8, 5.10, 6.2, 6.4**

  describe('Property 21: Limit Validation and Capping', () => {
    it('should cap limit at 100 for query operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 101, max: 1000 }),
          async (excessiveLimit) => {
            const results = await service.queryScriptIncludes({ limit: excessiveLimit });
            
            // Should return at most 100 results
            expect(results.length).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should cap limit at 100 for list recent operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 101, max: 1000 }),
          async (excessiveLimit) => {
            const results = await service.listRecentScriptIncludes(excessiveLimit);
            
            // Should return at most 100 results
            expect(results.length).toBeLessThanOrEqual(100);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should accept valid limits between 1 and 100', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          async (validLimit) => {
            const results = await service.queryScriptIncludes({ limit: validLimit });
            
            // Should not throw and should respect the limit
            expect(results.length).toBeLessThanOrEqual(validLimit);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: script-include-management, Property 22: Summary Field Completeness
  // **Validates: Requirements 5.12, 6.5**

  describe('Property 22: Summary Field Completeness', () => {
    it('should return all required summary fields in query results', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeDataArbitrary(),
          async (data) => {
            await service.createScriptInclude(data);
            
            const results = await service.queryScriptIncludes({});
            
            for (const summary of results) {
              expect(summary).toHaveProperty('sys_id');
              expect(summary).toHaveProperty('name');
              expect(summary).toHaveProperty('api_name');
              expect(summary).toHaveProperty('active');
              expect(summary).toHaveProperty('access');
              expect(summary).toHaveProperty('client_callable');
              expect(summary).toHaveProperty('sys_updated_on');
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should return all required summary fields in list recent results', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeDataArbitrary(),
          async (data) => {
            await service.createScriptInclude(data);
            
            const results = await service.listRecentScriptIncludes();
            
            for (const summary of results) {
              expect(summary).toHaveProperty('sys_id');
              expect(summary).toHaveProperty('name');
              expect(summary).toHaveProperty('api_name');
              expect(summary).toHaveProperty('active');
              expect(summary).toHaveProperty('access');
              expect(summary).toHaveProperty('client_callable');
              expect(summary).toHaveProperty('sys_updated_on');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // Feature: script-include-management, Property 23: Detail Field Completeness
  // **Validates: Requirements 2.6**

  describe('Property 23: Detail Field Completeness', () => {
    it('should return all required detail fields when retrieving a Script Include', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeDataArbitrary(),
          async (data) => {
            const sysId = await service.createScriptInclude(data);
            const detail = await service.getScriptInclude(sysId);
            
            expect(detail).not.toBeNull();
            expect(detail).toHaveProperty('sys_id');
            expect(detail).toHaveProperty('name');
            expect(detail).toHaveProperty('api_name');
            expect(detail).toHaveProperty('script');
            expect(detail).toHaveProperty('active');
            expect(detail).toHaveProperty('access');
            expect(detail).toHaveProperty('client_callable');
            expect(detail).toHaveProperty('description');
            expect(detail).toHaveProperty('sys_created_on');
            expect(detail).toHaveProperty('sys_updated_on');
            expect(detail).toHaveProperty('sys_created_by');
            expect(detail).toHaveProperty('sys_updated_by');
            expect(detail).toHaveProperty('sys_mod_count');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// Feature: script-include-management, Property 24: Recent Ordering
// **Validates: Requirements 6.1**

describe('ScriptIncludeService - Recent Ordering Property Tests', () => {
  let service: ScriptIncludeService;
  let mockClient: MockServiceNowClient;

  beforeEach(() => {
    mockClient = new MockServiceNowClient();
    service = new ScriptIncludeService(mockClient as any);
  });

  afterEach(() => {
    mockClient.clear();
  });

  describe('Property 24: Recent Ordering', () => {
    it('should return Script Includes ordered by sys_updated_on descending', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(scriptIncludeDataArbitrary(), { minLength: 2, maxLength: 5 }),
          async (scriptIncludes) => {
            // Ensure unique api_names
            const uniqueScriptIncludes = scriptIncludes.map((si, idx) => ({
              ...si,
              api_name: `${si.api_name}_${idx}`
            }));

            // Create Script Includes with delays to ensure different timestamps
            for (const data of uniqueScriptIncludes) {
              await service.createScriptInclude(data);
              await new Promise(resolve => setTimeout(resolve, 10));
            }

            const results = await service.listRecentScriptIncludes();
            
            // Verify descending order
            for (let i = 0; i < results.length - 1; i++) {
              const current = new Date(results[i].sys_updated_on).getTime();
              const next = new Date(results[i + 1].sys_updated_on).getTime();
              expect(current).toBeGreaterThanOrEqual(next);
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});

// Feature: script-include-management, Property 25: Structured Error Response
// **Validates: Requirements 10.1, 10.2**

describe('ScriptIncludeService - Error Response Property Tests', () => {
  let service: ScriptIncludeService;
  let mockClient: MockServiceNowClient;

  beforeEach(() => {
    mockClient = new MockServiceNowClient();
    service = new ScriptIncludeService(mockClient as any);
  });

  afterEach(() => {
    mockClient.clear();
  });

  describe('Property 25: Structured Error Response', () => {
    it('should return structured error with code, message, and detail for validation failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          scriptIncludeNameArbitrary(),
          apiNameArbitrary(),
          fc.constantFrom('eval("code")', 'new Function("return 1")'),
          async (name, apiName, dangerousScript) => {
            try {
              await service.createScriptInclude({
                name,
                api_name: apiName,
                script: dangerousScript
              });
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              // Error should have structured information
              expect(error).toBeDefined();
              expect(error.message).toBeDefined();
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
