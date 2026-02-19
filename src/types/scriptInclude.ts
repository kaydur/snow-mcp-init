/**
 * Script Include data models for ServiceNow MCP Server
 */

/**
 * Summary view of a Script Include (used in query/list operations)
 */
export interface ScriptIncludeSummary {
  /** System ID (unique identifier) */
  sys_id: string;
  
  /** Display name of the Script Include */
  name: string;
  
  /** Unique API name used in code (e.g., "TaskManager") */
  api_name: string;
  
  /** Whether the Script Include is active */
  active: boolean;
  
  /** Access level: "public", "package_private", or "private" */
  access: string;
  
  /** Whether callable from client-side via GlideAjax */
  client_callable: boolean;
  
  /** Timestamp of last update */
  sys_updated_on: string;
}

/**
 * Detailed view of a Script Include (used in get operations)
 */
export interface ScriptIncludeDetail extends ScriptIncludeSummary {
  /** The JavaScript code */
  script: string;
  
  /** Description of the Script Include's purpose */
  description: string | null;
  
  /** Timestamp when Script Include was created */
  sys_created_on: string;
  
  /** User who created the Script Include */
  sys_created_by: string;
  
  /** User who last updated the Script Include */
  sys_updated_by: string;
  
  /** Number of modifications */
  sys_mod_count: number;
}

/**
 * Filter parameters for querying Script Includes
 */
export interface ScriptIncludeFilters {
  /** Partial match, case-insensitive */
  name?: string;
  
  /** Exact match */
  api_name?: string;
  
  /** Filter by active status */
  active?: boolean;
  
  /** Filter by access level */
  access?: string;
  
  /** Filter by client-callable flag */
  client_callable?: boolean;
  
  /** Custom encoded query */
  query?: string;
  
  /** Max results (1-100, default 25) */
  limit?: number;
}

/**
 * Data for creating a Script Include
 */
export interface CreateScriptIncludeData {
  /** Display name of the Script Include */
  name: string;
  
  /** Unique API name used in code */
  api_name: string;
  
  /** The JavaScript code */
  script: string;
  
  /** Whether the Script Include is active (optional, defaults to true) */
  active?: boolean;
  
  /** Access level (optional, defaults to "public") */
  access?: string;
  
  /** Description of the Script Include's purpose (optional) */
  description?: string;
  
  /** Whether callable from client-side via GlideAjax (optional, defaults to false) */
  client_callable?: boolean;
}

/**
 * Data for updating a Script Include
 */
export interface UpdateScriptIncludeData {
  /** Display name of the Script Include */
  name?: string;
  
  /** Unique API name used in code */
  api_name?: string;
  
  /** The JavaScript code */
  script?: string;
  
  /** Whether the Script Include is active */
  active?: boolean;
  
  /** Access level */
  access?: string;
  
  /** Description of the Script Include's purpose */
  description?: string;
  
  /** Whether callable from client-side via GlideAjax */
  client_callable?: boolean;
}

/**
 * Validation message for script validation
 */
export interface ValidationMessage {
  /** Type of validation message */
  type: string;
  
  /** Human-readable message */
  message: string;
  
  /** Additional context or technical details */
  detail: string;
}

/**
 * Script validation result
 */
export interface ScriptValidationResult {
  /** Whether the script is valid */
  valid: boolean;
  
  /** Warning messages (discouraged patterns) */
  warnings: ValidationMessage[];
  
  /** Error messages (security violations, syntax errors) */
  errors: ValidationMessage[];
}

/**
 * Test method parameters
 */
export interface TestMethodParams {
  /** Name of the method to test */
  method_name: string;
  
  /** Parameters to pass to the method */
  parameters?: Record<string, any>;
  
  /** Parameters to pass to the initialize function */
  initialize_params?: any[];
}

/**
 * Test execution result
 */
export interface TestResult {
  /** Whether the test executed successfully */
  success: boolean;
  
  /** Result returned by the method */
  result?: any;
  
  /** Error message if execution failed */
  error?: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
  
  /** Log messages from execution */
  logs: string[];
}
