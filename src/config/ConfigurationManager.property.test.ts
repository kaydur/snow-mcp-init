import * as fc from 'fast-check';
import { ConfigurationManager } from './ConfigurationManager.js';

// Feature: glidequery-development-tools, Property 7: Configuration integration
describe('ConfigurationManager - Property Tests', () => {
  // Store original env vars
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Property 7: Configuration integration', () => {
    /**
     * **Validates: Requirements 5.3**
     * 
     * For any operation requiring configuration values (timeout, endpoint URL, security settings),
     * the values should be retrieved from the existing ConfigurationManager.
     */
    it('should load GlideQuery configuration from environment variables with defaults', () => {
      fc.assert(
        fc.property(
          fc.record({
            servicenowUrl: fc.constant('https://dev12345.service-now.com'),
            username: fc.constant('testuser'),
            password: fc.constant('testpass'),
            scriptEndpoint: fc.option(fc.string(), { nil: undefined }),
            timeout: fc.option(fc.integer({ min: 1000, max: 60000 }), { nil: undefined }),
            maxScriptLength: fc.option(fc.integer({ min: 100, max: 100000 }), { nil: undefined }),
            testMaxResults: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined })
          }),
          (envVars) => {
            // Set required environment variables
            process.env.SERVICENOW_INSTANCE_URL = envVars.servicenowUrl;
            process.env.SERVICENOW_USERNAME = envVars.username;
            process.env.SERVICENOW_PASSWORD = envVars.password;

            // Set optional GlideQuery environment variables
            if (envVars.scriptEndpoint !== undefined) {
              process.env.SERVICENOW_SCRIPT_ENDPOINT = envVars.scriptEndpoint;
            } else {
              delete process.env.SERVICENOW_SCRIPT_ENDPOINT;
            }

            if (envVars.timeout !== undefined) {
              process.env.GLIDEQUERY_TIMEOUT = envVars.timeout.toString();
            } else {
              delete process.env.GLIDEQUERY_TIMEOUT;
            }

            if (envVars.maxScriptLength !== undefined) {
              process.env.GLIDEQUERY_MAX_SCRIPT_LENGTH = envVars.maxScriptLength.toString();
            } else {
              delete process.env.GLIDEQUERY_MAX_SCRIPT_LENGTH;
            }

            if (envVars.testMaxResults !== undefined) {
              process.env.GLIDEQUERY_TEST_MAX_RESULTS = envVars.testMaxResults.toString();
            } else {
              delete process.env.GLIDEQUERY_TEST_MAX_RESULTS;
            }

            // Load configuration
            const config = ConfigurationManager.loadConfig();

            // Verify GlideQuery configuration is present
            expect(config.glideQuery).toBeDefined();
            
            if (config.glideQuery) {
              // Verify script execution endpoint
              if (envVars.scriptEndpoint !== undefined && envVars.scriptEndpoint !== '') {
                expect(config.glideQuery.scriptExecutionEndpoint).toBe(envVars.scriptEndpoint);
              } else {
                // Should use default
                expect(config.glideQuery.scriptExecutionEndpoint).toBe('/api/now/v1/script/execute');
              }

              // Verify timeout
              if (envVars.timeout !== undefined) {
                expect(config.glideQuery.defaultTimeout).toBe(envVars.timeout);
              } else {
                // Should use default
                expect(config.glideQuery.defaultTimeout).toBe(30000);
              }

              // Verify max script length
              if (envVars.maxScriptLength !== undefined) {
                expect(config.glideQuery.maxScriptLength).toBe(envVars.maxScriptLength);
              } else {
                // Should use default
                expect(config.glideQuery.maxScriptLength).toBe(10000);
              }

              // Verify test mode max results
              if (envVars.testMaxResults !== undefined) {
                expect(config.glideQuery.testModeMaxResults).toBe(envVars.testMaxResults);
              } else {
                // Should use default
                expect(config.glideQuery.testModeMaxResults).toBe(100);
              }

              // Verify security configuration is present
              expect(config.glideQuery.security).toBeDefined();
              expect(config.glideQuery.security.blacklistedPatterns).toBeInstanceOf(Array);
              expect(config.glideQuery.security.blacklistedPatterns.length).toBeGreaterThan(0);
              expect(config.glideQuery.security.requireConfirmation).toBeInstanceOf(Array);
              expect(config.glideQuery.security.maxScriptLength).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should clamp configuration values to valid ranges', () => {
      fc.assert(
        fc.property(
          fc.record({
            timeout: fc.integer({ min: -1000, max: 100000 }), // Include invalid values
            maxScriptLength: fc.integer({ min: -100, max: 200000 }),
            testMaxResults: fc.integer({ min: -10, max: 2000 })
          }),
          (envVars) => {
            // Set required environment variables
            process.env.SERVICENOW_INSTANCE_URL = 'https://dev12345.service-now.com';
            process.env.SERVICENOW_USERNAME = 'testuser';
            process.env.SERVICENOW_PASSWORD = 'testpass';

            // Set GlideQuery environment variables with potentially invalid values
            process.env.GLIDEQUERY_TIMEOUT = envVars.timeout.toString();
            process.env.GLIDEQUERY_MAX_SCRIPT_LENGTH = envVars.maxScriptLength.toString();
            process.env.GLIDEQUERY_TEST_MAX_RESULTS = envVars.testMaxResults.toString();

            // Load configuration
            const config = ConfigurationManager.loadConfig();

            // Verify values are clamped to valid ranges
            expect(config.glideQuery).toBeDefined();
            
            if (config.glideQuery) {
              // Timeout should be between 1000 and 60000
              expect(config.glideQuery.defaultTimeout).toBeGreaterThanOrEqual(1000);
              expect(config.glideQuery.defaultTimeout).toBeLessThanOrEqual(60000);

              // Max script length should be between 100 and 100000
              expect(config.glideQuery.maxScriptLength).toBeGreaterThanOrEqual(100);
              expect(config.glideQuery.maxScriptLength).toBeLessThanOrEqual(100000);

              // Test max results should be between 1 and 1000
              expect(config.glideQuery.testModeMaxResults).toBeGreaterThanOrEqual(1);
              expect(config.glideQuery.testModeMaxResults).toBeLessThanOrEqual(1000);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle invalid numeric values gracefully', () => {
      fc.assert(
        fc.property(
          fc.record({
            timeout: fc.oneof(fc.constant('invalid'), fc.constant('NaN'), fc.constant('')),
            maxScriptLength: fc.oneof(fc.constant('abc'), fc.constant(''), fc.constant('null')),
            testMaxResults: fc.oneof(fc.constant('undefined'), fc.constant(''), fc.constant('xyz'))
          }),
          (envVars) => {
            // Set required environment variables
            process.env.SERVICENOW_INSTANCE_URL = 'https://dev12345.service-now.com';
            process.env.SERVICENOW_USERNAME = 'testuser';
            process.env.SERVICENOW_PASSWORD = 'testpass';

            // Set GlideQuery environment variables with invalid values
            process.env.GLIDEQUERY_TIMEOUT = envVars.timeout;
            process.env.GLIDEQUERY_MAX_SCRIPT_LENGTH = envVars.maxScriptLength;
            process.env.GLIDEQUERY_TEST_MAX_RESULTS = envVars.testMaxResults;

            // Load configuration - should not throw
            const config = ConfigurationManager.loadConfig();

            // Verify default values are used for invalid inputs
            expect(config.glideQuery).toBeDefined();
            
            if (config.glideQuery) {
              expect(config.glideQuery.defaultTimeout).toBe(30000);
              expect(config.glideQuery.maxScriptLength).toBe(10000);
              expect(config.glideQuery.testModeMaxResults).toBe(100);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
