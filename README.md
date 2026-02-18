# ServiceNow MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to ServiceNow data across multiple tables. This server enables AI tools to query, retrieve, and list ServiceNow records including incidents, users, groups, tasks, stories, scrum tasks, and change requests through a standardized protocol interface.

## Features

### Multi-Table Support
- **Users (sys_user)**: Query, retrieve, and list ServiceNow users
- **Groups (sys_user_group)**: Manage group information and membership
- **Group Members (sys_user_grmember)**: Track group membership relationships
- **Tasks (task)**: Access base task records across all task types
- **Stories (rm_story)**: Query agile user stories and requirements
- **Scrum Tasks (rm_scrum_task)**: Manage scrum task assignments and progress
- **Change Requests (change_request)**: Track change management workflows

### Incident Management
- **Query Incidents**: Filter incidents by state, priority, assignment, and custom criteria
- **Retrieve Incidents**: Get complete incident details by sys_id or incident number
- **List Recent Incidents**: View the most recently updated incidents

### GlideQuery Development
- **Execute GlideQuery Scripts**: Run GlideQuery code directly on ServiceNow instances
- **Generate GlideQuery Code**: Convert natural language to syntactically valid GlideQuery
- **Test GlideQuery Scripts**: Safely test queries with result limiting and warnings

### Security & Reliability
- **Secure Authentication**: Basic authentication with ServiceNow instances
- **Script Security Validation**: Blacklist dangerous patterns and operations
- **Comprehensive Logging**: Configurable logging with sensitive data sanitization
- **Error Handling**: Structured error responses with detailed context

## Installation

### Prerequisites

- Node.js 18 or higher
- A ServiceNow instance with API access
- Valid ServiceNow credentials with incident read permissions

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

## Configuration

The server is configured using environment variables. Create a `.env` file in the project root or set these variables in your environment:

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SERVICENOW_INSTANCE_URL` | Your ServiceNow instance URL | `https://dev12345.service-now.com` |
| `SERVICENOW_USERNAME` | ServiceNow username | `admin` |
| `SERVICENOW_PASSWORD` | ServiceNow password | `your-password` |

### Optional Environment Variables

| Variable | Description | Default | Options |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | Logging verbosity level | `info` | `debug`, `info`, `warn`, `error` |

### Example Configuration

Copy `.env.example` to `.env` and update with your credentials:

```bash
cp .env.example .env
```

Edit `.env`:

```env
SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com
SERVICENOW_USERNAME=your-username
SERVICENOW_PASSWORD=your-password
LOG_LEVEL=info
```

## Usage

### Start the Server

```bash
npm start
```

Or run directly:

```bash
node dist/main.js
```

The server will:
1. Load configuration from environment variables
2. Test connectivity to your ServiceNow instance
3. Authenticate with ServiceNow
4. Register available tools
5. Start listening for MCP protocol requests via stdio

### Development Mode

Build and run in one command:

```bash
npm run dev
```

## Available Tools

The server exposes 27 tools through the MCP protocol across 9 ServiceNow tables:

- **Incidents** (3 tools): query_incidents, get_incident, list_recent_incidents
- **Users** (3 tools): query_users, get_user, list_recent_users
- **Groups** (3 tools): query_groups, get_group, list_recent_groups
- **Group Members** (3 tools): query_group_members, get_group_member, list_recent_group_members
- **Tasks** (3 tools): query_tasks, get_task, list_recent_tasks
- **Stories** (3 tools): query_stories, get_story, list_recent_stories
- **Scrum Tasks** (3 tools): query_scrum_tasks, get_scrum_task, list_recent_scrum_tasks
- **Change Requests** (3 tools): query_change_requests, get_change_request, list_recent_change_requests
- **GlideQuery Development** (3 tools): execute_glidequery, generate_glidequery, test_glidequery

### Incident Query Tools

#### 1. query_incidents

Query ServiceNow incidents using filter criteria.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | string[] | No | Filter by incident states (New, In Progress, On Hold, Resolved, Closed) |
| `priority` | integer[] | No | Filter by priority levels (1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning) |
| `assigned_to` | string | No | Filter by assigned user (name or sys_id) |
| `assignment_group` | string | No | Filter by assignment group (name or sys_id) |
| `query` | string | No | Custom ServiceNow encoded query string |
| `limit` | integer | No | Maximum results to return (default: 25, max: 100) |

**Example:**

```json
{
  "name": "query_incidents",
  "arguments": {
    "state": ["New", "In Progress"],
    "priority": [1, 2],
    "limit": 50
  }
}
```

**Response:**

```json
{
  "incidents": [
    {
      "sys_id": "abc123...",
      "number": "INC0010001",
      "short_description": "Unable to access email",
      "state": "2",
      "priority": 2,
      "assigned_to": "John Doe",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### 2. get_incident

Retrieve a specific ServiceNow incident by its sys_id or incident number.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identifier` | string | Yes | Incident sys_id (32-char hex) or incident number (e.g., INC0010001) |

**Example:**

```json
{
  "name": "get_incident",
  "arguments": {
    "identifier": "INC0010001"
  }
}
```

**Response:**

```json
{
  "incident": {
    "sys_id": "abc123...",
    "number": "INC0010001",
    "short_description": "Unable to access email",
    "description": "User reports cannot access email since this morning...",
    "state": "2",
    "priority": 2,
    "category": "Software",
    "assigned_to": "John Doe",
    "opened_by": "Jane Smith",
    "opened_at": "2024-01-15T08:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "resolution_notes": null
  },
  "found": true
}
```

#### 3. list_recent_incidents

List the most recently created or updated ServiceNow incidents.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Maximum results to return (default: 25, max: 100) |

**Example:**

```json
{
  "name": "list_recent_incidents",
  "arguments": {
    "limit": 10
  }
}
```

**Response:**

```json
{
  "incidents": [
    {
      "sys_id": "abc123...",
      "number": "INC0010001",
      "short_description": "Unable to access email",
      "state": "2",
      "priority": 2,
      "assigned_to": "John Doe",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1
}
```

### GlideQuery Development Tools

The server provides three tools for GlideQuery development, enabling interactive script execution, code generation, and testing capabilities.

#### 4. execute_glidequery

Execute a GlideQuery script on the ServiceNow instance. Supports querying, inserting, updating, and deleting records using the modern GlideQuery API.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `script` | string | Yes | GlideQuery script to execute |
| `timeout` | integer | No | Execution timeout in milliseconds (default: 30000, max: 60000) |

**Example:**

```json
{
  "name": "execute_glidequery",
  "arguments": {
    "script": "new GlideQuery('incident').where('active', true).where('priority', '<=', 2).select('number', 'short_description')",
    "timeout": 30000
  }
}
```

**Response:**

```json
{
  "success": true,
  "result": [
    {
      "number": "INC0010001",
      "short_description": "Unable to access email"
    },
    {
      "number": "INC0010002",
      "short_description": "Network connectivity issue"
    }
  ],
  "logs": [],
  "executionTime": 245,
  "recordCount": 2
}
```

**Security Considerations:**

- Scripts are validated against blacklisted patterns (e.g., `gs.executeNow`, `gs.eval`, file system access)
- Maximum script length: 10,000 characters
- Dangerous operations (deleteMultiple, updateMultiple) are detected and logged
- Write operations will persist changes to the database

**Common Use Cases:**

- Query incidents with complex filters
- Aggregate data (count, sum, average)
- Update records with business logic
- Test GlideQuery syntax before deployment

#### 5. generate_glidequery

Generate GlideQuery code from a natural language description. Produces syntactically valid GlideQuery code with explanatory comments and best practices.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `description` | string | Yes | Natural language description of the desired query |
| `table` | string | No | Optional table name hint (e.g., 'incident', 'cmdb_ci_server') |
| `includeComments` | boolean | No | Whether to include explanatory comments (default: true) |

**Example:**

```json
{
  "name": "generate_glidequery",
  "arguments": {
    "description": "get all active incidents where priority is 1 or 2, ordered by created date descending, limit to 10",
    "includeComments": true
  }
}
```

**Response:**

```json
{
  "code": "// Query incident table\n// Retrieve multiple records\n// Filters: 3 condition(s)\n// Ordered by: sys_created_on DESC\n// Limited to 10 records\n\nnew GlideQuery('incident')\n  .where('active', true)\n  .orWhere('priority', 1)\n  .orWhere('priority', 2)\n  .orderByDesc('sys_created_on')\n  .limit(10)\n  .select();\n\n// Returns Stream - use .forEach(), .toArray(), or other Stream methods",
  "explanation": "This query selects records from the incident table with 3 filter condition(s), ordered by sys_created_on, limited to 10 records.",
  "warnings": []
}
```

**Supported Query Patterns:**

- Filtering with operators (=, !=, >, <, >=, <=, IN, CONTAINS, STARTSWITH, ENDSWITH)
- Null checks (whereNull, whereNotNull)
- OR conditions (orWhere)
- Ordering (orderBy, orderByDesc)
- Limiting results (limit)
- Field selection with flags ($DISPLAY, $CURRENCY_CODE)
- Aggregates (count, avg, sum, min, max)
- Write operations (insert, update, updateMultiple, deleteMultiple)
- Modifiers (disableWorkflow, withAcls, etc.)

**Common Use Cases:**

- Quickly create queries without memorizing GlideQuery syntax
- Learn GlideQuery patterns and best practices
- Generate boilerplate code for common operations
- Convert natural language requirements to code

#### 6. test_glidequery

Test a GlideQuery script in a safe mode with result limiting. Executes the script with a maximum result limit and provides warnings for write operations.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `script` | string | Yes | GlideQuery script to test |
| `maxResults` | integer | No | Maximum results to return (default: 100, max: 1000) |

**Example:**

```json
{
  "name": "test_glidequery",
  "arguments": {
    "script": "new GlideQuery('incident').where('active', true).select('number', 'short_description')",
    "maxResults": 50
  }
}
```

**Response:**

```json
{
  "success": true,
  "result": [
    {
      "number": "INC0010001",
      "short_description": "Unable to access email"
    }
  ],
  "warnings": [],
  "executionTime": 180,
  "recordCount": 1,
  "truncated": false
}
```

**Test Mode Features:**

- Automatic result limiting to prevent overwhelming output
- Warnings for write operations (insert, update, delete)
- Truncation indicators when results exceed limit
- Safe environment for validating query behavior

**Common Use Cases:**

- Validate query syntax before deployment
- Preview query results with limited output
- Test complex filters and conditions
- Verify write operations before execution

### GlideQuery Configuration

To use GlideQuery tools, ensure your ServiceNow instance has the Script Execution API enabled, or create a custom Scripted REST API endpoint:

**Option A: Use Script Execution API (if available)**
- No setup required if your instance has this API enabled
- Endpoint: `/api/now/v1/script/execute`

**Option B: Create Custom Scripted REST API**
1. Navigate to System Web Services > Scripted REST APIs
2. Create new API: "GlideQuery Executor"
3. Create resource: "execute" (POST method)
4. Add the script execution logic (see design document for details)

**Environment Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `SERVICENOW_SCRIPT_ENDPOINT` | Script execution API endpoint | `/api/now/v1/script/execute` |
| `GLIDEQUERY_TIMEOUT` | Default timeout in milliseconds | 30000 |
| `GLIDEQUERY_MAX_SCRIPT_LENGTH` | Maximum script length | 10000 |
| `GLIDEQUERY_TEST_MAX_RESULTS` | Maximum results in test mode | 100 |

### User Management Tools

The server provides three tools for querying and retrieving ServiceNow user information.

#### 7. query_users

Query ServiceNow users using filter criteria. Supports filtering by active status, department, role, name, and custom query strings.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `active` | boolean | No | Filter by active status (true for active users, false for inactive) |
| `department` | string | No | Filter by department (name or sys_id) |
| `role` | string | No | Filter by role (name or sys_id) |
| `name` | string | No | Filter by user name (partial match) |
| `query` | string | No | Custom ServiceNow encoded query string |
| `limit` | integer | No | Maximum results to return (default: 25, max: 100) |

**Example:**

```json
{
  "name": "query_users",
  "arguments": {
    "active": true,
    "department": "IT",
    "limit": 50
  }
}
```

#### 8. get_user

Retrieve a specific ServiceNow user by sys_id or username.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identifier` | string | Yes | User sys_id or username (e.g., admin) |

#### 9. list_recent_users

List the most recently created or updated ServiceNow users.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | No | Maximum results to return (default: 25, max: 100) |

### Group Management Tools

#### 10. query_groups

Query ServiceNow groups using filter criteria.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `active` | boolean | No | Filter by active status |
| `type` | string | No | Filter by group type |
| `name` | string | No | Filter by group name (partial match) |
| `query` | string | No | Custom ServiceNow encoded query string |
| `limit` | integer | No | Maximum results to return (default: 25, max: 100) |

#### 11. get_group

Retrieve a specific ServiceNow group by sys_id or group name.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identifier` | string | Yes | Group sys_id or group name |

#### 12. list_recent_groups

List the most recently created or updated ServiceNow groups.

### Group Member Tools

#### 13. query_group_members

Query ServiceNow group members using filter criteria.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `group` | string | No | Filter by group (name or sys_id) |
| `user` | string | No | Filter by user (username or sys_id) |
| `query` | string | No | Custom ServiceNow encoded query string |
| `limit` | integer | No | Maximum results to return (default: 25, max: 100) |

#### 14. get_group_member

Retrieve a specific ServiceNow group member by sys_id.

#### 15. list_recent_group_members

List the most recently created or updated ServiceNow group members.

### Task Management Tools

#### 16. query_tasks

Query ServiceNow tasks using filter criteria.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | string[] | No | Filter by task states (Open, Work In Progress, Closed, Pending, Canceled) |
| `priority` | integer[] | No | Filter by priority levels (1-5) |
| `assigned_to` | string | No | Filter by assigned user (name or sys_id) |
| `assignment_group` | string | No | Filter by assignment group (name or sys_id) |
| `query` | string | No | Custom ServiceNow encoded query string |
| `limit` | integer | No | Maximum results to return (default: 25, max: 100) |

#### 17. get_task

Retrieve a specific ServiceNow task by sys_id or task number.

#### 18. list_recent_tasks

List the most recently created or updated ServiceNow tasks.

### Story Management Tools

#### 19. query_stories

Query ServiceNow stories using filter criteria.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | string[] | No | Filter by story states (Draft, Ready, In Progress, Review, Complete, Accepted) |
| `priority` | integer[] | No | Filter by priority levels (1-5) |
| `sprint` | string | No | Filter by sprint (name or sys_id) |
| `assigned_to` | string | No | Filter by assigned user (name or sys_id) |
| `story_points` | integer | No | Filter by story points |
| `query` | string | No | Custom ServiceNow encoded query string |
| `limit` | integer | No | Maximum results to return (default: 25, max: 100) |

#### 20. get_story

Retrieve a specific ServiceNow story by sys_id or story number.

#### 21. list_recent_stories

List the most recently created or updated ServiceNow stories.

### Scrum Task Management Tools

#### 22. query_scrum_tasks

Query ServiceNow scrum tasks using filter criteria.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | string[] | No | Filter by scrum task states (Ready, Work In Progress, Complete, Canceled) |
| `priority` | integer[] | No | Filter by priority levels (1-5) |
| `sprint` | string | No | Filter by sprint (name or sys_id) |
| `assigned_to` | string | No | Filter by assigned user (name or sys_id) |
| `parent_story` | string | No | Filter by parent story (number or sys_id) |
| `query` | string | No | Custom ServiceNow encoded query string |
| `limit` | integer | No | Maximum results to return (default: 25, max: 100) |

#### 23. get_scrum_task

Retrieve a specific ServiceNow scrum task by sys_id or scrum task number.

#### 24. list_recent_scrum_tasks

List the most recently created or updated ServiceNow scrum tasks.

### Change Request Management Tools

#### 25. query_change_requests

Query ServiceNow change requests using filter criteria.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `state` | string[] | No | Filter by change request states (New, Assess, Authorize, Scheduled, Implement, Review, Closed, Canceled) |
| `priority` | integer[] | No | Filter by priority levels (1-5) |
| `risk` | integer[] | No | Filter by risk levels (1=High, 2=Moderate, 3=Low) |
| `type` | string[] | No | Filter by change request type (standard, normal, emergency) |
| `assigned_to` | string | No | Filter by assigned user (name or sys_id) |
| `assignment_group` | string | No | Filter by assignment group (name or sys_id) |
| `query` | string | No | Custom ServiceNow encoded query string |
| `limit` | integer | No | Maximum results to return (default: 25, max: 100) |

#### 26. get_change_request

Retrieve a specific ServiceNow change request by sys_id or change request number.

#### 27. list_recent_change_requests

List the most recently created or updated ServiceNow change requests.

## Error Codes

The server returns structured error responses with the following codes:

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `AUTH_ERROR` | Not authenticated | Verify credentials and re-authenticate |
| `AUTH_EXPIRED` | Session expired | Re-authenticate with ServiceNow |
| `FORBIDDEN` | Insufficient permissions | Check user permissions in ServiceNow |
| `NOT_FOUND` | Resource not found | Verify the identifier or table name |
| `VALIDATION_ERROR` | Invalid parameters | Check parameter values against schema |
| `SCHEMA_VALIDATION_ERROR` | Schema validation failed | Review tool parameter requirements |
| `API_ERROR` | ServiceNow API error | Check ServiceNow instance status |
| `NETWORK_ERROR` | Network connectivity issue | Verify instance URL and network connection |
| `TIMEOUT` | Request timeout | Check network connection and instance performance |
| `TOOL_NOT_FOUND` | Tool does not exist | Use list_tools to see available tools |
| `TOOL_EXECUTION_ERROR` | Tool execution failed | Check logs for details |
| `SECURITY_VIOLATION` | Script contains blacklisted patterns | Review script for dangerous operations |
| `ENDPOINT_NOT_FOUND` | Script execution endpoint not available | Configure Script Execution API or custom endpoint |
| `GENERATION_ERROR` | Code generation failed | Check description for ambiguity |

## Troubleshooting

### Incident Query Issues

#### Authentication Fails

### Authentication Fails

**Problem:** Server fails to start with authentication error

**Solutions:**
- Verify `SERVICENOW_INSTANCE_URL` is correct and includes `https://`
- Check username and password are correct
- Ensure user has API access permissions in ServiceNow
- Verify the ServiceNow instance is accessible from your network

#### Connection Timeout

**Problem:** Requests timeout when querying incidents

**Solutions:**
- Check network connectivity to ServiceNow instance
- Verify firewall rules allow outbound HTTPS connections
- Try reducing query result limits
- Check ServiceNow instance performance

#### Invalid State or Priority Values

**Problem:** Query fails with validation error

**Solutions:**
- Use valid state names: `New`, `In Progress`, `On Hold`, `Resolved`, `Closed`
- Use priority numbers 1-5 (1=Critical, 5=Planning)
- Check the design document for valid filter values

#### No Results Returned

**Problem:** Query returns empty results

**Solutions:**
- Verify incidents exist matching your filter criteria
- Check user permissions allow viewing the incidents
- Try removing filters to see all incidents
- Use `list_recent_incidents` to verify connectivity

### GlideQuery Tool Issues

#### Script Execution Endpoint Not Found

**Problem:** execute_glidequery fails with ENDPOINT_NOT_FOUND error

**Solutions:**
- Verify Script Execution API is enabled on your ServiceNow instance
- Create a custom Scripted REST API endpoint (see GlideQuery Configuration section)
- Check `SERVICENOW_SCRIPT_ENDPOINT` environment variable is set correctly
- Ensure user has permissions to access the script execution endpoint

#### Security Violation Error

**Problem:** Script execution blocked with SECURITY_VIOLATION error

**Solutions:**
- Remove blacklisted patterns: `gs.executeNow`, `gs.eval`, `eval`, `Function`
- Avoid file system access and network request patterns
- Use GlideQuery instead of GlideRecord for better security
- Review script for dangerous operations (deleteMultiple, updateMultiple)

#### Script Timeout

**Problem:** Script execution times out after 30 seconds

**Solutions:**
- Reduce query complexity or add more specific filters
- Increase timeout parameter (max 60 seconds)
- Use `.limit()` to reduce result set size
- Check ServiceNow instance performance
- Consider breaking complex operations into smaller scripts

#### Generated Code Doesn't Match Intent

**Problem:** generate_glidequery produces unexpected code

**Solutions:**
- Make description more specific and explicit
- Include table name hint for non-incident tables
- Use explicit operators in description (e.g., "greater than" instead of "more than")
- Review generated code and adjust description
- Refer to GlideQuery API documentation for correct syntax

#### Test Mode Results Truncated

**Problem:** test_glidequery truncates results unexpectedly

**Solutions:**
- This is expected behavior to prevent overwhelming output
- Increase `maxResults` parameter (max 1000)
- Use `.limit()` in your query to control result size
- For full results, use `execute_glidequery` instead
- Check `truncated` flag in response to detect truncation

## Logging

The server logs all operations with timestamps, operation types, parameters, and results. Sensitive data (passwords, tokens) is automatically sanitized from logs.

### Log Levels

- **DEBUG**: Detailed request/response data, useful for development
- **INFO**: Successful operations and important events (default)
- **WARN**: Retryable errors and validation failures
- **ERROR**: Authentication failures, API errors, network errors

### Example Log Output

```
[2024-01-15T10:30:00.123Z] [INFO] [authenticate] Authentication successful result={"success":true} duration=245ms
[2024-01-15T10:30:05.456Z] [INFO] [query_incidents] Querying incidents params={"filters":{"state":["New"],"limit":25}}
[2024-01-15T10:30:05.789Z] [INFO] [query_incidents] Query completed result={"count":15} duration=333ms
```

## Development

### Run Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Build

```bash
npm run build
```

## Architecture

The server follows a layered architecture:

- **MCP Protocol Layer**: Handles MCP protocol communication and tool registration
- **Service Layer**: Implements business logic for all ServiceNow table operations
  - IncidentService: Incident query and retrieval operations
  - UserService: User management and query operations
  - GroupService: Group management and query operations
  - GroupMemberService: Group membership tracking
  - TaskService: Task query and retrieval operations
  - StoryService: Story management for agile workflows
  - ScrumTaskService: Scrum task tracking and management
  - ChangeRequestService: Change request workflow operations
  - GlideQueryExecutor: Script execution, validation, and security checking
  - GlideQueryGenerator: Natural language to code generation
  - ScriptSecurityValidator: Security validation for scripts
- **API Client Layer**: Manages HTTP communication with ServiceNow REST APIs
  - ServiceNowClient: Table API and Script Execution API communication
- **Authentication Layer**: Handles credential management and session lifecycle
- **Configuration Layer**: Manages environment-based configuration

## Security

### Authentication & Access Control
- Credentials are never logged (automatically sanitized)
- Basic authentication over HTTPS only
- Session management with expiration detection
- User permissions enforced by ServiceNow

### GlideQuery Script Security
- Script validation against blacklisted patterns
- Maximum script length enforcement (10,000 characters)
- Dangerous operation detection (deleteMultiple, updateMultiple, disableWorkflow)
- Execution logging with timestamps and user information
- No arbitrary code execution outside GlideQuery API

### Data Access
- Incident tools provide read-only access
- GlideQuery tools can modify data (write operations logged and warned)
- All operations respect ServiceNow ACLs and security rules

## License

MIT

## Support

For issues, questions, or contributions, please refer to the project repository.
