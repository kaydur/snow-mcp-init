# Implementation Plan: GlideQuery Development Tools

## Overview

This implementation extends the existing ServiceNow MCP Server with three GlideQuery development capabilities: script execution, code generation, and validation/testing. The implementation follows the existing layered architecture and integrates with existing authentication, API client, and configuration components.

## Tasks

- [x] 1. Extend ServiceNowClient with script execution capability
  - Add executeScript method to ServiceNowClient class
  - Implement request/response handling for Script Execution API
  - Add timeout handling (default 30s, configurable, max 60s)
  - Parse execution results, logs, and errors from API response
  - Handle authentication using existing AuthenticationManager
  - _Requirements: 1.1, 1.3, 1.5, 5.1, 5.2, 6.1, 6.3, 6.4_

- [x] 1.1 Write property test for script execution
  - **Property 1: Valid script execution returns results**
  - **Validates: Requirements 1.1**

- [x] 1.2 Write property test for authentication integration
  - **Property 3: Authentication integration**
  - **Validates: Requirements 1.3, 5.2, 6.4**

- [x] 1.3 Write unit tests for timeout handling
  - Test timeout error after 30 seconds
  - Test configurable timeout values
  - _Requirements: 1.5_

- [x] 2. Implement GlideQueryExecutor service
  - [x] 2.1 Create GlideQueryExecutor class with execute method
    - Implement script sanitization to prevent injection attacks
    - Validate script is not empty
    - Call ServiceNowClient.executeScript()
    - Parse and format results into ExecutionResult structure
    - Handle different return types (Stream, Optional, primitives, aggregates)
    - _Requirements: 1.1, 1.2, 1.4, 1.6, 5.1, 6.3, 8.1, 8.2_

  - [x] 2.2 Write property test for script execution
    - **Property 1: Valid script execution returns results**
    - **Validates: Requirements 1.1**

  - [x] 2.3 Write property test for failed execution
    - **Property 2: Failed execution includes error details**
    - **Validates: Requirements 1.2**

  - [x] 2.4 Write property test for record results
    - **Property 4: Record results are valid JSON**
    - **Validates: Requirements 1.4, 8.1**

  - [x] 2.5 Write property test for script sanitization
    - **Property 5: Script input sanitization**
    - **Validates: Requirements 1.6**

  - [x] 2.6 Implement test mode execution
    - Add testMode option to execute method
    - Wrap scripts with result limiting (max 100 records)
    - Add warnings for write operations (insert, update, delete, updateMultiple, deleteMultiple)
    - Set truncated flag when results are limited
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.5_

  - [x] 2.7 Write property test for test mode
    - **Property 15: Test mode execution returns results**
    - **Property 16: Test mode result limiting**
    - **Validates: Requirements 4.1, 4.2**

  - [x] 2.8 Write property test for write operation warnings
    - **Property 17: Write operation warnings**
    - **Validates: Requirements 4.3**

  - [x] 2.9 Implement validate method
    - Perform basic syntax checks locally
    - Check for common mistakes (undefined methods, incorrect chaining, invalid operators)
    - Detect GlideRecord patterns used incorrectly (.next(), .query(), .getValue())
    - Validate field flags ($DISPLAY, $CURRENCY_CODE, etc.)
    - Return ValidationResult with errors and warnings
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.10 Write property test for syntax error detection
    - **Property 12: Syntax error detection**
    - **Validates: Requirements 3.1**

  - [x] 2.11 Write property test for error line numbers
    - **Property 13: Error responses include line numbers**
    - **Validates: Requirements 3.2**

  - [x] 2.12 Write property test for valid snippet confirmation
    - **Property 14: Valid snippet confirmation**
    - **Validates: Requirements 3.3**

  - [x] 2.13 Write unit tests for common validation mistakes
    - Test detection of undefined methods (.selectAll(), .findOne())
    - Test detection of incorrect chaining (.select().count())
    - Test detection of missing parentheses
    - Test detection of invalid operators
    - Test detection of GlideRecord patterns
    - _Requirements: 3.4_

- [x] 3. Implement ScriptSecurityValidator
  - Create ScriptSecurityValidator class
  - Define blacklisted patterns (gs.executeNow, gs.eval, file system access, network requests)
  - Implement dangerous operation detection (deleteMultiple, updateMultiple, disableWorkflow)
  - Validate script length (max 10000 characters)
  - Return SecurityValidationResult with violations and dangerous operations
  - _Requirements: 1.6, 7.2, 7.4_

- [x] 3.1 Write property test for dangerous operation detection
  - **Property 19: Dangerous operation detection**
  - **Validates: Requirements 7.2**

- [x] 3.2 Write property test for blacklist enforcement
  - **Property 21: Blacklist enforcement**
  - **Validates: Requirements 7.4**

- [x] 3.3 Write unit tests for security validation
  - Test script length validation
  - Test blacklisted pattern detection
  - Test dangerous operation detection
  - _Requirements: 1.6, 7.4_

- [x] 4. Checkpoint - Ensure core execution and security tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement GlideQueryGenerator service
  - [x] 5.1 Create GlideQueryGenerator class with generate method
    - Implement parseDescription to extract QueryIntent
    - Identify operation type (select, selectOne, get, insert, update, updateMultiple, deleteMultiple, insertOrUpdate, count, aggregate)
    - Extract table, fields, conditions, ordering, limits, modifiers
    - Parse operators (=, !=, >, <, IN, CONTAINS, STARTSWITH, etc.)
    - Detect dot-walking patterns (reference.field)
    - Detect null checks (whereNull, whereNotNull)
    - Detect OR conditions (orWhere)
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [x] 5.2 Write property test for generated code validity
    - **Property 9: Generated code is syntactically valid**
    - **Validates: Requirements 2.1**

  - [x] 5.3 Write property test for table name preservation
    - **Property 11: Table name preservation**
    - **Validates: Requirements 2.3**

  - [x] 5.2 Implement buildGlideQuery method
    - Generate GlideQuery constructor with table name
    - Build where clauses with correct operators
    - Build orWhere clauses
    - Build whereNull/whereNotNull clauses
    - Add orderBy/orderByDesc modifiers
    - Add limit modifier
    - Add other modifiers (disableWorkflow, withAcls, etc.)
    - Select appropriate terminal operation (select, selectOne, get, count, etc.)
    - Handle field flags ($DISPLAY, $CURRENCY_CODE, etc.)
    - Generate proper Optional/Stream handling code
    - _Requirements: 2.1, 2.5_

  - [x] 5.3 Implement addComments method
    - Add explanatory comments for query logic
    - Document operators used
    - Document modifiers applied
    - Add best practice notes (Optional handling, error handling)
    - _Requirements: 2.2_

  - [x] 5.4 Write property test for comment inclusion
    - **Property 10: Generated code includes comments**
    - **Validates: Requirements 2.2**

  - [x] 5.5 Write unit tests for common query patterns
    - Test filtering with various operators
    - Test ordering (orderBy, orderByDesc)
    - Test limiting
    - Test field selection with flags
    - Test null checks
    - Test OR conditions
    - Test aggregates
    - Test write operations
    - Test modifiers
    - Test dot-walking
    - _Requirements: 2.5_

- [x] 6. Implement MCP tool handlers
  - [x] 6.1 Create execute_glidequery tool handler
    - Define ExecuteGlideQueryParams interface
    - Validate params (script not empty)
    - Call GlideQueryExecutor.execute()
    - Format response as ExecuteGlideQueryResponse
    - Handle errors and return error responses
    - _Requirements: 1.1, 1.2, 5.4_

  - [x] 6.2 Write unit tests for execute_glidequery handler
    - Test successful execution
    - Test error handling
    - Test parameter validation
    - _Requirements: 1.1, 1.2_

  - [x] 6.3 Create generate_glidequery tool handler
    - Define GenerateGlideQueryParams interface
    - Validate params (description not empty)
    - Call GlideQueryGenerator.generate()
    - Format response as GenerateGlideQueryResponse
    - Handle errors and return error responses
    - _Requirements: 2.1, 2.2, 5.4_

  - [x] 6.4 Write unit tests for generate_glidequery handler
    - Test successful generation
    - Test error handling
    - Test parameter validation
    - _Requirements: 2.1, 2.2_

  - [x] 6.5 Create test_glidequery tool handler
    - Define TestGlideQueryParams interface
    - Validate params (script not empty)
    - Call GlideQueryExecutor.execute() with testMode=true
    - Add warnings for write operations
    - Format response as TestGlideQueryResponse with truncation info
    - Handle errors and return error responses
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.4_

  - [x] 6.6 Write unit tests for test_glidequery handler
    - Test successful test execution
    - Test result limiting
    - Test write operation warnings
    - Test error handling
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7. Register MCP tools with server
  - Register execute_glidequery tool with MCP server
  - Register generate_glidequery tool with MCP server
  - Register test_glidequery tool with MCP server
  - Define tool schemas with parameter descriptions
  - Add tool documentation
  - _Requirements: 5.4_

- [x] 7.1 Write unit test for tool registration
  - Test all three tools are registered and discoverable
  - _Requirements: 5.4_

- [x] 8. Implement configuration management
  - Add GlideQueryConfig to existing ServerConfig
  - Define configuration properties (scriptExecutionEndpoint, defaultTimeout, maxScriptLength, testModeMaxResults, security settings)
  - Add environment variable support (SERVICENOW_SCRIPT_ENDPOINT, GLIDEQUERY_TIMEOUT, etc.)
  - Integrate with existing ConfigurationManager
  - _Requirements: 5.3, 6.1, 6.2_

- [x] 8.1 Write property test for configuration integration
  - **Property 7: Configuration integration**
  - **Validates: Requirements 5.3**

- [x] 8.2 Write unit test for endpoint configuration
  - Test configuration error when endpoint not available
  - _Requirements: 6.2_

- [x] 9. Implement execution logging
  - Add logging for all script executions (successful and failed)
  - Include timestamp, user information, script content, execution time
  - Use existing logger with new operation types (GLIDEQUERY_EXECUTE, GLIDEQUERY_GENERATE, GLIDEQUERY_VALIDATE, GLIDEQUERY_TEST)
  - _Requirements: 7.3_

- [x] 9.1 Write property test for execution logging
  - **Property 20: Execution logging**
  - **Validates: Requirements 7.3**

- [x] 10. Implement result formatting
  - [x] 10.1 Create result formatter for different return types
    - Format Stream results (convert to array)
    - Format Optional results (unwrap with orElse)
    - Format primitive results (numbers, booleans, strings)
    - Format aggregate results
    - Add type information for primitive values
    - Handle empty results with appropriate messages
    - Implement truncation for large result sets
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 10.2 Write property test for primitive value formatting
    - **Property 22: Primitive value type information**
    - **Validates: Requirements 8.2**

  - [x] 10.3 Write property test for log inclusion
    - **Property 23: Log inclusion**
    - **Validates: Requirements 8.4**

  - [x] 10.4 Write property test for large result truncation
    - **Property 24: Large result truncation**
    - **Validates: Requirements 8.5**

  - [x] 10.5 Write unit test for empty results
    - Test empty result message
    - _Requirements: 8.3_

- [x] 11. Implement permission validation
  - Add permission check before script execution
  - Validate authenticated user has script execution permissions
  - Return permission error if user lacks permissions
  - _Requirements: 7.1_

- [x] 11.1 Write unit test for permission validation
  - Test execution with and without permissions
  - _Requirements: 7.1_

- [x] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Integration and documentation
  - [x] 13.1 Wire all components together
    - Connect GlideQueryExecutor to ServiceNowClient
    - Connect tool handlers to services
    - Connect security validator to executor
    - Connect configuration to all components
    - Connect logger to all operations
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 13.2 Write integration tests
    - Test end-to-end script execution flow
    - Test end-to-end code generation flow
    - Test end-to-end validation flow
    - Test end-to-end test execution flow
    - Test error handling across layers
    - _Requirements: 5.5_

  - [x] 13.3 Update API documentation
    - Document execute_glidequery tool
    - Document generate_glidequery tool
    - Document test_glidequery tool
    - Add usage examples
    - Document configuration options
    - Document security considerations

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check library (minimum 100 iterations)
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end flows
- The implementation uses TypeScript and integrates with the existing ServiceNow MCP Server architecture
