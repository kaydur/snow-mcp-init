import { logger } from '../utils/logger.js';

/**
 * Request parameters for code generation
 */
export interface GenerationRequest {
  /** Natural language description of the query */
  description: string;
  
  /** Optional table hint */
  table?: string;
  
  /** Whether to include explanatory comments (default true) */
  includeComments?: boolean;
}

/**
 * Result of code generation
 */
export interface GenerationResult {
  /** Generated GlideQuery code */
  code: string;
  
  /** Optional explanation of the generated code */
  explanation?: string;
  
  /** Optional warnings about the generation */
  warnings?: string[];
}

/**
 * Structured intent extracted from natural language description
 */
export interface QueryIntent {
  /** Type of operation */
  operation: 'select' | 'selectOne' | 'get' | 'insert' | 'update' | 'updateMultiple' | 'deleteMultiple' | 'insertOrUpdate' | 'count' | 'aggregate';
  
  /** Target table name */
  table: string;
  
  /** Fields to select (can include field flags like 'field$DISPLAY') */
  fields?: string[];
  
  /** Filter conditions */
  conditions?: Array<{
    field: string;
    operator: string;
    value: any;
    isNull?: boolean;
    isOr?: boolean;
  }>;
  
  /** Ordering specifications */
  orderBy?: Array<{
    field: string;
    descending?: boolean;
  }>;
  
  /** Result limit */
  limit?: number;
  
  /** Aggregate type */
  aggregateType?: 'COUNT' | 'AVG' | 'SUM' | 'MIN' | 'MAX';
  
  /** Field to aggregate */
  aggregateField?: string;
  
  /** Fields to group by */
  groupBy?: string[];
  
  /** Having clause for grouped results */
  having?: {
    aggregate: string;
    field: string;
    operator: string;
    value: any;
  };
  
  /** Query modifiers */
  modifiers?: {
    disableWorkflow?: boolean;
    disableAutoSysFields?: boolean;
    forceUpdate?: boolean;
    withAcls?: boolean;
    withSecurityDataFilters?: boolean;
  };
}

/**
 * GlideQueryGenerator generates GlideQuery code from natural language descriptions
 * 
 * Analyzes natural language input to extract query intent and produces
 * syntactically valid GlideQuery code with explanatory comments.
 */
export class GlideQueryGenerator {
  /**
   * Generate GlideQuery code from natural language description
   * 
   * @param request - Generation request with description and options
   * @returns GenerationResult with code and explanation
   */
  generate(request: GenerationRequest): GenerationResult {
    try {
      const includeComments = request.includeComments !== false; // default true
      
      // Parse description to extract intent
      const intent = this.parseDescription(request.description, request.table);
      
      // Build GlideQuery code
      let code = this.buildGlideQuery(intent);
      
      // Add comments if requested
      if (includeComments) {
        code = this.addComments(code, intent);
      }
      
      // Generate explanation
      const explanation = this.generateExplanation(intent);
      
      // Collect warnings
      const warnings = this.collectWarnings(intent);
      
      logger.info('glidequery_generate', 'Generated GlideQuery code', {
        params: {
          operation: intent.operation,
          table: intent.table
        }
      });
      
      return {
        code,
        explanation,
        warnings: warnings.length > 0 ? warnings : undefined
      };
      
    } catch (error: any) {
      logger.error('glidequery_generate', 'Code generation failed', { error });
      
      return {
        code: '',
        explanation: 'Failed to generate code',
        warnings: [error.message || 'Unknown error occurred']
      };
    }
  }

  /**
   * Parse natural language description to extract QueryIntent
   * 
   * @param description - Natural language description
   * @param tableHint - Optional table name hint
   * @returns Extracted QueryIntent
   */
  private parseDescription(description: string, tableHint?: string): QueryIntent {
    // Use lowercase for pattern matching but preserve original for value extraction
    const descLower = description.toLowerCase();
    
    // Extract table name
    const table = this.extractTable(descLower, tableHint);
    
    // Determine operation type
    const operation = this.extractOperation(descLower);
    
    // Extract fields (use original description to preserve case)
    const fields = this.extractFields(description, descLower);
    
    // Extract conditions (use original description to preserve case)
    const conditions = this.extractConditions(description, descLower);
    
    // Extract ordering
    const orderBy = this.extractOrdering(descLower);
    
    // Extract limit
    const limit = this.extractLimit(descLower);
    
    // Extract aggregate information
    const { aggregateType, aggregateField, groupBy, having } = this.extractAggregateInfo(descLower);
    
    // Extract modifiers
    const modifiers = this.extractModifiers(descLower);
    
    return {
      operation,
      table,
      fields,
      conditions,
      orderBy,
      limit,
      aggregateType,
      aggregateField,
      groupBy,
      having,
      modifiers
    };
  }

  /**
   * Extract table name from description
   */
  private extractTable(desc: string, tableHint?: string): string {
    if (tableHint) {
      return tableHint;
    }
    
    // Common ServiceNow tables - check for exact word boundaries
    // Also check for plural forms
    const tables = [
      { name: 'sys_user', patterns: ['sys_user', 'sys_users'] },
      { name: 'sys_user_group', patterns: ['sys_user_group', 'sys_user_groups'] },
      { name: 'incident', patterns: ['incident', 'incidents'] },
      { name: 'problem', patterns: ['problem', 'problems'] },
      { name: 'change_request', patterns: ['change_request', 'change_requests'] },
      { name: 'task', patterns: ['task', 'tasks'] },
      { name: 'user', patterns: ['user', 'users'] },
      { name: 'cmdb_ci', patterns: ['cmdb_ci', 'cmdb_cis'] },
      { name: 'cmdb_ci_server', patterns: ['cmdb_ci_server', 'cmdb_ci_servers'] },
      { name: 'cmdb_ci_computer', patterns: ['cmdb_ci_computer', 'cmdb_ci_computers'] },
      { name: 'kb_knowledge', patterns: ['kb_knowledge'] },
      { name: 'sc_request', patterns: ['sc_request', 'sc_requests'] },
      { name: 'sc_req_item', patterns: ['sc_req_item', 'sc_req_items'] },
      { name: 'sc_task', patterns: ['sc_task', 'sc_tasks'] }
    ];
    
    // Check for exact table names with word boundaries
    for (const table of tables) {
      for (const pattern of table.patterns) {
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        if (regex.test(desc)) {
          return table.name;
        }
      }
    }
    
    // Try to extract from common patterns
    const fromMatch = desc.match(/from\s+(\w+)/);
    if (fromMatch) {
      return fromMatch[1];
    }
    
    const tableMatch = desc.match(/(\w+)\s+(?:table|records?)/);
    if (tableMatch) {
      return tableMatch[1];
    }
    
    // Default to incident if no table found
    return 'incident';
  }

  /**
   * Extract operation type from description
   */
  private extractOperation(desc: string): QueryIntent['operation'] {
    // Check for specific patterns first (more specific to less specific)
    // Use word boundaries to avoid matching partial words
    if (desc.includes('get') && (desc.includes('by sys_id') || desc.includes('by id'))) {
      return 'get';
    }
    if (desc.includes('insert or update') || desc.includes('upsert')) {
      return 'insertOrUpdate';
    }
    if (desc.includes('update multiple') || desc.includes('bulk update')) {
      return 'updateMultiple';
    }
    if (desc.includes('delete multiple') || desc.includes('bulk delete')) {
      return 'deleteMultiple';
    }
    // Check for group by BEFORE checking for count/avg/sum/etc
    // because "count ... grouped by" should be aggregate, not count
    if (desc.includes('group by') || desc.includes('grouped by')) {
      return 'aggregate';
    }
    if (/\bcount\b/.test(desc)) {
      return 'count';
    }
    if (/\b(average|avg)\b/.test(desc)) {
      return 'aggregate';
    }
    if (/\bsum\b/.test(desc)) {
      return 'aggregate';
    }
    if (/\b(minimum|min)\b/.test(desc)) {
      return 'aggregate';
    }
    if (/\b(maximum|max)\b/.test(desc)) {
      return 'aggregate';
    }
    if (/\binsert\b/.test(desc) || /\bcreate\b/.test(desc)) {
      return 'insert';
    }
    if (/\bupdate\b/.test(desc)) {
      return 'update';
    }
    if (/\bdelete\b/.test(desc) || /\bremove\b/.test(desc)) {
      return 'deleteMultiple';
    }
    // Check for "single" or "one" explicitly mentioned
    if (/\b(single|one)\b/.test(desc)) {
      return 'selectOne';
    }
    // If it has "get" with specific fields (not just "get all"), use select
    // Only use selectOne if it explicitly says "single" or "one"
    
    // Default to select
    return 'select';
  }

  /**
   * Extract fields from description
   */
  private extractFields(desc: string, descLower: string): string[] | undefined {
    // Look for "get <fields>" or "select <fields>" patterns
    // Match patterns like "get number and short_description from incident"
    // Be careful not to include "display value" as part of the field name
    const getMatch = descLower.match(/(?:get|select|show|return)\s+(.+?)(?:\s+display\s+value|\s+from\s+\w+|\s+where|\s+order|\s+limit|$)/);
    if (getMatch) {
      const fieldsStr = getMatch[1].trim();
      
      // Skip if it's "all", "records", "single", or similar non-field words
      const skipWords = ['all', '*', 'records', 'record', 'single', 'one', 'first'];
      const skipPhrases = ['all incidents', 'all incident', 'all problems', 'all problem', 'all users', 'all user', 'all tasks', 'all task', 'single incident', 'single problem', 'single user', 'single task'];
      
      if (skipWords.includes(fieldsStr) || skipPhrases.includes(fieldsStr)) {
        return undefined;
      }
      
      // Get the original case version of the fields string
      const matchStart = getMatch.index! + descLower.substring(getMatch.index!).indexOf(fieldsStr);
      const originalFieldsStr = desc.substring(matchStart, matchStart + fieldsStr.length);
      
      // Parse field list - split by comma or "and"
      const fields = originalFieldsStr
        .split(/,|\s+and\s+/i)
        .map(f => f.trim())
        .filter(f => {
          const lower = f.toLowerCase();
          return f.length > 0 && 
                 !['the', 'of', 'for', 'from', 'all', 'single', 'one', 'first', 'incidents', 'incident', 'problems', 'problem', 'users', 'user', 'tasks', 'task'].includes(lower);
        });
      
      if (fields.length === 0) {
        return undefined;
      }
      
      // Check for display value requests
      const displayFields = fields.map(field => {
        // Check if "display" or "display value" is mentioned for this field
        // Pattern: "field display", "display value of field", "field$display"
        const fieldLower = field.toLowerCase();
        if (descLower.includes(`${fieldLower} display`) || 
            descLower.includes(`display value of ${fieldLower}`) || 
            descLower.includes(`${fieldLower}$display`) ||
            descLower.includes(`${fieldLower} display value`)) {
          return `${field}$DISPLAY`;
        }
        return field;
      });
      
      return displayFields.length > 0 ? displayFields : undefined;
    }
    
    return undefined;
  }

  /**
   * Extract filter conditions from description
   */
  private extractConditions(desc: string, descLower: string): QueryIntent['conditions'] | undefined {
    const conditions: QueryIntent['conditions'] = [];
    
    // Extract where clauses
    const whereMatch = descLower.match(/where\s+(.+?)(?:\s+order|\s+limit|\s+group|$)/);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const whereStart = whereMatch.index! + 6; // "where ".length
      const originalWhereClause = desc.substring(whereStart, whereStart + whereClause.length);
      
      // Split by "and" and "or"
      const parts = whereClause.split(/\s+(?:and|or)\s+/);
      const originalParts = originalWhereClause.split(/\s+(?:and|or)\s+/i);
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        const originalPart = originalParts[i]?.trim() || part;
        const isOr = i > 0 && whereClause.includes(' or ' + part);
        
        // Check for null conditions
        if (part.includes('is null') || part.includes('is empty')) {
          const fieldMatch = part.match(/(\w+)\s+is\s+(?:null|empty)/);
          if (fieldMatch) {
            conditions.push({
              field: fieldMatch[1],
              operator: '=',
              value: null,
              isNull: true,
              isOr
            });
            continue;
          }
        }
        
        if (part.includes('is not null') || part.includes('is not empty')) {
          const fieldMatch = part.match(/(\w+)\s+is\s+not\s+(?:null|empty)/);
          if (fieldMatch) {
            conditions.push({
              field: fieldMatch[1],
              operator: '!=',
              value: null,
              isNull: true,
              isOr
            });
            continue;
          }
        }
        
        // Check for IN operator
        if (part.includes(' in ')) {
          const inMatch = part.match(/(\w+)\s+in\s+\[([^\]]+)\]/);
          if (inMatch) {
            const values = inMatch[2].split(',').map(v => v.trim().replace(/['"]/g, ''));
            conditions.push({
              field: inMatch[1],
              operator: 'IN',
              value: values,
              isOr
            });
            continue;
          }
        }
        
        // Check for comparison operators (use original part to preserve case)
        const operators = [
          { pattern: /(\w+(?:\.\w+)?)\s+(?:contains|includes)\s+(.+)/i, op: 'CONTAINS' },
          { pattern: /(\w+(?:\.\w+)?)\s+(?:starts with|begins with)\s+(.+)/i, op: 'STARTSWITH' },
          { pattern: /(\w+(?:\.\w+)?)\s+(?:ends with)\s+(.+)/i, op: 'ENDSWITH' },
          { pattern: /(\w+(?:\.\w+)?)\s+>=\s+(.+)/, op: '>=' },
          { pattern: /(\w+(?:\.\w+)?)\s+<=\s+(.+)/, op: '<=' },
          { pattern: /(\w+(?:\.\w+)?)\s+>\s+(.+)/, op: '>' },
          { pattern: /(\w+(?:\.\w+)?)\s+<\s+(.+)/, op: '<' },
          { pattern: /(\w+(?:\.\w+)?)\s+!=\s+(.+)/, op: '!=' },
          { pattern: /(\w+(?:\.\w+)?)\s+(?:equals|is|=)\s+(.+)/i, op: '=' }
        ];
        
        for (const { pattern, op } of operators) {
          const match = originalPart.match(pattern);
          if (match) {
            let value: any = match[2].trim();
            
            // Parse value type
            if (value.toLowerCase() === 'true') value = true;
            else if (value.toLowerCase() === 'false') value = false;
            // Only parse as number if it doesn't have leading zeros (to preserve "001" as string)
            else if (/^\d+$/.test(value) && !value.startsWith('0')) value = parseInt(value, 10);
            else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
            else {
              // Remove quotes but preserve case
              value = value.replace(/^['"]|['"]$/g, '');
            }
            
            conditions.push({
              field: match[1],
              operator: op,
              value,
              isOr
            });
            break;
          }
        }
      }
    }
    
    return conditions.length > 0 ? conditions : undefined;
  }

  /**
   * Extract ordering from description
   */
  private extractOrdering(desc: string): QueryIntent['orderBy'] | undefined {
    const orderMatch = desc.match(/order(?:ed)?\s+by\s+(\w+)(?:\s+(asc|desc|ascending|descending))?/);
    if (orderMatch) {
      return [{
        field: orderMatch[1],
        descending: orderMatch[2] ? orderMatch[2].startsWith('desc') : false
      }];
    }
    
    return undefined;
  }

  /**
   * Extract limit from description
   */
  private extractLimit(desc: string): number | undefined {
    const limitMatch = desc.match(/limit(?:ed)?\s+(?:to\s+)?(\d+)/);
    if (limitMatch) {
      return parseInt(limitMatch[1], 10);
    }
    
    const firstMatch = desc.match(/first\s+(\d+)/);
    if (firstMatch) {
      return parseInt(firstMatch[1], 10);
    }
    
    return undefined;
  }

  /**
   * Extract aggregate information from description
   */
  private extractAggregateInfo(desc: string): {
    aggregateType?: QueryIntent['aggregateType'];
    aggregateField?: string;
    groupBy?: string[];
    having?: QueryIntent['having'];
  } {
    let aggregateType: QueryIntent['aggregateType'] | undefined;
    let aggregateField: string | undefined;
    let groupBy: string[] | undefined;
    let having: QueryIntent['having'] | undefined;
    
    // Extract group by first (match both "group by" and "grouped by")
    // Look for the pattern more specifically
    if (desc.includes('grouped by') || desc.includes('group by')) {
      const groupMatch = desc.match(/group(?:ed)?\s+by\s+([\w,\s]+?)(?:\s+having|$)/);
      if (groupMatch) {
        const groupByStr = groupMatch[1].trim();
        // Split by comma or "and", and filter out non-field words
        const fields = groupByStr.split(/,|\s+and\s+/).map(f => f.trim()).filter(f => {
          const lower = f.toLowerCase();
          return f.length > 0 && !['incidents', 'incident', 'problems', 'problem', 'users', 'user', 'tasks', 'task', 'records', 'record'].includes(lower);
        });
        if (fields.length > 0) {
          groupBy = fields;
        }
      }
    }
    
    // Extract aggregate type
    if (desc.includes('count')) {
      aggregateType = 'COUNT';
      aggregateField = '*';
    } else if (desc.includes('average') || desc.includes('avg')) {
      aggregateType = 'AVG';
      const avgMatch = desc.match(/(?:average|avg)(?:\s+of)?\s+(\w+)/);
      if (avgMatch) aggregateField = avgMatch[1];
    } else if (desc.includes('sum')) {
      aggregateType = 'SUM';
      const sumMatch = desc.match(/sum(?:\s+of)?\s+(\w+)/);
      if (sumMatch) aggregateField = sumMatch[1];
    } else if (desc.includes('minimum') || desc.includes('min')) {
      aggregateType = 'MIN';
      const minMatch = desc.match(/(?:minimum|min)(?:\s+of)?\s+(\w+)/);
      if (minMatch) aggregateField = minMatch[1];
    } else if (desc.includes('maximum') || desc.includes('max')) {
      aggregateType = 'MAX';
      const maxMatch = desc.match(/(?:maximum|max)(?:\s+of)?\s+(\w+)/);
      if (maxMatch) aggregateField = maxMatch[1];
    }
    
    // Extract having clause
    const havingMatch = desc.match(/having\s+(\w+)\s+(.+?)\s+(>|<|>=|<=|=|!=)\s+(.+?)(?:\s+order|\s+limit|$)/);
    if (havingMatch) {
      let value: any = havingMatch[4].trim();
      // Parse value type
      if (/^\d+$/.test(value)) value = parseInt(value, 10);
      else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
      else value = value.replace(/^['"]|['"]$/g, '');
      
      having = {
        aggregate: havingMatch[1].toUpperCase(),
        field: havingMatch[2].trim(),
        operator: havingMatch[3],
        value
      };
    }
    
    return { aggregateType, aggregateField, groupBy, having };
  }

  /**
   * Extract modifiers from description
   */
  private extractModifiers(desc: string): QueryIntent['modifiers'] | undefined {
    const modifiers: QueryIntent['modifiers'] = {};
    
    if (desc.includes('disable workflow') || desc.includes('without workflow')) {
      modifiers.disableWorkflow = true;
    }
    if (desc.includes('disable auto sys fields')) {
      modifiers.disableAutoSysFields = true;
    }
    if (desc.includes('force update')) {
      modifiers.forceUpdate = true;
    }
    if (desc.includes('with acls') || desc.includes('with security')) {
      modifiers.withAcls = true;
    }
    if (desc.includes('with security filters')) {
      modifiers.withSecurityDataFilters = true;
    }
    
    return Object.keys(modifiers).length > 0 ? modifiers : undefined;
  }

  /**
   * Build GlideQuery code from intent
   * 
   * @param intent - Extracted query intent
   * @returns Generated GlideQuery code
   */
  private buildGlideQuery(intent: QueryIntent): string {
    let code = `new GlideQuery('${intent.table}')`;
    
    // Add conditions
    if (intent.conditions && intent.conditions.length > 0) {
      for (const condition of intent.conditions) {
        if (condition.isNull) {
          if (condition.operator === '=') {
            code += `\n  .${condition.isOr ? 'orWhereNull' : 'whereNull'}('${condition.field}')`;
          } else {
            code += `\n  .${condition.isOr ? 'orWhereNotNull' : 'whereNotNull'}('${condition.field}')`;
          }
        } else {
          const method = condition.isOr ? 'orWhere' : 'where';
          const value = this.formatValue(condition.value);
          
          if (condition.operator === '=') {
            code += `\n  .${method}('${condition.field}', ${value})`;
          } else {
            code += `\n  .${method}('${condition.field}', '${condition.operator}', ${value})`;
          }
        }
      }
    }
    
    // Add group by (before modifiers and terminal operations)
    if (intent.groupBy && intent.groupBy.length > 0) {
      const fields = intent.groupBy.map(f => `'${f}'`).join(', ');
      code += `\n  .groupBy(${fields})`;
    }
    
    // Add having clause
    if (intent.having) {
      const value = this.formatValue(intent.having.value);
      code += `\n  .having('${intent.having.aggregate}', '${intent.having.field}', '${intent.having.operator}', ${value})`;
    }
    
    // Add ordering
    if (intent.orderBy && intent.orderBy.length > 0) {
      for (const order of intent.orderBy) {
        const method = order.descending ? 'orderByDesc' : 'orderBy';
        code += `\n  .${method}('${order.field}')`;
      }
    }
    
    // Add limit
    if (intent.limit) {
      code += `\n  .limit(${intent.limit})`;
    }
    
    // Add modifiers
    if (intent.modifiers) {
      if (intent.modifiers.disableWorkflow) {
        code += `\n  .disableWorkflow()`;
      }
      if (intent.modifiers.disableAutoSysFields) {
        code += `\n  .disableAutoSysFields()`;
      }
      if (intent.modifiers.forceUpdate) {
        code += `\n  .forceUpdate()`;
      }
      if (intent.modifiers.withAcls) {
        code += `\n  .withAcls()`;
      }
      if (intent.modifiers.withSecurityDataFilters) {
        code += `\n  .withSecurityDataFilters()`;
      }
    }
    
    // Add terminal operation
    code += this.buildTerminalOperation(intent);
    
    return code + ';';
  }

  /**
   * Build terminal operation based on intent
   */
  private buildTerminalOperation(intent: QueryIntent): string {
    switch (intent.operation) {
      case 'select':
        if (intent.fields && intent.fields.length > 0) {
          const fields = intent.fields.map(f => `'${f}'`).join(', ');
          return `\n  .select(${fields})`;
        }
        return `\n  .select()`;
      
      case 'selectOne':
        if (intent.fields && intent.fields.length > 0) {
          const fields = intent.fields.map(f => `'${f}'`).join(', ');
          return `\n  .selectOne(${fields})`;
        }
        return `\n  .selectOne()`;
      
      case 'get':
        return `\n  .get(sys_id)`;
      
      case 'count':
        return `\n  .count()`;
      
      case 'aggregate':
        if (intent.aggregateType && intent.aggregateField) {
          // If there's a groupBy, always use .aggregate()
          if (intent.groupBy && intent.groupBy.length > 0) {
            return `\n  .aggregate('${intent.aggregateType}', '${intent.aggregateField}')`;
          }
          
          // Simple aggregates without groupBy
          switch (intent.aggregateType) {
            case 'COUNT':
              return `\n  .count()`;
            case 'AVG':
              return `\n  .avg('${intent.aggregateField}')`;
            case 'SUM':
              return `\n  .sum('${intent.aggregateField}')`;
            case 'MIN':
              return `\n  .min('${intent.aggregateField}')`;
            case 'MAX':
              return `\n  .max('${intent.aggregateField}')`;
          }
        }
        return `\n  .count()`;
      
      case 'insert':
        return `\n  .insert({ /* field: value */ })`;
      
      case 'update':
        return `\n  .update({ /* field: value */ })`;
      
      case 'updateMultiple':
        return `\n  .updateMultiple({ /* field: value */ })`;
      
      case 'deleteMultiple':
        return `\n  .deleteMultiple()`;
      
      case 'insertOrUpdate':
        return `\n  .insertOrUpdate({ /* sys_id: id, field: value */ })`;
      
      default:
        return `\n  .select()`;
    }
  }

  /**
   * Format value for code generation
   */
  private formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (Array.isArray(value)) {
      return `[${value.map(v => this.formatValue(v)).join(', ')}]`;
    }
    return JSON.stringify(value);
  }

  /**
   * Add explanatory comments to generated code
   * 
   * @param code - Generated code
   * @param intent - Query intent
   * @returns Code with comments
   */
  private addComments(code: string, intent: QueryIntent): string {
    let commented = `// Query ${intent.table} table\n`;
    
    // Add operation description
    switch (intent.operation) {
      case 'select':
        commented += `// Retrieve multiple records\n`;
        break;
      case 'selectOne':
        commented += `// Retrieve a single record\n`;
        break;
      case 'get':
        commented += `// Get record by sys_id\n`;
        break;
      case 'count':
        commented += `// Count matching records\n`;
        break;
      case 'aggregate':
        commented += `// Perform aggregate operation\n`;
        break;
      case 'insert':
        commented += `// Insert a new record\n`;
        break;
      case 'update':
        commented += `// Update a single record\n`;
        break;
      case 'updateMultiple':
        commented += `// Update multiple records\n`;
        break;
      case 'deleteMultiple':
        commented += `// Delete multiple records\n`;
        break;
      case 'insertOrUpdate':
        commented += `// Insert or update record (upsert)\n`;
        break;
    }
    
    // Add filter description
    if (intent.conditions && intent.conditions.length > 0) {
      commented += `// Filters: ${intent.conditions.length} condition(s)\n`;
    }
    
    // Add ordering description
    if (intent.orderBy && intent.orderBy.length > 0) {
      const orderDesc = intent.orderBy.map(o => 
        `${o.field} ${o.descending ? 'DESC' : 'ASC'}`
      ).join(', ');
      commented += `// Ordered by: ${orderDesc}\n`;
    }
    
    // Add limit description
    if (intent.limit) {
      commented += `// Limited to ${intent.limit} records\n`;
    }
    
    commented += '\n' + code;
    
    // Add usage notes for Optional/Stream results
    if (intent.operation === 'selectOne' || intent.operation === 'get') {
      commented += '\n\n// Returns Optional - use .orElse() or check .isPresent() before .get()';
    } else if (intent.operation === 'select') {
      commented += '\n\n// Returns Stream - use .forEach(), .toArray(), or other Stream methods';
    }
    
    return commented;
  }

  /**
   * Generate explanation of the generated code
   */
  private generateExplanation(intent: QueryIntent): string {
    let explanation = `This query ${intent.operation}s records from the ${intent.table} table`;
    
    if (intent.conditions && intent.conditions.length > 0) {
      explanation += ` with ${intent.conditions.length} filter condition(s)`;
    }
    
    if (intent.orderBy && intent.orderBy.length > 0) {
      explanation += `, ordered by ${intent.orderBy.map(o => o.field).join(', ')}`;
    }
    
    if (intent.limit) {
      explanation += `, limited to ${intent.limit} records`;
    }
    
    explanation += '.';
    
    return explanation;
  }

  /**
   * Collect warnings about the generated code
   */
  private collectWarnings(intent: QueryIntent): string[] {
    const warnings: string[] = [];
    
    // Warn about write operations
    if (['insert', 'update', 'updateMultiple', 'deleteMultiple', 'insertOrUpdate'].includes(intent.operation)) {
      warnings.push('This is a write operation that will modify data in the database');
    }
    
    // Warn about bulk operations
    if (['updateMultiple', 'deleteMultiple'].includes(intent.operation)) {
      warnings.push('This is a bulk operation that may affect multiple records');
    }
    
    // Warn about missing conditions on write operations
    if (['update', 'updateMultiple', 'deleteMultiple'].includes(intent.operation)) {
      if (!intent.conditions || intent.conditions.length === 0) {
        warnings.push('No filter conditions specified - this will affect ALL records in the table');
      }
    }
    
    // Warn about workflow modifiers
    if (intent.modifiers?.disableWorkflow) {
      warnings.push('Workflow is disabled - business rules will not execute');
    }
    
    return warnings;
  }
}
