# Design Document: GlideQuery Development Tools

## Overview

This feature extends the existing ServiceNow MCP Server with three GlideQuery development capabilities: script execution, code generation, and validation/testing. The design integrates seamlessly with the existing layered architecture (Configuration → Authentication → API Client → Service Layer → MCP Protocol Layer) by adding new service components and MCP tools.

The implementation leverages ServiceNow's server-side script execution capabilities through either the Script Execution API or a custom Scripted REST API endpoint. Code generation operates locally without requiring ServiceNow API calls, while script execution and validation interact with the ServiceNow instance.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Protocol Layer                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────┐│
│  │ execute_glidequery│  │generate_glidequery│  │test_glidequery││
│  │      Tool        │  │      Tool        │  │    Tool    ││
│  └──────────────────┘  └──────────────────┘  └────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ GlideQueryExecutor│  │ GlideQueryGenerator│              │
│  │    Service       │  │    Service       │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    API Client Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         ServiceNowClient (existing)                   │  │
│  │  + executeScript(script: string): ScriptResult       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                  Authentication Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      AuthenticationManager (existing)                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Script Execution Flow:**
1. MCP Tool receives execute_glidequery request
2. Tool handler validates script input and sanitizes for security
3. GlideQueryExecutor service receives script
4. ServiceNowClient.executeScript() wraps script and calls Script Execution API
5. ServiceNow executes script server-side and returns results
6. Results are parsed, formatted, and returned through MCP protocol

**Code Generation Flow:**
1. MCP Tool receives generate_glidequery request with natural language description
2. GlideQueryGenerator service analyzes description
3. Generator produces GlideQuery code with comments
4. Code is returned directly (no ServiceNow API call needed)

**Testing Flow:**
1. MCP Tool receives test_glidequery request
2. Tool handler adds result limiting and safety checks
3. GlideQueryExecutor executes script with test mode enabled
4. Results are formatted with warnings and returned

## Components and Interfaces

### GlideQuery API Reference

This section documents the actual GlideQuery API based on ServiceNow documentation and source code.

**Constructor:**
```javascript
new GlideQuery('table_name')
```

**Query Building Methods:**
- `.where(field, operator, value)` - Add WHERE clause with explicit operator
- `.where(field, value)` - Add WHERE clause (defaults to '=' operator)
- `.orWhere(field, operator, value)` - Add OR WHERE clause
- `.orWhere(field, value)` - Add OR WHERE clause (defaults to '=')
- `.whereNull(field)` - WHERE field IS NULL
- `.whereNotNull(field)` - WHERE field IS NOT NULL
- `.orWhereNull(field)` - OR WHERE field IS NULL
- `.orWhereNotNull(field)` - OR WHERE field IS NOT NULL

**Supported Operators:**
'=', '!=', '>', '>=', '<', '<=', 'IN', 'NOT IN', 'STARTSWITH', 'ENDSWITH', 'CONTAINS', 'DOES NOT CONTAIN', 'INSTANCEOF', 'SAMEAS', 'NSAMEAS', 'GT_FIELD', 'LT_FIELD', 'GT_OR_EQUALS_FIELD', 'LT_OR_EQUALS_FIELD', 'BETWEEN', 'DYNAMIC', 'EMPTYSTRING', 'ANYTHING', 'LIKE', 'NOT LIKE', 'ON'

**Query Execution Methods (Terminal Operations):**
- `.select(...fields)` - Returns Stream of results
- `.selectOne(...fields)` - Returns Optional with single result
- `.get(key, [selectFields])` - Get by primary key (sys_id), returns Optional
- `.getBy(keyValues, [selectFields])` - Get by key-value pairs, returns Optional

**Write Operations (Terminal Operations):**
- `.insert(keyValues, [selectFields])` - Insert record, returns Optional
- `.update(changes, [selectFields], [reason])` - Update single record, returns Optional
- `.updateMultiple(changes)` - Update multiple records, returns {rowCount}
- `.insertOrUpdate(changes, [selectFields], [reason])` - Upsert operation, returns Optional
- `.deleteMultiple()` - Delete multiple records matching query

**Modifiers (Chain before terminal operations):**
- `.orderBy(field)` - Order results ascending by field
- `.orderByDesc(field)` - Order results descending by field
- `.limit(n)` - Limit number of results
- `.disableWorkflow()` - Disable business rules and workflows
- `.disableAutoSysFields()` - Don't automatically update sys fields
- `.forceUpdate()` - Force update even when no changes detected
- `.withAcls()` - Use GlideRecordSecure (honor ACLs)
- `.withSecurityDataFilters()` - Apply security data filters

**Aggregate Methods (Terminal Operations):**
- `.count()` - Returns number (count of records)
- `.avg(field)` - Returns Optional with average value
- `.sum(field)` - Returns Optional with sum
- `.min(field)` - Returns Optional with minimum value
- `.max(field)` - Returns Optional with maximum value
- `.aggregate(type, field)` - For complex aggregates
- `.groupBy(...fields)` - Group results by fields
- `.having(aggregate, field, operator, value)` - Filter grouped results

**Field Flags (Append to field names in select):**
- `field$DISPLAY` - Get display value instead of raw value
- `field$CURRENCY_CODE` - Get currency code for currency fields
- `field$CURRENCY_DISPLAY` - Get currency display value
- `field$CURRENCY_STRING` - Get currency as formatted string

**Utility Methods:**
- `.toGlideRecord()` - Convert GlideQuery to GlideRecord
- `GlideQuery.parse(table, encodedQuery)` - Parse encoded query string into GlideQuery

**Return Types:**

*Optional* - Returned by selectOne(), get(), getBy(), insert(), update(), insertOrUpdate()
- `.get()` - Get the value (throws if empty)
- `.orElse(defaultValue)` - Get value or default
- `.isPresent()` - Check if value exists
- `.map(fn)` - Transform the value
- `.flatMap(fn)` - Transform and flatten
- `.filter(predicate)` - Filter the optional

*Stream* - Returned by select()
- `.forEach(fn)` - Iterate over results
- `.map(fn)` - Transform each result
- `.filter(predicate)` - Filter results
- `.reduce(fn, initial)` - Reduce to single value
- `.toArray()` - Convert to array
- `.limit(n)` - Limit stream results
- `.skip(n)` - Skip n results

**Important Characteristics:**
- GlideQuery is **immutable** - each method returns a new GlideQuery instance
- Results aren't fetched until **terminal methods** are called (select, selectOne, get, count, etc.)
- Nested queries are supported in where clauses up to 2 levels deep
- Cannot mix simple aggregates (count, avg, etc.) with aggregate() + groupBy()
- GlideQuery is **lazy** - queries are only executed when terminal operations are invoked
- GlideQuery uses **functional programming patterns** - methods like map, filter, reduce on Stream results
- **Performance**: GlideQuery is generally faster than GlideRecord for read operations
- **Type safety**: GlideQuery provides better type inference in scoped applications
- **Dot-walking**: GlideQuery supports dot-walking in where clauses (e.g., `where('caller_id.department', 'IT')`)
- **Reference fields**: When selecting reference fields, you get the sys_id by default; use $DISPLAY for display value
- **Error handling**: GlideQuery throws exceptions for invalid operations; use try-catch for error handling
- **Scoped apps**: GlideQuery respects application scope and ACLs when using `.withAcls()`
- **Chaining**: All non-terminal methods return new GlideQuery instances, allowing method chaining
- **No side effects**: GlideQuery queries don't modify state until write operations are executed

**Example Queries:**
```javascript
// Simple select
new GlideQuery('incident')
  .where('active', true)
  .where('priority', '<=', 3)
  .select('number', 'short_description')
  .forEach(function(incident) {
    gs.info(incident.number);
  });

// Select with display values
new GlideQuery('incident')
  .where('state', 1)
  .select('number', 'assigned_to$DISPLAY', 'priority')
  .toArray();

// Get single record
var incident = new GlideQuery('incident')
  .get('sys_id_value')
  .orElse(null);

// Insert
var newRecord = new GlideQuery('incident')
  .insert({
    short_description: 'Test incident',
    urgency: 3,
    impact: 3
  })
  .get();

// Update with modifiers
new GlideQuery('incident')
  .where('number', 'INC0010001')
  .disableWorkflow()
  .update({state: 6});

// Aggregate
var count = new GlideQuery('incident')
  .where('active', true)
  .count();

// Group by with having
new GlideQuery('incident')
  .groupBy('assigned_to')
  .having('COUNT', '*', '>', 5)
  .aggregate('COUNT', '*');

// Null checks
new GlideQuery('incident')
  .whereNull('assigned_to')
  .whereNotNull('short_description')
  .select('number');

// OR conditions
new GlideQuery('incident')
  .where('priority', 1)
  .orWhere('priority', 2)
  .select('number');

// Dot-walking (reference field traversal)
new GlideQuery('incident')
  .where('caller_id.department', 'IT')
  .where('assigned_to.active', true)
  .select('number', 'caller_id$DISPLAY');

// Using IN operator
new GlideQuery('incident')
  .where('state', 'IN', [1, 2, 3])
  .select('number');

// Complex query with multiple modifiers
new GlideQuery('incident')
  .where('active', true)
  .whereNotNull('assigned_to')
  .orderByDesc('sys_created_on')
  .limit(10)
  .withAcls()
  .select('number', 'short_description', 'assigned_to$DISPLAY');
```

### 1. ServiceNowClient Extension

Extend the existing ServiceNowClient class with script execution capability:

```typescript
interface ScriptExecutionRequest {
  script: string;
  timeout?: number; // milliseconds, default 30000
}

interface ScriptExecutionResult {
  success: boolean;
  result?: any;
  logs?: string[];
  error?: {
    message: string;
    line?: number;
    type?: string;
  };
  executionTime: number; // milliseconds
}

class ServiceNowClient {
  // ... existing methods ...
  
  /**
   * Execute a server-side script on ServiceNow instance
   * Uses Script Execution API or custom Scripted REST API endpoint
   */
  async executeScript(request: ScriptExecutionRequest): Promise<ScriptExecutionResult> {
    // Implementation details:
    // 1. Validate script is not empty
    // 2. Construct API request to script execution endpoint
    // 3. Include authentication headers
    // 4. Set timeout from request or default
    // 5. Parse response and extract result, logs, errors
    // 6. Handle timeout errors
    // 7. Return structured result
  }
}
```

**API Endpoint Options:**

Option A: ServiceNow Script Execution API (if available)
- Endpoint: `/api/now/v1/script/execute`
- Method: POST
- Body: `{ script: string }`

Option B: Custom Scripted REST API (fallback)
- Create a Scripted REST API resource in ServiceNow
- Endpoint: `/api/x_custom/glidequery_executor/execute`
- Method: POST
- Body: `{ script: string }`
- Server-side script evaluates the provided GlideQuery code

### 2. GlideQueryExecutor Service

```typescript
interface ExecutionOptions {
  timeout?: number;
  testMode?: boolean; // limits results, adds warnings
  maxResults?: number; // for test mode, default 100
}

interface ExecutionResult {
  success: boolean;
  data?: any;
  logs?: string[];
  error?: string;
  executionTime: number;
  recordCount?: number;
  truncated?: boolean;
}

class GlideQueryExecutor {
  constructor(private client: ServiceNowClient) {}
  
  /**
   * Execute a GlideQuery script
   */
  async execute(script: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
    // 1. Sanitize script input (remove dangerous patterns)
    // 2. Validate script is not empty
    // 3. If testMode, wrap script with result limiting
    // 4. Call client.executeScript()
    // 5. Parse and format results
    // 6. Add warnings for write operations in test mode
    // 7. Return structured result
  }
  
  /**
   * Validate GlideQuery syntax without execution
   */
  async validate(script: string): Promise<ValidationResult> {
    // 1. Perform basic syntax checks locally
    // 2. Check for common mistakes:
    //    - Undefined methods (e.g., .selectAll() doesn't exist, use .select())
    //    - Incorrect chaining (e.g., calling terminal operation twice)
    //    - Missing parentheses on method calls
    //    - Invalid operators (check against supported operator list)
    //    - Mixing aggregate methods incorrectly
    // 3. Optionally: execute in dry-run mode on ServiceNow
    // 4. Return validation result with errors/warnings
  }
  
  private sanitizeScript(script: string): string {
    // Remove or escape dangerous patterns
    // Check against blacklist
    // Return sanitized script
  }
  
  private wrapForTestMode(script: string, maxResults: number): string {
    // Wrap script to limit results
    // Example: add .limit(maxResults) to queries
    // Add logging/instrumentation
  }
}

interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    message: string;
    line?: number;
  }>;
  warnings?: string[];
}
```

### 3. GlideQueryGenerator Service

```typescript
interface GenerationRequest {
  description: string;
  table?: string; // optional table hint
  includeComments?: boolean; // default true
}

interface GenerationResult {
  code: string;
  explanation?: string;
  warnings?: string[];
}

class GlideQueryGenerator {
  /**
   * Generate GlideQuery code from natural language description
   */
  generate(request: GenerationRequest): GenerationResult {
    // 1. Parse description to extract intent
    // 2. Identify query type (select, selectOne, get, insert, update, updateMultiple, deleteMultiple, count, aggregate)
    // 3. Extract filters, fields, ordering, limits, modifiers
    // 4. Generate GlideQuery code
    // 5. Add explanatory comments
    // 6. Return code with explanation
  }
  
  private parseDescription(description: string): QueryIntent {
    // Extract structured intent from natural language
    // Identify table, fields, conditions, operations, modifiers
  }
  
  private buildGlideQuery(intent: QueryIntent): string {
    // Construct GlideQuery code from intent
    // Handle different query patterns
    // Apply modifiers (disableWorkflow, withAcls, etc.)
    // Use correct operators and method signatures
  }
  
  private addComments(code: string, intent: QueryIntent): string {
    // Add explanatory comments to code
  }
}

interface QueryIntent {
  operation: 'select' | 'selectOne' | 'get' | 'insert' | 'update' | 'updateMultiple' | 'deleteMultiple' | 'insertOrUpdate' | 'count' | 'aggregate';
  table: string;
  fields?: string[]; // Can include field flags like 'field$DISPLAY'
  conditions?: Array<{
    field: string;
    operator: string; // '=', '!=', '>', '>=', '<', '<=', 'IN', 'CONTAINS', 'STARTSWITH', etc.
    value: any;
    isNull?: boolean; // for whereNull/whereNotNull
    isOr?: boolean; // for orWhere
  }>;
  orderBy?: Array<{
    field: string;
    descending?: boolean;
  }>;
  limit?: number;
  aggregateType?: 'COUNT' | 'AVG' | 'SUM' | 'MIN' | 'MAX';
  aggregateField?: string;
  groupBy?: string[];
  having?: {
    aggregate: string;
    field: string;
    operator: string;
    value: any;
  };
  modifiers?: {
    disableWorkflow?: boolean;
    disableAutoSysFields?: boolean;
    forceUpdate?: boolean;
    withAcls?: boolean;
    withSecurityDataFilters?: boolean;
  };
}
```

### 4. MCP Tool Handlers

```typescript
// Tool 1: Execute GlideQuery
interface ExecuteGlideQueryParams {
  script: string;
  timeout?: number;
}

interface ExecuteGlideQueryResponse {
  success: boolean;
  result?: any;
  logs?: string[];
  error?: string;
  executionTime: number;
  recordCount?: number;
}

async function executeGlideQueryHandler(
  params: ExecuteGlideQueryParams,
  executor: GlideQueryExecutor
): Promise<ExecuteGlideQueryResponse> {
  // 1. Validate params
  // 2. Call executor.execute()
  // 3. Format response
  // 4. Handle errors
}

// Tool 2: Generate GlideQuery
interface GenerateGlideQueryParams {
  description: string;
  table?: string;
  includeComments?: boolean;
}

interface GenerateGlideQueryResponse {
  code: string;
  explanation?: string;
  warnings?: string[];
}

async function generateGlideQueryHandler(
  params: GenerateGlideQueryParams,
  generator: GlideQueryGenerator
): Promise<GenerateGlideQueryResponse> {
  // 1. Validate params
  // 2. Call generator.generate()
  // 3. Return code
}

// Tool 3: Test GlideQuery
interface TestGlideQueryParams {
  script: string;
  maxResults?: number;
}

interface TestGlideQueryResponse {
  success: boolean;
  result?: any;
  warnings?: string[];
  error?: string;
  executionTime: number;
  recordCount?: number;
  truncated?: boolean;
}

async function testGlideQueryHandler(
  params: TestGlideQueryParams,
  executor: GlideQueryExecutor
): Promise<TestGlideQueryResponse> {
  // 1. Validate params
  // 2. Call executor.execute() with testMode=true
  // 3. Add warnings for write operations
  // 4. Format response with truncation info
}
```

### 5. Security Components

```typescript
interface SecurityConfig {
  blacklistedPatterns: RegExp[];
  requireConfirmation: string[]; // operations requiring confirmation
  maxScriptLength: number;
}

class ScriptSecurityValidator {
  constructor(private config: SecurityConfig) {}
  
  validate(script: string): SecurityValidationResult {
    // 1. Check script length
    // 2. Check against blacklisted patterns
    // 3. Detect dangerous operations
    // 4. Return validation result
  }
  
  private detectDangerousOperations(script: string): string[] {
    // Detect operations like deleteMultiple, updateMultiple
    // Return list of dangerous operations found
  }
}

interface SecurityValidationResult {
  safe: boolean;
  violations?: string[];
  dangerousOperations?: string[];
}
```

## Data Models

### Script Execution Models

```typescript
// Request/Response models for script execution
interface ScriptExecutionRequest {
  script: string;
  timeout?: number;
}

interface ScriptExecutionResult {
  success: boolean;
  result?: any;
  logs?: string[];
  error?: {
    message: string;
    line?: number;
    type?: string;
  };
  executionTime: number;
}

// Execution options
interface ExecutionOptions {
  timeout?: number;
  testMode?: boolean;
  maxResults?: number;
}

// Formatted execution result
interface ExecutionResult {
  success: boolean;
  data?: any;
  logs?: string[];
  error?: string;
  executionTime: number;
  recordCount?: number;
  truncated?: boolean;
}
```

### Code Generation Models

```typescript
interface GenerationRequest {
  description: string;
  table?: string;
  includeComments?: boolean;
}

interface GenerationResult {
  code: string;
  explanation?: string;
  warnings?: string[];
}

interface QueryIntent {
  operation: 'select' | 'selectOne' | 'get' | 'insert' | 'update' | 'updateMultiple' | 'deleteMultiple' | 'insertOrUpdate' | 'count' | 'aggregate';
  table: string;
  fields?: string[]; // Can include field flags like 'field$DISPLAY'
  conditions?: Array<{
    field: string;
    operator: string; // '=', '!=', '>', '>=', '<', '<=', 'IN', 'CONTAINS', 'STARTSWITH', etc.
    value: any;
    isNull?: boolean; // for whereNull/whereNotNull
    isOr?: boolean; // for orWhere
  }>;
  orderBy?: Array<{
    field: string;
    descending?: boolean;
  }>;
  limit?: number;
  aggregateType?: 'COUNT' | 'AVG' | 'SUM' | 'MIN' | 'MAX';
  aggregateField?: string;
  groupBy?: string[];
  having?: {
    aggregate: string;
    field: string;
    operator: string;
    value: any;
  };
  modifiers?: {
    disableWorkflow?: boolean;
    disableAutoSysFields?: boolean;
    forceUpdate?: boolean;
    withAcls?: boolean;
    withSecurityDataFilters?: boolean;
  };
}
```

### Validation Models

```typescript
interface ValidationResult {
  valid: boolean;
  errors?: Array<{
    message: string;
    line?: number;
  }>;
  warnings?: string[];
}

interface SecurityValidationResult {
  safe: boolean;
  violations?: string[];
  dangerousOperations?: string[];
}
```

### Configuration Models

```typescript
interface GlideQueryConfig {
  scriptExecutionEndpoint: string; // API endpoint for script execution
  defaultTimeout: number; // default 30000ms
  maxScriptLength: number; // default 10000 characters
  testModeMaxResults: number; // default 100
  security: SecurityConfig;
}

interface SecurityConfig {
  blacklistedPatterns: RegExp[];
  requireConfirmation: string[];
  maxScriptLength: number;
}
```

## Error Handling

### Error Categories

1. **Validation Errors**
   - Empty script
   - Script too long
   - Invalid parameters
   - Security violations

2. **Execution Errors**
   - Syntax errors in GlideQuery
   - Runtime errors (undefined variables, null references)
   - Permission errors (user lacks script execution rights)
   - Timeout errors

3. **API Errors**
   - Script execution endpoint not available
   - Authentication failures
   - Network errors
   - ServiceNow instance unavailable

4. **Generation Errors**
   - Ambiguous description
   - Unknown table references
   - Unsupported query patterns

### Error Response Format

All errors follow a consistent structure:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    line?: number; // for syntax errors
  };
}
```

### Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `SECURITY_VIOLATION`: Script contains blacklisted patterns
- `SYNTAX_ERROR`: GlideQuery syntax error
- `RUNTIME_ERROR`: Script execution error
- `TIMEOUT_ERROR`: Execution exceeded timeout
- `PERMISSION_ERROR`: User lacks required permissions
- `API_ERROR`: ServiceNow API error
- `ENDPOINT_NOT_FOUND`: Script execution endpoint not configured
- `GENERATION_ERROR`: Code generation failed

### Error Handling Strategy

```typescript
class GlideQueryExecutor {
  async execute(script: string, options: ExecutionOptions): Promise<ExecutionResult> {
    try {
      // Validation
      if (!script || script.trim().length === 0) {
        throw new ValidationError('Script cannot be empty');
      }
      
      // Security check
      const securityResult = this.securityValidator.validate(script);
      if (!securityResult.safe) {
        throw new SecurityError('Security violation', securityResult.violations);
      }
      
      // Execute
      const result = await this.client.executeScript({
        script: this.sanitizeScript(script),
        timeout: options.timeout || this.config.defaultTimeout
      });
      
      // Format and return
      return this.formatResult(result);
      
    } catch (error) {
      return this.handleError(error);
    }
  }
  
  private handleError(error: any): ExecutionResult {
    if (error instanceof ValidationError) {
      return {
        success: false,
        error: error.message,
        executionTime: 0
      };
    }
    
    if (error instanceof SecurityError) {
      return {
        success: false,
        error: `Security violation: ${error.violations.join(', ')}`,
        executionTime: 0
      };
    }
    
    if (error.code === 'TIMEOUT') {
      return {
        success: false,
        error: 'Script execution timed out',
        executionTime: error.timeout
      };
    }
    
    // Generic error
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      executionTime: 0
    };
  }
}
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests:

- **Unit tests**: Validate specific examples, edge cases, error conditions, and integration points
- **Property tests**: Verify universal properties across randomized inputs

### Unit Testing Focus

Unit tests should cover:
- Specific code generation examples (e.g., "get all active incidents" → expected GlideQuery code)
- Edge cases (empty scripts, very long scripts, special characters)
- Error conditions (timeout, syntax errors, permission errors)
- Integration between components (executor → client → API)
- Security validation (blacklisted patterns, dangerous operations)

### Property-Based Testing Configuration

- **Library**: fast-check (already used in existing ServiceNow MCP Server)
- **Iterations**: Minimum 100 per property test
- **Tagging**: Each test must include comment: `// Feature: glidequery-development-tools, Property N: [property text]`

### Test Organization

```
tests/
  unit/
    glidequery-executor.test.ts
    glidequery-generator.test.ts
    script-security.test.ts
    tool-handlers.test.ts
  property/
    glidequery-executor.property.test.ts
    glidequery-generator.property.test.ts
  integration/
    end-to-end.test.ts
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Script Execution Properties

**Property 1: Valid script execution returns results**
*For any* valid GlideQuery script, executing it should return results without errors, and the response should indicate success.
**Validates: Requirements 1.1**

**Property 2: Failed execution includes error details**
*For any* GlideQuery script that fails execution, the error response should contain a descriptive message, error type, and line number (when applicable).
**Validates: Requirements 1.2**

**Property 3: Authentication integration**
*For any* script execution, the Script_Executor should retrieve authentication headers from the existing Authentication_Manager before making API calls.
**Validates: Requirements 1.3, 5.2, 6.4**

**Property 4: Record results are valid JSON**
*For any* script execution that returns records, the results should be serializable to valid JSON format that can be parsed back.
**Validates: Requirements 1.4, 8.1**

**Property 5: Script input sanitization**
*For any* script containing injection patterns (SQL injection, command injection, etc.), the Script_Executor should either sanitize the dangerous content or reject the script with a security error.
**Validates: Requirements 1.6**

**Property 6: API client integration**
*For any* script execution, the Script_Executor should use the existing API_Client's HTTP methods for communication with ServiceNow.
**Validates: Requirements 5.1**

**Property 7: Configuration integration**
*For any* operation requiring configuration values (timeout, endpoint URL, security settings), the values should be retrieved from the existing ConfigurationManager.
**Validates: Requirements 5.3**

**Property 8: API response parsing**
*For any* API response received from ServiceNow, the Script_Executor should successfully parse it and format it into the standard ExecutionResult structure.
**Validates: Requirements 6.3**

### Code Generation Properties

**Property 9: Generated code is syntactically valid**
*For any* natural language description, the Code_Generator should produce GlideQuery code that is syntactically valid (can be parsed without syntax errors).
**Validates: Requirements 2.1**

**Property 10: Generated code includes comments**
*For any* code generation request with includeComments=true (default), the generated code should contain at least one comment explaining the query logic.
**Validates: Requirements 2.2**

**Property 11: Table name preservation**
*For any* description that explicitly mentions a ServiceNow table name, the generated code should use that exact table name in the GlideQuery.
**Validates: Requirements 2.3**

### Validation Properties

**Property 12: Syntax error detection**
*For any* GlideQuery snippet with syntax errors, the Validator should return valid=false and include error descriptions.
**Validates: Requirements 3.1**

**Property 13: Error responses include line numbers**
*For any* invalid GlideQuery snippet, the validation error response should include line numbers for each syntax error found.
**Validates: Requirements 3.2**

**Property 14: Valid snippet confirmation**
*For any* syntactically valid GlideQuery snippet, the Validator should return valid=true with no errors.
**Validates: Requirements 3.3**

### Testing Properties

**Property 15: Test mode execution returns results**
*For any* GlideQuery snippet executed in test mode, the Script_Executor should return results (or errors) just like normal execution.
**Validates: Requirements 4.1**

**Property 16: Test mode result limiting**
*For any* query executed in test mode that would return more than 100 records, the results should be limited to exactly 100 records and the truncated flag should be true.
**Validates: Requirements 4.2**

**Property 17: Write operation warnings**
*For any* script containing write operations (insert, update, delete, deleteMultiple) executed in test mode, the response should include a warning that changes will be persisted.
**Validates: Requirements 4.3**

**Property 18: Test execution error details**
*For any* test execution that fails, the error response should include detailed information (message, type, line number when applicable).
**Validates: Requirements 4.4**

### Security Properties

**Property 19: Dangerous operation detection**
*For any* script containing dangerous operations (deleteMultiple, updateMultiple, etc.), the Script_Executor should detect them and either require confirmation or include them in the response metadata.
**Validates: Requirements 7.2**

**Property 20: Execution logging**
*For any* script execution (successful or failed), a log entry should be created with timestamp, user information, and execution details.
**Validates: Requirements 7.3**

**Property 21: Blacklist enforcement**
*For any* script containing blacklisted patterns or functions, the Script_Executor should reject it with a security violation error before execution.
**Validates: Requirements 7.4**

### Result Formatting Properties

**Property 22: Primitive value type information**
*For any* script execution that returns primitive values (string, number, boolean), the response should include type information for each value.
**Validates: Requirements 8.2**

**Property 23: Log inclusion**
*For any* script execution that produces logs or warnings, those logs should be included in the ExecutionResult response.
**Validates: Requirements 8.4**

**Property 24: Large result truncation**
*For any* query that returns more records than the configured maximum, the results should be truncated and the truncated flag should be set to true.
**Validates: Requirements 8.5**


### Example-Based Testing

Some requirements are best validated with specific examples rather than properties:

**Example 1: Timeout handling**
Test that a script taking longer than 30 seconds returns a timeout error.
**Validates: Requirements 1.5**

**Example 2: Common query patterns**
Test code generation for each pattern:
- Filtering with various operators (=, !=, >, <, IN, CONTAINS, STARTSWITH, etc.)
- Ordering (orderBy, orderByDesc)
- Limiting (limit)
- Field selection (select with specific fields, field flags like $DISPLAY)
- Null checks (whereNull, whereNotNull)
- OR conditions (orWhere)
- Aggregates (count, avg, sum, min, max)
- Write operations (insert, update, updateMultiple, deleteMultiple, insertOrUpdate)
- Modifiers (disableWorkflow, withAcls, etc.)
**Validates: Requirements 2.5**

**Example 3: Common validation mistakes**
Test detection of:
- Undefined methods (e.g., `.selectAll()`, `.findOne()`)
- Incorrect chaining (e.g., `.select().count()`)
- Missing parentheses (e.g., `.select` instead of `.select()`)
- Invalid operators (e.g., `.where('field', 'INVALID_OP', value)`)
- Mixing aggregate methods incorrectly
**Validates: Requirements 3.4**

**Example 4: Tool registration**
Test that all three tools (execute_glidequery, generate_glidequery, test_glidequery) are registered and discoverable via MCP protocol.
**Validates: Requirements 5.4**

**Example 5: Script execution endpoint**
Test that the correct ServiceNow API endpoint is called during script execution.
**Validates: Requirements 6.1**

**Example 6: Endpoint unavailable**
Test that a configuration error is returned when the script execution endpoint is not available.
**Validates: Requirements 6.2**

**Example 7: Permission validation**
Test script execution with users that have and don't have script execution permissions.
**Validates: Requirements 7.1**

**Example 8: Empty results**
Test that queries returning no results include an appropriate message indicating no records were found.
**Validates: Requirements 8.3**

## Implementation Notes

### ServiceNow Script Execution Setup

The feature requires one of these ServiceNow configurations:

**Option A: Use Script Execution API (if available)**
- No setup required if your ServiceNow instance has this API enabled
- Endpoint: `/api/now/v1/script/execute`

**Option B: Create Custom Scripted REST API**
1. In ServiceNow, navigate to System Web Services > Scripted REST APIs
2. Create new API: "GlideQuery Executor"
3. Create resource: "execute"
4. Method: POST
5. Script:
```javascript
(function process(request, response) {
    var requestBody = request.body.data;
    var script = requestBody.script;
    
    try {
        var result = eval(script);
        response.setStatus(200);
        response.setBody({
            success: true,
            result: result
        });
    } catch (e) {
        response.setStatus(200);
        response.setBody({
            success: false,
            error: {
                message: e.message,
                type: e.name
            }
        });
    }
})(request, response);
```

### Security Considerations

**Common GlideQuery Mistakes to Detect:**
- Using `.selectAll()` (doesn't exist - use `.select()` with no arguments or specify fields)
- Calling multiple terminal operations (e.g., `.select().count()` - can't chain terminal ops)
- Using invalid operators (check against supported operator list)
- Mixing simple aggregates with `.aggregate()` + `.groupBy()`
- Forgetting to handle Optional results (calling `.get()` without checking `.isPresent()`)
- Using field flags incorrectly (e.g., `field$INVALID` instead of `field$DISPLAY`)
- Chaining after terminal operations (GlideQuery methods return new instances, but terminal ops return Stream/Optional)
- Using `.next()` loop pattern from GlideRecord (use `.forEach()` or `.toArray()` instead)
- Calling `.query()` method (doesn't exist - use `.select()`)
- Using `.getValue()` on results (direct field access: `record.field`)
- Not wrapping write operations in try-catch
- Using `.get()` on Optional without null handling
- Attempting to modify GlideQuery instance (it's immutable)

**Blacklisted Patterns:**
- `gs.executeNow()` - direct database execution
- `gs.eval()` - arbitrary code evaluation
- `GlideRecord` operations that bypass GlideQuery
- File system access patterns
- Network request patterns outside ServiceNow API

**Dangerous Operations Requiring Confirmation:**
- `deleteMultiple()` - bulk delete operation
- `updateMultiple()` - bulk update operation
- `.disableWorkflow()` - bypasses business rules
- `.disableAutoSysFields()` - bypasses system field updates
- `.forceUpdate()` - forces updates even without changes
- Any operation affecting more than 100 records

**Script Sanitization:**
- Remove comments that might hide malicious code
- Validate parentheses and bracket matching
- Check for encoded or obfuscated content
- Limit script length to prevent DoS
- Validate that GlideQuery methods are used correctly

### Code Generation Patterns

The GlideQueryGenerator should recognize these common patterns based on actual GlideQuery API:

**Key Differences from GlideRecord:**
- GlideQuery uses `.where()` instead of `.addQuery()`
- GlideQuery uses `.select()` instead of `.query()` + `.next()`
- GlideQuery returns Stream/Optional, not a cursor
- GlideQuery is immutable - each method returns new instance
- GlideQuery uses functional patterns (map, filter, forEach on results)
- No `.next()` loop - use `.forEach()` or `.toArray()` on Stream results
- Field access in results is direct (e.g., `record.field`) not via `.getValue()`

**Best Practices for Code Generation:**
- Always handle Optional results with `.orElse()` or check `.isPresent()` before `.get()`
- Use `.selectOne()` when expecting single result instead of `.select().limit(1)`
- Prefer specific field selection over selecting all fields for performance
- Use `.withAcls()` when security context matters
- Use field flags ($DISPLAY) for user-facing values
- Wrap write operations in try-catch for error handling
- Use `.disableWorkflow()` carefully - only when business rules should be bypassed
- For bulk operations, prefer `.updateMultiple()` over looping with `.update()`
- Use `.count()` instead of `.select().toArray().length` for counting

**Select queries:**
- "get all [table]" → `new GlideQuery('table').select()`
- "find [table] where [field] is [value]" → `new GlideQuery('table').where('field', value).select()`
- "get [fields] from [table]" → `new GlideQuery('table').select('field1', 'field2')`
- "get single [table] where [field] is [value]" → `new GlideQuery('table').where('field', value).selectOne()`
- "get [table] by sys_id" → `new GlideQuery('table').get(sys_id)`

**Filtering:**
- "where [field] equals [value]" → `.where('field', value)` (defaults to '=' operator)
- "where [field] equals [value]" (explicit) → `.where('field', '=', value)`
- "where [field] contains [value]" → `.where('field', 'CONTAINS', value)`
- "where [field] is greater than [value]" → `.where('field', '>', value)`
- "where [field] is null" → `.whereNull('field')`
- "where [field] is not null" → `.whereNotNull('field')`
- "where [field] in [values]" → `.where('field', 'IN', [value1, value2])`
- "where [field] starts with [value]" → `.where('field', 'STARTSWITH', value)`
- "where [field] ends with [value]" → `.where('field', 'ENDSWITH', value)`
- "or where [field] equals [value]" → `.orWhere('field', value)`
- "where [reference].[field] equals [value]" → `.where('reference.field', value)` (dot-walking)

**Supported Operators:**
'=', '!=', '>', '>=', '<', '<=', 'IN', 'NOT IN', 'STARTSWITH', 'ENDSWITH', 'CONTAINS', 'DOES NOT CONTAIN', 'INSTANCEOF', 'SAMEAS', 'NSAMEAS', 'GT_FIELD', 'LT_FIELD', 'GT_OR_EQUALS_FIELD', 'LT_OR_EQUALS_FIELD', 'BETWEEN', 'DYNAMIC', 'EMPTYSTRING', 'ANYTHING', 'LIKE', 'NOT LIKE', 'ON'

**Ordering:**
- "order by [field]" → `.orderBy('field')`
- "order by [field] descending" → `.orderByDesc('field')`

**Limiting:**
- "limit to [n] records" → `.limit(n)`
- "first [n] records" → `.limit(n)`

**Field Selection with Flags:**
- "get display value of [field]" → `.select('field$DISPLAY')`
- "get currency code" → `.select('field$CURRENCY_CODE')`
- "get currency display" → `.select('field$CURRENCY_DISPLAY')`

**Aggregates:**
- "count [table]" → `new GlideQuery('table').count()`
- "average of [field]" → `new GlideQuery('table').avg('field')`
- "sum of [field]" → `new GlideQuery('table').sum('field')`
- "minimum [field]" → `new GlideQuery('table').min('field')`
- "maximum [field]" → `new GlideQuery('table').max('field')`
- "group by [field]" → `.groupBy('field')`
- "having count > [n]" → `.having('COUNT', '*', '>', n)`

**Write operations:**
- "insert [table] with [data]" → `new GlideQuery('table').insert({field: value})`
- "update [table] where [condition]" → `new GlideQuery('table').where('field', value).update({field: newValue})`
- "update multiple [table]" → `new GlideQuery('table').where('field', value).updateMultiple({field: newValue})`
- "delete [table] where [condition]" → `new GlideQuery('table').where('field', value).deleteMultiple()`
- "insert or update [table]" → `new GlideQuery('table').insertOrUpdate({sys_id: id, field: value})`

**Modifiers:**
- "disable workflow" → `.disableWorkflow()`
- "disable auto sys fields" → `.disableAutoSysFields()`
- "force update" → `.forceUpdate()`
- "with ACLs" → `.withAcls()`
- "with security filters" → `.withSecurityDataFilters()`

**Advanced:**
- "parse encoded query" → `GlideQuery.parse('table', 'encoded_query_string')`
- "convert to GlideRecord" → `.toGlideRecord()`

**Encoded Query Parsing:**
GlideQuery can parse ServiceNow encoded query strings (the format used by GlideRecord):
```javascript
// Parse an encoded query string
var query = GlideQuery.parse('incident', 'active=true^priority<=3');
query.select('number', 'short_description');

// This is equivalent to:
new GlideQuery('incident')
  .where('active', true)
  .where('priority', '<=', 3)
  .select('number', 'short_description');
```

**Important Notes:**
- GlideQuery is immutable - each method returns a new instance
- Results aren't fetched until terminal methods are called (select, selectOne, get, count, etc.)
- select() returns a Stream, selectOne() and get() return Optional
- Optional has .get(), .orElse(), .map(), .flatMap() methods
- Stream has .forEach(), .map(), .filter(), .reduce(), .toArray() methods

### Integration with Existing Components

**Handling GlideQuery Return Types:**

When executing GlideQuery scripts, the results will vary based on the terminal operation:

- **Stream results** (from `.select()`): Need to be consumed and converted to arrays or processed with forEach
- **Optional results** (from `.selectOne()`, `.get()`, `.insert()`, `.update()`): Need to check `.isPresent()` and extract with `.get()` or `.orElse()`
- **Primitive results** (from `.count()`, `.deleteMultiple()`, `.updateMultiple()`): Direct numeric values or objects with rowCount
- **Aggregate results**: Optional values that need to be unwrapped

The executor should handle these different return types and format them consistently for the MCP response.

**Configuration:**
Add to existing ServerConfig:
```typescript
interface ServerConfig {
  // ... existing fields ...
  glideQuery?: GlideQueryConfig;
}
```

**Environment Variables:**
- `SERVICENOW_SCRIPT_ENDPOINT` - Script execution API endpoint
- `GLIDEQUERY_TIMEOUT` - Default timeout in milliseconds (default: 30000)
- `GLIDEQUERY_MAX_SCRIPT_LENGTH` - Maximum script length (default: 10000)
- `GLIDEQUERY_TEST_MAX_RESULTS` - Maximum results in test mode (default: 100)

**Logging:**
Use existing logger with new operation types:
- `GLIDEQUERY_EXECUTE` - Script execution
- `GLIDEQUERY_GENERATE` - Code generation
- `GLIDEQUERY_VALIDATE` - Validation
- `GLIDEQUERY_TEST` - Test execution

### Performance Considerations

**Caching:**
- Cache generated code for identical descriptions (LRU cache, max 100 entries)
- Cache validation results for identical scripts (TTL: 5 minutes)

**Timeouts:**
- Default: 30 seconds
- Configurable per request
- Hard maximum: 60 seconds

**Result Limiting:**
- Normal mode: configurable, default 1000 records
- Test mode: fixed at 100 records
- Truncation indicated in response

### Future Enhancements

Potential future additions (not in current scope):
- GlideQuery syntax highlighting and autocomplete
- Query performance analysis
- Query optimization suggestions
- Saved query templates
- Query history and favorites
- Dry-run mode (parse and validate without execution)
- Interactive query builder UI
