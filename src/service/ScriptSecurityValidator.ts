import { SecurityConfig, SecurityValidationResult } from '../types/interfaces.js';

/**
 * ScriptSecurityValidator provides security validation for GlideQuery scripts
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
}
