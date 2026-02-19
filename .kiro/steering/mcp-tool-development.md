---
inclusion: auto
---

# MCP Tool Development Standards

## Tool Development Workflow

When adding new MCP tools to the ServiceNow server, follow this structured approach:

### 1. Define Types

Create TypeScript interfaces in `src/types/`:

```typescript
// src/types/tableName.ts

// Summary: Minimal fields for list operations
export interface TableSummary {
  sys_id: string;
  number: string;
  short_description: string;
  state: string;
  priority: number;
  updated_at: string;
}

// Detail: Complete record with all fields
export interface TableDetail extends TableSummary {
  description: string;
  category: string;
  opened_by: string;
  opened_at: string;
  resolution_notes: string | null;
}

// Filters: Query parameters
export interface TableFilters {
  state?: string[];
  priority?: number[];
  assigned_to?: string;
  assignment_group?: string;
  query?: string;
  limit?: number;
}

// Tool parameters
export interface QueryTableParams {
  state?: string[];
  priority?: number[];
  assigned_to?: string;
  assignment_group?: string;
  query?: string;
  limit?: number;
}

export interface GetTableParams {
  identifier: string;
}

export interface ListRecentTableParams {
  limit?: number;
}
```

### 2. Implement Service Layer

Create service class in `src/service/`:

```typescript
// src/service/TableNameService.ts

export class TableNameService {
  private readonly tableName = 'table_name';
  
  constructor(private client: ServiceNowClient) {}
  
  async query(filters: TableFilters): Promise<{ items: TableSummary[]; count: number }> {
    const query = this.buildQuery(filters);
    const limit = Math.min(filters.limit || 25, 100);
    
    const response = await this.client.get(`/api/now/table/${this.tableName}`, {
      sysparm_query: query,
      sysparm_limit: limit,
      sysparm_display_value: 'true'
    });
    
    const items = response.data.result.map(this.toSummary);
    return { items, count: items.length };
  }
  
  async get(identifier: string): Promise<{ item: TableDetail | null; found: boolean }> {
    // Implementation
  }
  
  async listRecent(limit: number = 25): Promise<{ items: TableSummary[]; count: number }> {
    // Implementation
  }
  
  private buildQuery(filters: TableFilters): string {
    // Implementation
  }
  
  private toSummary(record: any): TableSummary {
    // Implementation
  }
  
  private toDetail(record: any): TableDetail {
    // Implementation
  }
}
```

### 3. Define Tool Schemas

Add schemas in `src/server/schemas.ts`:

```typescript
export const QUERY_TABLE_SCHEMA = {
  name: 'query_table',
  description: 'Query ServiceNow table records using filter criteria',
  inputSchema: {
    type: 'object',
    properties: {
      state: {
        type: 'array',
        items: { type: 'string' },
        description: 'Filter by states'
      },
      priority: {
        type: 'array',
        items: { type: 'integer', minimum: 1, maximum: 5 },
        description: 'Filter by priority levels (1=Critical, 5=Planning)'
      },
      assigned_to: {
        type: 'string',
        description: 'Filter by assigned user (name or sys_id)'
      },
      assignment_group: {
        type: 'string',
        description: 'Filter by assignment group (name or sys_id)'
      },
      query: {
        type: 'string',
        description: 'Custom ServiceNow encoded query string'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 25,
        description: 'Maximum number of results to return'
      }
    }
  }
};

export const GET_TABLE_SCHEMA = {
  name: 'get_table',
  description: 'Retrieve a specific record by sys_id or number',
  inputSchema: {
    type: 'object',
    properties: {
      identifier: {
        type: 'string',
        description: 'Record sys_id or number (e.g., INC0010001)'
      }
    },
    required: ['identifier']
  }
};

export const LIST_RECENT_TABLE_SCHEMA = {
  name: 'list_recent_table',
  description: 'List the most recently created or updated records',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 25,
        description: 'Maximum number of results to return'
      }
    }
  }
};
```

### 4. Implement Tool Handlers

Create handlers in `src/tools/`:

```typescript
// src/tools/tableNameHandlers.ts

export function createQueryTableHandler(service: TableNameService) {
  return async (params: QueryTableParams) => {
    try {
      // Validate parameters
      if (params.limit !== undefined && (params.limit < 1 || params.limit > 100)) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'VALIDATION_ERROR',
              message: 'limit must be between 1 and 100'
            })
          }]
        };
      }
      
      // Execute service method
      const result = await service.query(params);
      
      // Return formatted response
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            items: result.items,
            count: result.count
          })
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'TOOL_EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  };
}

export function createGetTableHandler(service: TableNameService) {
  return async (params: GetTableParams) => {
    try {
      if (!params.identifier) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'VALIDATION_ERROR',
              message: 'identifier is required'
            })
          }]
        };
      }
      
      const result = await service.get(params.identifier);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            item: result.item,
            found: result.found
          })
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'TOOL_EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  };
}

export function createListRecentTableHandler(service: TableNameService) {
  return async (params: ListRecentTableParams) => {
    try {
      const limit = params.limit || 25;
      
      if (limit < 1 || limit > 100) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'VALIDATION_ERROR',
              message: 'limit must be between 1 and 100'
            })
          }]
        };
      }
      
      const result = await service.listRecent(limit);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            items: result.items,
            count: result.count
          })
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'TOOL_EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error'
          })
        }],
        isError: true
      };
    }
  };
}
```

### 5. Register Tools in MCP Server

Update `src/server/MCPServer.ts`:

```typescript
// Import schemas
import {
  QUERY_TABLE_SCHEMA,
  GET_TABLE_SCHEMA,
  LIST_RECENT_TABLE_SCHEMA
} from './schemas.js';

// Import handlers
import {
  createQueryTableHandler,
  createGetTableHandler,
  createListRecentTableHandler
} from '../tools/tableNameHandlers.js';

// In MCPServer class constructor
this.tableService = new TableNameService(this.client);

// In registerTools method
this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ... existing tools
    QUERY_TABLE_SCHEMA,
    GET_TABLE_SCHEMA,
    LIST_RECENT_TABLE_SCHEMA
  ]
}));

// In tool execution handler
case 'query_table':
  return createQueryTableHandler(this.tableService)(params);
case 'get_table':
  return createGetTableHandler(this.tableService)(params);
case 'list_recent_table':
  return createListRecentTableHandler(this.tableService)(params);
```

### 6. Write Tests

Create comprehensive tests in `src/tools/`:

```typescript
// src/tools/tableNameHandlers.test.ts

describe('Table Name Handlers', () => {
  let service: jest.Mocked<TableNameService>;
  
  beforeEach(() => {
    service = {
      query: jest.fn(),
      get: jest.fn(),
      listRecent: jest.fn()
    } as any;
  });
  
  describe('queryTableHandler', () => {
    it('should return items on success', async () => {
      const mockItems = [{ sys_id: '123', number: 'INC001' }];
      service.query.mockResolvedValue({ items: mockItems, count: 1 });
      
      const handler = createQueryTableHandler(service);
      const result = await handler({ state: ['New'] });
      
      const response = JSON.parse(result.content[0].text);
      expect(response.items).toEqual(mockItems);
      expect(response.count).toBe(1);
    });
    
    it('should validate limit parameter', async () => {
      const handler = createQueryTableHandler(service);
      const result = await handler({ limit: 200 });
      
      const response = JSON.parse(result.content[0].text);
      expect(response.error).toBe('VALIDATION_ERROR');
    });
    
    it('should handle service errors', async () => {
      service.query.mockRejectedValue(new Error('API Error'));
      
      const handler = createQueryTableHandler(service);
      const result = await handler({});
      
      expect(result.isError).toBe(true);
    });
  });
});
```

### 7. Update Documentation

Add tool documentation to `README.md`:

```markdown
### Table Name Tools

#### query_table

Query ServiceNow table records using filter criteria.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | string[] | No | Filter by states |
| `priority` | integer[] | No | Filter by priority (1-5) |
| `limit` | integer | No | Max results (default: 25, max: 100) |

**Example:**

\`\`\`json
{
  "name": "query_table",
  "arguments": {
    "state": ["New"],
    "limit": 50
  }
}
\`\`\`
```

## Tool Design Principles

### 1. Consistent Naming

- Query tools: `query_{table_name}` (plural)
- Get tools: `get_{table_name}` (singular)
- List tools: `list_recent_{table_name}` (plural)

### 2. Parameter Validation

Always validate:
- Required parameters exist
- Numeric ranges (1-100 for limits, 1-5 for priorities)
- String formats (sys_id is 32-char hex)
- Array lengths (reasonable limits)

### 3. Error Handling

Return structured errors:
```typescript
{
  error: 'ERROR_CODE',
  message: 'Human-readable description'
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid parameters
- `NOT_FOUND`: Resource doesn't exist
- `TOOL_EXECUTION_ERROR`: Unexpected error
- `API_ERROR`: ServiceNow API error

### 4. Response Format

Consistent response structure:
```typescript
// Success
{
  items: [...],
  count: number
}

// Single item
{
  item: {...},
  found: boolean
}

// Error
{
  error: string,
  message: string
}
```

### 5. Logging

Log all tool executions:
```typescript
logger.info('Tool executed', {
  tool: 'query_table',
  params: sanitizeParams(params),
  duration: executionTime
});
```

## Testing Standards

### Unit Tests

Test each handler independently:
- Success cases with valid parameters
- Validation errors with invalid parameters
- Service errors and error handling
- Edge cases (empty results, null values)

### Property-Based Tests

Test invariants:
- Valid parameters always succeed or return validation error
- Response format is always consistent
- Error responses always include error code and message

### Integration Tests

Test end-to-end flow:
- Tool registration in MCP server
- Tool execution through MCP protocol
- ServiceNow API interaction

## Common Patterns

### Optional Parameters with Defaults

```typescript
const limit = params.limit || 25;
const includeInactive = params.includeInactive ?? false;
```

### Array Parameter Handling

```typescript
if (params.state?.length) {
  // Process array
}
```

### Identifier Resolution

```typescript
// Support both sys_id and number
if (/^[a-f0-9]{32}$/.test(identifier)) {
  // It's a sys_id
} else {
  // It's a number
}
```

### Display Value Handling

```typescript
// Always request display values for reference fields
const response = await this.client.get(endpoint, {
  sysparm_display_value: 'true'
});

// Access: record.assigned_to.display_value
```

## Performance Considerations

### Limit Result Sets

- Default limit: 25
- Maximum limit: 100
- Always enforce limits to prevent overwhelming responses

### Field Selection

```typescript
// Only request needed fields
sysparm_fields: 'sys_id,number,short_description,state,priority'
```

### Query Optimization

- Use indexed fields in queries (sys_id, number, state)
- Avoid complex OR conditions when possible
- Use encoded queries for complex filters

## Security Considerations

### Input Sanitization

- Validate all user inputs
- Escape special characters in queries
- Limit string lengths

### Permission Checking

- Rely on ServiceNow ACLs
- Don't implement custom permission logic
- Log access attempts

### Sensitive Data

- Never log passwords or tokens
- Sanitize parameters before logging
- Use display values instead of sys_ids when possible
