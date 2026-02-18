# Requirements Document

## Introduction

The ServiceNow MCP Server is a focused Model Context Protocol (MCP) server that enables AI assistants to read incident data from ServiceNow instances. This initial implementation is intentionally minimal, focusing exclusively on querying and retrieving incident records. This narrow scope allows for rapid development and validation before expanding to additional ServiceNow capabilities.

## Glossary

- **MCP_Server**: The Model Context Protocol server that exposes ServiceNow capabilities as tools
- **ServiceNow_Instance**: A specific ServiceNow environment (development, test, or production)
- **Incident**: A ServiceNow record representing an unplanned interruption or reduction in quality of an IT service
- **Incident_Table**: The ServiceNow table (incident) that stores incident records
- **Tool**: An MCP-exposed capability that AI assistants can invoke
- **Authentication_Manager**: Component responsible for managing ServiceNow credentials and sessions
- **API_Client**: Component that handles HTTP communication with ServiceNow REST APIs
- **Query**: A filter expression used to retrieve specific incident records based on criteria

## Requirements

### Requirement 1: ServiceNow Instance Authentication

**User Story:** As a developer, I want to authenticate with my ServiceNow instance, so that the MCP server can read incident data on my behalf.

#### Acceptance Criteria

1. WHEN authentication credentials are provided, THE Authentication_Manager SHALL validate them against the ServiceNow_Instance
2. WHEN valid credentials are provided, THE Authentication_Manager SHALL establish a session and store authentication tokens
3. WHEN invalid credentials are provided, THE Authentication_Manager SHALL return a descriptive error message
4. IF a session expires during an operation, THEN THE Authentication_Manager SHALL detect the expiration and return an authentication error
5. THE MCP_Server SHALL support basic authentication with username and password

### Requirement 2: MCP Server Initialization and Tool Registration

**User Story:** As an AI assistant, I want to discover available ServiceNow tools, so that I can understand what incident operations are possible.

#### Acceptance Criteria

1. WHEN the MCP_Server starts, THE MCP_Server SHALL register all available tools with their JSON schemas
2. WHEN a tool discovery request is received, THE MCP_Server SHALL return a list of available tools with descriptions and parameter schemas
3. THE MCP_Server SHALL provide JSON Schema definitions for all tool input parameters
4. WHEN a tool is invoked with invalid parameters, THE MCP_Server SHALL return schema validation errors
5. THE MCP_Server SHALL register tools for querying incidents, retrieving individual incidents, and listing incidents

### Requirement 3: Query Incidents by Criteria

**User Story:** As a developer, I want to query incidents using filter criteria, so that I can retrieve specific incidents that match my search conditions.

#### Acceptance Criteria

1. WHEN a query request is received with filter criteria, THE MCP_Server SHALL query the Incident_Table using the provided filters
2. WHEN query results are returned, THE MCP_Server SHALL include incident number, short description, state, priority, assigned to, and sys_id for each incident
3. THE MCP_Server SHALL support common query operators including equals, not equals, contains, starts with, and greater than/less than
4. THE MCP_Server SHALL limit query results to a maximum of 100 incidents per request
5. WHEN no incidents match the query criteria, THE MCP_Server SHALL return an empty results array

### Requirement 4: Retrieve Individual Incident by ID

**User Story:** As a developer, I want to retrieve a specific incident by its sys_id or incident number, so that I can view complete incident details.

#### Acceptance Criteria

1. WHEN an incident retrieval request is received with a sys_id, THE MCP_Server SHALL return the complete incident record
2. WHEN an incident retrieval request is received with an incident number, THE MCP_Server SHALL search by number and return the matching incident
3. WHEN retrieving an incident, THE MCP_Server SHALL return all standard incident fields including number, description, state, priority, category, assigned to, opened by, opened at, updated at, and resolution notes
4. IF no incident is found with the provided identifier, THEN THE MCP_Server SHALL return a not found error
5. THE MCP_Server SHALL return incident data in a structured JSON format

### Requirement 5: List Recent Incidents

**User Story:** As a developer, I want to retrieve a list of recent incidents, so that I can see the latest incident activity.

#### Acceptance Criteria

1. WHEN a list request is received without filters, THE MCP_Server SHALL return the most recently created or updated incidents
2. WHEN a list request includes a limit parameter, THE MCP_Server SHALL return up to the specified number of incidents
3. THE MCP_Server SHALL default to returning 25 incidents when no limit is specified
4. THE MCP_Server SHALL order incidents by updated timestamp in descending order (most recent first)
5. WHEN listing incidents, THE MCP_Server SHALL include incident number, short description, state, priority, assigned to, updated at, and sys_id

### Requirement 6: Filter Incidents by State

**User Story:** As a developer, I want to filter incidents by their state, so that I can focus on incidents in specific workflow stages.

#### Acceptance Criteria

1. WHEN a query includes a state filter, THE MCP_Server SHALL return only incidents matching the specified state
2. THE MCP_Server SHALL support filtering by state values including New, In Progress, On Hold, Resolved, and Closed
3. WHEN multiple states are provided, THE MCP_Server SHALL return incidents matching any of the specified states
4. THE MCP_Server SHALL validate state values and return an error for invalid state names
5. WHEN no state filter is provided, THE MCP_Server SHALL return incidents in all states

### Requirement 7: Filter Incidents by Priority

**User Story:** As a developer, I want to filter incidents by priority, so that I can focus on high-priority issues.

#### Acceptance Criteria

1. WHEN a query includes a priority filter, THE MCP_Server SHALL return only incidents matching the specified priority
2. THE MCP_Server SHALL support priority values from 1 (Critical) to 5 (Planning)
3. WHEN multiple priorities are provided, THE MCP_Server SHALL return incidents matching any of the specified priorities
4. THE MCP_Server SHALL validate priority values and return an error for invalid priority numbers
5. WHEN no priority filter is provided, THE MCP_Server SHALL return incidents of all priorities

### Requirement 8: Filter Incidents by Assignment

**User Story:** As a developer, I want to filter incidents by assigned user or group, so that I can see who is working on what.

#### Acceptance Criteria

1. WHEN a query includes an assigned_to filter, THE MCP_Server SHALL return only incidents assigned to the specified user
2. WHEN a query includes an assignment_group filter, THE MCP_Server SHALL return only incidents assigned to the specified group
3. THE MCP_Server SHALL support filtering for unassigned incidents when assigned_to is empty or null
4. THE MCP_Server SHALL accept user names, user sys_ids, group names, or group sys_ids as filter values
5. WHEN both user and group filters are provided, THE MCP_Server SHALL return incidents matching either condition

### Requirement 9: Error Handling and Response Formatting

**User Story:** As a developer, I want clear error messages and structured responses, so that I can understand what happened and troubleshoot issues.

#### Acceptance Criteria

1. WHEN any operation fails, THE MCP_Server SHALL return a structured error response with error code, message, and context
2. WHEN a ServiceNow API returns an error, THE MCP_Server SHALL include the ServiceNow error details in the response
3. WHEN an operation succeeds, THE MCP_Server SHALL return a consistent response format with operation result and relevant metadata
4. THE MCP_Server SHALL log all operations and errors with timestamps for debugging purposes
5. WHEN network connectivity issues occur, THE MCP_Server SHALL detect the issue and return a connection error message

### Requirement 10: Configuration Management

**User Story:** As a developer, I want to configure the MCP server with my ServiceNow instance details, so that I can connect to the correct environment.

#### Acceptance Criteria

1. THE MCP_Server SHALL accept configuration for ServiceNow instance URL, username, and password
2. WHEN configuration is provided, THE MCP_Server SHALL validate the instance URL format
3. THE MCP_Server SHALL support configuration via environment variables
4. WHEN the MCP_Server starts, THE MCP_Server SHALL test connectivity to the ServiceNow_Instance
5. IF the connectivity test fails, THEN THE MCP_Server SHALL log the error and continue startup to allow configuration correction
