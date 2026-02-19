import { SecurityConfig, SecurityValidationResult } from '../types/interfaces.js';
import { ScriptValidationResult, ValidationMessage } from '../types/scriptInclude.js';

/**
 * ScriptSecurityValidator provides security validation for GlideQuery scripts and Script Includes
 * 
 * Validates scripts against blacklisted patterns, detects dangerous operations,
 * and enforces script length limits to prevent security vulnerabilities.
 */
export class ScriptSecurityValidator {
  private config: SecurityConfig;

  /**
   * Default security configuration
   */
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    blacklistedPatterns: [
      /gs\.executeNow\s*\(/i,
      /gs\.eval\s*\(/i,
      /eval\s*\(/i,
      /Function\s*\(/i,
      /GlideRecord\s*\(/i, // Discourage GlideRecord in favor of GlideQuery
      /GlideSysAttachment/i,
      /GlideScriptedProcessor/i,
      /XMLDocument/i,
      /SOAPMessage/i,
      /require\s*\(/i, // Prevent module loading
      /import\s+/i, // Prevent ES6 imports
      /\.readLine\(/i, // File system access
      /\.write\(/i, // File system write
      /\.getFile\(/i, // File system access
      /\.setFile\(/i, // File system access
      /GlideHTTPRequest/i, // Network requests
      /RESTMessageV2/i, // Network requests
      /SOAPMessageV2/i, // Network requests
    ],
    requireConfirmation: [
      'deleteMultiple',
      'updateMultiple',
      'disableWorkflow',
      'disableAutoSysFields',
      'forceUpdate',
    ],
    maxScriptLength: 10000,
  };

  /**
   * Create a ScriptSecurityValidator instance
   * 
   * @param config - Optional security configuration (uses defaults if not provided)
   */
  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      ...ScriptSecurityValidator.DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Validate a script for security issues
   * 
   * Checks script length, blacklisted patterns, and dangerous operations.
   * 
   * @param script - Script to validate
   * @returns SecurityValidationResult with safety status and any violations
   */
  validate(script: string): SecurityValidationResult {
    const violations: string[] = [];
    const dangerousOperations: string[] = [];

    // Check script length
    if (script.length > this.config.maxScriptLength) {
      violations.push(
        `Script exceeds maximum length of ${this.config.maxScriptLength} characters (actual: ${script.length})`
      );
    }

    // Check against blacklisted patterns
    for (const pattern of this.config.blacklistedPatterns) {
      if (pattern.test(script)) {
        violations.push(`Blacklisted pattern detected: ${pattern.source}`);
      }
    }

    // Detect dangerous operations
    const detected = this.detectDangerousOperations(script);
    dangerousOperations.push(...detected);

    return {
      safe: violations.length === 0,
      violations: violations.length > 0 ? violations : undefined,
      dangerousOperations: dangerousOperations.length > 0 ? dangerousOperations : undefined,
    };
  }

  /**
   * Detect dangerous operations in script
   * 
   * Identifies operations that require confirmation or special handling,
   * such as bulk deletes, bulk updates, and workflow bypasses.
   * 
   * @param script - Script to analyze
   * @returns Array of detected dangerous operations
   */
  private detectDangerousOperations(script: string): string[] {
    const operations: string[] = [];

    // Check for each dangerous operation
    if (/\.deleteMultiple\s*\(/i.test(script)) {
      operations.push('deleteMultiple');
    }

    if (/\.updateMultiple\s*\(/i.test(script)) {
      operations.push('updateMultiple');
    }

    if (/\.disableWorkflow\s*\(/i.test(script)) {
      operations.push('disableWorkflow');
    }

    if (/\.disableAutoSysFields\s*\(/i.test(script)) {
      operations.push('disableAutoSysFields');
    }

    if (/\.forceUpdate\s*\(/i.test(script)) {
      operations.push('forceUpdate');
    }

    return operations;
  }

  /**
   * Get the current security configuration
   * 
   * @returns Current SecurityConfig
   */
  getConfig(): SecurityConfig {
    return { ...this.config };
  }

  /**
   * Update security configuration
   * 
   * @param config - Partial configuration to merge with current config
   */
  updateConfig(config: Partial<SecurityConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Blacklisted patterns specifically for Script Includes
   * These patterns are security violations and will cause validation to fail
   */
  private static readonly SCRIPT_INCLUDE_BLACKLIST = [
    { pattern: /eval\s*\(/i, message: 'eval()', detail: 'Arbitrary code execution is not allowed for security reasons' },
    { pattern: /new\s+Function\s*\(/i, message: 'Function constructor', detail: 'Dynamic function creation is not allowed for security reasons' },
    { pattern: /require\s*\(/i, message: 'require()', detail: 'Module loading is not allowed for security reasons' },
    { pattern: /import\s+/i, message: 'import statement', detail: 'ES6 imports are not allowed for security reasons' },
    { pattern: /GlideHTTPRequest/i, message: 'GlideHTTPRequest', detail: 'Unrestricted network requests are not allowed for security reasons' },
    { pattern: /RESTMessageV2/i, message: 'RESTMessageV2', detail: 'REST API calls without proper configuration are not allowed' },
    { pattern: /SOAPMessageV2/i, message: 'SOAPMessageV2', detail: 'SOAP calls without proper configuration are not allowed' },
    { pattern: /XMLDocument/i, message: 'XMLDocument', detail: 'XML parsing with potential XXE vulnerabilities is not allowed' },
    { pattern: /gs\.executeNow\s*\(/i, message: 'gs.executeNow()', detail: 'Immediate script execution is not allowed for security reasons' },
    { pattern: /\.readFile\(/i, message: 'readFile()', detail: 'File system access is not allowed for security reasons' },
    { pattern: /\.writeFile\(/i, message: 'writeFile()', detail: 'File system write is not allowed for security reasons' },
    { pattern: /\.getFile\(/i, message: 'getFile()', detail: 'File system access is not allowed for security reasons' },
    { pattern: /\.setFile\(/i, message: 'setFile()', detail: 'File system write is not allowed for security reasons' },
    { pattern: /\bfs\./i, message: 'fs module', detail: 'File system module access is not allowed for security reasons' },
  ];

  /**
   * Discouraged patterns for Script Includes
   * These patterns generate warnings but don't fail validation
   */
  private static readonly SCRIPT_INCLUDE_DISCOURAGED = [
    { pattern: /new\s+GlideRecord\s*\(/i, message: 'GlideRecord usage detected', detail: 'Consider using GlideQuery for better performance and modern API' },
    { pattern: /gs\.print\s*\(/i, message: 'gs.print() usage detected', detail: 'Consider using gs.info() or gs.log() for proper logging' },
  ];

  /**
   * Validate a Script Include script for security issues and best practices
   * 
   * Checks script length, blacklisted patterns (errors), and discouraged patterns (warnings).
   * Unlike the standard validate() method, this returns separate errors and warnings.
   * 
   * @param script - Script Include code to validate
   * @returns ScriptValidationResult with valid flag, warnings, and errors
   */
  validateScriptInclude(script: string): ScriptValidationResult {
    const errors: ValidationMessage[] = [];
    const warnings: ValidationMessage[] = [];

    // Check script length
    if (script.length > this.config.maxScriptLength) {
      errors.push({
        type: 'VALIDATION_ERROR',
        message: 'Script exceeds maximum length',
        detail: `Script length ${script.length} exceeds maximum of ${this.config.maxScriptLength} characters`
      });
    }

    // Check against blacklisted patterns (security violations)
    for (const { pattern, message, detail } of ScriptSecurityValidator.SCRIPT_INCLUDE_BLACKLIST) {
      if (pattern.test(script)) {
        errors.push({
          type: 'SECURITY_VIOLATION',
          message: `Detected dangerous pattern: ${message}`,
          detail
        });
      }
    }

    // Check against discouraged patterns (warnings)
    for (const { pattern, message, detail } of ScriptSecurityValidator.SCRIPT_INCLUDE_DISCOURAGED) {
      if (pattern.test(script)) {
        warnings.push({
          type: 'DISCOURAGED_PATTERN',
          message,
          detail
        });
      }
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors
    };
  }
}
