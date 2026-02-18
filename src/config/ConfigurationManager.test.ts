import { ConfigurationManager } from './ConfigurationManager.js';

describe('ConfigurationManager', () => {
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

  describe('loadConfig', () => {
    it('should load valid configuration from environment variables', () => {
      process.env.SERVICENOW_INSTANCE_URL = 'https://dev12345.service-now.com';
      process.env.SERVICENOW_USERNAME = 'testuser';
      process.env.SERVICENOW_PASSWORD = 'testpass';
      process.env.LOG_LEVEL = 'debug';

      const config = ConfigurationManager.loadConfig();

      expect(config.servicenowUrl).toBe('https://dev12345.service-now.com');
      expect(config.username).toBe('testuser');
      expect(config.password).toBe('testpass');
      expect(config.logLevel).toBe('debug');
    });

    it('should use default log level when not specified', () => {
      process.env.SERVICENOW_INSTANCE_URL = 'https://dev12345.service-now.com';
      process.env.SERVICENOW_USERNAME = 'testuser';
      process.env.SERVICENOW_PASSWORD = 'testpass';

      const config = ConfigurationManager.loadConfig();

      expect(config.logLevel).toBe('info');
    });

    it('should throw error when SERVICENOW_INSTANCE_URL is missing', () => {
      process.env.SERVICENOW_USERNAME = 'testuser';
      process.env.SERVICENOW_PASSWORD = 'testpass';

      expect(() => ConfigurationManager.loadConfig()).toThrow(
        'Missing required configuration: SERVICENOW_INSTANCE_URL environment variable is not set'
      );
    });

    it('should throw error when SERVICENOW_USERNAME is missing', () => {
      process.env.SERVICENOW_INSTANCE_URL = 'https://dev12345.service-now.com';
      process.env.SERVICENOW_PASSWORD = 'testpass';

      expect(() => ConfigurationManager.loadConfig()).toThrow(
        'Missing required configuration: SERVICENOW_USERNAME environment variable is not set'
      );
    });

    it('should throw error when SERVICENOW_PASSWORD is missing', () => {
      process.env.SERVICENOW_INSTANCE_URL = 'https://dev12345.service-now.com';
      process.env.SERVICENOW_USERNAME = 'testuser';

      expect(() => ConfigurationManager.loadConfig()).toThrow(
        'Missing required configuration: SERVICENOW_PASSWORD environment variable is not set'
      );
    });

    it('should throw error for invalid URL format', () => {
      process.env.SERVICENOW_INSTANCE_URL = 'http://dev12345.service-now.com'; // HTTP not HTTPS
      process.env.SERVICENOW_USERNAME = 'testuser';
      process.env.SERVICENOW_PASSWORD = 'testpass';

      expect(() => ConfigurationManager.loadConfig()).toThrow(
        /Invalid ServiceNow URL format/
      );
    });

    it('should throw error for invalid log level', () => {
      process.env.SERVICENOW_INSTANCE_URL = 'https://dev12345.service-now.com';
      process.env.SERVICENOW_USERNAME = 'testuser';
      process.env.SERVICENOW_PASSWORD = 'testpass';
      process.env.LOG_LEVEL = 'invalid';

      expect(() => ConfigurationManager.loadConfig()).toThrow(
        /Invalid LOG_LEVEL/
      );
    });
  });

  describe('validateUrl', () => {
    it('should accept valid HTTPS URLs', () => {
      expect(ConfigurationManager.validateUrl('https://dev12345.service-now.com')).toBe(true);
      expect(ConfigurationManager.validateUrl('https://instance.service-now.com')).toBe(true);
      expect(ConfigurationManager.validateUrl('https://test.example.com')).toBe(true);
    });

    it('should reject HTTP URLs', () => {
      expect(ConfigurationManager.validateUrl('http://dev12345.service-now.com')).toBe(false);
    });

    it('should reject URLs without protocol', () => {
      expect(ConfigurationManager.validateUrl('dev12345.service-now.com')).toBe(false);
    });

    it('should reject invalid URLs', () => {
      expect(ConfigurationManager.validateUrl('not a url')).toBe(false);
      expect(ConfigurationManager.validateUrl('')).toBe(false);
    });

    it('should reject URLs with invalid hostname format', () => {
      expect(ConfigurationManager.validateUrl('https://-invalid.com')).toBe(false);
      expect(ConfigurationManager.validateUrl('https://invalid-.com')).toBe(false);
    });
  });

  describe('testConnectivity', () => {
    it('should return true for successful connection', async () => {
      const config = {
        servicenowUrl: 'https://dev12345.service-now.com',
        username: 'testuser',
        password: 'testpass',
        logLevel: 'info' as const
      };

      // Mock fetch to simulate successful response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await ConfigurationManager.testConnectivity(config);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/now/table/incident'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic ')
          })
        })
      );
    });

    it('should return true for auth errors (connection works but auth fails)', async () => {
      const config = {
        servicenowUrl: 'https://dev12345.service-now.com',
        username: 'testuser',
        password: 'wrongpass',
        logLevel: 'info' as const
      };

      // Mock fetch to simulate auth failure
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401
      });

      const result = await ConfigurationManager.testConnectivity(config);

      expect(result).toBe(true); // Connection works, just auth failed
    });

    it('should return false for network errors', async () => {
      const config = {
        servicenowUrl: 'https://dev12345.service-now.com',
        username: 'testuser',
        password: 'testpass',
        logLevel: 'info' as const
      };

      // Mock fetch to simulate network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await ConfigurationManager.testConnectivity(config);

      expect(result).toBe(false);
    });
  });

  describe('loadGlideQueryConfig', () => {
    it('should load GlideQuery configuration with default values', () => {
      const config = ConfigurationManager.loadGlideQueryConfig();

      expect(config.scriptExecutionEndpoint).toBe('/api/now/v1/script/execute');
      expect(config.defaultTimeout).toBe(30000);
      expect(config.maxScriptLength).toBe(10000);
      expect(config.testModeMaxResults).toBe(100);
      expect(config.security).toBeDefined();
      expect(config.security.blacklistedPatterns).toBeInstanceOf(Array);
      expect(config.security.requireConfirmation).toBeInstanceOf(Array);
    });

    it('should use custom script execution endpoint when provided', () => {
      process.env.SERVICENOW_SCRIPT_ENDPOINT = '/api/custom/glidequery/execute';

      const config = ConfigurationManager.loadGlideQueryConfig();

      expect(config.scriptExecutionEndpoint).toBe('/api/custom/glidequery/execute');
    });

    it('should use custom timeout when provided', () => {
      process.env.GLIDEQUERY_TIMEOUT = '45000';

      const config = ConfigurationManager.loadGlideQueryConfig();

      expect(config.defaultTimeout).toBe(45000);
    });

    it('should use custom max script length when provided', () => {
      process.env.GLIDEQUERY_MAX_SCRIPT_LENGTH = '20000';

      const config = ConfigurationManager.loadGlideQueryConfig();

      expect(config.maxScriptLength).toBe(20000);
    });

    it('should use custom test mode max results when provided', () => {
      process.env.GLIDEQUERY_TEST_MAX_RESULTS = '50';

      const config = ConfigurationManager.loadGlideQueryConfig();

      expect(config.testModeMaxResults).toBe(50);
    });

    it('should clamp timeout to minimum value', () => {
      process.env.GLIDEQUERY_TIMEOUT = '500'; // Below minimum of 1000

      const config = ConfigurationManager.loadGlideQueryConfig();

      expect(config.defaultTimeout).toBe(1000);
    });

    it('should clamp timeout to maximum value', () => {
      process.env.GLIDEQUERY_TIMEOUT = '90000'; // Above maximum of 60000

      const config = ConfigurationManager.loadGlideQueryConfig();

      expect(config.defaultTimeout).toBe(60000);
    });

    it('should use default timeout for invalid values', () => {
      process.env.GLIDEQUERY_TIMEOUT = 'invalid';

      const config = ConfigurationManager.loadGlideQueryConfig();

      expect(config.defaultTimeout).toBe(30000);
    });
  });

  describe('loadSecurityConfig', () => {
    it('should load security configuration with blacklisted patterns', () => {
      const config = ConfigurationManager.loadSecurityConfig();

      expect(config.blacklistedPatterns).toBeInstanceOf(Array);
      expect(config.blacklistedPatterns.length).toBeGreaterThan(0);
      
      // Verify some key blacklisted patterns
      const patterns = config.blacklistedPatterns.map(p => p.source);
      expect(patterns.some(p => p.includes('gs\\.executeNow'))).toBe(true);
      expect(patterns.some(p => p.includes('gs\\.eval'))).toBe(true);
      expect(patterns.some(p => p.includes('GlideRecord'))).toBe(true);
    });

    it('should include operations requiring confirmation', () => {
      const config = ConfigurationManager.loadSecurityConfig();

      expect(config.requireConfirmation).toContain('deleteMultiple');
      expect(config.requireConfirmation).toContain('updateMultiple');
      expect(config.requireConfirmation).toContain('disableWorkflow');
    });

    it('should set max script length', () => {
      const config = ConfigurationManager.loadSecurityConfig();

      expect(config.maxScriptLength).toBe(10000);
    });
  });

  describe('parseNumber', () => {
    it('should return default value when input is undefined', () => {
      const result = ConfigurationManager.parseNumber(undefined, 100, 1, 1000);
      expect(result).toBe(100);
    });

    it('should parse valid number string', () => {
      const result = ConfigurationManager.parseNumber('500', 100, 1, 1000);
      expect(result).toBe(500);
    });

    it('should clamp to minimum value', () => {
      const result = ConfigurationManager.parseNumber('0', 100, 10, 1000);
      expect(result).toBe(10);
    });

    it('should clamp to maximum value', () => {
      const result = ConfigurationManager.parseNumber('2000', 100, 1, 1000);
      expect(result).toBe(1000);
    });

    it('should return default for invalid number string', () => {
      const result = ConfigurationManager.parseNumber('invalid', 100, 1, 1000);
      expect(result).toBe(100);
    });

    it('should return default for empty string', () => {
      const result = ConfigurationManager.parseNumber('', 100, 1, 1000);
      expect(result).toBe(100);
    });
  });

  describe('endpoint configuration error handling', () => {
    /**
     * Test configuration error when endpoint not available
     * Validates: Requirements 6.2
     */
    it('should use default endpoint when environment variable is empty', () => {
      process.env.SERVICENOW_SCRIPT_ENDPOINT = '';

      const config = ConfigurationManager.loadGlideQueryConfig();

      // Empty endpoint should fall back to default
      expect(config.scriptExecutionEndpoint).toBe('/api/now/v1/script/execute');
    });

    it('should integrate GlideQuery config into ServerConfig', () => {
      process.env.SERVICENOW_INSTANCE_URL = 'https://dev12345.service-now.com';
      process.env.SERVICENOW_USERNAME = 'testuser';
      process.env.SERVICENOW_PASSWORD = 'testpass';
      process.env.SERVICENOW_SCRIPT_ENDPOINT = '/api/custom/endpoint';
      process.env.GLIDEQUERY_TIMEOUT = '25000';

      const config = ConfigurationManager.loadConfig();

      expect(config.glideQuery).toBeDefined();
      expect(config.glideQuery?.scriptExecutionEndpoint).toBe('/api/custom/endpoint');
      expect(config.glideQuery?.defaultTimeout).toBe(25000);
    });
  });
});
