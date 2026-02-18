/**
 * Configuration interfaces for ServiceNow MCP Server
 */

/**
 * Server configuration containing all settings needed to run the MCP server
 */
export interface ServerConfig {
  /** ServiceNow instance URL (e.g., https://dev12345.service-now.com) */
  servicenowUrl: string;
  
  /** ServiceNow username for authentication */
  username: string;
  
  /** ServiceNow password for authentication */
  password: string;
  
  /** Optional logging level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  
  /** Optional GlideQuery-specific configuration */
  glideQuery?: GlideQueryConfig;
}

/**
 * GlideQuery-specific configuration
 */
export interface GlideQueryConfig {
  /** Script execution API endpoint (e.g., /api/now/v1/script/execute or custom endpoint) */
  scriptExecutionEndpoint: string;
  
  /** Default timeout for script execution in milliseconds (default 30000) */
  defaultTimeout: number;
  
  /** Maximum allowed script length in characters (default 10000) */
  maxScriptLength: number;
  
  /** Maximum number of results in test mode (default 100) */
  testModeMaxResults: number;
  
  /** Security configuration for script validation */
  security: SecurityConfig;
}

/**
 * Authentication configuration for ServiceNow
 */
export interface AuthConfig {
  /** ServiceNow instance URL */
  instanceUrl: string;
  
  /** ServiceNow username */
  username: string;
  
  /** ServiceNow password */
  password: string;
}

/**
 * API client configuration
 */
export interface ClientConfig {
  /** ServiceNow instance URL */
  instanceUrl: string;
  
  /** Optional request timeout in milliseconds */
  timeout?: number;
  
  /** Optional maximum number of retry attempts */
  maxRetries?: number;
}

/**
 * Result of authentication attempt
 */
export interface AuthResult {
  /** Whether authentication was successful */
  success: boolean;
  
  /** Error message if authentication failed */
  error?: string;
}

/**
 * Query parameters for ServiceNow Table API requests
 */
export interface QueryParams {
  /** Encoded query string for filtering records */
  sysparm_query?: string;
  
  /** Maximum number of records to return */
  sysparm_limit?: number;
  
  /** Number of records to skip (for pagination) */
  sysparm_offset?: number;
  
  /** Comma-separated list of fields to return */
  sysparm_fields?: string;
  
  /** Whether to return display values instead of actual values */
  sysparm_display_value?: boolean;
}

/**
 * ServiceNow API response structure
 */
export interface ServiceNowResponse {
  /** Array of records returned from the query */
  result: ServiceNowRecord[];
}

/**
 * ServiceNow record structure
 */
export interface ServiceNowRecord {
  /** System ID (unique identifier) */
  sys_id: string;
  
  /** Additional fields (dynamic based on table and query) */
  [key: string]: unknown;
}

/**
 * ServiceNow API error structure
 */
export interface ServiceNowError {
  /** Machine-readable error code */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Optional additional error details */
  detail?: string;
}

/**
 * Script execution request parameters
 */
export interface ScriptExecutionRequest {
  /** Server-side script to execute */
  script: string;
  
  /** Optional timeout in milliseconds (default 30000, max 60000) */
  timeout?: number;
}

/**
 * Script execution result
 */
export interface ScriptExecutionResult {
  /** Whether script execution was successful */
  success: boolean;
  
  /** Result value from script execution (if successful) */
  result?: any;
  
  /** Log messages generated during execution */
  logs?: string[];
  
  /** Error information (if execution failed) */
  error?: {
    /** Error message */
    message: string;
    
    /** Line number where error occurred (if available) */
    line?: number;
    
    /** Error type (e.g., 'ReferenceError', 'SyntaxError') */
    type?: string;
  };
  
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * Execution options for GlideQuery scripts
 */
export interface ExecutionOptions {
  /** Optional timeout in milliseconds */
  timeout?: number;
  
  /** Whether to run in test mode (limits results, adds warnings) */
  testMode?: boolean;
  
  /** Maximum number of results in test mode (default 100) */
  maxResults?: number;
}

/**
 * Formatted execution result for GlideQuery scripts
 */
export interface ExecutionResult {
  /** Whether execution was successful */
  success: boolean;
  
  /** Formatted data from script execution */
  data?: any;
  
  /** Log messages generated during execution */
  logs?: string[];
  
  /** Error message if execution failed */
  error?: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
  
  /** Number of records returned (if applicable) */
  recordCount?: number;
  
  /** Whether results were truncated */
  truncated?: boolean;
}

/**
 * Validation result for GlideQuery scripts
 */
export interface ValidationResult {
  /** Whether the script is valid */
  valid: boolean;
  
  /** Array of validation errors (if any) */
  errors?: Array<{
    /** Error message */
    message: string;
    
    /** Line number where error occurred (if available) */
    line?: number;
  }>;
  
  /** Array of validation warnings (if any) */
  warnings?: string[];
}

/**
 * Security configuration for script validation
 */
export interface SecurityConfig {
  /** Regular expressions for blacklisted patterns */
  blacklistedPatterns: RegExp[];
  
  /** Operations requiring explicit confirmation */
  requireConfirmation: string[];
  
  /** Maximum allowed script length in characters */
  maxScriptLength: number;
}

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  /** Whether the script is safe to execute */
  safe: boolean;
  
  /** Array of security violations (if any) */
  violations?: string[];
  
  /** Array of dangerous operations detected (if any) */
  dangerousOperations?: string[];
}
