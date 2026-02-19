---
inclusion: auto
---

# ServiceNow Development Patterns

## Service Layer Patterns

When implementing ServiceNow table services, follow these established patterns:

### Service Structure

Each ServiceNow table should have a dedicated service class:

```typescript
export class TableNameService {
  constructor(private client: ServiceNowClient) {}
  
  // Query with filters
  async query(filters: TableFilters): Promise<{ items: TableSummary[]; count: number }> {}
  
  // Get by identifier (sys_id or number)
  async get(identifier: string): Promise<{ item: TableDetail | null; found: boolean }> {}
  
  // List recent (ordered by sys_updated_on DESC)
  async listRecent(limit: number = 25): Promise<{ items: TableSummary[]; count: number }> {}
}
```

### Query Building Pattern

Use the `buildQuery` helper method for constructing ServiceNow encoded queries:

```typescript
private buildQuery(filters: TableFilters): string {
  const conditions: string[] = [];
  
  // Array filters (OR within, AND between)
  if (filters.state?.length) {
    const stateConditions = filters.state.map(s => `state=${s}`).join('^OR');
    conditions.push(`(${stateConditions})`);
  }
  
  // Single value filters
  if (filters.assigned_to) {
    conditions.push(`assigned_to=${filters.assigned_to}`);
  }
  
  // Null checks
  if (filters.checkNull) {
    conditions.push(`field=NULL`);
  }
  
  // Custom query (highest priority)
  if (filters.query) {
    return filters.query;
  }
  
  return conditions.join('^');
}
```

### Transformation Pattern

Separate summary and detail transformations:

```typescript
// Summary: minimal fields for lists
private toSummary(record: any): TableSummary {
  return {
    sys_id: record.sys_id,
    number: record.number,
    short_description: record.short_description,
    state: record.state,
    priority: record.priority,
    updated_at: record.sys_updated_on
  };
}

// Detail: complete record with all fields
private toDetail(record: any): TableDetail {
  return {
    ...this.toSummary(record),
    description: record.description,
    category: record.category,
    opened_by: record.opened_by?.display_value,
    opened_at: record.sys_created_on,
    resolution_notes: record.close_notes
  };
}
```

## GlideQuery Patterns

### Query Construction

Use method chaining for readable queries:

```typescript
new GlideQuery('incident')
  .where('active', true)
  .where('priority', '<=', 2)
  .whereNull('assigned_to')
  .orderByDesc('sys_created_on')
  .limit(100)
  .select('number', 'short_description', 'priority');
```

### Aggregation Pattern

```typescript
// Count
new GlideQuery('incident')
  .where('active', true)
  .aggregate('count')
  .toArray();

// Group by with count
new GlideQuery('incident')
  .where('active', true)
  .aggregate('count', 'priority')
  .groupBy('priority')
  .toArray();
```

### Write Operations

Always validate before write operations:

```typescript
// Insert
new GlideQuery('incident')
  .insert({
    short_description: 'New incident',
    priority: 3,
    caller_id: userSysId
  })
  .get();

// Update (single record)
new GlideQuery('incident')
  .where('sys_id', incidentSysId)
  .update({ state: 6 })
  .toArray();
```

## Script Include Patterns

### Class-Based Pattern (Recommended)

```javascript
var ClassName = Class.create();
ClassName.prototype = {
    initialize: function() {
        // Constructor logic
    },
    
    methodName: function(param1, param2) {
        // Method implementation
        return result;
    },
    
    type: 'ClassName'
};
```

### On-Demand Pattern

For utility functions without state:

```javascript
var UtilityClass = Class.create();
UtilityClass.prototype = Object.extendsObject(AbstractAjaxProcessor, {
    // Methods here
    type: 'UtilityClass'
});
```

### GlideAjax Pattern (Client-Callable)

```javascript
var AjaxHandler = Class.create();
AjaxHandler.prototype = Object.extendsObject(AbstractAjaxProcessor, {
    // Client-callable methods must start with specific prefix
    getDataForClient: function() {
        var result = this.getParameter('sysparm_data');
        return JSON.stringify({ data: result });
    },
    
    type: 'AjaxHandler'
});
```

## Security Patterns

### Blacklisted Patterns (Never Use)

- `eval()`, `Function()` - Arbitrary code execution
- `gs.executeNow()`, `gs.eval()` - Server-side eval
- `require()`, `import()` - Module loading
- File system access patterns
- Network request patterns outside ServiceNow APIs

### Discouraged Patterns (Use Alternatives)

- `GlideRecord` → Use `GlideQuery` instead
- `gs.print()` → Use `gs.info()` or proper logging
- Synchronous operations → Use asynchronous where possible

### Allowed Patterns

- `GlideQuery` for database operations
- `gs.info()`, `gs.warn()`, `gs.error()` for logging
- ServiceNow API classes (GlideDateTime, GlideUser, etc.)
- Standard JavaScript operations

## Error Handling Pattern

```typescript
try {
  const response = await this.client.get(endpoint, params);
  return { data: response.data, success: true };
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 404) {
      return { data: null, found: false };
    }
    throw new Error(`API_ERROR: ${error.message}`);
  }
  throw error;
}
```

## Validation Patterns

### Parameter Validation

```typescript
// Validate required parameters
if (!identifier) {
  throw new Error('VALIDATION_ERROR: identifier is required');
}

// Validate format
if (!/^[a-f0-9]{32}$/.test(sysId)) {
  throw new Error('VALIDATION_ERROR: Invalid sys_id format');
}

// Validate ranges
if (limit < 1 || limit > 100) {
  throw new Error('VALIDATION_ERROR: limit must be between 1 and 100');
}
```

### Script Validation

Use `ScriptSecurityValidator` for all script inputs:

```typescript
const validator = new ScriptSecurityValidator();
const validation = validator.validateScriptInclude(script);

if (!validation.isValid) {
  throw new Error(`SECURITY_VIOLATION: ${validation.errors.join(', ')}`);
}

if (validation.warnings.length > 0) {
  logger.warn('Script validation warnings', { warnings: validation.warnings });
}
```

## Testing Patterns

### Unit Test Structure

```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockClient: jest.Mocked<ServiceNowClient>;
  
  beforeEach(() => {
    mockClient = {
      get: jest.fn(),
      post: jest.fn()
    } as any;
    service = new ServiceName(mockClient);
  });
  
  describe('methodName', () => {
    it('should handle success case', async () => {
      mockClient.get.mockResolvedValue({ data: { result: [] } });
      const result = await service.methodName();
      expect(result).toEqual(expected);
    });
    
    it('should handle error case', async () => {
      mockClient.get.mockRejectedValue(new Error('API Error'));
      await expect(service.methodName()).rejects.toThrow();
    });
  });
});
```

### Property-Based Test Structure

```typescript
import fc from 'fast-check';

describe('ServiceName Property Tests', () => {
  it('property: method always returns valid format', () => {
    fc.assert(
      fc.property(
        fc.string(), // arbitrary input
        (input) => {
          const result = service.method(input);
          expect(result).toMatchSchema(expectedSchema);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```
