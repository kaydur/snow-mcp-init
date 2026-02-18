# Requirements Document

## Introduction

The ServiceNow Multi-Table Support feature extends the existing ServiceNow MCP Server to support querying and retrieving data from five additional ServiceNow tables beyond the current incident table. This expansion enables AI assistants to access a broader range of ServiceNow data including users, groups, stories, scrum tasks, and change requests. The implementation follows the established architectural patterns from the incident implementation, ensuring consistency and maintainability.

## Glossary

- **MCP_Server**: The Model Context Protocol server that exposes ServiceNow capabilities as tools
- **ServiceNow_Instance**: A specific ServiceNow environment (development, test, or production)
- **Table_Service**: A service class that provides business logic for operations on a specific ServiceNow table
- **API_Client**: The ServiceNowClient component that handles HTTP communication with ServiceNow REST APIs
- **Tool**: An MCP-exposed capability that AI assistants can invoke
- **User_Table**: The ServiceNow table (sys_user) that stores user records
- **Group_Table**: The ServiceNow table (sys_user_group) that stores group records
- **Story_Table**: The ServiceNow table (rm_story) that stores story records
- **Scrum_Task_Table**: The ServiceNow table (rm_scrum_task) that stores scrum task records
- **Change_Request_Table**: The ServiceNow table (change_request) that stores change request records
- **Summary_View**: A lightweight data representation containing key fields for list and query operations
- **Detail_View**: A comprehensive data representation containing all standard fields for individual record retrieval

## Requirements

### Requirement 1: Query Users

**User Story:** As a developer, I want to query users using filter criteria, so that I can retrieve specific user records that match my search conditions.

#### Acceptance Criteria

1. WHEN a query request is received with filter criteria, THE User_Service SHALL query the User_Table using the provided filters
2. WHEN query results are returned, THE User_Service SHALL include sys_id, user_name, name, email, active status, and title for each user
3. THE User_Service SHALL support filtering by active status, department, role, and name
4. THE User_Service SHALL limit query results to a maximum of 100 users per request
5. WHEN no users match the query criteria, THE User_Service SHALL return an empty results array

### Requirement 2: Retrieve Individual User

**User Story:** As a developer, I want to retrieve a specific user by sys_id or username, so that I can view complete user details.

#### Acceptance Criteria

1. WHEN a user retrieval request is received with a sys_id, THE User_Service SHALL return the complete user record
2. WHEN a user retrieval request is received with a username, THE User_Service SHALL search by user_name and return the matching user
3. WHEN retrieving a user, THE User_Service SHALL return all standard fields including sys_id, user_name, name, email, phone, title, department, manager, active, and created_at
4. IF no user is found with the provided identifier, THEN THE User_Service SHALL return a not found error
5. THE User_Service SHALL return user data in a structured JSON format

### Requirement 3: Query Groups

**User Story:** As a developer, I want to query groups using filter criteria, so that I can retrieve specific group records that match my search conditions.

#### Acceptance Criteria

1. WHEN a query request is received with filter criteria, THE Group_Service SHALL query the Group_Table using the provided filters
2. WHEN query results are returned, THE Group_Service SHALL include sys_id, name, description, active status, type, and manager for each group
3. THE Group_Service SHALL support filtering by active status, type, and name
4. THE Group_Service SHALL limit query results to a maximum of 100 groups per request
5. WHEN no groups match the query criteria, THE Group_Service SHALL return an empty results array

### Requirement 4: Retrieve Individual Group

**User Story:** As a developer, I want to retrieve a specific group by sys_id or name, so that I can view complete group details.

#### Acceptance Criteria

1. WHEN a group retrieval request is received with a sys_id, THE Group_Service SHALL return the complete group record
2. WHEN a group retrieval request is received with a name, THE Group_Service SHALL search by name and return the matching group
3. WHEN retrieving a group, THE Group_Service SHALL return all standard fields including sys_id, name, description, active, type, manager, email, and created_at
4. IF no group is found with the provided identifier, THEN THE Group_Service SHALL return a not found error
5. THE Group_Service SHALL return group data in a structured JSON format

### Requirement 5: Query Stories

**User Story:** As a developer, I want to query stories using filter criteria, so that I can retrieve specific story records that match my search conditions.

#### Acceptance Criteria

1. WHEN a query request is received with filter criteria, THE Story_Service SHALL query the Story_Table using the provided filters
2. WHEN query results are returned, THE Story_Service SHALL include sys_id, number, short_description, state, priority, assigned_to, story_points, and updated_at for each story
3. THE Story_Service SHALL support filtering by state, priority, sprint, assigned user, and story points
4. THE Story_Service SHALL limit query results to a maximum of 100 stories per request
5. WHEN no stories match the query criteria, THE Story_Service SHALL return an empty results array

### Requirement 6: Retrieve Individual Story

**User Story:** As a developer, I want to retrieve a specific story by sys_id or number, so that I can view complete story details.

#### Acceptance Criteria

1. WHEN a story retrieval request is received with a sys_id, THE Story_Service SHALL return the complete story record
2. WHEN a story retrieval request is received with a number, THE Story_Service SHALL search by number and return the matching story
3. WHEN retrieving a story, THE Story_Service SHALL return all standard fields including sys_id, number, short_description, description, state, priority, assigned_to, story_points, sprint, product, opened_by, opened_at, and updated_at
4. IF no story is found with the provided identifier, THEN THE Story_Service SHALL return a not found error
5. THE Story_Service SHALL return story data in a structured JSON format

### Requirement 7: Query Scrum Tasks

**User Story:** As a developer, I want to query scrum tasks using filter criteria, so that I can retrieve specific scrum task records that match my search conditions.

#### Acceptance Criteria

1. WHEN a query request is received with filter criteria, THE Scrum_Task_Service SHALL query the Scrum_Task_Table using the provided filters
2. WHEN query results are returned, THE Scrum_Task_Service SHALL include sys_id, number, short_description, state, priority, assigned_to, remaining_work, and updated_at for each scrum task
3. THE Scrum_Task_Service SHALL support filtering by state, priority, sprint, assigned user, and parent story
4. THE Scrum_Task_Service SHALL limit query results to a maximum of 100 scrum tasks per request
5. WHEN no scrum tasks match the query criteria, THE Scrum_Task_Service SHALL return an empty results array

### Requirement 8: Retrieve Individual Scrum Task

**User Story:** As a developer, I want to retrieve a specific scrum task by sys_id or number, so that I can view complete scrum task details.

#### Acceptance Criteria

1. WHEN a scrum task retrieval request is received with a sys_id, THE Scrum_Task_Service SHALL return the complete scrum task record
2. WHEN a scrum task retrieval request is received with a number, THE Scrum_Task_Service SHALL search by number and return the matching scrum task
3. WHEN retrieving a scrum task, THE Scrum_Task_Service SHALL return all standard fields including sys_id, number, short_description, description, state, priority, assigned_to, remaining_work, parent_story, sprint, opened_by, opened_at, and updated_at
4. IF no scrum task is found with the provided identifier, THEN THE Scrum_Task_Service SHALL return a not found error
5. THE Scrum_Task_Service SHALL return scrum task data in a structured JSON format

### Requirement 9: Query Change Requests

**User Story:** As a developer, I want to query change requests using filter criteria, so that I can retrieve specific change request records that match my search conditions.

#### Acceptance Criteria

1. WHEN a query request is received with filter criteria, THE Change_Request_Service SHALL query the Change_Request_Table using the provided filters
2. WHEN query results are returned, THE Change_Request_Service SHALL include sys_id, number, short_description, state, priority, risk, type, assigned_to, and updated_at for each change request
3. THE Change_Request_Service SHALL support filtering by state, priority, risk, type, assigned user, and assignment group
4. THE Change_Request_Service SHALL limit query results to a maximum of 100 change requests per request
5. WHEN no change requests match the query criteria, THE Change_Request_Service SHALL return an empty results array

### Requirement 10: Retrieve Individual Change Request

**User Story:** As a developer, I want to retrieve a specific change request by sys_id or number, so that I can view complete change request details.

#### Acceptance Criteria

1. WHEN a change request retrieval request is received with a sys_id, THE Change_Request_Service SHALL return the complete change request record
2. WHEN a change request retrieval request is received with a number, THE Change_Request_Service SHALL search by number and return the matching change request
3. WHEN retrieving a change request, THE Change_Request_Service SHALL return all standard fields including sys_id, number, short_description, description, state, priority, risk, type, category, assigned_to, assignment_group, start_date, end_date, opened_by, opened_at, and updated_at
4. IF no change request is found with the provided identifier, THEN THE Change_Request_Service SHALL return a not found error
5. THE Change_Request_Service SHALL return change request data in a structured JSON format

### Requirement 11: List Recent Records for All Tables

**User Story:** As a developer, I want to retrieve a list of recent records from any supported table, so that I can see the latest activity across different ServiceNow tables.

#### Acceptance Criteria

1. WHEN a list request is received for any supported table, THE corresponding Table_Service SHALL return the most recently created or updated records
2. WHEN a list request includes a limit parameter, THE Table_Service SHALL return up to the specified number of records
3. THE Table_Service SHALL default to returning 25 records when no limit is specified
4. THE Table_Service SHALL order records by updated timestamp in descending order (most recent first)
5. WHEN listing records, THE Table_Service SHALL include all summary view fields for that table type

### Requirement 12: MCP Tool Registration for All Tables

**User Story:** As an AI assistant, I want to discover available tools for all supported ServiceNow tables, so that I can understand what operations are possible across different tables.

#### Acceptance Criteria

1. WHEN the MCP_Server starts, THE MCP_Server SHALL register query, get, and list_recent tools for each supported table
2. WHEN a tool discovery request is received, THE MCP_Server SHALL return tools for all five new tables in addition to existing incident tools
3. THE MCP_Server SHALL provide JSON Schema definitions for all tool input parameters for each table
4. WHEN a tool is invoked with invalid parameters, THE MCP_Server SHALL return schema validation errors
5. THE MCP_Server SHALL use consistent naming patterns for tools: query_[table], get_[table], list_recent_[table]

### Requirement 13: Data Transformation for All Tables

**User Story:** As a developer, I want ServiceNow records to be transformed into typed interfaces, so that I can work with consistent, well-structured data across all tables.

#### Acceptance Criteria

1. WHEN ServiceNow records are retrieved, THE Table_Service SHALL transform raw ServiceNow data into typed Summary or Detail interfaces
2. THE Table_Service SHALL handle null and missing fields gracefully by providing appropriate default values or null
3. THE Table_Service SHALL convert ServiceNow field types to appropriate TypeScript types (strings, numbers, booleans, dates)
4. THE Table_Service SHALL include all required fields in Summary views for list and query operations
5. THE Table_Service SHALL include all standard fields in Detail views for individual record retrieval

### Requirement 14: Filter Validation for All Tables

**User Story:** As a developer, I want filter parameters to be validated before queries are executed, so that I receive clear error messages for invalid inputs.

#### Acceptance Criteria

1. WHEN a query includes filter values, THE Table_Service SHALL validate filter values against known valid values for that table
2. WHEN invalid filter values are provided, THE Table_Service SHALL return a validation error with a descriptive message
3. THE Table_Service SHALL validate state values against the valid states for that specific table type
4. THE Table_Service SHALL validate priority values are integers between 1 and 5 where applicable
5. THE Table_Service SHALL validate that required filter parameters are provided when specified

### Requirement 15: Consistent Error Handling Across Tables

**User Story:** As a developer, I want consistent error handling across all table operations, so that I can handle errors uniformly regardless of which table I'm querying.

#### Acceptance Criteria

1. WHEN any table operation fails, THE Table_Service SHALL return a structured error response with error code, message, and context
2. WHEN a ServiceNow API returns an error for any table, THE Table_Service SHALL include the ServiceNow error details in the response
3. WHEN an operation succeeds for any table, THE Table_Service SHALL return a consistent response format with operation result and relevant metadata
4. THE Table_Service SHALL log all operations and errors with timestamps for debugging purposes
5. WHEN a record is not found in any table, THE Table_Service SHALL return a consistent not found response rather than throwing an exception

### Requirement 16: Reuse Existing Infrastructure

**User Story:** As a developer, I want new table support to reuse existing infrastructure components, so that the implementation is consistent and maintainable.

#### Acceptance Criteria

1. THE new Table_Services SHALL use the existing ServiceNowClient for all API communication
2. THE new Table_Services SHALL use the existing AuthenticationManager for authentication
3. THE new Table_Services SHALL use the existing ConfigurationManager for configuration
4. THE new Table_Services SHALL follow the same architectural patterns as IncidentService
5. THE new tool handlers SHALL follow the same patterns as existing incident tool handlers
