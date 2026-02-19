import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { ScriptSecurityValidator } from './ScriptSecurityValidator.js';
import {
  ScriptIncludeSummary,
  ScriptIncludeDetail,
  ScriptIncludeFilters,
  CreateScriptIncludeData,
  UpdateScriptIncludeData,
  ScriptValidationResult,
  TestMethodParams,
  TestResult
} from '../types/scriptInclude.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * ScriptIncludeService provides business logic for Script Include operations
 * 
 * Handles creating, reading, updating, deleting, querying, validating, and testing
 * Script Includes in ServiceNow, including security validation and pattern checking.
 */
export class ScriptIncludeService {
  private client: ServiceNowClient;
  private securityValidator: ScriptSecurityValidator;

  /**
   * Create a ScriptIncludeService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
    this.securityValidator = new ScriptSecurityValidator();
  }

  /**
   * Create a new Script Include
   * 
   * @param data - Script Include creation data
   * @returns Promise resolving to sys_id of created Script Include
   * @throws Error if validation fails or creation fails
   */
  async createScriptInclude(data: CreateScriptIncludeData): Promise<string> {
    const startTime = Date.now();
    
    try {
      logger.info('create_script_include', 'Creating Script Include', {
        params: { name: data.name, api_name: data.api_name }
      });
      
      // Validate required fields
      if (!data.name || data.name.trim().length === 0) {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'Name field is required',
          detail: 'The name field must be provided and non-empty'
        };
      }
      
      if (!data.api_name || data.api_name.trim().length === 0) {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'API name field is required',
          detail: 'The api_name field must be provided and non-empty'
        };
      }
      
      if (!data.script || data.script.trim().length === 0) {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'Script field is required',
          detail: 'The script field must be provided and non-empty'
        };
      }
      
      // Validate access level if provided
      if (data.access) {
        this.validateAccessLevel(data.access);
      }
      
      // Validate script for security issues
      const validationResult = this.securityValidator.validateScriptInclude(data.script);
      if (!validationResult.valid) {
        throw {
          code: 'SECURITY_VIOLATION',
          message: 'Script contains blacklisted security patterns',
          detail: validationResult.errors.map(e => e.message).join('; ')
        };
      }
      
      // Validate Script Include pattern
      this.validateScriptIncludePattern(data);
      
      // Check for duplicate api_name
      const existing = await this.getScriptInclude(data.api_name);
      if (existing) {
        throw {
          code: 'DUPLICATE_ERROR',
          message: 'Script Include with this API name already exists',
          detail: `A Script Include with api_name '${data.api_name}' already exists`
        };
      }
      
      // Prepare record for creation
      const record: any = {
        name: data.name,
        api_name: data.api_name,
        script: data.script,
        active: data.active !== undefined ? data.active : true,
        access: data.access || 'public',
        client_callable: data.client_callable || false
      };
      
      if (data.description) {
        record.description = data.description;
      }
      
      // Create Script Include
      const response = await this.client.post('sys_script_include', record);
      const sysId = response.sys_id;
      
      const duration = Date.now() - startTime;
      logger.info('create_script_include', 'Script Include created', {
        result: { sys_id: sysId },
        duration
      });
      
      return sysId;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('create_script_include', 'Creation failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get a specific Script Include by sys_id or api_name
   * 
   * @param identifier - Script Include sys_id or api_name
   * @returns Promise resolving to Script Include detail or null if not found
   * @throws Error if retrieval fails
   */
  async getScriptInclude(identifier: string): Promise<ScriptIncludeDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_script_include', 'Retrieving Script Include', {
        params: { identifier }
      });
      
      // Check if identifier looks like a sys_id (32 character hex string)
      const isSysId = /^[0-9a-f]{32}$/i.test(identifier);
      
      let result: ScriptIncludeDetail | null = null;
      
      if (isSysId) {
        // Retrieve by sys_id
        const record = await this.client.getById('sys_script_include', identifier);
        result = this.toScriptIncludeDetail(record);
      } else {
        // Search by api_name
        const response = await this.client.get('sys_script_include', {
          sysparm_query: `api_name=${identifier}`,
          sysparm_limit: 1,
          sysparm_display_value: false
        });
        
        if (response.result.length === 0) {
          result = null;
        } else {
          result = this.toScriptIncludeDetail(response.result[0]);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_script_include', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_script_include', 'Script Include not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_script_include', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Update an existing Script Include
   * 
   * @param sysId - Script Include sys_id
   * @param updates - Fields to update
   * @returns Promise resolving to sys_id of updated Script Include
   * @throws Error if validation fails or update fails
   */
  async updateScriptInclude(sysId: string, updates: UpdateScriptIncludeData): Promise<string> {
    const startTime = Date.now();
    
    try {
      logger.info('update_script_include', 'Updating Script Include', {
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
      
      // Validate script if being updated
      if (updates.script) {
        const validationResult = this.securityValidator.validateScriptInclude(updates.script);
        if (!validationResult.valid) {
          throw {
            code: 'SECURITY_VIOLATION',
            message: 'Script contains blacklisted security patterns',
            detail: validationResult.errors.map(e => e.message).join('; ')
          };
        }
      }
      
      // Validate access level if being updated
      if (updates.access) {
        this.validateAccessLevel(updates.access);
      }
      
      // Prepare update record
      const record: any = {};
      if (updates.name !== undefined) record.name = updates.name;
      if (updates.api_name !== undefined) record.api_name = updates.api_name;
      if (updates.script !== undefined) record.script = updates.script;
      if (updates.active !== undefined) record.active = updates.active;
      if (updates.access !== undefined) record.access = updates.access;
      if (updates.description !== undefined) record.description = updates.description;
      if (updates.client_callable !== undefined) record.client_callable = updates.client_callable;
      
      // Update Script Include
      await this.client.put('sys_script_include', sysId, record);
      
      const duration = Date.now() - startTime;
      logger.info('update_script_include', 'Script Include updated', {
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
          message: 'Script Include not found',
          detail: `No Script Include found with sys_id: ${sysId}`
        };
      }
      
      logger.error('update_script_include', 'Update failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Delete a Script Include
   * 
   * @param sysId - Script Include sys_id
   * @returns Promise resolving when deletion is complete
   * @throws Error if deletion fails
   */
  async deleteScriptInclude(sysId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info('delete_script_include', 'Deleting Script Include', {
        params: { sys_id: sysId }
      });
      
      // Validate sys_id parameter
      if (!sysId || typeof sysId !== 'string') {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'sys_id parameter is required and must be a string',
          detail: 'Provide a valid sys_id to delete'
        };
      }
      
      // Delete Script Include
      await this.client.delete('sys_script_include', sysId);
      
      const duration = Date.now() - startTime;
      logger.info('delete_script_include', 'Script Include deleted', {
        result: { success: true },
        duration
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, throw with appropriate code
      if (error?.code === 'NOT_FOUND') {
        throw {
          code: 'NOT_FOUND',
          message: 'Script Include not found',
          detail: `No Script Include found with sys_id: ${sysId}`
        };
      }
      
      logger.error('delete_script_include', 'Deletion failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Query Script Includes with filters
   * 
   * @param filters - Filter criteria for Script Includes
   * @returns Promise resolving to array of Script Include summaries
   * @throws Error if query fails
   */
  async queryScriptIncludes(filters: ScriptIncludeFilters = {}): Promise<ScriptIncludeSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_script_includes', 'Querying Script Includes', {
        params: { filters }
      });
      
      // Validate access level filter if provided
      if (filters.access) {
        this.validateAccessLevel(filters.access);
      }
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('sys_script_include', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to Script Include summaries
      const results = response.result.map(record => this.toScriptIncludeSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_script_includes', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_script_includes', 'Query failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * List recent Script Includes ordered by updated timestamp
   * 
   * @param limit - Maximum number of Script Includes to return (default 25, max 100)
   * @returns Promise resolving to array of Script Include summaries
   * @throws Error if list operation fails
   */
  async listRecentScriptIncludes(limit: number = 25): Promise<ScriptIncludeSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_recent_script_includes', 'Listing recent Script Includes', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by updated_on descending
      const response = await this.client.get('sys_script_include', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to Script Include summaries
      const results = response.result.map(record => this.toScriptIncludeSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_recent_script_includes', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_recent_script_includes', 'List failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Validate Script Include JavaScript code
   * 
   * @param script - JavaScript code to validate
   * @returns ScriptValidationResult with valid flag, warnings, and errors
   */
  async validateScript(script: string): Promise<ScriptValidationResult> {
    const startTime = Date.now();
    
    try {
      logger.info('validate_script_include', 'Validating script', {
        params: { script_length: script.length }
      });
      
      const result = this.securityValidator.validateScriptInclude(script);
      
      const duration = Date.now() - startTime;
      logger.info('validate_script_include', 'Validation completed', {
        result: { valid: result.valid, errors: result.errors.length, warnings: result.warnings.length },
        duration
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('validate_script_include', 'Validation failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Test a Script Include method
   * 
   * @param sysId - Script Include sys_id
   * @param methodName - Name of the method to test
   * @param params - Test parameters
   * @returns Promise resolving to test result
   * @throws Error if test fails
   */
  async testScriptInclude(sysId: string, methodName: string, params: TestMethodParams): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      logger.info('test_script_include', 'Testing Script Include method', {
        params: { sys_id: sysId, method_name: methodName }
      });
      
      // Validate parameters
      if (!sysId || typeof sysId !== 'string') {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'sys_id parameter is required and must be a string',
          detail: 'Provide a valid sys_id to test'
        };
      }
      
      if (!methodName || typeof methodName !== 'string') {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'method_name parameter is required and must be a string',
          detail: 'Provide a valid method name to test'
        };
      }
      
      // Retrieve Script Include
      const scriptInclude = await this.getScriptInclude(sysId);
      if (!scriptInclude) {
        throw {
          code: 'NOT_FOUND',
          message: 'Script Include not found',
          detail: `No Script Include found with sys_id: ${sysId}`
        };
      }
      
      // Check if method exists in script
      const methodPattern = new RegExp(`\\b${methodName}\\s*:\\s*function`, 'i');
      if (!methodPattern.test(scriptInclude.script)) {
        throw {
          code: 'METHOD_NOT_FOUND',
          message: 'Method not found in Script Include',
          detail: `Method '${methodName}' does not exist in Script Include '${scriptInclude.api_name}'`
        };
      }
      
      // TODO: Actual execution requires ServiceNow scripting API
      // For now, return a placeholder result
      const duration = Date.now() - startTime;
      logger.info('test_script_include', 'Test completed (placeholder)', {
        result: { success: true },
        duration
      });
      
      return {
        success: true,
        result: 'Test execution not yet implemented - requires ServiceNow scripting API',
        executionTime: duration,
        logs: []
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('test_script_include', 'Test failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Validate Script Include pattern based on type
   * 
   * @param data - Script Include creation data
   * @throws Error if pattern validation fails
   */
  private validateScriptIncludePattern(data: CreateScriptIncludeData): void {
    // If client_callable is true, validate that script extends AbstractAjaxProcessor
    if (data.client_callable) {
      if (!data.script.includes('AbstractAjaxProcessor')) {
        throw {
          code: 'VALIDATION_ERROR',
          message: 'Client-callable Script Include must extend AbstractAjaxProcessor',
          detail: 'Script Includes with client_callable=true must use Object.extendsObject(AbstractAjaxProcessor, {...})'
        };
      }
    }
    
    // Check if it's an on-demand Script Include (function name matches api_name)
    const onDemandPattern = new RegExp(`function\\s+${data.api_name}\\s*\\(`, 'i');
    const isOnDemand = onDemandPattern.test(data.script);
    
    // Check if it's a class-based Script Include
    const classPattern = new RegExp(`${data.api_name}\\s*=\\s*Class\\.create`, 'i');
    const isClassBased = classPattern.test(data.script);
    
    // If it's on-demand, ensure function name matches api_name
    if (isOnDemand && !data.script.includes(`function ${data.api_name}(`)) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'On-demand Script Include function name must match api_name',
        detail: `Function name must be exactly '${data.api_name}' to match the api_name`
      };
    }
    
    // Note: We don't enforce that it must be one or the other, as ServiceNow allows various patterns
  }

  /**
   * Validate access level value
   * 
   * @param access - Access level to validate
   * @throws Error if access level is invalid
   */
  private validateAccessLevel(access: string): void {
    const validAccessLevels = ['public', 'package_private', 'private'];
    if (!validAccessLevels.includes(access)) {
      throw {
        code: 'VALIDATION_ERROR',
        message: 'Invalid access level',
        detail: `Access level must be one of: ${validAccessLevels.join(', ')}. Received: ${access}`
      };
    }
  }

  /**
   * Build ServiceNow encoded query string from filters
   * 
   * @param filters - Filter criteria
   * @returns Encoded query string
   */
  private buildQuery(filters: ScriptIncludeFilters): string {
    const queryParts: string[] = [];
    
    // Add name filter (partial match, case-insensitive)
    if (filters.name) {
      queryParts.push(`nameLIKE${filters.name}`);
    }
    
    // Add api_name filter (exact match)
    if (filters.api_name) {
      queryParts.push(`api_name=${filters.api_name}`);
    }
    
    // Add active filter
    if (filters.active !== undefined) {
      queryParts.push(`active=${filters.active}`);
    }
    
    // Add access filter
    if (filters.access) {
      queryParts.push(`access=${filters.access}`);
    }
    
    // Add client_callable filter
    if (filters.client_callable !== undefined) {
      queryParts.push(`client_callable=${filters.client_callable}`);
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }

  /**
   * Transform ServiceNow record to ScriptIncludeSummary
   * 
   * @param record - ServiceNow record
   * @returns ScriptIncludeSummary object
   */
  private toScriptIncludeSummary(record: ServiceNowRecord): ScriptIncludeSummary {
    return {
      sys_id: record.sys_id,
      name: String(record.name || ''),
      api_name: String(record.api_name || ''),
      active: Boolean(record.active),
      access: String(record.access || 'public'),
      client_callable: Boolean(record.client_callable),
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }

  /**
   * Transform ServiceNow record to ScriptIncludeDetail
   * 
   * @param record - ServiceNow record
   * @returns ScriptIncludeDetail object
   */
  private toScriptIncludeDetail(record: ServiceNowRecord): ScriptIncludeDetail {
    return {
      sys_id: record.sys_id,
      name: String(record.name || ''),
      api_name: String(record.api_name || ''),
      script: String(record.script || ''),
      active: Boolean(record.active),
      access: String(record.access || 'public'),
      client_callable: Boolean(record.client_callable),
      description: record.description ? String(record.description) : null,
      sys_created_on: String(record.sys_created_on || ''),
      sys_created_by: String(record.sys_created_by || ''),
      sys_updated_on: String(record.sys_updated_on || ''),
      sys_updated_by: String(record.sys_updated_by || ''),
      sys_mod_count: Number(record.sys_mod_count || 0)
    };
  }
}
