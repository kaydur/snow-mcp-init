import * as fc from 'fast-check';
import { ScriptSecurityValidator } from './ScriptSecurityValidator.js';

// Feature: glidequery-development-tools, Property 19: Dangerous operation detection
// **Validates: Requirements 7.2**

// Feature: glidequery-development-tools, Property 21: Blacklist enforcement
// **Validates: Requirements 7.4**

describe('ScriptSecurityValidator - Property-Based Tests', () => {
  let validator: ScriptSecurityValidator;

  beforeEach(() => {
    validator = new ScriptSecurityValidator();
  });

  describe('Property 19: Dangerous operation detection', () => {
    it('should detect dangerous operations in any script containing them', async () => {
      await fc.assert(
        fc.property(
          // Generate scripts with dangerous operations
          fc.record({
            operation: fc.constantFrom(
              'deleteMultiple',
              'updateMultiple',
              'disableWorkflow',
              'disableAutoSysFields',
              'forceUpdate'
            ),
            table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
            prefix: fc.constantFrom('', '  ', '\n', '\t'),
            casing: fc.constantFrom('lower', 'upper', 'mixed')
          }),
          ({ operation, table, prefix, casing }) => {
            // Apply casing transformation
            let operationName = operation;
            if (casing === 'upper') {
              operationName = operation.toUpperCase();
            } else if (casing === 'mixed') {
              operationName = operation.charAt(0).toUpperCase() + operation.slice(1);
            }

            // Build script with dangerous operation (always include parentheses)
            const script = `${prefix}new GlideQuery('${table}').${operationName}()`;

            const result = validator.validate(script);

            // Should detect the dangerous operation (case-insensitive)
            expect(result.dangerousOperations).toBeDefined();
            expect(result.dangerousOperations).toContain(operation);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect multiple dangerous operations in the same script', async () => {
      await fc.assert(
        fc.property(
          // Generate scripts with multiple dangerous operations
          fc.array(
            fc.constantFrom(
              'deleteMultiple',
              'updateMultiple',
              'disableWorkflow',
              'disableAutoSysFields',
              'forceUpdate'
            ),
            { minLength: 2, maxLength: 5 }
          ),
          fc.constantFrom('incident', 'problem', 'change_request'),
          (operations, table) => {
            // Remove duplicates
            const uniqueOps = [...new Set(operations)];
            
            // Build script with multiple dangerous operations
            const script = uniqueOps
              .map(op => `new GlideQuery('${table}').${op}()`)
              .join(';\n');

            const result = validator.validate(script);

            // Should detect all dangerous operations
            expect(result.dangerousOperations).toBeDefined();
            for (const op of uniqueOps) {
              expect(result.dangerousOperations).toContain(op);
            }
            expect(result.dangerousOperations!.length).toBe(uniqueOps.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not flag safe operations as dangerous', async () => {
      await fc.assert(
        fc.property(
          // Generate safe GlideQuery scripts
          fc.record({
            table: fc.constantFrom('incident', 'problem', 'change_request', 'task'),
            operation: fc.constantFrom(
              'select',
              'selectOne',
              'count',
              'get',
              'where',
              'orderBy',
              'orderByDesc',
              'limit',
              'withAcls'
            ),
            field: fc.constantFrom('active', 'state', 'priority', 'number'),
            value: fc.oneof(
              fc.boolean(),
              fc.integer({ min: 1, max: 5 }),
              fc.string({ minLength: 1, maxLength: 20 })
            )
          }),
          ({ table, operation, field, value }) => {
            // Build safe script
            let script: string;
            if (operation === 'select' || operation === 'selectOne' || operation === 'count') {
              script = `new GlideQuery('${table}').where('${field}', ${JSON.stringify(value)}).${operation}()`;
            } else if (operation === 'get') {
              script = `new GlideQuery('${table}').get('${value}')`;
            } else {
              script = `new GlideQuery('${table}').${operation}('${field}')`;
            }

            const result = validator.validate(script);

            // Should not detect any dangerous operations
            expect(result.dangerousOperations).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 21: Blacklist enforcement', () => {
    it('should reject any script containing blacklisted patterns', async () => {
      await fc.assert(
        fc.property(
          // Generate scripts with blacklisted patterns
          fc.record({
            pattern: fc.constantFrom(
              'gs.executeNow',
              'gs.eval',
              'eval',
              'Function',
              'GlideRecord',
              'GlideSysAttachment',
              'GlideHTTPRequest',
              'RESTMessageV2',
              'require',
              'import'
            ),
            prefix: fc.constantFrom('', '  ', '\n', 'var x = '),
            suffix: fc.constantFrom('', '  ', '\n', '()'),
            argument: fc.string({ minLength: 1, maxLength: 20 })
          }),
          ({ pattern, prefix, suffix, argument }) => {
            // Build script with blacklisted pattern
            let script: string;
            if (pattern === 'import') {
              script = `${prefix}import ${argument} from "module"${suffix}`;
            } else if (pattern === 'require') {
              script = `${prefix}require("${argument}")${suffix}`;
            } else if (pattern === 'Function') {
              script = `${prefix}new Function("${argument}")${suffix}`;
            } else if (pattern.startsWith('Glide') || pattern.startsWith('REST') || pattern.startsWith('SOAP')) {
              script = `${prefix}new ${pattern}()${suffix}`;
            } else {
              script = `${prefix}${pattern}("${argument}")${suffix}`;
            }

            const result = validator.validate(script);

            // Should reject the script
            expect(result.safe).toBe(false);
            expect(result.violations).toBeDefined();
            expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept scripts without blacklisted patterns', async () => {
      await fc.assert(
        fc.property(
          // Generate safe GlideQuery scripts
          fc.record({
            table: fc.constantFrom('incident', 'problem', 'change_request', 'task', 'sys_user'),
            field: fc.constantFrom('active', 'state', 'priority', 'urgency', 'impact', 'number'),
            operator: fc.constantFrom('=', '!=', '>', '<', '>=', '<=', 'CONTAINS', 'STARTSWITH'),
            value: fc.oneof(
              fc.boolean(),
              fc.integer({ min: 1, max: 10 }),
              fc.string({ minLength: 1, maxLength: 30 }).filter(s => 
                // Filter out strings that might accidentally match blacklisted patterns
                !s.includes('eval') && 
                !s.includes('execute') && 
                !s.includes('Function') &&
                !s.includes('require') &&
                !s.includes('import')
              )
            ),
            operation: fc.constantFrom('select', 'selectOne', 'count', 'get')
          }),
          ({ table, field, operator, value, operation }) => {
            // Build safe GlideQuery script
            let script: string;
            if (operation === 'get') {
              script = `new GlideQuery('${table}').get('${value}')`;
            } else {
              script = `new GlideQuery('${table}').where('${field}', '${operator}', ${JSON.stringify(value)}).${operation}()`;
            }

            const result = validator.validate(script);

            // Should not have blacklist violations (may have dangerous operations, but that's separate)
            if (result.violations) {
              expect(result.violations.every(v => !v.includes('Blacklisted pattern'))).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect file system access patterns', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            method: fc.constantFrom('readLine', 'write', 'getFile', 'setFile'),
            prefix: fc.constantFrom('file.', 'obj.', 'x.'),
            argument: fc.string({ minLength: 0, maxLength: 20 })
          }),
          ({ method, prefix, argument }) => {
            const script = argument 
              ? `${prefix}${method}("${argument}")`
              : `${prefix}${method}()`;

            const result = validator.validate(script);

            // Should detect file system access
            expect(result.safe).toBe(false);
            expect(result.violations).toBeDefined();
            expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect network request patterns', async () => {
      await fc.assert(
        fc.property(
          fc.constantFrom('GlideHTTPRequest', 'RESTMessageV2', 'SOAPMessageV2'),
          fc.constantFrom('', 'var x = ', 'const req = '),
          (className, prefix) => {
            const script = `${prefix}new ${className}()`;

            const result = validator.validate(script);

            // Should detect network request pattern
            expect(result.safe).toBe(false);
            expect(result.violations).toBeDefined();
            expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Script length validation', () => {
    it('should reject any script exceeding maximum length', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 10001, max: 15000 }),
          fc.constantFrom('a', 'x', '1', ' ', '\n'),
          (length, char) => {
            const script = char.repeat(length);

            const result = validator.validate(script);

            // Should reject due to length
            expect(result.safe).toBe(false);
            expect(result.violations).toBeDefined();
            expect(result.violations!.some(v => v.includes('exceeds maximum length'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept any script within maximum length', async () => {
      await fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (length) => {
            // Generate a safe script of specified length
            const baseScript = "new GlideQuery('incident').select()";
            const padding = ' '.repeat(Math.max(0, length - baseScript.length));
            const script = baseScript + padding;

            const result = validator.validate(script);

            // Should not have length violation
            if (result.violations) {
              expect(result.violations.every(v => !v.includes('exceeds maximum length'))).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Combined validation', () => {
    it('should detect all violations in a script with multiple issues', async () => {
      await fc.assert(
        fc.property(
          fc.record({
            blacklistedPattern: fc.constantFrom('gs.eval', 'eval', 'gs.executeNow'),
            dangerousOp: fc.constantFrom('deleteMultiple', 'updateMultiple', 'disableWorkflow'),
            table: fc.constantFrom('incident', 'problem', 'task')
          }),
          ({ blacklistedPattern, dangerousOp, table }) => {
            const script = `
              ${blacklistedPattern}("malicious");
              new GlideQuery('${table}').${dangerousOp}();
            `;

            const result = validator.validate(script);

            // Should detect both blacklist violation and dangerous operation
            expect(result.safe).toBe(false);
            expect(result.violations).toBeDefined();
            expect(result.violations!.some(v => v.includes('Blacklisted pattern'))).toBe(true);
            expect(result.dangerousOperations).toBeDefined();
            expect(result.dangerousOperations).toContain(dangerousOp);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
