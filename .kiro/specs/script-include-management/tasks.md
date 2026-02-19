# Implementation Plan: Script Include Management

## Overview

This implementation plan breaks down the Script Include management feature into discrete coding tasks following the established four-layer architecture. Each task builds incrementally, with testing integrated throughout to validate functionality early. The implementation follows patterns from IncidentService, UserService, and existing tool handlers.

## Tasks

- [ ] 1. Set up TypeScript types and interfaces
  - Create src/types/scriptInclude.ts with ScriptIncludeSummary, ScriptIncludeDetail, ScriptIncludeFilters, CreateScriptIncludeData, UpdateScriptIncludeData, ScriptValidationResult, TestMethodParams, and TestResult interfaces
  - Export all types from src/types/index.ts
  - _Requirements: 11.4_

- [ ] 2. Extend ScriptSecurityValidator for Script Include patterns
  - [ ] 2.1 Add Script Include-specific blacklisted patterns to ScriptSecurityValidator
    - Add patterns for eval, Function constructor, require, import, file system access, network requests (GlideHTTPRequest, RESTMessageV2, SOAPMessageV2), XMLDocument
    - Add discouraged patterns for GlideRecord and gs.print
    - _Requirements: 9.1, 9.2, 9.3, 9.8_
  
  - [ ]* 2.2 Write property test for dangerous pattern detection
    - **Property 9: Dangerous Pattern Detection**
    - **Validates: Requirements 1.6, 1.7, 3.3, 3.4, 7.2, 7.5, 9.1, 9.2, 9.3, 9.5**
  
  - [ ]* 2.3 Write property test for discouraged pattern warnings
    - **Property 12: Discouraged Pattern Warnings**
    - **Validates: Requirements 7.8, 7.9, 9.8**

- [ ] 3. Implement ScriptIncludeService core structure
  - [ ] 3.1 Create src/service/ScriptIncludeService.ts with class skeleton
    - Implement constructor accepting ServiceNowClient
    - Initialize ScriptSecurityValidator instance
    - Add private helper method stubs: validateScriptIncludePattern, validateAccessLevel, buildQuery, toScriptIncludeSummary, toScriptIncludeDetail
    - _Requirements: 11.1, 11.3_
  
  - [ ] 3.2 Implement validation helper methods
    - Implement validateAccessLevel to check for "public", "package_private", or "private"
    - Implement validateScriptIncludePattern to validate class-based, on-demand, and GlideAjax patterns
    - _Requirements: 1.5, 1.11, 1.12_
  
  - [ ]* 3.3 Write property test for access level validation
    - **Property 6: Access Level Enum Validation**
    - **Validates: Requirements 1.5, 3.5, 5.11**
  
  - [ ]* 3.4 Write property test for client-callable pattern validation
    - **Property 14: Client-Callable Pattern Validation**
    - **Validates: Requirements 1.11, 9.9**
  
  - [ ]* 3.5 Write property test for on-demand function name validation
    - **Property 15: On-Demand Function Name Validation**
    - **Validates: Requirements 1.12**

- [ ] 4. Implement Script Include creation
  - [ ] 4.1 Implement createScriptInclude method
    - Validate required fields (name, api_name, script)
    - Validate script using ScriptSecurityValidator
    - Validate Script Include pattern based on client_callable flag
    - Validate access level if provided
    - Check for duplicate api_name
    - Call ServiceNowClient.post to create in sys_script_include table
    - Return sys_id
    - Log operation with timing
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 1.9, 1.11, 1.12_
  
  - [ ]* 4.2 Write property test for create-retrieve round trip
    - **Property 1: Create-Retrieve Round Trip**
    - **Validates: Requirements 1.1, 2.1**
  
  - [ ]* 4.3 Write property test for required fields validation
    - **Property 5: Required Fields Validation**
    - **Validates: Requirements 1.2, 1.3**
  
  - [ ]* 4.4 Write property test for script length limit
    - **Property 10: Script Length Limit Enforcement**
    - **Validates: Requirements 1.8, 7.6, 9.4**
  
  - [ ]* 4.5 Write property test for syntax validation
    - **Property 11: Syntax Validation**
    - **Validates: Requirements 1.4, 3.2, 7.1, 7.4**
  
  - [ ]* 4.6 Write unit test for duplicate api_name rejection
    - Test that creating a Script Include with an existing api_name returns DUPLICATE_ERROR
    - _Requirements: 1.9_

- [ ] 5. Implement Script Include retrieval
  - [ ] 5.1 Implement getScriptInclude method
    - Accept identifier parameter (sys_id or api_name)
    - Detect if identifier is sys_id (32 character hex) or api_name
    - Call ServiceNowClient.getById for sys_id or ServiceNowClient.get with query for api_name
    - Transform result using toScriptIncludeDetail
    - Return null if not found
    - Log operation with timing
    - _Requirements: 2.1, 2.2, 2.3, 2.6_
  
  - [ ] 5.2 Implement toScriptIncludeDetail transformation method
    - Map ServiceNow record fields to ScriptIncludeDetail interface
    - Handle null/undefined values appropriately
    - _Requirements: 2.6, 11.8_
  
  - [ ]* 5.3 Write property test for create-retrieve by api_name round trip
    - **Property 2: Create-Retrieve by API Name Round Trip**
    - **Validates: Requirements 1.1, 2.2**
  
  - [ ]* 5.4 Write property test for detail field completeness
    - **Property 23: Detail Field Completeness**
    - **Validates: Requirements 2.6**
  
  - [ ]* 5.5 Write unit test for not found case
    - Test that retrieving a non-existent Script Include returns found: false
    - _Requirements: 2.3_
  
  - [ ]* 5.6 Write property test for parameter type validation
    - **Property 7: Parameter Type Validation**
    - **Validates: Requirements 2.4, 2.5, 4.2, 4.3, 8.7, 8.8**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Script Include update
  - [ ] 7.1 Implement updateScriptInclude method
    - Validate sys_id parameter is provided
    - Validate at least one update field is provided
    - If script is being updated, validate using ScriptSecurityValidator
    - If access is being updated, validate access level
    - Call ServiceNowClient.put to update in sys_script_include table
    - Return sys_id
    - Log operation with timing
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.8, 3.9_
  
  - [ ]* 7.2 Write property test for update persistence
    - **Property 3: Update Persistence**
    - **Validates: Requirements 3.1, 3.9**
  
  - [ ]* 7.3 Write unit test for empty update rejection
    - **Property 8: Empty Update Rejection**
    - **Validates: Requirements 3.8**
  
  - [ ]* 7.4 Write unit test for update not found case
    - Test that updating a non-existent Script Include returns NOT_FOUND error
    - _Requirements: 3.7_

- [ ] 8. Implement Script Include deletion
  - [ ] 8.1 Implement deleteScriptInclude method
    - Validate sys_id parameter is provided and is a string
    - Call ServiceNowClient.delete to remove from sys_script_include table
    - Log operation with timing
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 8.2 Write property test for delete removes Script Include
    - **Property 4: Delete Removes Script Include**
    - **Validates: Requirements 4.1**
  
  - [ ]* 8.3 Write unit test for delete not found case
    - Test that deleting a non-existent Script Include returns NOT_FOUND error
    - _Requirements: 4.4_

- [ ] 9. Implement Script Include query operations
  - [ ] 9.1 Implement buildQuery method
    - Build ServiceNow encoded query from ScriptIncludeFilters
    - Handle name filter with LIKE operator for partial match
    - Handle api_name filter with exact match
    - Handle active, access, and client_callable filters
    - Append custom query string if provided
    - Join all parts with AND operator (^)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  
  - [ ] 9.2 Implement queryScriptIncludes method
    - Validate filters (access level enum, limit range)
    - Build query using buildQuery helper
    - Apply limit (default 25, max 100)
    - Call ServiceNowClient.get with query and limit
    - Transform results using toScriptIncludeSummary
    - Log operation with timing
    - _Requirements: 5.1, 5.8, 5.9, 5.10, 5.11, 5.12_
  
  - [ ] 9.3 Implement toScriptIncludeSummary transformation method
    - Map ServiceNow record fields to ScriptIncludeSummary interface
    - Include only summary fields: sys_id, name, api_name, active, access, client_callable, sys_updated_on
    - _Requirements: 5.12, 11.8_
  
  - [ ]* 9.4 Write property test for query filter conjunction
    - **Property 16: Query Filter Conjunction**
    - **Validates: Requirements 5.1**
  
  - [ ]* 9.5 Write property test for name partial match
    - **Property 17: Name Partial Match**
    - **Validates: Requirements 5.2**
  
  - [ ]* 9.6 Write property test for api_name exact match
    - **Property 18: API Name Exact Match**
    - **Validates: Requirements 5.3**
  
  - [ ]* 9.7 Write property test for boolean filter matching
    - **Property 19: Boolean Filter Matching**
    - **Validates: Requirements 5.4, 5.6**
  
  - [ ]* 9.8 Write property test for access level filter matching
    - **Property 20: Access Level Filter Matching**
    - **Validates: Requirements 5.5**
  
  - [ ]* 9.9 Write property test for limit validation and capping
    - **Property 21: Limit Validation and Capping**
    - **Validates: Requirements 5.8, 5.10, 6.2, 6.4**
  
  - [ ]* 9.10 Write property test for summary field completeness
    - **Property 22: Summary Field Completeness**
    - **Validates: Requirements 5.12, 6.5**
  
  - [ ]* 9.11 Write unit test for default limit
    - Test that querying without a limit returns at most 25 results
    - _Requirements: 5.9_
  
  - [ ]* 9.12 Write unit test for limit capping
    - Test that querying with limit > 100 returns at most 100 results
    - _Requirements: 5.10_

- [ ] 10. Implement list recent Script Includes
  - [ ] 10.1 Implement listRecentScriptIncludes method
    - Validate limit parameter is a positive integer
    - Apply limit (default 25, max 100)
    - Call ServiceNowClient.get with ORDERBYDESCsys_updated_on query
    - Transform results using toScriptIncludeSummary
    - Log operation with timing
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 10.2 Write property test for recent ordering
    - **Property 24: Recent Ordering**
    - **Validates: Requirements 6.1**
  
  - [ ]* 10.3 Write unit test for default limit
    - Test that listing without a limit returns at most 25 results
    - _Requirements: 6.3_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement Script Include validation
  - [ ] 12.1 Implement validateScript method
    - Call ScriptSecurityValidator.validate with the script
    - Check for syntax errors using basic JavaScript parsing
    - Return ScriptValidationResult with valid flag, warnings, and errors
    - Separate security violations (errors) from discouraged patterns (warnings)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_
  
  - [ ]* 12.2 Write property test for validation result structure
    - **Property 13: Validation Result Structure**
    - **Validates: Requirements 7.3, 7.4, 7.5, 7.6**

- [ ] 13. Implement Script Include testing (basic structure)
  - [ ] 13.1 Implement testScriptInclude method skeleton
    - Validate sys_id and method_name parameters
    - Retrieve Script Include by sys_id
    - Return NOT_FOUND if Script Include doesn't exist
    - Return METHOD_NOT_FOUND if method doesn't exist in script
    - Add TODO comment for actual execution (requires ServiceNow scripting API)
    - Log operation with timing
    - _Requirements: 8.1, 8.3, 8.4, 8.7, 8.8_
  
  - [ ]* 13.2 Write unit test for test not found cases
    - Test that testing a non-existent Script Include returns NOT_FOUND
    - Test that testing a non-existent method returns METHOD_NOT_FOUND
    - _Requirements: 8.3, 8.4_

- [ ] 14. Implement inheritance validation (basic structure)
  - [ ] 14.1 Add parent Script Include detection to validateScriptIncludePattern
    - Detect Object.extendsObject pattern in script
    - Extract parent Script Include name from pattern
    - Add TODO comment for parent existence validation (requires querying sys_script_include)
    - _Requirements: 12.1_
  
  - [ ]* 14.2 Write unit test for parent existence validation
    - Test that creating a Script Include with non-existent parent returns VALIDATION_ERROR
    - _Requirements: 12.1_
  
  - [ ]* 14.3 Write property test for parent information in retrieval
    - **Property 28: Parent Information in Retrieval**
    - **Validates: Requirements 12.4**
  
  - [ ]* 14.4 Write property test for parent filter matching
    - **Property 29: Parent Filter Matching**
    - **Validates: Requirements 12.3**

- [ ] 15. Implement tool handlers for Script Include operations
  - [ ] 15.1 Create src/tools/scriptIncludeHandlers.ts
    - Implement createScriptIncludeHandler with parameter validation
    - Implement getScriptIncludeHandler with parameter validation
    - Implement updateScriptIncludeHandler with parameter validation
    - Implement deleteScriptIncludeHandler with parameter validation
    - Follow existing handler patterns from handlers.ts
    - Validate all parameter types before calling service methods
    - Return structured error responses for validation failures
    - _Requirements: 11.2_
  
  - [ ]* 15.2 Write unit tests for create handler parameter validation
    - Test that invalid parameter types return INVALID_PARAMETER errors
    - Test that missing required parameters return INVALID_PARAMETER errors
    - _Requirements: 1.2, 1.3_
  
  - [ ]* 15.3 Write unit tests for get handler parameter validation
    - Test that invalid identifier types return INVALID_PARAMETER errors
    - Test that empty identifiers return INVALID_PARAMETER errors
    - _Requirements: 2.4, 2.5_
  
  - [ ]* 15.4 Write unit tests for update handler parameter validation
    - Test that invalid sys_id types return INVALID_PARAMETER errors
    - Test that empty update objects return INVALID_PARAMETER errors
    - _Requirements: 3.6, 3.8_
  
  - [ ]* 15.5 Write unit tests for delete handler parameter validation
    - Test that invalid sys_id types return INVALID_PARAMETER errors
    - Test that empty sys_ids return INVALID_PARAMETER errors
    - _Requirements: 4.2, 4.3_

- [ ] 16. Implement tool handlers for query and validation operations
  - [ ] 16.1 Add query and list handlers to scriptIncludeHandlers.ts
    - Implement queryScriptIncludesHandler with filter validation
    - Implement listRecentScriptIncludesHandler with limit validation
    - Implement validateScriptIncludeHandler with script parameter validation
    - Implement testScriptIncludeHandler with parameter validation
    - Follow existing handler patterns
    - _Requirements: 11.2_
  
  - [ ]* 16.2 Write unit tests for query handler parameter validation
    - Test that invalid filter types return INVALID_PARAMETER errors
    - Test that invalid limit values return INVALID_PARAMETER errors
    - _Requirements: 5.8, 5.11_
  
  - [ ]* 16.3 Write unit tests for list handler parameter validation
    - Test that invalid limit values return INVALID_PARAMETER errors
    - _Requirements: 6.2_
  
  - [ ]* 16.4 Write unit tests for test handler parameter validation
    - Test that invalid parameter types return INVALID_PARAMETER errors
    - _Requirements: 8.7, 8.8_

- [ ] 17. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Define MCP tool schemas
  - [ ] 18.1 Create tool definitions in src/tools/index.ts
    - Define create_script_include tool with JSON schema for parameters
    - Define get_script_include tool with identifier parameter
    - Define update_script_include tool with sys_id and update fields
    - Define delete_script_include tool with sys_id parameter
    - Define query_script_includes tool with filter parameters
    - Define list_recent_script_includes tool with limit parameter
    - Define validate_script_include tool with script parameter
    - Define test_script_include tool with sys_id, method_name, and parameters
    - Follow existing tool definition patterns
    - _Requirements: 11.5, 11.6_

- [ ] 19. Register tools with MCP server
  - [ ] 19.1 Wire up Script Include tools in src/server/index.ts
    - Import ScriptIncludeService and handlers
    - Create ScriptIncludeService instance
    - Register all 8 Script Include tools with the MCP server
    - Map tool calls to appropriate handlers
    - Follow existing tool registration patterns
    - _Requirements: 11.5, 11.6_

- [ ] 20. Implement error response property tests
  - [ ]* 20.1 Write property test for structured error response
    - **Property 25: Structured Error Response**
    - **Validates: Requirements 10.1, 10.2**
  
  - [ ]* 20.2 Write property test for standardized error codes
    - **Property 26: Standardized Error Codes**
    - **Validates: Requirements 10.2**

- [ ] 21. Export types and service from index files
  - [ ] 21.1 Update src/types/index.ts
    - Export all Script Include types
  
  - [ ] 21.2 Update src/service/index.ts
    - Export ScriptIncludeService
  
  - [ ] 21.3 Update src/tools/index.ts
    - Export all Script Include handlers

- [ ] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The implementation follows the established four-layer architecture pattern
- All code uses TypeScript with strict type checking
- Testing uses Jest and fast-check for property-based testing
- Script Include testing (task 13) and inheritance validation (task 14) have basic structure but may require additional ServiceNow API capabilities for full implementation
