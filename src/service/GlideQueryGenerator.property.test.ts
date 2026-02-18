import * as fc from 'fast-check';
import { GlideQueryGenerator } from './GlideQueryGenerator.js';
import { GlideQueryExecutor } from './GlideQueryExecutor.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';

// Feature: glidequery-development-tools

describe('GlideQueryGenerator Property Tests', () => {
  const generator = new GlideQueryGenerator();

  // Property 9: Generated code is syntactically valid
  // **Validates: Requirements 2.1**
  describe('Property 9: Generated code is syntactically valid', () => {
    it('should generate syntactically valid GlideQuery code for any description', () => {
      // Feature: glidequery-development-tools, Property 9: Generated code is syntactically valid
      
      // Arbitraries for generating test data
      const tableArb = fc.constantFrom(
        'incident', 'problem', 'change_request', 'task', 'user', 'sys_user'
      );
      
      const operationArb = fc.constantFrom(
        'get all', 'find', 'select', 'count', 'get single', 'get first'
      );
      
      const fieldArb = fc.constantFrom(
        'number', 'short_description', 'priority', 'state', 'active', 'assigned_to'
      );
      
      const conditionArb = fc.record({
        field: fieldArb,
        operator: fc.constantFrom('equals', 'is', '>', '<', '>=', '<=', 'contains', 'starts with'),
        value: fc.oneof(
          fc.integer({ min: 1, max: 10 }),
          fc.boolean(),
          fc.constantFrom('test', 'active', 'closed')
        )
      });
      
      const descriptionArb = fc.tuple(
        operationArb,
        tableArb,
        fc.option(fc.array(conditionArb, { minLength: 0, maxLength: 3 }), { nil: undefined })
      ).map(([operation, table, conditions]) => {
        let desc = `${operation} ${table}`;
        
        if (conditions && conditions.length > 0) {
          desc += ' where ';
          desc += conditions.map(c => 
            `${c.field} ${c.operator} ${c.value}`
          ).join(' and ');
        }
        
        return desc;
      });
      
      fc.assert(
        fc.property(descriptionArb, (description) => {
          const result = generator.generate({
            description,
            includeComments: false
          });
          
          // Code should not be empty
          expect(result.code).toBeTruthy();
          expect(result.code.length).toBeGreaterThan(0);
          
          // Code should contain GlideQuery constructor
          expect(result.code).toContain('new GlideQuery(');
          
          // Code should have matching parentheses
          const openParens = (result.code.match(/\(/g) || []).length;
          const closeParens = (result.code.match(/\)/g) || []).length;
          expect(openParens).toBe(closeParens);
          
          // Code should have matching quotes
          const singleQuotes = (result.code.match(/'/g) || []).length;
          expect(singleQuotes % 2).toBe(0);
          
          // Code should end with semicolon
          expect(result.code.trim()).toMatch(/;$/);
          
          // Code should be valid JavaScript (basic check)
          // Try to parse it - this will throw if syntax is invalid
          expect(() => {
            // Wrap in function to avoid execution
            new Function(`return function() { ${result.code} };`);
          }).not.toThrow();
          
          // Code should contain a terminal operation
          const terminalOps = [
            '.select(', '.selectOne(', '.get(', '.count()', 
            '.insert(', '.update(', '.updateMultiple(', '.deleteMultiple(',
            '.avg(', '.sum(', '.min(', '.max(', '.aggregate('
          ];
          const hasTerminalOp = terminalOps.some(op => result.code.includes(op));
          expect(hasTerminalOp).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 10: Generated code includes comments
  // **Validates: Requirements 2.2**
  describe('Property 10: Generated code includes comments', () => {
    it('should include comments when includeComments is true', () => {
      // Feature: glidequery-development-tools, Property 10: Generated code includes comments
      
      const tableArb = fc.constantFrom(
        'incident', 'problem', 'change_request', 'task'
      );
      
      const operationArb = fc.constantFrom(
        'get all', 'find', 'select', 'count', 'insert', 'update', 'delete'
      );
      
      const descriptionArb = fc.tuple(operationArb, tableArb).map(
        ([operation, table]) => `${operation} ${table}`
      );
      
      fc.assert(
        fc.property(descriptionArb, (description) => {
          const result = generator.generate({
            description,
            includeComments: true
          });
          
          // Code should contain at least one comment
          expect(result.code).toMatch(/\/\//);
          
          // Code should contain query description comment
          expect(result.code).toContain('// Query');
          
          // Code should contain operation description comment
          const operationComments = [
            '// Retrieve', '// Count', '// Insert', '// Update', '// Delete',
            '// Get', '// Perform'
          ];
          const hasOperationComment = operationComments.some(
            comment => result.code.includes(comment)
          );
          expect(hasOperationComment).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should not include comments when includeComments is false', () => {
      // Feature: glidequery-development-tools, Property 10: Generated code includes comments (negative case)
      
      const descriptionArb = fc.string({ minLength: 10, maxLength: 100 }).filter(
        s => s.includes('get') || s.includes('find') || s.includes('select')
      );
      
      fc.assert(
        fc.property(descriptionArb, (description) => {
          const result = generator.generate({
            description,
            includeComments: false
          });
          
          // Code should not contain comments
          expect(result.code).not.toMatch(/\/\//);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 11: Table name preservation
  // **Validates: Requirements 2.3**
  describe('Property 11: Table name preservation', () => {
    it('should use exact table name from description', () => {
      // Feature: glidequery-development-tools, Property 11: Table name preservation
      
      const tableArb = fc.constantFrom(
        'incident', 'problem', 'change_request', 'task', 'user', 'sys_user',
        'cmdb_ci', 'cmdb_ci_server', 'kb_knowledge', 'sc_request'
      );
      
      const operationArb = fc.constantFrom(
        'get all', 'find', 'select', 'count'
      );
      
      fc.assert(
        fc.property(tableArb, operationArb, (table, operation) => {
          const description = `${operation} ${table}`;
          
          const result = generator.generate({
            description,
            includeComments: false
          });
          
          // Generated code should contain the exact table name
          expect(result.code).toContain(`new GlideQuery('${table}')`);
        }),
        { numRuns: 100 }
      );
    });

    it('should use table hint when provided', () => {
      // Feature: glidequery-development-tools, Property 11: Table name preservation (with hint)
      
      const tableHintArb = fc.string({ minLength: 3, maxLength: 30 }).filter(
        s => /^[a-z][a-z0-9_]*$/.test(s)
      );
      
      const descriptionArb = fc.constantFrom(
        'get all records', 'find records', 'select all', 'count records'
      );
      
      fc.assert(
        fc.property(tableHintArb, descriptionArb, (tableHint, description) => {
          const result = generator.generate({
            description,
            table: tableHint,
            includeComments: false
          });
          
          // Generated code should use the table hint
          expect(result.code).toContain(`new GlideQuery('${tableHint}')`);
        }),
        { numRuns: 100 }
      );
    });

    it('should extract table from "from" clause', () => {
      // Feature: glidequery-development-tools, Property 11: Table name preservation (from clause)
      
      const tableArb = fc.constantFrom(
        'incident', 'problem', 'change_request', 'task', 'user'
      );
      
      const operationArb = fc.constantFrom(
        'get all records', 'select records', 'find records'
      );
      
      fc.assert(
        fc.property(tableArb, operationArb, (table, operation) => {
          const description = `${operation} from ${table}`;
          
          const result = generator.generate({
            description,
            includeComments: false
          });
          
          // Generated code should extract and use the table name from "from" clause
          expect(result.code).toContain(`new GlideQuery('${table}')`);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Additional property: Generated code can be validated
  describe('Property: Generated code passes validation', () => {
    it('should generate code that passes GlideQueryExecutor validation', () => {
      // Feature: glidequery-development-tools, Property: Generated code passes validation
      
      const mockClient = {
        executeScript: async () => ({ success: true, result: [], executionTime: 0 })
      } as any;
      const executor = new GlideQueryExecutor(mockClient);
      
      const tableArb = fc.constantFrom('incident', 'problem', 'task');
      const operationArb = fc.constantFrom('get all', 'select', 'count');
      
      const descriptionArb = fc.tuple(operationArb, tableArb).map(
        ([operation, table]) => `${operation} ${table}`
      );
      
      fc.assert(
        fc.property(descriptionArb, (description) => {
          const result = generator.generate({
            description,
            includeComments: false
          });
          
          // Generated code should pass validation
          const validation = executor.validate(result.code);
          
          // Should be valid (no errors)
          expect(validation.valid).toBe(true);
          expect(validation.errors).toBeUndefined();
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property: Generated code structure is consistent
  describe('Property: Generated code structure is consistent', () => {
    it('should generate code with consistent method chaining order', () => {
      // Feature: glidequery-development-tools, Property: Generated code structure is consistent
      
      const descriptionArb = fc.record({
        operation: fc.constantFrom('get', 'select', 'find'),
        table: fc.constantFrom('incident', 'problem'),
        hasCondition: fc.boolean(),
        hasOrdering: fc.boolean(),
        hasLimit: fc.boolean()
      }).map(({ operation, table, hasCondition, hasOrdering, hasLimit }) => {
        let desc = `${operation} ${table}`;
        if (hasCondition) desc += ' where active equals true';
        if (hasOrdering) desc += ' ordered by priority';
        if (hasLimit) desc += ' limited to 10';
        return desc;
      });
      
      fc.assert(
        fc.property(descriptionArb, (description) => {
          const result = generator.generate({
            description,
            includeComments: false
          });
          
          // Check method chaining order:
          // 1. Constructor
          // 2. where clauses
          // 3. orderBy/limit
          // 4. terminal operation
          
          const constructorIndex = result.code.indexOf('new GlideQuery(');
          expect(constructorIndex).toBeGreaterThanOrEqual(0);
          
          const whereIndex = result.code.indexOf('.where(');
          const orderIndex = result.code.indexOf('.order');
          const limitIndex = result.code.indexOf('.limit(');
          const selectIndex = result.code.indexOf('.select');
          
          // If where exists, it should come after constructor
          if (whereIndex >= 0) {
            expect(whereIndex).toBeGreaterThan(constructorIndex);
          }
          
          // If orderBy exists, it should come after where (if where exists)
          if (orderIndex >= 0 && whereIndex >= 0) {
            expect(orderIndex).toBeGreaterThan(whereIndex);
          }
          
          // If limit exists, it should come after where and orderBy
          if (limitIndex >= 0) {
            if (whereIndex >= 0) expect(limitIndex).toBeGreaterThan(whereIndex);
            if (orderIndex >= 0) expect(limitIndex).toBeGreaterThan(orderIndex);
          }
          
          // Terminal operation should come last
          if (selectIndex >= 0) {
            if (whereIndex >= 0) expect(selectIndex).toBeGreaterThan(whereIndex);
            if (orderIndex >= 0) expect(selectIndex).toBeGreaterThan(orderIndex);
            if (limitIndex >= 0) expect(selectIndex).toBeGreaterThan(limitIndex);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property: Warnings are provided for dangerous operations
  describe('Property: Warnings are provided for dangerous operations', () => {
    it('should warn about write operations', () => {
      // Feature: glidequery-development-tools, Property: Warnings for dangerous operations
      
      const writeOperationArb = fc.constantFrom(
        'insert', 'update', 'update multiple', 'delete', 'delete multiple'
      );
      
      const tableArb = fc.constantFrom('incident', 'problem', 'task');
      
      fc.assert(
        fc.property(writeOperationArb, tableArb, (operation, table) => {
          const description = `${operation} ${table}`;
          
          const result = generator.generate({
            description,
            includeComments: false
          });
          
          // Should have warnings for write operations
          expect(result.warnings).toBeDefined();
          expect(result.warnings!.length).toBeGreaterThan(0);
          expect(result.warnings!.some(w => 
            w.includes('write operation') || w.includes('modify data')
          )).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should warn about bulk operations', () => {
      // Feature: glidequery-development-tools, Property: Warnings for bulk operations
      
      const bulkOperationArb = fc.constantFrom(
        'update multiple', 'bulk update', 'delete multiple', 'bulk delete'
      );
      
      const tableArb = fc.constantFrom('incident', 'problem');
      
      fc.assert(
        fc.property(bulkOperationArb, tableArb, (operation, table) => {
          const description = `${operation} ${table}`;
          
          const result = generator.generate({
            description,
            includeComments: false
          });
          
          // Should have warnings for bulk operations
          expect(result.warnings).toBeDefined();
          expect(result.warnings!.some(w => 
            w.includes('bulk operation') || w.includes('multiple records')
          )).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
