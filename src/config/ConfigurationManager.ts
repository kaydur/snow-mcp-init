import { ServerConfig, GlideQueryConfig, SecurityConfig } from '../types/interfaces.js';

/**
 * ConfigurationManager handles loading and validating server configuration
 * from environment variables.
 */
export class ConfigurationManager {
  /**
   * Load configuration from environment variables
   * @returns ServerConfig object with validated configuration
   * @throws Error if required configuration is missing or invalid
   */
  static loadConfig(): ServerConfig {
    const servicenowUrl = process.env.SERVICENOW_INSTANCE_URL;
    const username = process.env.SERVICENOW_USERNAME;
    const password = process.env.SERVICENOW_PASSWORD;
    const logLevel = process.env.LOG_LEVEL as 'debug' | 'info' | 'warn' | 'error' | undefined;

    // Validate required configuration
    if (!servicenowUrl) {
      throw new Error('Missing required configuration: SERVICENOW_INSTANCE_URL environment variable is not set');
    }

    if (!username) {
      throw new Error('Missing required configuration: SERVICENOW_USERNAME environment variable is not set');
    }

    if (!password) {
      throw new Error('Missing required configuration: SERVICENOW_PASSWORD environment variable is not set');
    }

    // Validate URL format
    if (!this.validateUrl(servicenowUrl)) {
      throw new Error(`Invalid ServiceNow URL format: ${servicenowUrl}. URL must be a valid HTTPS URL (e.g., https://instance.service-now.com)`);
    }

    // Validate log level if provided
    if (logLevel && !['debug', 'info', 'warn', 'error'].includes(logLevel)) {
      throw new Error(`Invalid LOG_LEVEL: ${logLevel}. Must be one of: debug, info, warn, error`);
    }

    // Load GlideQuery configuration
    const glideQuery = this.loadGlideQueryConfig();

    return {
      servicenowUrl,
      username,
      password,
      logLevel: logLevel || 'info',
      glideQuery
    };
  }

  /**
   * Load GlideQuery-specific configuration from environment variables
   * @returns GlideQueryConfig object with defaults if not specified
   */
  static loadGlideQueryConfig(): GlideQueryConfig {
    const scriptExecutionEndpoint = process.env.SERVICENOW_SCRIPT_ENDPOINT || '/api/now/v1/script/execute';
    const defaultTimeout = this.parseNumber(process.env.GLIDEQUERY_TIMEOUT, 30000, 1000, 60000);
    const maxScriptLength = this.parseNumber(process.env.GLIDEQUERY_MAX_SCRIPT_LENGTH, 10000, 100, 100000);
    const testModeMaxResults = this.parseNumber(process.env.GLIDEQUERY_TEST_MAX_RESULTS, 100, 1, 1000);

    // Load security configuration
    const security = this.loadSecurityConfig();

    return {
      scriptExecutionEndpoint,
      defaultTimeout,
      maxScriptLength,
      testModeMaxResults,
      security
    };
  }

  /**
   * Load security configuration with default blacklisted patterns
   * @returns SecurityConfig object
   */
  static loadSecurityConfig(): SecurityConfig {
    // Default blacklisted patterns for security
    const blacklistedPatterns = [
      /gs\.executeNow\s*\(/i,
      /gs\.eval\s*\(/i,
      /GlideRecord\s*\(/i,
      /GlideAggregate\s*\(/i,
      /new\s+Packages\./i,
      /java\.io\./i,
      /java\.net\./i,
      /java\.lang\.Runtime/i,
      /XMLHttpRequest/i,
      /fetch\s*\(/i,
    ];

    // Operations requiring confirmation
    const requireConfirmation = [
      'deleteMultiple',
      'updateMultiple',
      'disableWorkflow',
      'disableAutoSysFields',
      'forceUpdate'
    ];

    const maxScriptLength = this.parseNumber(process.env.GLIDEQUERY_MAX_SCRIPT_LENGTH, 10000, 100, 100000);

    return {
      blacklistedPatterns,
      requireConfirmation,
      maxScriptLength
    };
  }

  /**
   * Parse a number from environment variable with validation
   * @param value - String value from environment variable
   * @param defaultValue - Default value if not provided
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns Parsed and validated number
   */
  static parseNumber(value: string | undefined, defaultValue: number, min: number, max: number): number {
    if (!value) {
      return defaultValue;
    }

    const parsed = parseInt(value, 10);
    
    if (isNaN(parsed)) {
      return defaultValue;
    }

    // Clamp to min/max range
    return Math.max(min, Math.min(max, parsed));
  }

  /**
   * Validate ServiceNow URL format
   * @param url - URL to validate
   * @returns true if URL is valid, false otherwise
   */
  static validateUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      
      // Must be HTTPS protocol
      if (parsed.protocol !== 'https:') {
        return false;
      }

      // Must have a hostname
      if (!parsed.hostname) {
        return false;
      }

      // ServiceNow URLs typically end with service-now.com
      // But we'll be lenient and just check for valid hostname format
      const hostnamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
      if (!hostnamePattern.test(parsed.hostname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Test connectivity to ServiceNow instance
   * @param config - Server configuration
   * @returns Promise that resolves to true if connection successful, false otherwise
   */
  static async testConnectivity(config: ServerConfig): Promise<boolean> {
    try {
      // Create basic auth header
      const authString = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      const headers = {
        'Authorization': `Basic ${authString}`,
        'Accept': 'application/json'
      };

      // Test connection by making a simple API call to the table API
      // We'll use a HEAD request to minimize data transfer
      const testUrl = `${config.servicenowUrl}/api/now/table/incident?sysparm_limit=1`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      // Consider 200-299 as success, 401/403 as auth failure (but connection works)
      return response.ok || response.status === 401 || response.status === 403;
    } catch (error) {
      // Network errors, timeouts, etc.
      return false;
    }
  }
}
