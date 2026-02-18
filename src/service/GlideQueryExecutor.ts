import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { ExecutionOptions, ExecutionResult, ValidationResult } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * GlideQueryExecutor provides execution capabilities for GlideQuery scripts
 * 
 * Handles script sanitization, execution, result formatting, and error handling
 * for GlideQuery scripts executed on ServiceNow instances.
 */
export class GlideQueryExecutor {
  private client: ServiceNowClient;
  private readonly MAX_SCRIPT_LENGTH = 10000;
  private readonly DEFAULT_TEST_MAX_RESULTS = 100;

  /**
   * Blacklisted patterns that pose security risks
   */
  private readonly BLACKLISTED_PATTERNS = [
    /gs\.executeNow\s*\(/i,
    /gs\.eval\s*\(/i,
    /eval\s*\(/i,
    /Function\s*\(/i,
    /GlideRecord\s*\(/i, // Discourage GlideRecord in favor of GlideQuery
  ];

  /**
   * Create a GlideQueryExecutor instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Execute a GlideQuery script
   * 
   * @param script - GlideQuery script to execute
   * @param options - Execution options (timeout, testMode, maxResults)
   * @returns Promise resolving to ExecutionResult
   */
  async execute(script: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    const startTime = Date.now();
    const operationType = options.testMode ? 'glidequery_test' : 'glidequery_execute';

    // Log execution start
    logger.info(operationType, 'Starting GlideQuery script execution', {
      params: {
        scriptLength: script?.length || 0,
        testMode: options.testMode || false,
        timeout: options.timeout,
        maxResults: options.maxResults
      }
    });

    try {
      // Validate script is not empty
      if (!script || script.trim().length === 0) {
        const executionTime = Date.now() - startTime;
        logger.warn(operationType, 'Script execution failed: empty script', {
          error: { code: 'VALIDATION_ERROR', message: 'Script cannot be empty' },
          duration: executionTime
        });
        return {
          success: false,
          error: 'Script cannot be empty',
          executionTime
        };
      }

      // Validate script length
      if (script.length > this.MAX_SCRIPT_LENGTH) {
        const executionTime = Date.now() - startTime;
        logger.warn(operationType, 'Script execution failed: script too long', {
          params: { scriptLength: script.length, maxLength: this.MAX_SCRIPT_LENGTH },
          error: { code: 'VALIDATION_ERROR', message: 'Script exceeds maximum length' },
          duration: executionTime
        });
        return {
          success: false,
          error: `Script exceeds maximum length of ${this.MAX_SCRIPT_LENGTH} characters`,
          executionTime
        };
      }

      // Sanitize script
      const sanitizationResult = this.sanitizeScript(script);
      if (!sanitizationResult.safe) {
        const executionTime = Date.now() - startTime;
        logger.error(operationType, 'Script execution failed: security violation', {
          params: { violations: sanitizationResult.violations },
          error: { code: 'SECURITY_VIOLATION', message: sanitizationResult.violations?.join(', ') },
          duration: executionTime
        });
        return {
          success: false,
          error: `Security violation: ${sanitizationResult.violations?.join(', ')}`,
          executionTime
        };
      }

      // Detect write operations for test mode warnings
      const writeOperations = options.testMode ? this.detectWriteOperations(script) : [];
      
      // Prepare script for execution
      let executableScript = script;
      
      // If test mode, wrap script with result limiting
      if (options.testMode) {
        const maxResults = options.maxResults || this.DEFAULT_TEST_MAX_RESULTS;
        executableScript = this.wrapForTestMode(script, maxResults);
      }

      // Execute script via ServiceNowClient
      const result = await this.client.executeScript({
        script: executableScript,
        timeout: options.timeout
      });

      // Parse and format results
      const executionTime = Date.now() - startTime;
      const formattedResult = this.formatResult(result, options.testMode || false, writeOperations);

      // Log successful execution
      if (formattedResult.success) {
        logger.info(operationType, 'Script execution completed successfully', {
          result: {
            recordCount: formattedResult.recordCount,
            truncated: formattedResult.truncated,
            hasData: formattedResult.data !== null && formattedResult.data !== undefined
          },
          duration: executionTime
        });
      } else {
        logger.error(operationType, 'Script execution completed with error', {
          error: { message: formattedResult.error },
          duration: executionTime
        });
      }

      return formattedResult;

    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      logger.error(operationType, 'Script execution failed with exception', {
        error: { message: error.message || String(error), stack: error.stack },
        duration: executionTime
      });

      return {
        success: false,
        error: error.message || 'Unknown error occurred',
        executionTime
      };
    }
  }

  /**
   * Validate GlideQuery syntax without execution
   * 
   * Performs basic syntax checks locally to catch common mistakes:
   * - Undefined methods (e.g., .selectAll(), .findOne())
   * - Incorrect chaining (e.g., calling terminal operation twice)
   * - Invalid operators
   * - GlideRecord patterns used incorrectly
   * - Invalid field flags
   * 
   * @param script - GlideQuery script to validate
   * @returns ValidationResult with errors and warnings
   */
  validate(script: string): ValidationResult {
    const startTime = Date.now();

    // Log validation start
    logger.info('glidequery_validate', 'Starting GlideQuery script validation', {
      params: { scriptLength: script?.length || 0 }
    });

    const errors: Array<{ message: string; line?: number }> = [];
    const warnings: string[] = [];

    // Check if script is empty
    if (!script || script.trim().length === 0) {
      errors.push({ message: 'Script cannot be empty' });
      const duration = Date.now() - startTime;
      logger.warn('glidequery_validate', 'Validation failed: empty script', {
        error: { code: 'VALIDATION_ERROR', message: 'Script cannot be empty' },
        duration
      });
      return { valid: false, errors };
    }

    // Check script length
    if (script.length > this.MAX_SCRIPT_LENGTH) {
      errors.push({ 
        message: `Script exceeds maximum length of ${this.MAX_SCRIPT_LENGTH} characters` 
      });
    }

    // Split script into lines for line number tracking
    const lines = script.split('\n');

    // Define valid GlideQuery methods
    const validMethods = [
      'where', 'orWhere', 'whereNull', 'whereNotNull', 'orWhereNull', 'orWhereNotNull',
      'select', 'selectOne', 'get', 'getBy',
      'insert', 'update', 'updateMultiple', 'insertOrUpdate', 'deleteMultiple',
      'orderBy', 'orderByDesc', 'limit',
      'disableWorkflow', 'disableAutoSysFields', 'forceUpdate', 'withAcls', 'withSecurityDataFilters',
      'count', 'avg', 'sum', 'min', 'max', 'aggregate', 'groupBy', 'having',
      'toGlideRecord', 'parse',
      // Stream methods
      'forEach', 'map', 'filter', 'reduce', 'toArray', 'skip',
      // Optional methods
      'orElse', 'isPresent', 'flatMap'
    ];

    // Define valid operators
    const validOperators = [
      '=', '!=', '>', '>=', '<', '<=', 
      'IN', 'NOT IN', 'STARTSWITH', 'ENDSWITH', 'CONTAINS', 'DOES NOT CONTAIN',
      'INSTANCEOF', 'SAMEAS', 'NSAMEAS', 'GT_FIELD', 'LT_FIELD', 
      'GT_OR_EQUALS_FIELD', 'LT_OR_EQUALS_FIELD', 'BETWEEN', 
      'DYNAMIC', 'EMPTYSTRING', 'ANYTHING', 'LIKE', 'NOT LIKE', 'ON'
    ];

    // Define valid field flags
    const validFieldFlags = ['$DISPLAY', '$CURRENCY_CODE', '$CURRENCY_DISPLAY', '$CURRENCY_STRING'];

    // Check for undefined methods (common mistakes)
    const undefinedMethods = [
      { pattern: /\.selectAll\s*\(/g, method: 'selectAll', suggestion: 'Use .select() instead' },
      { pattern: /\.findOne\s*\(/g, method: 'findOne', suggestion: 'Use .selectOne() or .get() instead' },
      { pattern: /\.find\s*\(/g, method: 'find', suggestion: 'Use .select() instead' },
      { pattern: /\.query\s*\(/g, method: 'query', suggestion: 'Use .select() instead (GlideQuery does not have .query())' },
      { pattern: /\.addQuery\s*\(/g, method: 'addQuery', suggestion: 'Use .where() instead (GlideQuery method)' },
      { pattern: /\.addEncodedQuery\s*\(/g, method: 'addEncodedQuery', suggestion: 'Use GlideQuery.parse() instead' },
      { pattern: /\.next\s*\(/g, method: 'next', suggestion: 'Use .forEach() or .toArray() on Stream results instead' },
      { pattern: /\.getValue\s*\(/g, method: 'getValue', suggestion: 'Use direct field access (e.g., record.field) instead' },
      { pattern: /\.setValue\s*\(/g, method: 'setValue', suggestion: 'Use .update() or .insert() with object syntax instead' }
    ];

    for (const { pattern, method, suggestion } of undefinedMethods) {
      const matches = script.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(script, match.index || 0);
        errors.push({
          message: `Undefined method '.${method}()' - ${suggestion}`,
          line: lineNumber
        });
      }
    }

    // Check for incorrect chaining (terminal operations called multiple times)
    const terminalOperations = [
      'select', 'selectOne', 'get', 'getBy', 
      'insert', 'update', 'updateMultiple', 'insertOrUpdate', 'deleteMultiple',
      'count', 'avg', 'sum', 'min', 'max'
    ];

    for (let i = 0; i < terminalOperations.length; i++) {
      for (let j = 0; j < terminalOperations.length; j++) {
        const pattern = new RegExp(`\\.${terminalOperations[i]}\\s*\\([^)]*\\)[^;]*\\.${terminalOperations[j]}\\s*\\(`, 'g');
        const matches = script.matchAll(pattern);
        for (const match of matches) {
          const lineNumber = this.getLineNumber(script, match.index || 0);
          errors.push({
            message: `Cannot chain terminal operations: .${terminalOperations[i]}() followed by .${terminalOperations[j]}()`,
            line: lineNumber
          });
        }
      }
    }

    // Check for missing parentheses on method calls
    for (const method of validMethods) {
      const pattern = new RegExp(`\\.${method}(?!\\s*\\()`, 'g');
      const matches = script.matchAll(pattern);
      for (const match of matches) {
        // Skip if it's part of a longer word
        const nextChar = script[match.index! + match[0].length];
        if (nextChar && /[a-zA-Z0-9_]/.test(nextChar)) {
          continue;
        }
        const lineNumber = this.getLineNumber(script, match.index || 0);
        warnings.push(`Method '.${method}' may be missing parentheses at line ${lineNumber}`);
      }
    }

    // Check for invalid operators in where clauses (3-parameter form only)
    // Pattern matches: .where('field', 'OPERATOR', value) or .orWhere('field', 'OPERATOR', value)
    // We need to ensure there's a third parameter to distinguish from 2-parameter form
    const wherePattern = /\.(?:where|orWhere)\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*,/g;
    const matches = script.matchAll(wherePattern);
    for (const match of matches) {
      const operator = match[2];
      if (!validOperators.includes(operator)) {
        const lineNumber = this.getLineNumber(script, match.index || 0);
        errors.push({
          message: `Invalid operator '${operator}' - must be one of: ${validOperators.join(', ')}`,
          line: lineNumber
        });
      }
    }
    
    // Check for invalid operators in having clauses
    // Pattern: .having('aggregate', 'field', 'OPERATOR', value)
    const havingPattern = /\.having\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*,/g;
    const havingMatches = script.matchAll(havingPattern);
    for (const match of havingMatches) {
      const operator = match[3]; // Third parameter is the operator in having()
      if (!validOperators.includes(operator)) {
        const lineNumber = this.getLineNumber(script, match.index || 0);
        errors.push({
          message: `Invalid operator '${operator}' in having clause - must be one of: ${validOperators.join(', ')}`,
          line: lineNumber
        });
      }
    }

    // Check for invalid field flags
    const fieldFlagPattern = /['"`]([a-zA-Z_][a-zA-Z0-9_]*\$[A-Z_]+)['"`]/g;
    const flagMatches = script.matchAll(fieldFlagPattern);
    for (const match of flagMatches) {
      const fieldWithFlag = match[1];
      const flag = '$' + fieldWithFlag.split('$')[1];
      if (!validFieldFlags.includes(flag)) {
        const lineNumber = this.getLineNumber(script, match.index || 0);
        warnings.push(`Unknown field flag '${flag}' at line ${lineNumber} - valid flags: ${validFieldFlags.join(', ')}`);
      }
    }

    // Check for GlideRecord patterns used incorrectly
    if (/GlideRecord\s*\(/i.test(script)) {
      warnings.push('GlideRecord detected - consider using GlideQuery for better performance and type safety');
    }

    // Check for common Optional handling mistakes
    if (/\.get\s*\(\s*\)/.test(script) && !/\.isPresent\s*\(\s*\)/.test(script) && !/\.orElse\s*\(/.test(script)) {
      warnings.push('Calling .get() on Optional without checking .isPresent() or using .orElse() may throw an error if empty');
    }

    // Log validation result
    const duration = Date.now() - startTime;
    if (errors.length === 0) {
      logger.info('glidequery_validate', 'Validation completed successfully', {
        result: {
          valid: true,
          warningCount: warnings.length
        },
        duration
      });
    } else {
      logger.warn('glidequery_validate', 'Validation completed with errors', {
        result: {
          valid: false,
          errorCount: errors.length,
          warningCount: warnings.length
        },
        duration
      });
    }

    // Return validation result
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Get line number for a character position in the script
   * 
   * @param script - Full script text
   * @param position - Character position
   * @returns Line number (1-indexed)
   */
  private getLineNumber(script: string, position: number): number {
    const upToPosition = script.substring(0, position);
    return upToPosition.split('\n').length;
  }

  /**
   * Sanitize script to prevent injection attacks
   * 
   * @param script - Script to sanitize
   * @returns Sanitization result with safety status and violations
   */
  private sanitizeScript(script: string): { safe: boolean; violations?: string[] } {
    const violations: string[] = [];

    // Check against blacklisted patterns
    for (const pattern of this.BLACKLISTED_PATTERNS) {
      if (pattern.test(script)) {
        violations.push(`Blacklisted pattern detected: ${pattern.source}`);
      }
    }

    return {
      safe: violations.length === 0,
      violations: violations.length > 0 ? violations : undefined
    };
  }

  /**
   * Detect write operations in script
   * 
   * @param script - Script to analyze
   * @returns Array of detected write operations
   */
  private detectWriteOperations(script: string): string[] {
    const writeOperations: string[] = [];
    const writePatterns = [
      { pattern: /\.insert\s*\(/i, operation: 'insert' },
      { pattern: /\.update\s*\(/i, operation: 'update' },
      { pattern: /\.updateMultiple\s*\(/i, operation: 'updateMultiple' },
      { pattern: /\.delete\s*\(/i, operation: 'delete' },
      { pattern: /\.deleteMultiple\s*\(/i, operation: 'deleteMultiple' },
      { pattern: /\.insertOrUpdate\s*\(/i, operation: 'insertOrUpdate' }
    ];

    for (const { pattern, operation } of writePatterns) {
      if (pattern.test(script)) {
        writeOperations.push(operation);
      }
    }

    return writeOperations;
  }

  /**
   * Wrap script for test mode execution
   * 
   * Adds result limiting and instrumentation for testing
   * 
   * @param script - Original script
   * @param maxResults - Maximum number of results to return
   * @returns Wrapped script
   */
  private wrapForTestMode(script: string, maxResults: number): string {
    // Wrap the script to capture and limit results
    // This is a simplified approach - in production, more sophisticated wrapping may be needed
    return `
(function() {
  var __testModeMaxResults = ${maxResults};
  var __originalScript = function() {
    ${script}
  };
  
  var result = __originalScript();
  
  // If result is a Stream (has toArray method), convert and limit
  if (result && typeof result.toArray === 'function') {
    var array = result.toArray();
    if (array.length > __testModeMaxResults) {
      return {
        __testMode: true,
        __truncated: true,
        __originalCount: array.length,
        data: array.slice(0, __testModeMaxResults)
      };
    }
    return {
      __testMode: true,
      __truncated: false,
      data: array
    };
  }
  
  // Return result as-is for non-Stream results
  return result;
})();
    `.trim();
  }

  /**
   * Format script execution result into ExecutionResult structure
   * 
   * @param result - Raw script execution result from ServiceNowClient
   * @param testMode - Whether execution was in test mode
   * @param writeOperations - Array of detected write operations (for test mode warnings)
   * @returns Formatted ExecutionResult
   */
  private formatResult(result: any, testMode: boolean, writeOperations: string[] = []): ExecutionResult {
    if (!result.success) {
      // Execution failed
      return {
        success: false,
        error: result.error?.message || 'Script execution failed',
        logs: result.logs,
        executionTime: result.executionTime
      };
    }

    // Execution succeeded
    const executionResult: ExecutionResult = {
      success: true,
      executionTime: result.executionTime,
      logs: result.logs || []
    };

    // Add write operation warnings in test mode
    if (testMode && writeOperations.length > 0) {
      executionResult.logs = executionResult.logs || [];
      executionResult.logs.unshift(
        `⚠️  WARNING: This script contains write operations (${writeOperations.join(', ')}) that will persist changes to the database.`
      );
    }

    // Handle different return types
    const data = result.result;

    // Check if this is a test mode result with metadata
    if (data && typeof data === 'object' && data.__testMode) {
      executionResult.data = data.data;
      executionResult.truncated = data.__truncated || false;
      executionResult.recordCount = Array.isArray(data.data) ? data.data.length : undefined;
      
      if (data.__truncated && data.__originalCount) {
        executionResult.logs = executionResult.logs || [];
        executionResult.logs.push(`Results truncated: showing ${data.data.length} of ${data.__originalCount} records`);
      }
      
      return executionResult;
    }

    // Handle Stream results (arrays) with truncation for large result sets
    if (Array.isArray(data)) {
      const MAX_RESULTS = 1000; // Maximum results in normal mode
      const shouldTruncate = data.length > MAX_RESULTS;
      
      executionResult.data = shouldTruncate ? data.slice(0, MAX_RESULTS) : data;
      executionResult.recordCount = executionResult.data.length;
      executionResult.truncated = shouldTruncate;
      
      if (shouldTruncate) {
        executionResult.logs = executionResult.logs || [];
        executionResult.logs.push(`Results truncated: showing ${MAX_RESULTS} of ${data.length} records`);
      }
      
      return executionResult;
    }

    // Handle Optional results (objects with value)
    if (data && typeof data === 'object' && 'value' in data) {
      executionResult.data = data.value;
      return executionResult;
    }

    // Handle primitive results (numbers, strings, booleans) with type information
    if (typeof data === 'number' || typeof data === 'string' || typeof data === 'boolean') {
      executionResult.data = {
        value: data,
        type: typeof data
      };
      return executionResult;
    }

    // Handle aggregate results (objects with rowCount or aggregate values)
    if (data && typeof data === 'object') {
      executionResult.data = data;
      if ('rowCount' in data) {
        executionResult.recordCount = data.rowCount;
      }
      return executionResult;
    }

    // Handle null/undefined results with appropriate message
    if (data === null || data === undefined) {
      executionResult.data = null;
      executionResult.logs = executionResult.logs || [];
      executionResult.logs.push('No records found - query returned empty result');
      return executionResult;
    }

    // Default: return data as-is
    executionResult.data = data;
    return executionResult;
  }
}
