import * as fc from 'fast-check';
import axios from 'axios';
import { ServiceNowClient } from './ServiceNowClient.js';
import { AuthenticationManager } from '../auth/AuthenticationManager.js';
import { ClientConfig, AuthConfig, ScriptExecutionRequest } from '../types/interfaces.js';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Feature: glidequery-development-tools, Property 1: Valid script execution returns results
// **Validates: Requirements 1.1**

describe('ServiceNowClient - Property-Based Tests', () => {
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

  describe('Property 1: Valid script execution returns results', () => {
    it('should return results without errors for any valid GlideQuery script', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate valid GlideQuery scripts
          fc.oneof(
            // Simple count queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
              script: fc.constant('count')
            }).map(({ table, script }) => `new GlideQuery('${table}').${script}()`),
            
            // Select queries with where clauses
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request'),
              field: fc.constantFrom('active', 'state', 'priority'),
              value: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 }))
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).select()`
            ),
            
            // Select with limit
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              limit: fc.integer({ min: 1, max: 100 })
            }).map(({ table, limit }) => 
              `new GlideQuery('${table}').limit(${limit}).select()`
            ),
            
            // SelectOne queries
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field: fc.constantFrom('number', 'sys_id'),
              value: fc.string({ minLength: 1, maxLength: 20 })
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', '${value}').selectOne()`
            ),
            
            // Aggregate queries
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              aggregateType: fc.constantFrom('avg', 'sum', 'min', 'max'),
              field: fc.constantFrom('priority', 'impact', 'urgency')
            }).map(({ table, aggregateType, field }) => 
              `new GlideQuery('${table}').${aggregateType}('${field}')`
            )
          ),
          async (script) => {
            // Create fresh instances for each test iteration
            const testAuthManager = new AuthenticationManager(authConfig);
            const testClient = new ServiceNowClient(clientConfig, testAuthManager);
            
            // Mock successful authentication
            mockedAxios.get.mockResolvedValueOnce({
              status: 200,
              data: { result: [] }
            });
            
            // Mock successful script execution
            const mockResult = {
              result: {
                success: true,
                value: fc.sample(fc.oneof(
                  fc.integer(),
                  fc.array(fc.record({ sys_id: fc.string(), number: fc.string() })),
                  fc.record({ sys_id: fc.string() })
                ), 1)[0],
                logs: ['Execution started', 'Query completed']
              }
            };

            mockedAxios.post.mockResolvedValueOnce({
              status: 200,
              data: mockResult
            });

            await testAuthManager.authenticate();

            const request: ScriptExecutionRequest = { script };
            const result = await testClient.executeScript(request);

            // Property: Valid script execution returns results without errors
            // and the response indicates success
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.executionTime).toBeGreaterThanOrEqual(0);
            expect(result.error).toBeUndefined();
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });

  // Feature: glidequery-development-tools, Property 3: Authentication integration
  // **Validates: Requirements 1.3, 5.2, 6.4**
  describe('Property 3: Authentication integration', () => {
    it('should retrieve authentication headers from AuthenticationManager before making API calls for any script execution', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various script types to test authentication integration
          fc.oneof(
            // Simple queries
            fc.record({
              table: fc.constantFrom('incident', 'problem', 'change_request', 'task', 'sys_user'),
              operation: fc.constantFrom('count', 'select')
            }).map(({ table, operation }) => 
              operation === 'count' 
                ? `new GlideQuery('${table}').count()`
                : `new GlideQuery('${table}').select()`
            ),
            
            // Queries with conditions
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field: fc.constantFrom('active', 'state', 'priority', 'urgency'),
              value: fc.oneof(fc.boolean(), fc.integer({ min: 1, max: 5 }), fc.string({ minLength: 1, maxLength: 10 }))
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).select()`
            ),
            
            // Write operations
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              field: fc.constantFrom('short_description', 'description'),
              value: fc.string({ minLength: 5, maxLength: 50 })
            }).map(({ table, field, value }) => 
              `new GlideQuery('${table}').insert({ ${field}: '${value}' })`
            ),
            
            // Update operations
            fc.record({
              table: fc.constantFrom('incident', 'problem'),
              whereField: fc.constantFrom('number', 'sys_id'),
              whereValue: fc.string({ minLength: 5, maxLength: 20 }),
              updateField: fc.constantFrom('state', 'priority'),
              updateValue: fc.integer({ min: 1, max: 5 })
            }).map(({ table, whereField, whereValue, updateField, updateValue }) => 
              `new GlideQuery('${table}').where('${whereField}', '${whereValue}').update({ ${updateField}: ${updateValue} })`
            )
          ),
          async (script) => {
            // Create fresh instances for each test iteration
            const testAuthManager = new AuthenticationManager(authConfig);
            const testClient = new ServiceNowClient(clientConfig, testAuthManager);
            
            // Spy on getAuthHeaders to verify it's called
            const getAuthHeadersSpy = jest.spyOn(testAuthManager, 'getAuthHeaders');
            
            // Mock successful authentication
            mockedAxios.get.mockResolvedValueOnce({
              status: 200,
              data: { result: [] }
            });
            
            await testAuthManager.authenticate();
            
            // Clear the spy call count from authentication
            getAuthHeadersSpy.mockClear();
            
            // Mock successful script execution
            const mockResult = {
              result: {
                success: true,
                value: fc.sample(fc.oneof(
                  fc.integer(),
                  fc.array(fc.record({ sys_id: fc.string(), number: fc.string() })),
                  fc.record({ sys_id: fc.string() }),
                  fc.constant(null)
                ), 1)[0],
                logs: []
              }
            };

            mockedAxios.post.mockResolvedValueOnce({
              status: 200,
              data: mockResult
            });

            const request: ScriptExecutionRequest = { script };
            await testClient.executeScript(request);

            // Property: For any script execution, the Script_Executor should retrieve 
            // authentication headers from the existing Authentication_Manager before making API calls
            expect(getAuthHeadersSpy).toHaveBeenCalled();
            expect(getAuthHeadersSpy).toHaveBeenCalledTimes(1);
            
            // Verify the headers were actually retrieved and used
            const headers = getAuthHeadersSpy.mock.results[0].value;
            expect(headers).toBeDefined();
            expect(headers).toHaveProperty('Authorization');
            expect(headers.Authorization).toContain('Basic ');
            
            // Verify the POST request was made with the authentication headers
            expect(mockedAxios.post).toHaveBeenCalledWith(
              expect.stringContaining('/api/now/v1/script/execute'),
              expect.objectContaining({ script }),
              expect.objectContaining({
                headers: expect.objectContaining({
                  'Authorization': expect.stringContaining('Basic ')
                })
              })
            );
            
            getAuthHeadersSpy.mockRestore();
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });

    it('should fail when authentication headers are not available', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate simple scripts for testing unauthenticated access
          fc.record({
            table: fc.constantFrom('incident', 'problem', 'change_request'),
            operation: fc.constantFrom('count', 'select')
          }).map(({ table, operation }) => 
            operation === 'count' 
              ? `new GlideQuery('${table}').count()`
              : `new GlideQuery('${table}').select()`
          ),
          async (script) => {
            // Create fresh instances without authenticating
            const testAuthManager = new AuthenticationManager(authConfig);
            const testClient = new ServiceNowClient(clientConfig, testAuthManager);
            
            // Spy on getAuthHeaders to verify it's called even when not authenticated
            const getAuthHeadersSpy = jest.spyOn(testAuthManager, 'getAuthHeaders');
            
            const request: ScriptExecutionRequest = { script };
            
            // Property: Script execution should check authentication before making API calls
            await expect(testClient.executeScript(request)).rejects.toMatchObject({
              code: 'AUTH_ERROR',
              message: expect.stringContaining('Not authenticated')
            });
            
            // Verify getAuthHeaders was called to check authentication status
            expect(getAuthHeadersSpy).toHaveBeenCalled();
            
            // Verify no API call was made since authentication failed
            expect(mockedAxios.post).not.toHaveBeenCalled();
            
            getAuthHeadersSpy.mockRestore();
          }
        ),
        { numRuns: 100 } // Minimum 100 iterations as specified
      );
    });
  });
});
