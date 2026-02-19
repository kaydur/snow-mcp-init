# Implementation Plan: Service Portal Management

## Overview

This implementation plan breaks down the Service Portal Management feature into discrete, incremental coding tasks. The approach follows a layered implementation strategy: types → services → handlers → tool registration → testing. Each task builds on previous work, with property-based tests integrated close to implementation to catch errors early.

## Tasks

- [x] 1. Set up project structure and core types
  - Create TypeScript type definitions for all Service Portal entities
  - Define interfaces for Widget, Page, Portal, and WidgetInstance (Summary and Detail views)
  - Define filter interfaces for query operations
  - Define validation result interfaces
  - Add link, option_schema fields to Widget types
  - Add validation interfaces for SCSS, option schema, link functions
  - _Requirements: 23.6, 23.7, 31.1, 32.1, 33.1_

- [x] 2. Implement WidgetService
  - [x] 2.1 Create WidgetService class with core CRUD operations
    - Implement createWidget with validation
    - Implement getWidget (by sys_id and id)
    - Implement updateWidget with validation
    - Implement cloneWidget
    - _Requirements: 4.1, 2.1, 2.2, 5.1, 6.1_
  
  - [ ]* 2.2 Write property test for widget create-retrieve round trip
    - **Property 1: Widget Create-Retrieve Round Trip**
    - **Validates: Requirements 2.1, 4.1**
  
  - [ ]* 2.3 Write property test for widget create-retrieve by ID round trip
    - **Property 2: Widget Create-Retrieve by ID Round Trip**
    - **Validates: Requirements 2.2, 4.1**
  
  - [ ]* 2.4 Write property test for widget update persistence
    - **Property 3: Widget Update Persistence**
    - **Validates: Requirements 5.1, 5.10**
  
  - [x] 2.5 Implement widget query operations
    - Implement queryWidgets with filter support
    - Implement listRecentWidgets
    - Implement buildQuery helper for encoded queries
    - _Requirements: 1.1, 3.1_
  
  - [ ]* 2.6 Write property test for widget query filter conjunction
    - **Property 4: Widget Query Filter Conjunction**
    - **Validates: Requirements 1.1**
  
  - [ ]* 2.7 Write property test for widget name partial match
    - **Property 5: Widget Name Partial Match**
    - **Validates: Requirements 1.2**
  
  - [ ]* 2.8 Write property test for widget limit validation and capping
    - **Property 8: Widget Limit Validation and Capping**
    - **Validates: Requirements 1.8, 1.10, 3.2, 3.4**
  
  - [x] 2.9 Implement widget validation methods
    - Implement validateHTML with security pattern checking (including Angular directives, Bootstrap classes)
    - Implement validateCSS with security pattern checking (including SCSS support)
    - Implement validateJavaScript with security pattern checking (including $sp and spUtil APIs)
    - Implement validateJSON for demo_data and option_schema
    - Implement validateLinkFunction for link function validation
    - Implement validateSCSS for SCSS-specific validation
    - Implement validateOptionSchema for option schema validation
    - Implement validateServerScriptAPIs for $sp API pattern recognition
    - Implement validateClientScriptAPIs for spUtil API pattern recognition
    - Implement validateAngularDirectives for directive validation
    - Implement validateBootstrapClasses for Bootstrap class recognition
    - Implement validateEmbeddedWidgets for <widget> tag validation
    - Implement checkPerformancePatterns for performance recommendations
    - Implement validateWidget method
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 4.8, 17.1, 17.2, 17.3, 17.4, 31.1, 31.5, 32.1, 32.3, 32.4, 33.2, 33.5, 34.1, 34.2, 35.1, 35.2, 36.1, 36.2, 37.1, 37.4, 38.1, 38.4, 38.5, 39.1, 39.2, 39.3_
  
  - [ ]* 2.10 Write property test for HTML security validation
    - **Property 15: Widget HTML Security Validation**
    - **Validates: Requirements 4.4, 4.10, 5.2, 17.1, 17.8, 21.4, 21.5**
  
  - [ ]* 2.11 Write property test for CSS security validation
    - **Property 16: Widget CSS Security Validation**
    - **Validates: Requirements 4.5, 5.3, 17.2, 17.9, 21.6**
  
  - [ ]* 2.12 Write property test for JavaScript security validation
    - **Property 17: Widget JavaScript Security Validation**
    - **Validates: Requirements 4.6, 4.7, 5.4, 5.5, 17.3, 17.4, 17.10, 21.7**
  
  - [ ]* 2.13 Write property test for JSON validation
    - **Property 18: Widget JSON Validation**
    - **Validates: Requirements 4.8, 5.6, 26.1, 26.3**
  
  - [x] 2.14 Implement widget relationship methods
    - Implement getWidgetDependencies
    - Implement getPagesUsingWidget
    - _Requirements: 18.1, 20.1_
  
  - [ ]* 2.15 Write property test for widget clone field preservation
    - **Property 12: Widget Clone Field Preservation**
    - **Validates: Requirements 6.1, 6.6**
  
  - [x] 2.16 Implement transformation methods
    - Implement toWidgetSummary
    - Implement toWidgetDetail
    - _Requirements: 1.11, 2.5_
  
  - [ ]* 2.17 Write property test for widget summary field completeness
    - **Property 9: Widget Summary Field Completeness**
    - **Validates: Requirements 1.11, 3.5**
  
  - [ ]* 2.18 Write property test for widget detail field completeness
    - **Property 10: Widget Detail Field Completeness**
    - **Validates: Requirements 2.5**
  
  - [ ]* 2.19 Write property test for widget option schema JSON validation
    - **Property 57: Widget Option Schema JSON Validation**
    - **Validates: Requirements 31.1, 31.5**
  
  - [ ]* 2.20 Write property test for widget link function security validation
    - **Property 59: Widget Link Function Security Validation**
    - **Validates: Requirements 32.1, 32.3**
  
  - [ ]* 2.21 Write property test for widget SCSS syntax validation
    - **Property 61: Widget SCSS Syntax Validation**
    - **Validates: Requirements 33.2**
  
  - [ ]* 2.22 Write property test for widget server script $sp API validation
    - **Property 63: Widget Server Script $sp API Validation**
    - **Validates: Requirements 34.1, 34.2**
  
  - [ ]* 2.23 Write property test for widget client script spUtil validation
    - **Property 64: Widget Client Script spUtil Validation**
    - **Validates: Requirements 35.1, 35.2**
  
  - [ ]* 2.24 Write property test for widget Bootstrap class recognition
    - **Property 67: Widget Bootstrap Class Recognition**
    - **Validates: Requirements 37.1, 37.4**
  
  - [ ]* 2.25 Write property test for widget AngularJS directive recognition
    - **Property 68: Widget AngularJS Directive Recognition**
    - **Validates: Requirements 38.1, 38.4**
  
  - [ ]* 2.26 Write property test for widget embedded widget syntax validation
    - **Property 70: Widget Embedded Widget Syntax Validation**
    - **Validates: Requirements 39.1, 39.2, 39.3**
  
  - [ ]* 2.27 Write property test for widget data table extension validation
    - **Property 71: Widget Data Table Extension Validation**
    - **Validates: Requirements 40.1, 40.2**

- [x] 3. Checkpoint - Ensure WidgetService tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement PageService
  - [x] 4.1 Create PageService class with core CRUD operations
    - Implement createPage with validation
    - Implement getPage (by sys_id and id)
    - Implement updatePage with validation
    - _Requirements: 10.1, 8.1, 8.2, 11.1_
  
  - [ ]* 4.2 Write property test for page create-retrieve round trip
    - **Property 23: Page Create-Retrieve Round Trip**
    - **Validates: Requirements 8.1, 10.1**
  
  - [ ]* 4.3 Write property test for page update persistence
    - **Property 25: Page Update Persistence**
    - **Validates: Requirements 11.1, 11.7**
  
  - [x] 4.4 Implement page query operations
    - Implement queryPages with filter support
    - Implement listRecentPages
    - Implement buildQuery helper for encoded queries
    - _Requirements: 7.1, 9.1_
  
  - [ ]* 4.5 Write property test for page query filter conjunction
    - **Property 26: Page Query Filter Conjunction**
    - **Validates: Requirements 7.1**
  
  - [ ]* 4.6 Write property test for page title partial match
    - **Property 27: Page Title Partial Match**
    - **Validates: Requirements 7.2**
  
  - [x] 4.7 Implement page validation methods
    - Implement validatePortalExists
    - Implement validateRolesExist
    - _Requirements: 10.5, 10.6, 11.5, 11.6, 29.1, 29.2_
  
  - [ ]* 4.8 Write property test for page portal validation
    - **Property 35: Page Portal Validation**
    - **Validates: Requirements 10.5, 11.5, 29.1, 29.2**
  
  - [ ]* 4.9 Write property test for page roles validation
    - **Property 36: Page Roles Validation**
    - **Validates: Requirements 10.6, 11.6, 29.1, 29.2**
  
  - [x] 4.10 Implement page relationship methods
    - Implement getWidgetsByPage
    - _Requirements: 19.1_
  
  - [x] 4.11 Implement transformation methods
    - Implement toPageSummary
    - Implement toPageDetail
    - _Requirements: 7.10, 8.5_
  
  - [ ]* 4.12 Write property test for page summary field completeness
    - **Property 30: Page Summary Field Completeness**
    - **Validates: Requirements 7.10, 9.5**

- [x] 5. Checkpoint - Ensure PageService tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement PortalService
  - [x] 6.1 Create PortalService class with query and retrieval operations
    - Implement queryPortals with filter support
    - Implement getPortal (by sys_id and url_suffix)
    - Implement listPortals
    - Implement buildQuery helper for encoded queries
    - _Requirements: 12.1, 13.1, 13.2, 14.1_
  
  - [ ]* 6.2 Write property test for portal query filter conjunction
    - **Property 37: Portal Query Filter Conjunction**
    - **Validates: Requirements 12.1**
  
  - [ ]* 6.3 Write property test for portal title partial match
    - **Property 38: Portal Title Partial Match**
    - **Validates: Requirements 12.2**
  
  - [x] 6.4 Implement transformation methods
    - Implement toPortalSummary
    - Implement toPortalDetail
    - _Requirements: 12.8, 13.5_
  
  - [ ]* 6.5 Write property test for portal summary field completeness
    - **Property 40: Portal Summary Field Completeness**
    - **Validates: Requirements 12.8, 14.5**
  
  - [ ]* 6.6 Write property test for portal detail field completeness
    - **Property 41: Portal Detail Field Completeness**
    - **Validates: Requirements 13.5**

- [x] 7. Implement WidgetInstanceService
  - [x] 7.1 Create WidgetInstanceService class with query and retrieval operations
    - Implement queryWidgetInstances with filter support
    - Implement getWidgetInstance
    - Implement buildQuery helper for encoded queries
    - _Requirements: 15.1, 16.1_
  
  - [ ]* 7.2 Write property test for widget instance query filter conjunction
    - **Property 43: Widget Instance Query Filter Conjunction**
    - **Validates: Requirements 15.1**
  
  - [ ]* 7.3 Write property test for widget instance page filter matching
    - **Property 44: Widget Instance Page Filter Matching**
    - **Validates: Requirements 15.2**
  
  - [x] 7.4 Implement transformation methods
    - Implement toWidgetInstanceSummary
    - Implement toWidgetInstanceDetail
    - Parse JSON options in transformation
    - _Requirements: 15.8, 16.4, 16.5_
  
  - [ ]* 7.5 Write property test for widget instance options JSON parsing
    - **Property 48: Widget Instance Options JSON Parsing**
    - **Validates: Requirements 16.5, 26.5**
  
  - [ ]* 7.6 Write property test for widget instance summary field completeness
    - **Property 46: Widget Instance Summary Field Completeness**
    - **Validates: Requirements 15.8**

- [x] 8. Checkpoint - Ensure all service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement widget tool handlers
  - [x] 9.1 Create widget tool handlers
    - Implement createWidgetHandler with parameter validation
    - Implement getWidgetHandler with parameter validation
    - Implement updateWidgetHandler with parameter validation
    - Implement cloneWidgetHandler with parameter validation
    - Implement queryWidgetsHandler with parameter validation
    - Implement listRecentWidgetsHandler with parameter validation
    - Implement validateWidgetHandler with parameter validation
    - Implement getWidgetDependenciesHandler with parameter validation
    - Implement getPagesUsingWidgetHandler with parameter validation
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 17.1, 18.1, 20.1_
  
  - [ ]* 9.2 Write unit tests for widget handlers
    - Test parameter validation
    - Test error handling
    - Test response formatting
    - _Requirements: 1.8, 2.4, 4.2, 4.3, 5.7, 5.9_

- [x] 10. Implement page tool handlers
  - [x] 10.1 Create page tool handlers
    - Implement createPageHandler with parameter validation
    - Implement getPageHandler with parameter validation
    - Implement updatePageHandler with parameter validation
    - Implement queryPagesHandler with parameter validation
    - Implement listRecentPagesHandler with parameter validation
    - Implement getWidgetsByPageHandler with parameter validation
    - _Requirements: 7.1, 8.1, 9.1, 10.1, 11.1, 19.1_
  
  - [ ]* 10.2 Write unit tests for page handlers
    - Test parameter validation
    - Test error handling
    - Test response formatting
    - _Requirements: 8.4, 10.2, 10.3, 11.2, 11.4_

- [x] 11. Implement portal and widget instance tool handlers
  - [x] 11.1 Create portal tool handlers
    - Implement queryPortalsHandler with parameter validation
    - Implement getPortalHandler with parameter validation
    - Implement listPortalsHandler with parameter validation
    - _Requirements: 12.1, 13.1, 14.1_
  
  - [x] 11.2 Create widget instance tool handlers
    - Implement queryWidgetInstancesHandler with parameter validation
    - Implement getWidgetInstanceHandler with parameter validation
    - _Requirements: 15.1, 16.1_
  
  - [ ]* 11.3 Write unit tests for portal and widget instance handlers
    - Test parameter validation
    - Test error handling
    - Test response formatting
    - _Requirements: 13.4, 16.3_

- [x] 12. Define tool schemas
  - [x] 12.1 Create widget tool schemas in schemas.ts
    - Define QUERY_WIDGETS_SCHEMA
    - Define GET_WIDGET_SCHEMA
    - Define LIST_RECENT_WIDGETS_SCHEMA
    - Define CREATE_WIDGET_SCHEMA
    - Define UPDATE_WIDGET_SCHEMA
    - Define CLONE_WIDGET_SCHEMA
    - Define VALIDATE_WIDGET_SCHEMA
    - Define GET_WIDGET_DEPENDENCIES_SCHEMA
    - Define GET_PAGES_USING_WIDGET_SCHEMA
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 17.1, 18.1, 20.1_
  
  - [x] 12.2 Create page tool schemas in schemas.ts
    - Define QUERY_PAGES_SCHEMA
    - Define GET_PAGE_SCHEMA
    - Define LIST_RECENT_PAGES_SCHEMA
    - Define CREATE_PAGE_SCHEMA
    - Define UPDATE_PAGE_SCHEMA
    - Define GET_WIDGETS_BY_PAGE_SCHEMA
    - _Requirements: 7.1, 8.1, 9.1, 10.1, 11.1, 19.1_
  
  - [x] 12.3 Create portal and widget instance tool schemas in schemas.ts
    - Define QUERY_PORTALS_SCHEMA
    - Define GET_PORTAL_SCHEMA
    - Define LIST_PORTALS_SCHEMA
    - Define QUERY_WIDGET_INSTANCES_SCHEMA
    - Define GET_WIDGET_INSTANCE_SCHEMA
    - _Requirements: 12.1, 13.1, 14.1, 15.1, 16.1_

- [x] 13. Register tools in MCP server
  - [x] 13.1 Update MCPServer.ts to register widget tools
    - Import widget schemas and handlers
    - Create WidgetService instance
    - Register widget tools in ListToolsRequestSchema handler
    - Add widget tool cases to CallToolRequestSchema handler
    - _Requirements: 23.1, 23.2, 23.5_
  
  - [x] 13.2 Update MCPServer.ts to register page tools
    - Import page schemas and handlers
    - Create PageService instance
    - Register page tools in ListToolsRequestSchema handler
    - Add page tool cases to CallToolRequestSchema handler
    - _Requirements: 23.3, 23.5_
  
  - [x] 13.3 Update MCPServer.ts to register portal and widget instance tools
    - Import portal and widget instance schemas and handlers
    - Create PortalService and WidgetInstanceService instances
    - Register portal and widget instance tools in ListToolsRequestSchema handler
    - Add portal and widget instance tool cases to CallToolRequestSchema handler
    - _Requirements: 23.4, 23.5_

- [x] 14. Checkpoint - Ensure all tools are registered and functional
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Extend ScriptSecurityValidator for Service Portal
  - [x] 15.1 Add Service Portal-specific validation patterns
    - Add HTML blacklist patterns (inline event handlers, javascript: URLs, Angular constructor access)
    - Add CSS/SCSS blacklist patterns (expression(), behavior, -moz-binding, url() with javascript:)
    - Extend JavaScript validation for Service Portal context ($sp, spUtil APIs)
    - Add valid pattern recognition for $sp API methods
    - Add valid pattern recognition for spUtil methods
    - Add valid pattern recognition for Bootstrap 3.3.7 classes
    - Add valid pattern recognition for AngularJS directives
    - Add valid pattern recognition for SCSS syntax (variables, mixins, nesting)
    - Add discouraged pattern warnings (GlideRecord, $scope.$apply, $scope.$watch, non-one-time bindings, ng-bind-html)
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7, 31.1, 32.1, 33.2, 33.5, 34.1, 34.2, 35.1, 35.2, 36.1, 36.2, 37.1, 37.4, 38.1, 38.4, 38.5_
  
  - [ ]* 15.2 Write property tests for Service Portal security patterns
    - Test HTML dangerous pattern detection (inline handlers, javascript: URLs, Angular exploits)
    - Test CSS dangerous pattern detection (expression(), behavior, -moz-binding)
    - Test Angular expression security (constructor, __proto__, prototype)
    - Test SCSS validation (variables, mixins, dangerous patterns)
    - Test $sp API recognition (getRecord, getParameter, getWidget, etc.)
    - Test spUtil API recognition (recordWatch, update, get, etc.)
    - Test Bootstrap class recognition (panels, buttons, grid, etc.)
    - Test AngularJS directive recognition (ng-if, ng-repeat, ng-model, etc.)
    - Test link function validation (signature, dangerous patterns)
    - Test option schema validation (JSON format, required fields)
    - Test performance pattern detection (one-time bindings, $watch usage)
    - Test embedded widget validation (<widget> tag, options passing)
    - _Requirements: 21.4, 21.5, 21.6, 31.1, 31.5, 32.1, 32.3, 32.4, 33.2, 33.5, 34.1, 34.2, 35.1, 35.2, 36.1, 36.2, 37.1, 37.4, 38.1, 38.4, 38.5, 39.1, 39.2, 39.3_

- [x] 16. Implement error handling and logging
  - [x] 16.1 Ensure consistent error responses across all services
    - Verify all services return structured error responses
    - Verify all error codes are standardized
    - _Requirements: 22.1, 22.2_
  
  - [x] 16.2 Add comprehensive logging to all services
    - Log operation start with parameters
    - Log operation success with duration
    - Log operation failure with error details
    - Log security violations with code excerpts
    - _Requirements: 22.3, 22.4, 22.5, 22.6, 22.7_
  
  - [ ]* 16.3 Write property test for structured error responses
    - **Property 55: Structured Error Response**
    - **Validates: Requirements 22.1, 22.2**
  
  - [ ]* 16.4 Write property test for standardized error codes
    - **Property 56: Standardized Error Codes**
    - **Validates: Requirements 22.2**

- [x] 17. Final checkpoint - Comprehensive testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Create Service Portal development steering document
  - [x] 18.1 Create service-portal-development.md steering file
    - Document Service Portal architecture (AngularJS 1.5.x, Bootstrap 3.3.7)
    - Document widget component structure (HTML, CSS/SCSS, Client Script, Server Script, Link Function, Option Schema)
    - Document $sp server API methods and usage patterns
    - Document spUtil client API methods and usage patterns
    - Document AngularJS directive patterns (ng-if, ng-repeat, ng-model, etc.)
    - Document Bootstrap 3.3.7 component patterns
    - Document client-server communication patterns (c.server.get, c.server.update, input/data/options objects)
    - Document performance best practices (one-time bindings, $watch usage, Script Includes)
    - Document security patterns (XSS prevention, sanitization, dangerous patterns)
    - Document SCSS usage (variables, mixins, nesting)
    - Document embedded widget patterns (<widget> tag, $sp.getWidget())
    - Document option schema patterns (field types, configuration)
    - Document data table extension patterns (sp_instance extension)
    - Include code examples for common widget patterns
    - _Requirements: 31.1-40.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Services are implemented before handlers to enable early testing
- Security validation is integrated throughout the implementation
- All tools follow the established MCP tool development patterns
- New requirements 31-40 add comprehensive Service Portal-specific validation and best practices
