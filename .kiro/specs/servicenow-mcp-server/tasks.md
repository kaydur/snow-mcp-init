# Implementation Plan: ServiceNow MCP Server

## Overview

This implementation plan breaks down the ServiceNow MCP Server into incremental, testable steps. The server will be built in TypeScript following a layered architecture: Configuration → Authentication → API Client → Service Layer → MCP Protocol Layer. Each major component will be implemented with its core functionality first, followed by optional property-based and unit tests to validate correctness.

The implementation follows the approved design document, building from the foundation (configuration and authentication) up through the API client and service layer, and finally integrating everything into the MCP server with tool registration.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Initialize TypeScript project with tsconfig.json
  - Install dependencies: @modelcontextprotocol/sdk, axios (HTTP client), fast-check (property testing), jest (unit testing)
  - Create directory structure: src/, src/config/, src/auth/, src/client/, src/service/, src/tools/, src/types/
  - Set up jest configuration for TypeScript
  - Create package.json with build and test scripts
  - _Requirements: 10.1, 10.3_

- [ ] 2. Implement configuration management
  - [x] 2.1 Create ServerConfig and related configuration interfaces
    - Define ServerConfig, AuthConfig, ClientConfig TypeScript interfaces
    - _Requirements: 10.1_
  
  - [x] 2.2 Implement ConfigurationManager class
    - Implement loadConfig() to read from environment variables (SERVICENOW_INSTANCE_URL, SERVICENOW_USERNAME, SERVICENOW_PASSWORD, LOG_LEVEL)
    - Implement validateUrl() to validate ServiceNow URL format
    - Implement testConnectivity() to test connection to ServiceNow instance
    - Handle missing configuration gracefully with descriptive errors
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 2.3 Write property test for URL validation
    - **Property 21: URL validation rejects malformed URLs**
    - **Validates: Requirements 10.2**
  
  - [ ]* 2.4 Write unit tests for ConfigurationManager
    - Test loading configuration from environment variables
    - Test URL validation with valid and invalid URLs
    - Test missing configuration handling
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 3. Implement authentication layer
  - [x] 3.1 Create authentication interfaces and types
    - Define AuthConfig, AuthResult TypeScript interfaces
    - _Requirements: 1.5_
  
  - [x] 3.2 Implement AuthenticationManager class
    - Implement authenticate() to validate credentials with ServiceNow
    - Implement getAuthHeaders() to return authentication headers for API requests
    - Implement isAuthenticated() to check session validity
    - Implement handleExpiration() to detect and handle session expiration
    - Use basic authentication (username:password base64 encoded)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 3.3 Write property test for valid credentials
    - **Property 1: Valid credentials establish authenticated sessions**
    - **Validates: Requirements 1.1, 1.2**
  
  - [ ]* 3.4 Write property test for invalid credentials
    - **Property 2: Invalid credentials produce descriptive errors**
    - **Validates: Requirements 1.3**
  
  - [ ]* 3.5 Write unit tests for AuthenticationManager
    - Test successful authentication with valid credentials
    - Test authentication failure with invalid credentials
    - Test session expiration detection
    - Test authentication header generation
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Checkpoint - Ensure configuration and authentication tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement ServiceNow API Client
  - [x] 5.1 Create API client interfaces and types
    - Define ClientConfig, QueryParams, ServiceNowResponse, ServiceNowRecord, ServiceNowError TypeScript interfaces
    - _Requirements: 3.1_
  
  - [x] 5.2 Implement ServiceNowClient class
    - Implement constructor to accept ClientConfig and AuthenticationManager
    - Implement get() to execute GET requests to ServiceNow Table API with query parameters
    - Implement getById() to retrieve a specific record by sys_id
    - Implement handleError() to parse and format ServiceNow API errors
    - Include authentication headers from AuthenticationManager in all requests
    - Handle network errors, timeouts, and HTTP error responses
    - _Requirements: 3.1, 4.1, 9.2, 9.5_
  
  - [ ]* 5.3 Write property test for API error propagation
    - **Property 19: ServiceNow API errors are propagated with details**
    - **Validates: Requirements 9.2**
  
  - [ ]* 5.4 Write unit tests for ServiceNowClient
    - Test GET requests with various query parameters
    - Test getById with valid sys_id
    - Test error handling for API errors (4xx, 5xx)
    - Test timeout handling
    - Test response parsing
    - _Requirements: 3.1, 4.1, 9.2, 9.5_

- [ ] 6. Implement data models and enums
  - [x] 6.1 Create incident data models
    - Define IncidentSummary and IncidentDetail TypeScript interfaces
    - Define IncidentFilters interface for query parameters
    - Define IncidentState and IncidentPriority enums with numeric values
    - Create STATE_LABELS and PRIORITY_LABELS mappings
    - _Requirements: 3.2, 4.3, 5.5, 6.2, 7.2_
  
  - [ ]* 6.2 Write unit tests for data models
    - Test enum value mappings
    - Test state and priority label lookups
    - _Requirements: 6.2, 7.2_

- [ ] 7. Implement Incident Service
  - [x] 7.1 Implement IncidentService class core methods
    - Implement constructor to accept ServiceNowClient
    - Implement queryIncidents() to query incidents with filters
    - Implement getIncident() to retrieve incident by sys_id or number
    - Implement listRecentIncidents() to list recent incidents with optional limit
    - _Requirements: 3.1, 4.1, 4.2, 5.1_
  
  - [x] 7.2 Implement query building and data transformation
    - Implement buildQuery() to construct ServiceNow encoded query strings from filters
    - Support state, priority, assigned_to, assignment_group filters
    - Support custom query strings
    - Implement toIncidentSummary() to transform ServiceNow records to IncidentSummary
    - Implement toIncidentDetail() to transform ServiceNow records to IncidentDetail
    - Apply result limits (max 100, default 25)
    - Order results by updated_at descending for list operations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.3, 5.2, 5.3, 5.4, 5.5, 6.1, 7.1, 8.1, 8.2_
  
  - [x] 7.3 Implement filter validation
    - Validate state values against known states (New, In Progress, On Hold, Resolved, Closed)
    - Validate priority values (1-5)
    - Return validation errors for invalid filter values
    - _Requirements: 6.4, 7.4_
  
  - [ ]* 7.4 Write property test for query filter application
    - **Property 5: Query filters are correctly applied**
    - **Validates: Requirements 3.1, 6.1, 7.1, 8.1, 8.2**
  
  - [ ]* 7.5 Write property test for query result fields
    - **Property 6: Query results contain required summary fields**
    - **Validates: Requirements 3.2, 5.5**
  
  - [ ]* 7.6 Write property test for query operators
    - **Property 7: Query operators work correctly**
    - **Validates: Requirements 3.3**
  
  - [ ]* 7.7 Write property test for result limits
    - **Property 8: Result limits are enforced**
    - **Validates: Requirements 3.4, 5.2**
  
  - [ ]* 7.8 Write property test for multiple filter values
    - **Property 9: Multiple filter values use OR logic**
    - **Validates: Requirements 6.3, 7.3**
  
  - [ ]* 7.9 Write property test for filter validation
    - **Property 10: Filter input validation rejects invalid values**
    - **Validates: Requirements 6.4, 7.4**
  
  - [ ]* 7.10 Write property test for combined user and group filters
    - **Property 11: Combined user and group filters use OR logic**
    - **Validates: Requirements 8.5**
  
  - [ ]* 7.11 Write property test for assignment filter identifier formats
    - **Property 12: Assignment filters support multiple identifier formats**
    - **Validates: Requirements 8.4**
  
  - [ ]* 7.12 Write property test for incident retrieval by identifier
    - **Property 13: Incidents can be retrieved by any valid identifier**
    - **Validates: Requirements 4.1, 4.2**
  
  - [ ]* 7.13 Write property test for retrieved incident fields
    - **Property 14: Retrieved incidents contain all detail fields**
    - **Validates: Requirements 4.3**
  
  - [ ]* 7.14 Write property test for non-existent identifiers
    - **Property 15: Non-existent identifiers return not found errors**
    - **Validates: Requirements 4.4**
  
  - [ ]* 7.15 Write property test for JSON response validity
    - **Property 16: All incident responses are valid JSON**
    - **Validates: Requirements 4.5**
  
  - [ ]* 7.16 Write property test for list result ordering
    - **Property 17: List results are ordered by recency**
    - **Validates: Requirements 5.1, 5.4**
  
  - [ ]* 7.17 Write unit tests for IncidentService
    - Test query string building from various filter combinations
    - Test incident transformation (ServiceNow record → IncidentSummary/IncidentDetail)
    - Test result limiting and ordering
    - Test empty result handling
    - Test unassigned incidents (null assigned_to)
    - Test getIncident with sys_id and incident number
    - Test getIncident with non-existent identifier
    - _Requirements: 3.1, 3.2, 3.4, 4.1, 4.2, 4.4, 5.1, 5.4, 8.3_

- [x] 8. Checkpoint - Ensure service layer tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement tool handlers
  - [x] 9.1 Create tool parameter and response interfaces
    - Define QueryIncidentsParams, QueryIncidentsResponse interfaces
    - Define GetIncidentParams, GetIncidentResponse interfaces
    - Define ListRecentParams, ListRecentResponse interfaces
    - _Requirements: 2.3, 3.1, 4.1, 5.1_
  
  - [x] 9.2 Implement queryIncidentsHandler
    - Validate parameters against expected types
    - Call incidentService.queryIncidents() with filters
    - Format results as QueryIncidentsResponse with incidents array and count
    - Handle errors and return structured error responses
    - _Requirements: 3.1, 3.2, 6.1, 6.5, 7.1, 7.5, 8.1, 8.2, 8.5, 9.1_
  
  - [x] 9.3 Implement getIncidentHandler
    - Validate identifier parameter
    - Call incidentService.getIncident() with identifier
    - Return GetIncidentResponse with incident and found flag
    - Handle not found case (return found: false)
    - Handle errors and return structured error responses
    - _Requirements: 4.1, 4.2, 4.4, 9.1_
  
  - [x] 9.4 Implement listRecentIncidentsHandler
    - Validate limit parameter (default 25, max 100)
    - Call incidentService.listRecentIncidents() with limit
    - Format results as ListRecentResponse with incidents array and count
    - Handle errors and return structured error responses
    - _Requirements: 5.1, 5.2, 5.3, 9.1_
  
  - [ ]* 9.5 Write property test for error response structure
    - **Property 18: All errors return structured responses**
    - **Validates: Requirements 9.1**
  
  - [ ]* 9.6 Write property test for success response structure
    - **Property 20: Success responses have consistent structure**
    - **Validates: Requirements 9.3**
  
  - [ ]* 9.7 Write unit tests for tool handlers
    - Test parameter validation for each tool
    - Test successful tool invocations
    - Test error responses
    - Test response formatting
    - Test not found handling in getIncidentHandler
    - _Requirements: 3.1, 4.1, 4.4, 5.1, 9.1_

- [ ] 10. Implement MCP Server and tool registration
  - [x] 10.1 Create MCP protocol interfaces
    - Define ToolDefinition interface
    - Define MCPRequest and MCPResponse types (or import from @modelcontextprotocol/sdk)
    - _Requirements: 2.1, 2.2_
  
  - [x] 10.2 Create JSON schemas for all tools
    - Create query_incidents JSON schema with state, priority, assigned_to, assignment_group, query, limit parameters
    - Create get_incident JSON schema with identifier parameter (required)
    - Create list_recent_incidents JSON schema with limit parameter
    - _Requirements: 2.3, 3.3, 6.2, 6.4, 7.2, 7.4_
  
  - [x] 10.3 Implement MCPServer class
    - Implement constructor to accept ServerConfig
    - Initialize ConfigurationManager, AuthenticationManager, ServiceNowClient, IncidentService
    - Implement start() to initialize server and register tools
    - Implement registerTool() to register a tool with its schema and handler
    - Implement handleRequest() to route MCP protocol messages (initialize, list_tools, call_tool)
    - Implement stop() to shutdown server gracefully
    - _Requirements: 2.1, 2.2_
  
  - [x] 10.4 Register all three tools with the MCP server
    - Register query_incidents tool with schema and queryIncidentsHandler
    - Register get_incident tool with schema and getIncidentHandler
    - Register list_recent_incidents tool with schema and listRecentIncidentsHandler
    - Include tool descriptions in registration
    - _Requirements: 2.1, 2.2, 2.5_
  
  - [x] 10.5 Implement tool parameter validation
    - Validate tool parameters against JSON schemas before invoking handlers
    - Return schema validation errors for invalid parameters
    - _Requirements: 2.4_
  
  - [ ]* 10.6 Write property test for tool schema validity
    - **Property 3: All registered tools have valid JSON schemas**
    - **Validates: Requirements 2.3**
  
  - [ ]* 10.7 Write property test for parameter validation
    - **Property 4: Invalid tool parameters trigger validation errors**
    - **Validates: Requirements 2.4**
  
  - [ ]* 10.8 Write unit tests for MCPServer
    - Test server initialization
    - Test tool registration
    - Test tool discovery (list_tools request)
    - Test tool invocation routing
    - Test parameter validation
    - Test graceful shutdown
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 11. Implement logging
  - [x] 11.1 Create logging utility
    - Implement logger with DEBUG, INFO, WARN, ERROR levels
    - Log all operations with timestamps, operation type, parameters (sanitized), result/error, duration
    - Respect LOG_LEVEL from configuration
    - _Requirements: 9.4_
  
  - [x] 11.2 Add logging to all components
    - Add logging to AuthenticationManager (authentication attempts, session expiration)
    - Add logging to ServiceNowClient (API requests, responses, errors)
    - Add logging to IncidentService (queries, retrievals, lists)
    - Add logging to MCPServer (tool invocations, errors)
    - Sanitize sensitive data (passwords, tokens) from logs
    - _Requirements: 9.4_

- [x] 12. Create main entry point
  - [x] 12.1 Implement main.ts entry point
    - Load configuration using ConfigurationManager
    - Create MCPServer instance with configuration
    - Start MCP server
    - Handle startup errors gracefully
    - Set up signal handlers for graceful shutdown (SIGINT, SIGTERM)
    - _Requirements: 10.1, 10.4, 10.5_
  
  - [ ]* 12.2 Write integration tests
    - Test end-to-end tool invocation flow (MCP request → ServiceNow API → response)
    - Test authentication flow
    - Test error propagation through all layers
    - Test session expiration handling
    - _Requirements: 1.4, 9.1, 9.2_

- [x] 13. Final checkpoint - Ensure all tests pass and server runs
  - Run all unit tests and property tests
  - Test server startup with valid configuration
  - Test server startup with invalid configuration
  - Test connectivity to ServiceNow instance (or mock)
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Create documentation
  - [x] 14.1 Create README.md
    - Document installation instructions
    - Document configuration (environment variables)
    - Document available tools and their parameters
    - Provide usage examples
    - Document error codes and troubleshooting
  
  - [x] 14.2 Add inline code documentation
    - Add JSDoc comments to all public classes and methods
    - Document parameter types and return types
    - Document error conditions

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests should run with minimum 100 iterations each
- All property tests must include the tag comment: `// Feature: servicenow-mcp-server, Property N: [property text]`
- The implementation uses TypeScript throughout as specified in the design document
- Authentication uses basic authentication (username:password base64 encoded)
- The MCP SDK (@modelcontextprotocol/sdk) provides protocol implementation utilities
- ServiceNow query syntax uses encoded query strings with operators: =, !=, LIKE, STARTSWITH, >, <, ^, ^OR
