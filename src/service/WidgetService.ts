import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { ScriptSecurityValidator } from './ScriptSecurityValidator.js';
import {
  WidgetSummary,
  WidgetDetail,
  WidgetFilters,
  CreateWidgetData,
  UpdateWidgetData,
  ValidateWidgetData,
  WidgetValidationResult,
  WidgetValidationMessage,
  JSONValidationResult,
  WidgetDependency
} from '../types/widget.js';
import { PageSummary } from '../types/page.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * WidgetService provides business logic for Service Portal widget operations
 * 
 * Handles creating, reading, updating, cloning, querying, and validating
 * Service Portal widgets, including comprehensive security validation for
 * HTML, CSS/SCSS, JavaScript, and JSON code.
 */
export class WidgetService {
  private client: ServiceNowClient;
  private securityValidator: ScriptSecurityValidator;

  /**
   * Create a WidgetService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
    this.securityValidator = new ScriptSecurityValidator();
  }

  /**
   * Create a new widget
   * 
   * @param data - Widget creation data
   * @returns Promise resolving to sys_id of created widget
   * @throws Error if validation fails or creation fails
   */
  async createWidget(data: CreateWidgetData): Promise<string> {
    const startTime = Date.now();
    
    try {
      logger.info('create_widget', 'Creating widget', {
        params: { name: data.name, id: data.id }
      });
      
      // Validate required fields
      if (!data.name || data.name.trim().length === 0) {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'Name field is required',
          detail: 'The name field must be provided and non-empty'
        };
      }
      
      if (!data.id || data.id.trim().length === 0) {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'ID field is required',
          detail: 'The id field must be provided and non-empty'
        };
      }
      
      // Validate HTML if provided
      if (data.html) {
        this.validateHTML(data.html);
      }
      
      // Validate CSS if provided
      if (data.css) {
        this.validateCSS(data.css);
      }
      
      // Validate client_script if provided
      if (data.client_script) {
        this.validateJavaScript(data.client_script, 'client_script');
      }
      
      // Validate server_script if provided
      if (data.server_script) {
        this.validateJavaScript(data.server_script, 'server_script');
      }
      
      // Validate demo_data if provided
      if (data.demo_data) {
        this.validateJSON(data.demo_data, 'demo_data');
      }
      
      // Validate option_schema if provided
      if (data.option_schema) {
        this.validateJSON(data.option_schema, 'option_schema');
      }
      
      // Check for duplicate id
      const existing = await this.getWidget(data.id);
      if (existing) {
        throw {
          code: 'DUPLICATE_ERROR',
          message: 'Widget with this ID already exists',
          detail: `A widget with id '${data.id}' already exists`
        };
      }
      
      // Prepare record for creation
      const record: any = {
        name: data.name,
        id: data.id,
        public: data.public !== undefined ? data.public : false
      };
      
      if (data.html) record.html = data.html;
      if (data.css) record.css = data.css;
      if (data.client_script) record.client_script = data.client_script;
      if (data.server_script) record.server_script = data.server_script;
      if (data.link) record.link = data.link;
      if (data.option_schema) record.option_schema = data.option_schema;
      if (data.data_table) record.data_table = data.data_table;
      if (data.demo_data) record.demo_data = data.demo_data;
      if (data.category) record.category = data.category;
      if (data.description) record.description = data.description;
      
      // Create widget
      const response = await this.client.post('sp_widget', record);
      const sysId = response.sys_id;
      
      const duration = Date.now() - startTime;
      logger.info('create_widget', 'Widget created', {
        result: { sys_id: sysId },
        duration
      });
      
      return sysId;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('create_widget', 'Creation failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get a specific widget by sys_id or id
   * 
   * @param identifier - Widget sys_id or id
   * @returns Promise resolving to widget detail or null if not found
   * @throws Error if retrieval fails
   */
  async getWidget(identifier: string): Promise<WidgetDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_widget', 'Retrieving widget', {
        params: { identifier }
      });
      
      // Check if identifier looks like a sys_id (32 character hex string)
      const isSysId = /^[0-9a-f]{32}$/i.test(identifier);
      
      let result: WidgetDetail | null = null;
      
      if (isSysId) {
        // Retrieve by sys_id
        const record = await this.client.getById('sp_widget', identifier);
        result = this.toWidgetDetail(record);
      } else {
        // Search by id
        const response = await this.client.get('sp_widget', {
          sysparm_query: `id=${identifier}`,
          sysparm_limit: 1,
          sysparm_display_value: false
        });
        
        if (response.result.length === 0) {
          result = null;
        } else {
          result = this.toWidgetDetail(response.result[0]);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_widget', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_widget', 'Widget not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_widget', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Update an existing widget
   * 
   * @param sysId - Widget sys_id
   * @param updates - Fields to update
   * @returns Promise resolving to sys_id of updated widget
   * @throws Error if validation fails or update fails
   */
  async updateWidget(sysId: string, updates: UpdateWidgetData): Promise<string> {
    const startTime = Date.now();
    
    try {
      logger.info('update_widget', 'Updating widget', {
        params: { sys_id: sysId, updates: Object.keys(updates) }
      });
      
      // Validate sys_id parameter
      if (!sysId || typeof sysId !== 'string') {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'sys_id parameter is required and must be a string',
          detail: 'Provide a valid sys_id to update'
        };
      }
      
      // Validate at least one update field is provided
      if (Object.keys(updates).length === 0) {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'No update fields provided',
          detail: 'At least one field must be provided for update'
        };
      }
      
      // Validate HTML if being updated
      if (updates.html !== undefined) {
        this.validateHTML(updates.html);
      }
      
      // Validate CSS if being updated
      if (updates.css !== undefined) {
        this.validateCSS(updates.css);
      }
      
      // Validate client_script if being updated
      if (updates.client_script !== undefined) {
        this.validateJavaScript(updates.client_script, 'client_script');
      }
      
      // Validate server_script if being updated
      if (updates.server_script !== undefined) {
        this.validateJavaScript(updates.server_script, 'server_script');
      }
      
      // Validate demo_data if being updated
      if (updates.demo_data !== undefined) {
        this.validateJSON(updates.demo_data, 'demo_data');
      }
      
      // Validate option_schema if being updated
      if (updates.option_schema !== undefined) {
        this.validateJSON(updates.option_schema, 'option_schema');
      }
      
      // Prepare update record
      const record: any = {};
      if (updates.name !== undefined) record.name = updates.name;
      if (updates.id !== undefined) record.id = updates.id;
      if (updates.html !== undefined) record.html = updates.html;
      if (updates.css !== undefined) record.css = updates.css;
      if (updates.client_script !== undefined) record.client_script = updates.client_script;
      if (updates.server_script !== undefined) record.server_script = updates.server_script;
      if (updates.link !== undefined) record.link = updates.link;
      if (updates.option_schema !== undefined) record.option_schema = updates.option_schema;
      if (updates.data_table !== undefined) record.data_table = updates.data_table;
      if (updates.demo_data !== undefined) record.demo_data = updates.demo_data;
      if (updates.public !== undefined) record.public = updates.public;
      if (updates.category !== undefined) record.category = updates.category;
      if (updates.description !== undefined) record.description = updates.description;
      
      // Update widget
      await this.client.put('sp_widget', sysId, record);
      
      const duration = Date.now() - startTime;
      logger.info('update_widget', 'Widget updated', {
        result: { sys_id: sysId },
        duration
      });
      
      return sysId;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, throw with appropriate code
      if (error?.code === 'NOT_FOUND') {
        throw {
          code: 'NOT_FOUND',
          message: 'Widget not found',
          detail: `No widget found with sys_id: ${sysId}`
        };
      }
      
      logger.error('update_widget', 'Update failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Clone an existing widget
   * 
   * @param sourceSysId - Source widget sys_id
   * @param newId - New unique id for the cloned widget
   * @param newName - New name for the cloned widget
   * @returns Promise resolving to sys_id of cloned widget
   * @throws Error if source not found or clone fails
   */
  async cloneWidget(sourceSysId: string, newId: string, newName: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      logger.info('clone_widget', 'Cloning widget', {
        params: { source_sys_id: sourceSysId, new_id: newId, new_name: newName }
      });
      
      // Retrieve source widget
      const sourceWidget = await this.getWidget(sourceSysId);
      if (!sourceWidget) {
        throw {
          code: 'NOT_FOUND',
          message: 'Source widget not found',
          detail: `No widget found with sys_id: ${sourceSysId}`
        };
      }
      
      // Check if new id already exists
      const existing = await this.getWidget(newId);
      if (existing) {
        throw {
          code: 'DUPLICATE_ERROR',
          message: 'Widget with this ID already exists',
          detail: `A widget with id '${newId}' already exists`
        };
      }
      
      // Create cloned widget with all fields from source
      const cloneData: CreateWidgetData = {
        name: newName,
        id: newId,
        html: sourceWidget.html || undefined,
        css: sourceWidget.css || undefined,
        client_script: sourceWidget.client_script || undefined,
        server_script: sourceWidget.server_script || undefined,
        link: sourceWidget.link || undefined,
        option_schema: sourceWidget.option_schema ? JSON.stringify(sourceWidget.option_schema) : undefined,
        data_table: sourceWidget.data_table || undefined,
        demo_data: sourceWidget.demo_data ? JSON.stringify(sourceWidget.demo_data) : undefined,
        public: sourceWidget.public,
        category: sourceWidget.category || undefined,
        description: sourceWidget.description || undefined
      };
      
      const clonedSysId = await this.createWidget(cloneData);
      
      const duration = Date.now() - startTime;
      logger.info('clone_widget', 'Widget cloned', {
        result: { sys_id: clonedSysId },
        duration
      });
      
      return clonedSysId;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('clone_widget', 'Clone failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Query widgets with filters
   * 
   * @param filters - Filter criteria for widgets
   * @returns Promise resolving to array of widget summaries
   * @throws Error if query fails
   */
  async queryWidgets(filters: WidgetFilters = {}): Promise<WidgetSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_widgets', 'Querying widgets', {
        params: { filters }
      });
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('sp_widget', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to widget summaries
      const results = response.result.map(record => this.toWidgetSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_widgets', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_widgets', 'Query failed', {
        error: error,
        duration
      });
      throw error;
    }
  }


  /**
   * List recent widgets ordered by updated timestamp
   * 
   * @param limit - Maximum number of widgets to return (default 25, max 100)
   * @returns Promise resolving to array of widget summaries
   * @throws Error if list operation fails
   */
  async listRecentWidgets(limit: number = 25): Promise<WidgetSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_recent_widgets', 'Listing recent widgets', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by updated_on descending
      const response = await this.client.get('sp_widget', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to widget summaries
      const results = response.result.map(record => this.toWidgetSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_recent_widgets', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_recent_widgets', 'List failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get widget dependencies
   * 
   * @param sysId - Widget sys_id
   * @returns Promise resolving to array of widget dependencies
   * @throws Error if widget not found or retrieval fails
   */
  async getWidgetDependencies(sysId: string): Promise<WidgetDependency[]> {
    const startTime = Date.now();
    
    try {
      logger.info('get_widget_dependencies', 'Retrieving widget dependencies', {
        params: { sys_id: sysId }
      });
      
      // Verify widget exists
      const widget = await this.getWidget(sysId);
      if (!widget) {
        throw {
          code: 'NOT_FOUND',
          message: 'Widget not found',
          detail: `No widget found with sys_id: ${sysId}`
        };
      }
      
      // Query sp_dependency table for this widget
      const response = await this.client.get('sp_dependency', {
        sysparm_query: `sp_widget=${sysId}`,
        sysparm_display_value: false
      });
      
      // Transform results to widget dependencies
      const results: WidgetDependency[] = response.result.map((record: ServiceNowRecord) => ({
        sys_id: record.sys_id,
        name: String(record.name || ''),
        type: String(record.type || ''),
        source: String(record.source || '')
      }));
      
      const duration = Date.now() - startTime;
      logger.info('get_widget_dependencies', 'Dependencies retrieved', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('get_widget_dependencies', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }


  /**
   * Get pages using a specific widget
   * 
   * @param sysId - Widget sys_id
   * @returns Promise resolving to array of page summaries
   * @throws Error if widget not found or retrieval fails
   */
  async getPagesUsingWidget(sysId: string): Promise<PageSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('get_pages_using_widget', 'Retrieving pages using widget', {
        params: { sys_id: sysId }
      });
      
      // Verify widget exists
      const widget = await this.getWidget(sysId);
      if (!widget) {
        throw {
          code: 'NOT_FOUND',
          message: 'Widget not found',
          detail: `No widget found with sys_id: ${sysId}`
        };
      }
      
      // Query sp_instance table for widget instances
      const instanceResponse = await this.client.get('sp_instance', {
        sysparm_query: `widget=${sysId}`,
        sysparm_display_value: false
      });
      
      // Extract unique page sys_ids
      const pageSysIds = new Set<string>();
      for (const instance of instanceResponse.result) {
        if (instance.page) {
          pageSysIds.add(String(instance.page));
        }
      }
      
      // If no pages found, return empty array
      if (pageSysIds.size === 0) {
        const duration = Date.now() - startTime;
        logger.info('get_pages_using_widget', 'No pages found', {
          result: { count: 0 },
          duration
        });
        return [];
      }
      
      // Query sp_page table for page details
      const pageQuery = Array.from(pageSysIds).map(id => `sys_id=${id}`).join('^OR');
      const pageResponse = await this.client.get('sp_page', {
        sysparm_query: pageQuery,
        sysparm_display_value: false
      });
      
      // Transform results to page summaries
      const results: PageSummary[] = pageResponse.result.map((record: ServiceNowRecord) => ({
        sys_id: record.sys_id,
        title: String(record.title || ''),
        id: String(record.id || ''),
        public: Boolean(record.public),
        portal: record.portal ? String(record.portal) : null,
        roles: record.roles ? String(record.roles).split(',') : [],
        sys_updated_on: String(record.sys_updated_on || '')
      }));
      
      // Sort by title
      results.sort((a, b) => a.title.localeCompare(b.title));
      
      const duration = Date.now() - startTime;
      logger.info('get_pages_using_widget', 'Pages retrieved', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('get_pages_using_widget', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }


  /**
   * Validate widget code (HTML, CSS, JavaScript, JSON)
   * 
   * @param data - Widget validation data
   * @returns WidgetValidationResult with valid flag, warnings, and errors
   */
  async validateWidget(data: ValidateWidgetData): Promise<WidgetValidationResult> {
    const startTime = Date.now();
    
    try {
      logger.info('validate_widget', 'Validating widget', {
        params: { fields: Object.keys(data) }
      });
      
      const warnings: WidgetValidationMessage[] = [];
      const errors: WidgetValidationMessage[] = [];
      
      // Validate HTML
      if (data.html) {
        try {
          this.validateHTML(data.html);
          const htmlWarnings = this.validateAngularDirectives(data.html);
          warnings.push(...htmlWarnings);
          const bootstrapWarnings = this.validateBootstrapClasses(data.html);
          warnings.push(...bootstrapWarnings);
          const embeddedWarnings = this.validateEmbeddedWidgets(data.html);
          warnings.push(...embeddedWarnings);
        } catch (error: any) {
          errors.push({
            type: 'security',
            field: 'html',
            message: error.message || 'HTML validation failed',
            detail: error.detail || ''
          });
        }
      }
      
      // Validate CSS
      if (data.css) {
        try {
          this.validateCSS(data.css);
          const scssWarnings = this.validateSCSS(data.css);
          warnings.push(...scssWarnings);
        } catch (error: any) {
          errors.push({
            type: 'security',
            field: 'css',
            message: error.message || 'CSS validation failed',
            detail: error.detail || ''
          });
        }
      }
      
      // Validate client_script
      if (data.client_script) {
        try {
          this.validateJavaScript(data.client_script, 'client_script');
          const clientWarnings = this.validateClientScriptAPIs(data.client_script);
          warnings.push(...clientWarnings);
        } catch (error: any) {
          errors.push({
            type: 'security',
            field: 'client_script',
            message: error.message || 'Client script validation failed',
            detail: error.detail || ''
          });
        }
      }
      
      // Validate server_script
      if (data.server_script) {
        try {
          this.validateJavaScript(data.server_script, 'server_script');
          const serverWarnings = this.validateServerScriptAPIs(data.server_script);
          warnings.push(...serverWarnings);
        } catch (error: any) {
          errors.push({
            type: 'security',
            field: 'server_script',
            message: error.message || 'Server script validation failed',
            detail: error.detail || ''
          });
        }
      }
      
      // Validate link function
      if (data.link) {
        try {
          this.validateLinkFunction(data.link);
        } catch (error: any) {
          errors.push({
            type: 'security',
            field: 'link',
            message: error.message || 'Link function validation failed',
            detail: error.detail || ''
          });
        }
      }
      
      // Validate option_schema
      if (data.option_schema) {
        const schemaResult = this.validateOptionSchema(data.option_schema);
        if (!schemaResult.valid) {
          errors.push({
            type: 'syntax',
            field: 'option_schema',
            message: 'Invalid JSON in option_schema',
            detail: schemaResult.error || ''
          });
        }
      }
      
      // Validate demo_data
      if (data.demo_data) {
        try {
          this.validateJSON(data.demo_data, 'demo_data');
        } catch (error: any) {
          errors.push({
            type: 'syntax',
            field: 'demo_data',
            message: error.message || 'Demo data validation failed',
            detail: error.detail || ''
          });
        }
      }
      
      // Check performance patterns
      if (data.html && data.client_script) {
        const perfWarnings = this.checkPerformancePatterns(data.html, data.client_script);
        warnings.push(...perfWarnings);
      }
      
      const valid = errors.length === 0;
      const duration = Date.now() - startTime;
      
      logger.info('validate_widget', 'Validation completed', {
        result: { valid, errors: errors.length, warnings: warnings.length },
        duration
      });
      
      return { valid, warnings, errors };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('validate_widget', 'Validation failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Validate HTML for dangerous patterns
   * 
   * @param html - HTML template to validate
   * @throws Error if HTML contains dangerous patterns
   */
  private validateHTML(html: string): void {
    const dangerousPatterns = [
      { pattern: /on\w+\s*=/i, message: 'Inline event handlers are not allowed' },
      { pattern: /javascript:/i, message: 'javascript: URLs are not allowed' },
      { pattern: /<script[^>]*>/i, message: 'Script tags in HTML are not allowed' },
      { pattern: /{{.*constructor.*}}/i, message: 'Angular constructor access is not allowed' },
      { pattern: /{{.*__proto__.*}}/i, message: 'Prototype pollution patterns are not allowed' },
      { pattern: /{{.*prototype.*}}/i, message: 'Prototype access is not allowed' }
    ];
    
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(html)) {
        throw {
          code: 'SECURITY_VIOLATION',
          message: 'HTML contains dangerous patterns',
          detail: message
        };
      }
    }
  }


  /**
   * Validate CSS for dangerous patterns
   * 
   * @param css - CSS/SCSS to validate
   * @throws Error if CSS contains dangerous patterns
   */
  private validateCSS(css: string): void {
    const dangerousPatterns = [
      { pattern: /expression\s*\(/i, message: 'CSS expression() is not allowed' },
      { pattern: /behavior\s*:/i, message: 'CSS behavior is not allowed' },
      { pattern: /-moz-binding\s*:/i, message: 'CSS -moz-binding is not allowed' },
      { pattern: /url\s*\(\s*javascript:/i, message: 'javascript: in url() is not allowed' },
      { pattern: /@import\s+/i, message: '@import is not allowed for security reasons' }
    ];
    
    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(css)) {
        throw {
          code: 'SECURITY_VIOLATION',
          message: 'CSS contains dangerous patterns',
          detail: message
        };
      }
    }
  }

  /**
   * Validate JavaScript for dangerous patterns
   * 
   * @param script - JavaScript code to validate
   * @param context - Context (client_script or server_script)
   * @throws Error if JavaScript contains dangerous patterns
   */
  private validateJavaScript(script: string, context: string): void {
    const validationResult = this.securityValidator.validateScriptInclude(script);
    if (!validationResult.valid) {
      throw {
        code: 'SECURITY_VIOLATION',
        message: `${context} contains blacklisted security patterns`,
        detail: validationResult.errors.map(e => e.message).join('; ')
      };
    }
  }

  /**
   * Validate JSON string
   * 
   * @param jsonString - JSON string to validate
   * @param fieldName - Name of the field being validated
   * @throws Error if JSON is invalid
   */
  private validateJSON(jsonString: string, fieldName: string): void {
    try {
      JSON.parse(jsonString);
    } catch (error: any) {
      throw {
        code: 'VALIDATION_ERROR',
        message: `Invalid JSON in ${fieldName}`,
        detail: error.message || 'JSON parsing failed'
      };
    }
  }

  /**
   * Validate link function
   * 
   * @param linkFunction - Link function code to validate
   * @throws Error if link function contains dangerous patterns
   */
  private validateLinkFunction(linkFunction: string): void {
    // Validate as JavaScript
    this.validateJavaScript(linkFunction, 'link');
    
    // Check for proper link function signature
    const signaturePattern = /function\s*\(\s*scope\s*,\s*element\s*,\s*attrs/i;
    if (!signaturePattern.test(linkFunction)) {
      // This is a warning, not an error
      logger.warn('validate_link_function', 'Link function may not follow standard signature');
    }
  }

  /**
   * Validate option schema JSON
   * 
   * @param schema - Option schema JSON string
   * @returns JSONValidationResult
   */
  private validateOptionSchema(schema: string): JSONValidationResult {
    try {
      const parsed = JSON.parse(schema);
      return { valid: true, parsed };
    } catch (error: any) {
      return {
        valid: false,
        error: error.message || 'JSON parsing failed'
      };
    }
  }


  /**
   * Validate SCSS syntax
   * 
   * @param scss - SCSS code to validate
   * @returns Array of validation messages (warnings)
   */
  private validateSCSS(scss: string): WidgetValidationMessage[] {
    const warnings: WidgetValidationMessage[] = [];
    
    // Check for SCSS variables
    const hasVariables = /\$[a-zA-Z_][a-zA-Z0-9_-]*/.test(scss);
    if (hasVariables) {
      warnings.push({
        type: 'info',
        field: 'css',
        message: 'SCSS variables detected',
        detail: 'Ensure SCSS variables are defined in theme or widget'
      });
    }
    
    return warnings;
  }

  /**
   * Validate server script $sp API usage
   * 
   * @param script - Server script to validate
   * @returns Array of validation messages (warnings)
   */
  private validateServerScriptAPIs(script: string): WidgetValidationMessage[] {
    const warnings: WidgetValidationMessage[] = [];
    
    // Check for GlideRecord usage (discouraged)
    if (/new\s+GlideRecord\s*\(/i.test(script)) {
      warnings.push({
        type: 'performance',
        field: 'server_script',
        message: 'GlideRecord usage detected',
        detail: 'Consider using $sp.getRecord() or GlideQuery instead for better performance'
      });
    }
    
    return warnings;
  }

  /**
   * Validate client script spUtil API usage
   * 
   * @param script - Client script to validate
   * @returns Array of validation messages (warnings)
   */
  private validateClientScriptAPIs(script: string): WidgetValidationMessage[] {
    const warnings: WidgetValidationMessage[] = [];
    
    // Check for $scope.$apply usage (discouraged)
    if (/\$scope\.\$apply\s*\(/i.test(script)) {
      warnings.push({
        type: 'performance',
        field: 'client_script',
        message: '$scope.$apply() usage detected',
        detail: 'Manual $scope.$apply() calls are usually unnecessary and can cause digest cycle issues'
      });
    }
    
    // Check for excessive $scope.$watch usage
    const watchMatches = script.match(/\$scope\.\$watch\s*\(/gi);
    if (watchMatches && watchMatches.length > 3) {
      warnings.push({
        type: 'performance',
        field: 'client_script',
        message: 'Excessive $scope.$watch() usage detected',
        detail: `Found ${watchMatches.length} watchers. Consider using one-time bindings (::) where possible`
      });
    }
    
    return warnings;
  }

  /**
   * Validate Angular directives in HTML
   * 
   * @param html - HTML template to validate
   * @returns Array of validation messages (warnings)
   */
  private validateAngularDirectives(html: string): WidgetValidationMessage[] {
    const warnings: WidgetValidationMessage[] = [];
    
    // Check for ng-bind-html without sanitization warning
    if (/ng-bind-html/i.test(html)) {
      warnings.push({
        type: 'security',
        field: 'html',
        message: 'ng-bind-html usage detected',
        detail: 'Ensure ng-bind-html content is properly sanitized to prevent XSS attacks'
      });
    }
    
    return warnings;
  }


  /**
   * Validate Bootstrap classes in HTML
   * 
   * @param html - HTML template to validate
   * @returns Array of validation messages (info)
   */
  private validateBootstrapClasses(html: string): WidgetValidationMessage[] {
    const warnings: WidgetValidationMessage[] = [];
    
    // Check for Bootstrap classes (informational)
    const hasBootstrap = /class="[^"]*\b(container|row|col-|panel|btn|form-control|alert|modal|nav|navbar|dropdown)\b/i.test(html);
    if (hasBootstrap) {
      warnings.push({
        type: 'info',
        field: 'html',
        message: 'Bootstrap 3.3.7 classes detected',
        detail: 'Widget uses Bootstrap framework classes'
      });
    }
    
    return warnings;
  }

  /**
   * Validate embedded widgets in HTML
   * 
   * @param html - HTML template to validate
   * @returns Array of validation messages (warnings)
   */
  private validateEmbeddedWidgets(html: string): WidgetValidationMessage[] {
    const warnings: WidgetValidationMessage[] = [];
    
    // Check for <widget> tag usage
    if (/<widget\s+/i.test(html)) {
      warnings.push({
        type: 'info',
        field: 'html',
        message: 'Embedded widget detected',
        detail: 'Widget embeds other widgets using <widget> tag'
      });
    }
    
    return warnings;
  }

  /**
   * Check performance patterns
   * 
   * @param html - HTML template
   * @param clientScript - Client script
   * @returns Array of validation messages (warnings)
   */
  private checkPerformancePatterns(html: string, clientScript: string): WidgetValidationMessage[] {
    const warnings: WidgetValidationMessage[] = [];
    
    // Check for non-one-time bindings
    const regularBindings = html.match(/{{[^:][^}]*}}/g);
    if (regularBindings && regularBindings.length > 5) {
      warnings.push({
        type: 'performance',
        field: 'html',
        message: 'Multiple regular bindings detected',
        detail: `Found ${regularBindings.length} bindings. Consider using one-time binding ({{::variable}}) for static data`
      });
    }
    
    return warnings;
  }

  /**
   * Build ServiceNow encoded query string from filters
   * 
   * @param filters - Filter criteria
   * @returns Encoded query string
   */
  private buildQuery(filters: WidgetFilters): string {
    const queryParts: string[] = [];
    
    // Add name filter (partial match, case-insensitive)
    if (filters.name) {
      queryParts.push(`nameLIKE${filters.name}`);
    }
    
    // Add id filter (exact match)
    if (filters.id) {
      queryParts.push(`id=${filters.id}`);
    }
    
    // Add public filter
    if (filters.public !== undefined) {
      queryParts.push(`public=${filters.public}`);
    }
    
    // Add category filter
    if (filters.category) {
      queryParts.push(`category=${filters.category}`);
    }
    
    // Add data_table filter
    if (filters.data_table) {
      queryParts.push(`data_table=${filters.data_table}`);
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }


  /**
   * Transform ServiceNow record to WidgetSummary
   * 
   * @param record - ServiceNow record
   * @returns WidgetSummary object
   */
  private toWidgetSummary(record: ServiceNowRecord): WidgetSummary {
    return {
      sys_id: record.sys_id,
      name: String(record.name || ''),
      id: String(record.id || ''),
      public: Boolean(record.public),
      category: record.category ? String(record.category) : null,
      data_table: record.data_table ? String(record.data_table) : null,
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }

  /**
   * Transform ServiceNow record to WidgetDetail
   * 
   * @param record - ServiceNow record
   * @returns WidgetDetail object
   */
  private toWidgetDetail(record: ServiceNowRecord): WidgetDetail {
    // Parse JSON fields
    let option_schema = null;
    if (record.option_schema) {
      try {
        option_schema = JSON.parse(String(record.option_schema));
      } catch (e) {
        option_schema = null;
      }
    }
    
    let demo_data = null;
    if (record.demo_data) {
      try {
        demo_data = JSON.parse(String(record.demo_data));
      } catch (e) {
        demo_data = null;
      }
    }
    
    // Parse dependencies (comma-separated sys_ids)
    let dependencies: string[] = [];
    if (record.dependencies) {
      dependencies = String(record.dependencies).split(',').filter(d => d.trim().length > 0);
    }
    
    return {
      sys_id: record.sys_id,
      name: String(record.name || ''),
      id: String(record.id || ''),
      public: Boolean(record.public),
      category: record.category ? String(record.category) : null,
      data_table: record.data_table ? String(record.data_table) : null,
      html: record.html ? String(record.html) : null,
      css: record.css ? String(record.css) : null,
      client_script: record.client_script ? String(record.client_script) : null,
      server_script: record.server_script ? String(record.server_script) : null,
      link: record.link ? String(record.link) : null,
      option_schema,
      demo_data,
      description: record.description ? String(record.description) : null,
      dependencies,
      sys_created_on: String(record.sys_created_on || ''),
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }
}
