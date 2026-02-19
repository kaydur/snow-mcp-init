import axios from 'axios';
import https from 'https';
import { ClientConfig, QueryParams, ServiceNowResponse, ServiceNowRecord, ServiceNowError, ScriptExecutionRequest, ScriptExecutionResult } from '../types/interfaces.js';
import { AuthenticationManager } from '../auth/AuthenticationManager.js';
import { logger } from '../utils/logger.js';

/**
 * ServiceNowClient handles HTTP communication with ServiceNow REST APIs
 * 
 * Provides methods for executing GET requests to the ServiceNow Table API,
 * including authentication, error handling, and response parsing.
 */
export class ServiceNowClient {
  private config: ClientConfig;
  private authManager: AuthenticationManager;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_MAX_RETRIES = 3;
  private readonly MAX_SCRIPT_TIMEOUT = 60000; // 60 seconds max
  private httpsAgent: https.Agent | undefined;

  constructor(config: ClientConfig, authManager: AuthenticationManager) {
    this.config = config;
    this.authManager = authManager;
    
    // Create HTTPS agent with SSL configuration
    if (process.env.REJECT_UNAUTHORIZED === 'false') {
      this.httpsAgent = new https.Agent({ rejectUnauthorized: false });
    }
  }

  /**
   * Execute a GET request to ServiceNow Table API
   * 
   * @param table - ServiceNow table name (e.g., 'incident')
   * @param params - Query parameters for filtering and pagination
   * @returns Promise resolving to ServiceNowResponse with result array
   * @throws ServiceNowError if request fails
   */
  async get(table: string, params: QueryParams = {}): Promise<ServiceNowResponse> {
    const startTime = Date.now();
    
    try {
      // Build URL with query parameters
      const url = this.buildUrl(table, params);
      
      logger.debug('api_request', 'Executing GET request', {
        params: { table, query: params.sysparm_query, limit: params.sysparm_limit }
      });
      
      // Get authentication headers
      const headers = this.authManager.getAuthHeaders();
      
      if (!this.authManager.isAuthenticated()) {
        throw this.createError('AUTH_ERROR', 'Not authenticated. Please authenticate before making API calls.');
      }

      // Execute request with timeout
      const timeout = this.config.timeout || this.DEFAULT_TIMEOUT;
      const response = await axios.get(url, {
        headers,
        timeout,
        httpsAgent: this.httpsAgent,
        validateStatus: () => true // Don't throw on any status code
      });

      // Handle authentication errors
      if (response.status === 401) {
        this.authManager.handleExpiration();
        throw this.createError('AUTH_EXPIRED', 'Session expired. Please re-authenticate.');
      }

      // Handle forbidden errors
      if (response.status === 403) {
        throw this.createError('FORBIDDEN', 'Access forbidden. User does not have required permissions.');
      }

      // Handle not found errors
      if (response.status === 404) {
        throw this.createError('NOT_FOUND', `Table '${table}' not found or does not exist.`);
      }

      // Handle other HTTP errors
      if (response.status !== 200) {
        const errorText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        throw this.createError(
          'API_ERROR',
          `ServiceNow API error: ${response.status} ${response.statusText}`,
          errorText
        );
      }

      // Parse and return response
      const data = response.data as ServiceNowResponse;
      const duration = Date.now() - startTime;
      
      logger.debug('api_response', 'GET request successful', {
        result: { count: data.result.length },
        duration
      });
      
      return data;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('api_request', 'GET request failed', {
        error: error,
        duration
      });
      throw this.handleError(error);
    }
  }

  /**
   * Retrieve a specific record by sys_id
   * 
   * @param table - ServiceNow table name (e.g., 'incident')
   * @param sysId - System ID of the record to retrieve
   * @returns Promise resolving to ServiceNowRecord
   * @throws ServiceNowError if request fails or record not found
   */
  async getById(table: string, sysId: string): Promise<ServiceNowRecord> {
    const startTime = Date.now();
    
    try {
      // Build URL for specific record
      const url = `${this.config.instanceUrl}/api/now/table/${table}/${sysId}`;
      
      logger.debug('api_request', 'Executing GET by ID request', {
        params: { table, sysId }
      });
      
      // Get authentication headers
      const headers = this.authManager.getAuthHeaders();
      
      if (!this.authManager.isAuthenticated()) {
        throw this.createError('AUTH_ERROR', 'Not authenticated. Please authenticate before making API calls.');
      }

      // Execute request with timeout
      const timeout = this.config.timeout || this.DEFAULT_TIMEOUT;
      const response = await axios.get(url, {
        headers,
        timeout,
        httpsAgent: this.httpsAgent,
        validateStatus: () => true // Don't throw on any status code
      });

      // Handle authentication errors
      if (response.status === 401) {
        this.authManager.handleExpiration();
        throw this.createError('AUTH_EXPIRED', 'Session expired. Please re-authenticate.');
      }

      // Handle forbidden errors
      if (response.status === 403) {
        throw this.createError('FORBIDDEN', 'Access forbidden. User does not have required permissions.');
      }

      // Handle not found errors
      if (response.status === 404) {
        throw this.createError('NOT_FOUND', `Record with sys_id '${sysId}' not found in table '${table}'.`);
      }

      // Handle other HTTP errors
      if (response.status !== 200) {
        const errorText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        throw this.createError(
          'API_ERROR',
          `ServiceNow API error: ${response.status} ${response.statusText}`,
          errorText
        );
      }

      // Parse and return response
      const data = response.data as { result: ServiceNowRecord };
      const duration = Date.now() - startTime;
      
      logger.debug('api_response', 'GET by ID request successful', {
        result: { sys_id: data.result.sys_id },
        duration
      });
      
      return data.result;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('api_request', 'GET by ID request failed', {
        error: error,
        duration
      });
      throw this.handleError(error);
    }
  }

  /**
   * Create a new record in a ServiceNow table
   * 
   * @param table - ServiceNow table name (e.g., 'sys_script_include')
   * @param data - Record data to create
   * @returns Promise resolving to created ServiceNowRecord
   * @throws ServiceNowError if request fails
   */
  async post(table: string, data: Record<string, any>): Promise<ServiceNowRecord> {
    const startTime = Date.now();
    
    try {
      // Build URL for table
      const url = `${this.config.instanceUrl}/api/now/table/${table}`;
      
      logger.debug('api_request', 'Executing POST request', {
        params: { table, fields: Object.keys(data) }
      });
      
      // Get authentication headers
      const headers = this.authManager.getAuthHeaders();
      
      if (!this.authManager.isAuthenticated()) {
        throw this.createError('AUTH_ERROR', 'Not authenticated. Please authenticate before making API calls.');
      }

      // Execute request with timeout
      const timeout = this.config.timeout || this.DEFAULT_TIMEOUT;
      const response = await axios.post(url, data, {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        timeout,
        httpsAgent: this.httpsAgent,
        validateStatus: () => true // Don't throw on any status code
      });

      // Handle authentication errors
      if (response.status === 401) {
        this.authManager.handleExpiration();
        throw this.createError('AUTH_EXPIRED', 'Session expired. Please re-authenticate.');
      }

      // Handle forbidden errors
      if (response.status === 403) {
        throw this.createError('FORBIDDEN', 'Access forbidden. User does not have required permissions.');
      }

      // Handle not found errors
      if (response.status === 404) {
        throw this.createError('NOT_FOUND', `Table '${table}' not found or does not exist.`);
      }

      // Handle other HTTP errors
      if (response.status !== 201 && response.status !== 200) {
        const errorText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        throw this.createError(
          'API_ERROR',
          `ServiceNow API error: ${response.status} ${response.statusText}`,
          errorText
        );
      }

      // Parse and return response
      const responseData = response.data as { result: ServiceNowRecord };
      const duration = Date.now() - startTime;
      
      logger.debug('api_response', 'POST request successful', {
        result: { sys_id: responseData.result.sys_id },
        duration
      });
      
      return responseData.result;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('api_request', 'POST request failed', {
        error: error,
        duration
      });
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing record in a ServiceNow table
   * 
   * @param table - ServiceNow table name (e.g., 'sys_script_include')
   * @param sysId - System ID of the record to update
   * @param data - Record data to update
   * @returns Promise resolving to updated ServiceNowRecord
   * @throws ServiceNowError if request fails or record not found
   */
  async put(table: string, sysId: string, data: Record<string, any>): Promise<ServiceNowRecord> {
    const startTime = Date.now();
    
    try {
      // Build URL for specific record
      const url = `${this.config.instanceUrl}/api/now/table/${table}/${sysId}`;
      
      logger.debug('api_request', 'Executing PUT request', {
        params: { table, sysId, fields: Object.keys(data) }
      });
      
      // Get authentication headers
      const headers = this.authManager.getAuthHeaders();
      
      if (!this.authManager.isAuthenticated()) {
        throw this.createError('AUTH_ERROR', 'Not authenticated. Please authenticate before making API calls.');
      }

      // Execute request with timeout
      const timeout = this.config.timeout || this.DEFAULT_TIMEOUT;
      const response = await axios.put(url, data, {
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        timeout,
        httpsAgent: this.httpsAgent,
        validateStatus: () => true // Don't throw on any status code
      });

      // Handle authentication errors
      if (response.status === 401) {
        this.authManager.handleExpiration();
        throw this.createError('AUTH_EXPIRED', 'Session expired. Please re-authenticate.');
      }

      // Handle forbidden errors
      if (response.status === 403) {
        throw this.createError('FORBIDDEN', 'Access forbidden. User does not have required permissions.');
      }

      // Handle not found errors
      if (response.status === 404) {
        throw this.createError('NOT_FOUND', `Record with sys_id '${sysId}' not found in table '${table}'.`);
      }

      // Handle other HTTP errors
      if (response.status !== 200) {
        const errorText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        throw this.createError(
          'API_ERROR',
          `ServiceNow API error: ${response.status} ${response.statusText}`,
          errorText
        );
      }

      // Parse and return response
      const responseData = response.data as { result: ServiceNowRecord };
      const duration = Date.now() - startTime;
      
      logger.debug('api_response', 'PUT request successful', {
        result: { sys_id: responseData.result.sys_id },
        duration
      });
      
      return responseData.result;

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('api_request', 'PUT request failed', {
        error: error,
        duration
      });
      throw this.handleError(error);
    }
  }

  /**
   * Delete a record from a ServiceNow table
   * 
   * @param table - ServiceNow table name (e.g., 'sys_script_include')
   * @param sysId - System ID of the record to delete
   * @returns Promise resolving when deletion is complete
   * @throws ServiceNowError if request fails or record not found
   */
  async delete(table: string, sysId: string): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Build URL for specific record
      const url = `${this.config.instanceUrl}/api/now/table/${table}/${sysId}`;
      
      logger.debug('api_request', 'Executing DELETE request', {
        params: { table, sysId }
      });
      
      // Get authentication headers
      const headers = this.authManager.getAuthHeaders();
      
      if (!this.authManager.isAuthenticated()) {
        throw this.createError('AUTH_ERROR', 'Not authenticated. Please authenticate before making API calls.');
      }

      // Execute request with timeout
      const timeout = this.config.timeout || this.DEFAULT_TIMEOUT;
      const response = await axios.delete(url, {
        headers,
        timeout,
        httpsAgent: this.httpsAgent,
        validateStatus: () => true // Don't throw on any status code
      });

      // Handle authentication errors
      if (response.status === 401) {
        this.authManager.handleExpiration();
        throw this.createError('AUTH_EXPIRED', 'Session expired. Please re-authenticate.');
      }

      // Handle forbidden errors
      if (response.status === 403) {
        throw this.createError('FORBIDDEN', 'Access forbidden. User does not have required permissions.');
      }

      // Handle not found errors
      if (response.status === 404) {
        throw this.createError('NOT_FOUND', `Record with sys_id '${sysId}' not found in table '${table}'.`);
      }

      // Handle other HTTP errors
      if (response.status !== 204 && response.status !== 200) {
        const errorText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        throw this.createError(
          'API_ERROR',
          `ServiceNow API error: ${response.status} ${response.statusText}`,
          errorText
        );
      }

      const duration = Date.now() - startTime;
      logger.debug('api_response', 'DELETE request successful', {
        result: { success: true },
        duration
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('api_request', 'DELETE request failed', {
        error: error,
        duration
      });
      throw this.handleError(error);
    }
  }

  /**
   * Execute a server-side script on ServiceNow instance
   *
   * Uses ServiceNow's Script Execution API to run server-side JavaScript code.
   * The script executes in the ServiceNow server context with access to GlideQuery and other APIs.
   *
   * @param request - Script execution request containing script and optional timeout
   * @returns Promise resolving to ScriptExecutionResult with results, logs, and errors
   * @throws ServiceNowError if request fails or authentication is invalid
   */
  async executeScript(request: ScriptExecutionRequest): Promise<ScriptExecutionResult> {
    const startTime = Date.now();

    try {
      // Validate script is not empty
      if (!request.script || request.script.trim().length === 0) {
        throw this.createError('VALIDATION_ERROR', 'Script cannot be empty');
      }

      // Validate and set timeout (default 30s, max 60s)
      const timeout = Math.min(
        request.timeout || this.DEFAULT_TIMEOUT,
        this.MAX_SCRIPT_TIMEOUT
      );

      // Build URL for script execution endpoint
      const url = `${this.config.instanceUrl}/api/now/v1/script/execute`;

      logger.debug('api_request', 'Executing script', {
        params: { scriptLength: request.script.length, timeout }
      });

      // Get authentication headers
      const headers = this.authManager.getAuthHeaders();

      if (!this.authManager.isAuthenticated()) {
        throw this.createError('AUTH_ERROR', 'Not authenticated. Please authenticate before making API calls.');
      }

      // Execute request with timeout
      const response = await axios.post(
        url,
        { script: request.script },
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          timeout,
          httpsAgent: this.httpsAgent,
          validateStatus: () => true // Don't throw on any status code
        }
      );

      // Handle authentication errors
      if (response.status === 401) {
        this.authManager.handleExpiration();
        throw this.createError('AUTH_EXPIRED', 'Session expired. Please re-authenticate.');
      }

      // Handle forbidden errors
      if (response.status === 403) {
        throw this.createError('FORBIDDEN', 'Access forbidden. User does not have script execution permissions.');
      }

      // Handle not found errors (endpoint doesn't exist)
      if (response.status === 404) {
        throw this.createError(
          'ENDPOINT_NOT_FOUND',
          'Script execution endpoint not found. The Script Execution API may not be available on this instance.'
        );
      }

      // Handle other HTTP errors
      if (response.status !== 200) {
        const errorText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        throw this.createError(
          'API_ERROR',
          `ServiceNow API error: ${response.status} ${response.statusText}`,
          errorText
        );
      }

      // Parse response
      const executionTime = Date.now() - startTime;
      const result = this.parseScriptExecutionResponse(response.data, executionTime);

      logger.debug('api_response', 'Script execution completed', {
        result: { success: result.success },
        duration: executionTime
      });

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;

      // Handle timeout errors specifically
      if (axios.isAxiosError(error) && (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED')) {
        logger.error('api_request', 'Script execution timed out', {
          error: error,
          duration: executionTime
        });

        return {
          success: false,
          error: {
            message: 'Script execution timed out',
            type: 'TIMEOUT'
          },
          executionTime
        };
      }

      logger.error('api_request', 'Script execution failed', {
        error: error,
        duration: executionTime
      });

      throw this.handleError(error);
    }
  }

  /**
   * Parse script execution API response
   *
   * @param data - Response data from ServiceNow API
   * @param executionTime - Time taken to execute the script
   * @returns Parsed ScriptExecutionResult
   */
  private parseScriptExecutionResponse(data: any, executionTime: number): ScriptExecutionResult {
    // Handle different response formats from ServiceNow

    // Format 1: Direct result with success flag
    if (typeof data === 'object' && 'result' in data) {
      const resultData = data.result;

      // Check if execution was successful
      if (resultData.success === false || resultData.error) {
        return {
          success: false,
          error: {
            message: resultData.error?.message || resultData.errorMessage || 'Script execution failed',
            line: resultData.error?.line || resultData.errorLine,
            type: resultData.error?.type || resultData.errorType || 'Error'
          },
          logs: resultData.logs || [],
          executionTime
        };
      }

      // Successful execution
      return {
        success: true,
        result: resultData.value !== undefined ? resultData.value : resultData,
        logs: resultData.logs || [],
        executionTime
      };
    }

    // Format 2: Direct value response
    return {
      success: true,
      result: data,
      executionTime
    };
  }

  /**
   * Build URL with query parameters
   * 
   * @param table - ServiceNow table name
   * @param params - Query parameters
   * @returns Complete URL with query string
   */
  private buildUrl(table: string, params: QueryParams): string {
    const baseUrl = `${this.config.instanceUrl}/api/now/table/${table}`;
    const queryParams = new URLSearchParams();

    if (params.sysparm_query) {
      queryParams.append('sysparm_query', params.sysparm_query);
    }
    if (params.sysparm_limit !== undefined) {
      queryParams.append('sysparm_limit', params.sysparm_limit.toString());
    }
    if (params.sysparm_offset !== undefined) {
      queryParams.append('sysparm_offset', params.sysparm_offset.toString());
    }
    if (params.sysparm_fields) {
      queryParams.append('sysparm_fields', params.sysparm_fields);
    }
    if (params.sysparm_display_value !== undefined) {
      queryParams.append('sysparm_display_value', params.sysparm_display_value.toString());
    }

    const queryString = queryParams.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Create a ServiceNowError object
   * 
   * @param code - Error code
   * @param message - Error message
   * @param detail - Optional error details
   * @returns ServiceNowError object
   */
  private createError(code: string, message: string, detail?: string): ServiceNowError {
    return { code, message, detail };
  }

  /**
   * Handle and format errors from API calls
   * 
   * @param error - Error object from catch block
   * @returns Formatted ServiceNowError
   */
  private handleError(error: unknown): ServiceNowError {
    // If already a ServiceNowError, return as-is
    if (this.isServiceNowError(error)) {
      return error;
    }

    // Handle axios errors
    if (axios.isAxiosError(error)) {
      if (error.code === 'ENOTFOUND') {
        return this.createError(
          'NETWORK_ERROR',
          `Cannot reach ServiceNow instance: ${this.config.instanceUrl} - check your URL`,
          error.message
        );
      } else if (error.code === 'ECONNREFUSED') {
        return this.createError(
          'NETWORK_ERROR',
          `Connection refused to ${this.config.instanceUrl}`,
          error.message
        );
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        return this.createError(
          'TIMEOUT',
          `Request timed out`,
          error.message
        );
      } else if (error.message) {
        return this.createError(
          'NETWORK_ERROR',
          'Network error: Unable to connect to ServiceNow instance. Please check your connection and instance URL.',
          error.message
        );
      }
    }

    // Handle generic errors
    if (error instanceof Error) {
      return this.createError(
        'UNKNOWN_ERROR',
        `Unexpected error: ${error.message}`,
        error.stack
      );
    }

    // Handle unknown error types
    return this.createError(
      'UNKNOWN_ERROR',
      'An unknown error occurred',
      String(error)
    );
  }

  /**
   * Type guard to check if error is ServiceNowError
   * 
   * @param error - Error to check
   * @returns true if error is ServiceNowError
   */
  private isServiceNowError(error: unknown): error is ServiceNowError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error &&
      typeof (error as ServiceNowError).code === 'string' &&
      typeof (error as ServiceNowError).message === 'string'
    );
  }
}
