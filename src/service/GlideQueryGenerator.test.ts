import { GlideQueryGenerator } from './GlideQueryGenerator.js';

describe('GlideQueryGenerator', () => {
  const generator = new GlideQueryGenerator();

  describe('Basic Query Generation', () => {
    it('should generate simple select query', () => {
      const result = generator.generate({
        description: 'get all incidents',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('incident')");
      expect(result.code).toContain('.select()');
    });

    it('should generate select query with specific fields', () => {
      const result = generator.generate({
        description: 'get number and short_description from incident',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('incident')");
      expect(result.code).toContain(".select('number', 'short_description')");
    });

    it('should generate selectOne query', () => {
      const result = generator.generate({
        description: 'get single incident where number equals INC0010001',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('incident')");
      expect(result.code).toContain('.selectOne()');
    });

    it('should generate get by sys_id query', () => {
      const result = generator.generate({
        description: 'get incident by sys_id',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('incident')");
      expect(result.code).toContain('.get(sys_id)');
    });
  });

  describe('Filtering', () => {
    it('should generate query with equals condition', () => {
      const result = generator.generate({
        description: 'get incidents where active equals true',
        includeComments: false
      });

      expect(result.code).toContain(".where('active', true)");
    });

    it('should generate query with greater than condition', () => {
      const result = generator.generate({
        description: 'get incidents where priority > 3',
        includeComments: false
      });

      expect(result.code).toContain(".where('priority', '>', 3)");
    });

    it('should generate query with less than or equal condition', () => {
      const result = generator.generate({
        description: 'get incidents where priority <= 2',
        includeComments: false
      });

      expect(result.code).toContain(".where('priority', '<=', 2)");
    });

    it('should generate query with CONTAINS operator', () => {
      const result = generator.generate({
        description: 'get incidents where short_description contains network',
        includeComments: false
      });

      expect(result.code).toContain(".where('short_description', 'CONTAINS', 'network')");
    });

    it('should generate query with STARTSWITH operator', () => {
      const result = generator.generate({
        description: 'get incidents where number starts with INC',
        includeComments: false
      });

      expect(result.code).toContain(".where('number', 'STARTSWITH', 'INC')");
    });

    it('should generate query with ENDSWITH operator', () => {
      const result = generator.generate({
        description: 'get incidents where number ends with 001',
        includeComments: false
      });

      expect(result.code).toContain(".where('number', 'ENDSWITH', '001')");
    });

    it('should generate query with IN operator', () => {
      const result = generator.generate({
        description: 'get incidents where state in [1, 2, 3]',
        includeComments: false
      });

      expect(result.code).toContain(".where('state', 'IN', ['1', '2', '3'])");
    });

    it('should generate query with null check', () => {
      const result = generator.generate({
        description: 'get incidents where assigned_to is null',
        includeComments: false
      });

      expect(result.code).toContain(".whereNull('assigned_to')");
    });

    it('should generate query with not null check', () => {
      const result = generator.generate({
        description: 'get incidents where assigned_to is not null',
        includeComments: false
      });

      expect(result.code).toContain(".whereNotNull('assigned_to')");
    });

    it('should generate query with OR condition', () => {
      const result = generator.generate({
        description: 'get incidents where priority = 1 or priority = 2',
        includeComments: false
      });

      expect(result.code).toContain(".where('priority', 1)");
      expect(result.code).toContain(".orWhere('priority', 2)");
    });

    it('should generate query with dot-walking', () => {
      const result = generator.generate({
        description: 'get incidents where caller_id.department equals IT',
        includeComments: false
      });

      expect(result.code).toContain(".where('caller_id.department', 'IT')");
    });
  });

  describe('Ordering', () => {
    it('should generate query with ascending order', () => {
      const result = generator.generate({
        description: 'get incidents ordered by priority',
        includeComments: false
      });

      expect(result.code).toContain(".orderBy('priority')");
    });

    it('should generate query with descending order', () => {
      const result = generator.generate({
        description: 'get incidents ordered by sys_created_on descending',
        includeComments: false
      });

      expect(result.code).toContain(".orderByDesc('sys_created_on')");
    });
  });

  describe('Limiting', () => {
    it('should generate query with limit', () => {
      const result = generator.generate({
        description: 'get incidents limited to 10',
        includeComments: false
      });

      expect(result.code).toContain('.limit(10)');
    });

    it('should generate query with first N pattern', () => {
      const result = generator.generate({
        description: 'get first 5 incidents',
        includeComments: false
      });

      expect(result.code).toContain('.limit(5)');
    });
  });

  describe('Field Flags', () => {
    it('should generate query with display value flag', () => {
      const result = generator.generate({
        description: 'get assigned_to display value from incident',
        includeComments: false
      });

      expect(result.code).toContain("'assigned_to$DISPLAY'");
    });
  });

  describe('Aggregates', () => {
    it('should generate count query', () => {
      const result = generator.generate({
        description: 'count incidents',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('incident')");
      expect(result.code).toContain('.count()');
    });

    it('should generate average query', () => {
      const result = generator.generate({
        description: 'average of priority from incident',
        includeComments: false
      });

      expect(result.code).toContain(".avg('priority')");
    });

    it('should generate sum query', () => {
      const result = generator.generate({
        description: 'sum of impact from incident',
        includeComments: false
      });

      expect(result.code).toContain(".sum('impact')");
    });

    it('should generate min query', () => {
      const result = generator.generate({
        description: 'minimum priority from incident',
        includeComments: false
      });

      expect(result.code).toContain(".min('priority')");
    });

    it('should generate max query', () => {
      const result = generator.generate({
        description: 'maximum priority from incident',
        includeComments: false
      });

      expect(result.code).toContain(".max('priority')");
    });

    it('should generate group by query', () => {
      const result = generator.generate({
        description: 'count incidents grouped by assigned_to',
        includeComments: false
      });

      expect(result.code).toContain(".groupBy('assigned_to')");
      expect(result.code).toContain(".aggregate('COUNT', '*')");
    });

    it('should generate having clause', () => {
      const result = generator.generate({
        description: 'count incidents grouped by assigned_to having COUNT * > 5',
        includeComments: false
      });

      expect(result.code).toContain(".groupBy('assigned_to')");
      expect(result.code).toContain(".having('COUNT', '*', '>', 5)");
    });
  });

  describe('Write Operations', () => {
    it('should generate insert query', () => {
      const result = generator.generate({
        description: 'insert incident',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('incident')");
      expect(result.code).toContain('.insert({ /* field: value */ })');
      expect(result.warnings).toContain('This is a write operation that will modify data in the database');
    });

    it('should generate update query', () => {
      const result = generator.generate({
        description: 'update incident where number equals INC0010001',
        includeComments: false
      });

      expect(result.code).toContain(".where('number', 'INC0010001')");
      expect(result.code).toContain('.update({ /* field: value */ })');
      expect(result.warnings).toContain('This is a write operation that will modify data in the database');
    });

    it('should generate updateMultiple query', () => {
      const result = generator.generate({
        description: 'update multiple incidents where active equals true',
        includeComments: false
      });

      expect(result.code).toContain(".where('active', true)");
      expect(result.code).toContain('.updateMultiple({ /* field: value */ })');
      expect(result.warnings).toContain('This is a bulk operation that may affect multiple records');
    });

    it('should generate deleteMultiple query', () => {
      const result = generator.generate({
        description: 'delete incidents where state = 7',
        includeComments: false
      });

      expect(result.code).toContain(".where('state', 7)");
      expect(result.code).toContain('.deleteMultiple()');
      expect(result.warnings).toContain('This is a bulk operation that may affect multiple records');
    });

    it('should generate insertOrUpdate query', () => {
      const result = generator.generate({
        description: 'insert or update incident',
        includeComments: false
      });

      expect(result.code).toContain('.insertOrUpdate({ /* sys_id: id, field: value */ })');
    });

    it('should warn about write operations without conditions', () => {
      const result = generator.generate({
        description: 'update multiple incidents',
        includeComments: false
      });

      expect(result.warnings).toContain('No filter conditions specified - this will affect ALL records in the table');
    });
  });

  describe('Modifiers', () => {
    it('should generate query with disableWorkflow modifier', () => {
      const result = generator.generate({
        description: 'update incident where number equals INC0010001 disable workflow',
        includeComments: false
      });

      expect(result.code).toContain('.disableWorkflow()');
      expect(result.warnings).toContain('Workflow is disabled - business rules will not execute');
    });

    it('should generate query with withAcls modifier', () => {
      const result = generator.generate({
        description: 'get incidents with acls',
        includeComments: false
      });

      expect(result.code).toContain('.withAcls()');
    });

    it('should generate query with withSecurityDataFilters modifier', () => {
      const result = generator.generate({
        description: 'get incidents with security filters',
        includeComments: false
      });

      expect(result.code).toContain('.withSecurityDataFilters()');
    });
  });

  describe('Table Detection', () => {
    it('should detect incident table', () => {
      const result = generator.generate({
        description: 'get all incidents',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('incident')");
    });

    it('should detect problem table', () => {
      const result = generator.generate({
        description: 'get all problems',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('problem')");
    });

    it('should detect user table', () => {
      const result = generator.generate({
        description: 'get all users',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('user')");
    });

    it('should use table hint when provided', () => {
      const result = generator.generate({
        description: 'get all records',
        table: 'custom_table',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('custom_table')");
    });

    it('should extract table from "from" clause', () => {
      const result = generator.generate({
        description: 'get all records from change_request',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('change_request')");
    });
  });

  describe('Comments', () => {
    it('should include comments when includeComments is true', () => {
      const result = generator.generate({
        description: 'get all incidents',
        includeComments: true
      });

      expect(result.code).toContain('// Query incident table');
      expect(result.code).toContain('// Retrieve multiple records');
    });

    it('should not include comments when includeComments is false', () => {
      const result = generator.generate({
        description: 'get all incidents',
        includeComments: false
      });

      expect(result.code).not.toContain('//');
    });

    it('should include comments by default', () => {
      const result = generator.generate({
        description: 'get all incidents'
      });

      expect(result.code).toContain('// Query incident table');
    });

    it('should add usage notes for Optional results', () => {
      const result = generator.generate({
        description: 'get single incident',
        includeComments: true
      });

      expect(result.code).toContain('// Returns Optional');
      expect(result.code).toContain('.orElse()');
    });

    it('should add usage notes for Stream results', () => {
      const result = generator.generate({
        description: 'get all incidents',
        includeComments: true
      });

      expect(result.code).toContain('// Returns Stream');
      expect(result.code).toContain('.forEach()');
    });
  });

  describe('Complex Queries', () => {
    it('should generate complex query with multiple conditions, ordering, and limit', () => {
      const result = generator.generate({
        description: 'get number and short_description from incident where active equals true and priority <= 3 ordered by sys_created_on descending limited to 10',
        includeComments: false
      });

      expect(result.code).toContain("new GlideQuery('incident')");
      expect(result.code).toContain(".where('active', true)");
      expect(result.code).toContain(".where('priority', '<=', 3)");
      expect(result.code).toContain(".orderByDesc('sys_created_on')");
      expect(result.code).toContain('.limit(10)');
      expect(result.code).toContain(".select('number', 'short_description')");
    });

    it('should generate query with multiple OR conditions', () => {
      const result = generator.generate({
        description: 'get incidents where priority = 1 or priority = 2 or priority = 3',
        includeComments: false
      });

      expect(result.code).toContain(".where('priority', 1)");
      expect(result.code).toContain(".orWhere('priority', 2)");
      expect(result.code).toContain(".orWhere('priority', 3)");
    });
  });

  describe('Explanation', () => {
    it('should generate explanation for simple query', () => {
      const result = generator.generate({
        description: 'get all incidents'
      });

      expect(result.explanation).toBeDefined();
      expect(result.explanation).toContain('incident');
      expect(result.explanation).toContain('select');
    });

    it('should include filter count in explanation', () => {
      const result = generator.generate({
        description: 'get incidents where active equals true and priority <= 3'
      });

      expect(result.explanation).toContain('2 filter condition(s)');
    });

    it('should include ordering in explanation', () => {
      const result = generator.generate({
        description: 'get incidents ordered by priority'
      });

      expect(result.explanation).toContain('ordered by priority');
    });

    it('should include limit in explanation', () => {
      const result = generator.generate({
        description: 'get incidents limited to 10'
      });

      expect(result.explanation).toContain('limited to 10 records');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty description gracefully', () => {
      const result = generator.generate({
        description: ''
      });

      expect(result.code).toBeDefined();
      // Should still generate some code, even if basic
    });

    it('should handle ambiguous descriptions', () => {
      const result = generator.generate({
        description: 'do something'
      });

      expect(result.code).toBeDefined();
      expect(result.code).toContain('new GlideQuery');
    });
  });
});
