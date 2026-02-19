/**
 * Widget data models for ServiceNow MCP Server
 * Service Portal widgets are self-contained UI components with HTML, CSS/SCSS, 
 * Client Script (Angular controller), Server Script, Link Function, and Option Schema
 */

/**
 * Summary view of a Widget (used in query/list operations)
 */
export interface WidgetSummary {
  /** System ID (unique identifier) */
  sys_id: string;
  
  /** Display name of the widget */
  name: string;
  
  /** Unique identifier for code (used in widget references) */
  id: string;
  
  /** Whether the widget is publicly available */
  public: boolean;
  
  /** Category sys_id (null if not categorized) */
  category: string | null;
  
  /** Associated ServiceNow table (extends sp_instance when specified) */
  data_table: string | null;
  
  /** Timestamp of last update */
  sys_updated_on: string;
}

/**
 * Detailed view of a Widget (used in get operations)
 */
export interface WidgetDetail extends WidgetSummary {
  /** HTML template with AngularJS directives */
  html: string | null;
  
  /** CSS/SCSS styles (auto-scoped per widget) */
  css: string | null;
  
  /** Angular controller JavaScript (AngularJS 1.5.x) */
  client_script: string | null;
  
  /** Server-side JavaScript with $sp API access */
  server_script: string | null;
  
  /** AngularJS link function for direct DOM manipulation */
  link: string | null;
  
  /** JSON schema defining configurable parameters */
  option_schema: any | null;
  
  /** JSON demo data for testing in Widget Editor */
  demo_data: any | null;
  
  /** Description of the widget's purpose */
  description: string | null;
  
  /** Array of dependency sys_ids (from sp_dependency table) */
  dependencies: string[];
  
  /** Timestamp when widget was created */
  sys_created_on: string;
}

/**
 * Filter parameters for querying Widgets
 */
export interface WidgetFilters {
  /** Partial match, case-insensitive */
  name?: string;
  
  /** Exact match */
  id?: string;
  
  /** Filter by public status */
  public?: boolean;
  
  /** Filter by category sys_id */
  category?: string;
  
  /** Filter by associated table */
  data_table?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Max results (1-100, default 25) */
  limit?: number;
}

/**
 * Data for creating a Widget
 */
export interface CreateWidgetData {
  /** Display name of the widget */
  name: string;
  
  /** Unique identifier for code */
  id: string;
  
  /** HTML template with AngularJS directives (optional) */
  html?: string;
  
  /** CSS/SCSS styles (optional) */
  css?: string;
  
  /** Angular controller JavaScript (optional) */
  client_script?: string;
  
  /** Server-side JavaScript (optional) */
  server_script?: string;
  
  /** AngularJS link function (optional) */
  link?: string;
  
  /** JSON schema for widget configuration (JSON string, optional) */
  option_schema?: string;
  
  /** Associated ServiceNow table (optional) */
  data_table?: string;
  
  /** JSON demo data for testing (JSON string, optional) */
  demo_data?: string;
  
  /** Whether the widget is publicly available (optional) */
  public?: boolean;
  
  /** Category sys_id (optional) */
  category?: string;
  
  /** Description of the widget's purpose (optional) */
  description?: string;
}

/**
 * Data for updating a Widget
 */
export interface UpdateWidgetData {
  /** Display name of the widget */
  name?: string;
  
  /** Unique identifier for code */
  id?: string;
  
  /** HTML template with AngularJS directives */
  html?: string;
  
  /** CSS/SCSS styles */
  css?: string;
  
  /** Angular controller JavaScript */
  client_script?: string;
  
  /** Server-side JavaScript */
  server_script?: string;
  
  /** AngularJS link function */
  link?: string;
  
  /** JSON schema for widget configuration (JSON string) */
  option_schema?: string;
  
  /** Associated ServiceNow table */
  data_table?: string;
  
  /** JSON demo data for testing (JSON string) */
  demo_data?: string;
  
  /** Whether the widget is publicly available */
  public?: boolean;
  
  /** Category sys_id */
  category?: string;
  
  /** Description of the widget's purpose */
  description?: string;
}

/**
 * Data for validating a Widget
 */
export interface ValidateWidgetData {
  /** HTML template to validate */
  html?: string;
  
  /** CSS/SCSS to validate */
  css?: string;
  
  /** Client script to validate */
  client_script?: string;
  
  /** Server script to validate */
  server_script?: string;
  
  /** Link function to validate */
  link?: string;
  
  /** Option schema to validate (JSON string) */
  option_schema?: string;
  
  /** Demo data to validate (JSON string) */
  demo_data?: string;
}

/**
 * Validation message for widget code validation
 */
export interface WidgetValidationMessage {
  /** Type of validation message (e.g., 'security', 'syntax', 'performance') */
  type: string;
  
  /** Field that triggered the validation message */
  field: string;
  
  /** Human-readable message */
  message: string;
  
  /** Additional context or technical details */
  detail: string;
}

/**
 * Widget validation result
 */
export interface WidgetValidationResult {
  /** Whether all validation checks passed */
  valid: boolean;
  
  /** Warning messages (discouraged patterns, performance suggestions) */
  warnings: WidgetValidationMessage[];
  
  /** Error messages (security violations, syntax errors) */
  errors: WidgetValidationMessage[];
}

/**
 * JSON validation result
 */
export interface JSONValidationResult {
  /** Whether the JSON is valid */
  valid: boolean;
  
  /** Error message if JSON is invalid */
  error?: string;
  
  /** Parsed JSON object if valid */
  parsed?: any;
}

/**
 * Widget dependency information
 */
export interface WidgetDependency {
  /** System ID of the dependency */
  sys_id: string;
  
  /** Name of the dependency */
  name: string;
  
  /** Type of dependency (e.g., 'js', 'css', 'widget') */
  type: string;
  
  /** Source URL or reference */
  source: string;
}
