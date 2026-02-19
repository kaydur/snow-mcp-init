# Requirements Document: Service Portal Management

## Introduction

This feature adds Service Portal management capabilities to the ServiceNow MCP Server, enabling AI assistants to query, retrieve, create, and update Service Portal components including widgets, pages, portals, and widget instances. Service Portal is ServiceNow's Angular-based framework for building custom user interfaces. This feature follows the existing layered architecture pattern (MCP Protocol Layer → Tool Handlers → Service Layer → API Client Layer → ServiceNow REST APIs) and maintains consistency with existing entity management patterns.

## Glossary

- **Service_Portal**: ServiceNow's Angular-based framework for building custom user interfaces using AngularJS 1.5.x and Bootstrap 3.3.7
- **Widget**: A self-contained UI component with HTML template, CSS/SCSS, Client Script (Angular controller), Server Script, Link Function, and Option Schema stored in the sp_widget table
- **Page**: A container for widgets arranged in rows and columns stored in the sp_page table
- **Widget_Instance**: A specific instance of a widget on a page with configuration options stored in the sp_instance table
- **Portal**: A top-level container defining theme, homepage, and URL prefix stored in the sp_portal table
- **HTML_Template**: The HTML markup for a widget's visual structure using AngularJS directives (ng-if, ng-repeat, ng-model, ng-click, etc.)
- **Client_Script**: Angular controller JavaScript code that runs in the browser with access to $scope, data, options, and server objects
- **Server_Script**: Server-side JavaScript code that runs on the ServiceNow server with access to input, options, data, and $sp objects
- **CSS/SCSS**: Cascading Style Sheets or SCSS (Sassy CSS) for widget styling with automatic scoping per widget
- **Link_Function**: Optional AngularJS link function for direct DOM manipulation, runs after controller
- **Option_Schema**: JSON schema defining configurable parameters for widget instances
- **Demo_Data**: JSON data used for widget development and testing in the Widget Editor
- **Data_Table**: The ServiceNow table a widget is associated with for data operations (extends sp_instance when specified)
- **Widget_Dependencies**: External JavaScript or CSS resources required by a widget (stored in sp_dependency table)
- **MCP_Server**: The ServiceNow Model Context Protocol server that provides AI assistants with ServiceNow access
- **Tool_Handler**: The layer that validates parameters and orchestrates service calls
- **Service_Layer**: The business logic layer that handles entity operations
- **API_Client**: The layer that communicates with ServiceNow REST APIs
- **Security_Validator**: A component that validates HTML, CSS, and JavaScript code for dangerous patterns
- **Angular_Expression**: Angular template syntax used in widget HTML templates ({{variable}}, {{::oneTime}})
- **Widget_Options**: JSON configuration passed to a widget instance, accessible via options object in client and server scripts
- **Rectangle**: A layout container representing a row on a page stored in the sp_rectangle table
- **Column**: A column definition within a row stored in the sp_column table
- **$sp_Object**: Server-side API object providing methods like getRecord(), getParameter(), getWidget(), getMenuHREF()
- **spUtil**: Client-side service for common operations like recordWatch, update, and addTrivialMessage
- **One_Time_Binding**: Angular optimization using {{::variable}} syntax to reduce watchers and improve performance
- **SCSS_Variables**: Variables defined in themes that can be used across widgets for consistent styling

## Requirements

### Requirement 1: Query Widgets

**User Story:** As an AI assistant, I want to query widgets by various criteria, so that I can find specific widgets based on their properties.

#### Acceptance Criteria

1. WHEN a query request is received with filters, THE System SHALL return widgets matching all provided filter criteria
2. WHEN filtering by name, THE System SHALL perform a case-insensitive partial match search
3. WHEN filtering by id (unique identifier), THE System SHALL perform an exact match search
4. WHEN filtering by public status, THE System SHALL return only widgets with the specified public value
5. WHEN filtering by category, THE System SHALL return only widgets in the specified category
6. WHEN filtering by data_table, THE System SHALL return only widgets associated with the specified table
7. WHEN a custom query string is provided, THE System SHALL append it to the ServiceNow encoded query
8. WHEN a limit parameter is provided, THE System SHALL validate it is between 1 and 100
9. WHEN no limit is specified, THE System SHALL default to 25 results
10. WHEN the limit exceeds 100, THE System SHALL cap it at 100
11. THE System SHALL return summary information including: sys_id, name, id, public, category, data_table, sys_updated_on

### Requirement 2: Get Widget Details

**User Story:** As an AI assistant, I want to retrieve complete widget details including all scripts, so that I can view and analyze widget implementation.

#### Acceptance Criteria

1. WHEN a retrieval request is received with a valid sys_id, THE System SHALL return the complete widget details
2. WHEN a retrieval request is received with a widget id, THE System SHALL search by id and return the widget details
3. WHEN a widget is not found, THE System SHALL return a response with found: false
4. WHEN the identifier parameter is missing or empty, THE System SHALL return an INVALID_PARAMETER error
5. THE System SHALL return all key fields including: sys_id, name, id, html, css, client_script, server_script, data_table, demo_data, public, category, description, dependencies, sys_created_on, sys_updated_on
6. WHEN a widget has dependencies, THE System SHALL return the list of dependency sys_ids
7. WHEN a widget has demo_data, THE System SHALL return it as parsed JSON

### Requirement 3: List Recent Widgets

**User Story:** As an AI assistant, I want to list recently updated widgets, so that I can see the most recent changes to Service Portal components.

#### Acceptance Criteria

1. WHEN a list recent request is received, THE System SHALL return widgets ordered by sys_updated_on descending
2. WHEN a limit parameter is provided, THE System SHALL validate it is a positive integer
3. WHEN no limit is specified, THE System SHALL default to 25 results
4. WHEN the limit exceeds 100, THE System SHALL cap it at 100
5. THE System SHALL return summary information including: sys_id, name, id, public, category, data_table, sys_updated_on

### Requirement 4: Create Widgets

**User Story:** As an AI assistant, I want to create new widgets with all components, so that I can add custom UI functionality to Service Portal.

#### Acceptance Criteria

1. WHEN a widget creation request is received with valid parameters, THE System SHALL create the widget in ServiceNow and return the sys_id
2. WHEN creating a widget, THE System SHALL validate that the name field is provided and non-empty
3. WHEN creating a widget, THE System SHALL validate that the id field is provided and non-empty
4. WHEN creating a widget with HTML template, THE System SHALL validate the HTML for dangerous patterns
5. WHEN creating a widget with CSS, THE System SHALL validate the CSS for dangerous patterns
6. WHEN creating a widget with client_script, THE System SHALL validate the JavaScript code for syntax errors and security issues
7. WHEN creating a widget with server_script, THE System SHALL validate the JavaScript code for syntax errors and security issues
8. WHEN creating a widget with demo_data, THE System SHALL validate that it is valid JSON
9. WHEN a widget with the same id already exists, THE System SHALL return a DUPLICATE_ERROR
10. WHEN the HTML template contains dangerous Angular expressions, THE System SHALL reject the creation and return a SECURITY_VIOLATION error
11. WHEN the ServiceNow API returns an error during creation, THE System SHALL return a structured error response with the error code and details

### Requirement 5: Update Widgets

**User Story:** As an AI assistant, I want to update existing widgets, so that I can modify their code and properties.

#### Acceptance Criteria

1. WHEN an update request is received with a valid sys_id and update fields, THE System SHALL update the widget and return the updated sys_id
2. WHEN updating the html field, THE System SHALL validate the HTML for dangerous patterns
3. WHEN updating the css field, THE System SHALL validate the CSS for dangerous patterns
4. WHEN updating the client_script field, THE System SHALL validate the JavaScript code for syntax errors and security issues
5. WHEN updating the server_script field, THE System SHALL validate the JavaScript code for syntax errors and security issues
6. WHEN updating the demo_data field, THE System SHALL validate that it is valid JSON
7. WHEN the sys_id parameter is missing or invalid, THE System SHALL return an INVALID_PARAMETER error
8. WHEN the widget to update is not found, THE System SHALL return a NOT_FOUND error
9. WHEN no update fields are provided, THE System SHALL return an INVALID_PARAMETER error
10. THE System SHALL allow updating the following fields: name, id, html, css, client_script, server_script, data_table, demo_data, public, category, description

### Requirement 6: Clone Widgets

**User Story:** As an AI assistant, I want to clone existing widgets as a starting point for customization, so that I can quickly create variations of existing widgets.

#### Acceptance Criteria

1. WHEN a clone request is received with a valid source widget sys_id, THE System SHALL create a new widget with all properties copied from the source
2. WHEN cloning a widget, THE System SHALL require a new unique id for the cloned widget
3. WHEN cloning a widget, THE System SHALL require a new name for the cloned widget
4. WHEN the source widget is not found, THE System SHALL return a NOT_FOUND error
5. WHEN the new id already exists, THE System SHALL return a DUPLICATE_ERROR
6. THE System SHALL copy all fields including: html, css, client_script, server_script, data_table, demo_data, public, category, description, dependencies
7. THE System SHALL set the cloned widget's sys_created_on and sys_updated_on to the current timestamp

### Requirement 7: Query Pages

**User Story:** As an AI assistant, I want to query Service Portal pages by various criteria, so that I can find specific pages based on their properties.

#### Acceptance Criteria

1. WHEN a query request is received with filters, THE System SHALL return pages matching all provided filter criteria
2. WHEN filtering by title, THE System SHALL perform a case-insensitive partial match search
3. WHEN filtering by id (URL suffix), THE System SHALL perform an exact match search
4. WHEN filtering by public status, THE System SHALL return only pages with the specified public value
5. WHEN filtering by portal, THE System SHALL return only pages associated with the specified portal sys_id
6. WHEN a custom query string is provided, THE System SHALL append it to the ServiceNow encoded query
7. WHEN a limit parameter is provided, THE System SHALL validate it is between 1 and 100
8. WHEN no limit is specified, THE System SHALL default to 25 results
9. WHEN the limit exceeds 100, THE System SHALL cap it at 100
10. THE System SHALL return summary information including: sys_id, title, id, public, portal, roles, sys_updated_on

### Requirement 8: Get Page Details

**User Story:** As an AI assistant, I want to retrieve complete page details including layout and widget instances, so that I can understand page structure and composition.

#### Acceptance Criteria

1. WHEN a retrieval request is received with a valid sys_id, THE System SHALL return the complete page details
2. WHEN a retrieval request is received with a page id, THE System SHALL search by id and return the page details
3. WHEN a page is not found, THE System SHALL return a response with found: false
4. WHEN the identifier parameter is missing or empty, THE System SHALL return an INVALID_PARAMETER error
5. THE System SHALL return all key fields including: sys_id, title, id, public, portal, roles, description, sys_created_on, sys_updated_on
6. WHEN a page has widget instances, THE System SHALL return the list of widget instances with their configuration
7. WHEN a page has roles, THE System SHALL return the list of role sys_ids required for access

### Requirement 9: List Recent Pages

**User Story:** As an AI assistant, I want to list recently updated pages, so that I can see the most recent changes to Service Portal pages.

#### Acceptance Criteria

1. WHEN a list recent request is received, THE System SHALL return pages ordered by sys_updated_on descending
2. WHEN a limit parameter is provided, THE System SHALL validate it is a positive integer
3. WHEN no limit is specified, THE System SHALL default to 25 results
4. WHEN the limit exceeds 100, THE System SHALL cap it at 100
5. THE System SHALL return summary information including: sys_id, title, id, public, portal, roles, sys_updated_on

### Requirement 10: Create Pages

**User Story:** As an AI assistant, I want to create new Service Portal pages, so that I can add new user interfaces to the portal.

#### Acceptance Criteria

1. WHEN a page creation request is received with valid parameters, THE System SHALL create the page in ServiceNow and return the sys_id
2. WHEN creating a page, THE System SHALL validate that the title field is provided and non-empty
3. WHEN creating a page, THE System SHALL validate that the id field is provided and non-empty
4. WHEN a page with the same id already exists, THE System SHALL return a DUPLICATE_ERROR
5. WHEN creating a page with a portal reference, THE System SHALL validate that the portal exists
6. WHEN creating a page with roles, THE System SHALL validate that the roles exist
7. WHEN the ServiceNow API returns an error during creation, THE System SHALL return a structured error response with the error code and details

### Requirement 11: Update Pages

**User Story:** As an AI assistant, I want to update existing pages, so that I can modify their properties and configuration.

#### Acceptance Criteria

1. WHEN an update request is received with a valid sys_id and update fields, THE System SHALL update the page and return the updated sys_id
2. WHEN the sys_id parameter is missing or invalid, THE System SHALL return an INVALID_PARAMETER error
3. WHEN the page to update is not found, THE System SHALL return a NOT_FOUND error
4. WHEN no update fields are provided, THE System SHALL return an INVALID_PARAMETER error
5. WHEN updating the portal field, THE System SHALL validate that the portal exists
6. WHEN updating the roles field, THE System SHALL validate that the roles exist
7. THE System SHALL allow updating the following fields: title, id, public, portal, roles, description

### Requirement 12: Query Portals

**User Story:** As an AI assistant, I want to query Service Portals by various criteria, so that I can find specific portals based on their properties.

#### Acceptance Criteria

1. WHEN a query request is received with filters, THE System SHALL return portals matching all provided filter criteria
2. WHEN filtering by title, THE System SHALL perform a case-insensitive partial match search
3. WHEN filtering by url_suffix, THE System SHALL perform an exact match search
4. WHEN a custom query string is provided, THE System SHALL append it to the ServiceNow encoded query
5. WHEN a limit parameter is provided, THE System SHALL validate it is between 1 and 100
6. WHEN no limit is specified, THE System SHALL default to 25 results
7. WHEN the limit exceeds 100, THE System SHALL cap it at 100
8. THE System SHALL return summary information including: sys_id, title, url_suffix, homepage, theme, sys_updated_on

### Requirement 13: Get Portal Details

**User Story:** As an AI assistant, I want to retrieve complete portal details including theme and configuration, so that I can understand portal structure.

#### Acceptance Criteria

1. WHEN a retrieval request is received with a valid sys_id, THE System SHALL return the complete portal details
2. WHEN a retrieval request is received with a url_suffix, THE System SHALL search by url_suffix and return the portal details
3. WHEN a portal is not found, THE System SHALL return a response with found: false
4. WHEN the identifier parameter is missing or empty, THE System SHALL return an INVALID_PARAMETER error
5. THE System SHALL return all key fields including: sys_id, title, url_suffix, homepage, theme, logo, quick_start_config, sys_created_on, sys_updated_on

### Requirement 14: List Portals

**User Story:** As an AI assistant, I want to list all Service Portals, so that I can see available portal configurations.

#### Acceptance Criteria

1. WHEN a list portals request is received, THE System SHALL return all portals ordered by title
2. WHEN a limit parameter is provided, THE System SHALL validate it is a positive integer
3. WHEN no limit is specified, THE System SHALL default to 25 results
4. WHEN the limit exceeds 100, THE System SHALL cap it at 100
5. THE System SHALL return summary information including: sys_id, title, url_suffix, homepage, theme, sys_updated_on

### Requirement 15: Query Widget Instances

**User Story:** As an AI assistant, I want to query widget instances by page or widget, so that I can understand widget placement and configuration.

#### Acceptance Criteria

1. WHEN a query request is received with filters, THE System SHALL return widget instances matching all provided filter criteria
2. WHEN filtering by page, THE System SHALL return only widget instances on the specified page sys_id
3. WHEN filtering by widget, THE System SHALL return only instances of the specified widget sys_id
4. WHEN a custom query string is provided, THE System SHALL append it to the ServiceNow encoded query
5. WHEN a limit parameter is provided, THE System SHALL validate it is between 1 and 100
6. WHEN no limit is specified, THE System SHALL default to 25 results
7. WHEN the limit exceeds 100, THE System SHALL cap it at 100
8. THE System SHALL return summary information including: sys_id, widget, page, order, color, size, options, sys_updated_on

### Requirement 16: Get Widget Instance Details

**User Story:** As an AI assistant, I want to retrieve complete widget instance details including configuration, so that I can understand how a widget is configured on a specific page.

#### Acceptance Criteria

1. WHEN a retrieval request is received with a valid sys_id, THE System SHALL return the complete widget instance details
2. WHEN a widget instance is not found, THE System SHALL return a response with found: false
3. WHEN the identifier parameter is missing or empty, THE System SHALL return an INVALID_PARAMETER error
4. THE System SHALL return all key fields including: sys_id, widget, page, order, color, size, bootstrap_alt_text, options, sys_created_on, sys_updated_on
5. WHEN a widget instance has options, THE System SHALL return them as parsed JSON

### Requirement 17: Validate Widget Code

**User Story:** As an AI assistant, I want to validate widget code before saving, so that I can catch syntax errors and security issues early.

#### Acceptance Criteria

1. WHEN a validation request is received with HTML template, THE System SHALL check for dangerous patterns and XSS vulnerabilities
2. WHEN a validation request is received with CSS, THE System SHALL check for dangerous patterns
3. WHEN a validation request is received with client_script, THE System SHALL check for syntax errors and security issues
4. WHEN a validation request is received with server_script, THE System SHALL check for syntax errors and security issues
5. WHEN all code is valid and safe, THE System SHALL return valid: true
6. WHEN the code contains syntax errors, THE System SHALL return valid: false with syntax error details
7. WHEN the code contains security violations, THE System SHALL return valid: false with security violation details
8. THE System SHALL check HTML for dangerous patterns including: inline event handlers, javascript: URLs, dangerous Angular expressions
9. THE System SHALL check CSS for dangerous patterns including: expression(), behavior, -moz-binding
10. THE System SHALL check JavaScript for dangerous patterns including: eval, Function constructor, document.write
11. THE System SHALL provide warnings for discouraged patterns that are not strictly forbidden

### Requirement 18: Get Widget Dependencies

**User Story:** As an AI assistant, I want to retrieve widget dependencies, so that I can understand what other widgets or libraries a widget requires.

#### Acceptance Criteria

1. WHEN a dependency request is received with a valid widget sys_id, THE System SHALL return the list of dependencies
2. WHEN a widget has no dependencies, THE System SHALL return an empty array
3. WHEN the widget is not found, THE System SHALL return a NOT_FOUND error
4. THE System SHALL return dependency information including: sys_id, name, type, source
5. WHEN a dependency is another widget, THE System SHALL include the widget sys_id and name

### Requirement 19: Get Widgets by Page

**User Story:** As an AI assistant, I want to retrieve all widgets used on a specific page, so that I can understand page composition.

#### Acceptance Criteria

1. WHEN a request is received with a valid page sys_id, THE System SHALL return all widgets used on that page
2. WHEN a page has no widgets, THE System SHALL return an empty array
3. WHEN the page is not found, THE System SHALL return a NOT_FOUND error
4. THE System SHALL return widget information including: sys_id, name, id, order, options
5. THE System SHALL order widgets by their order field on the page

### Requirement 20: Get Pages Using Widget

**User Story:** As an AI assistant, I want to find all pages that use a specific widget, so that I can understand widget usage and impact of changes.

#### Acceptance Criteria

1. WHEN a request is received with a valid widget sys_id, THE System SHALL return all pages using that widget
2. WHEN a widget is not used on any pages, THE System SHALL return an empty array
3. WHEN the widget is not found, THE System SHALL return a NOT_FOUND error
4. THE System SHALL return page information including: sys_id, title, id, portal
5. THE System SHALL order pages by title

### Requirement 21: Security and Validation

**User Story:** As a system administrator, I want widget code to be validated for security issues, so that dangerous code cannot be executed in Service Portal.

#### Acceptance Criteria

1. THE System SHALL validate all HTML templates against a blacklist of dangerous patterns before creation or update
2. THE System SHALL validate all CSS against a blacklist of dangerous patterns before creation or update
3. THE System SHALL validate all JavaScript code against a blacklist of dangerous patterns before creation or update
4. THE System SHALL reject HTML containing: inline event handlers (onclick, onerror, etc.), javascript: URLs, <script> tags in unsafe contexts
5. THE System SHALL reject Angular expressions containing: constructor, __proto__, prototype pollution patterns
6. THE System SHALL reject CSS containing: expression(), behavior, -moz-binding, url() with javascript:
7. THE System SHALL reject JavaScript containing: eval, Function constructor, require, import, XMLDocument, file system access
8. THE System SHALL enforce maximum length limits for html, css, client_script, and server_script fields
9. WHEN dangerous patterns are detected, THE System SHALL return a SECURITY_VIOLATION error with specific pattern details
10. THE System SHALL log all security violations for audit purposes
11. THE System SHALL use the existing ScriptSecurityValidator component for JavaScript validation
12. THE System SHALL provide warnings (not errors) for discouraged patterns like GlideRecord in server scripts

### Requirement 22: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can troubleshoot issues and monitor Service Portal operations.

#### Acceptance Criteria

1. WHEN any operation fails, THE System SHALL return a structured error response with code, message, and detail fields
2. THE System SHALL use standardized error codes: INVALID_PARAMETER, VALIDATION_ERROR, SECURITY_VIOLATION, NOT_FOUND, DUPLICATE_ERROR, INTERNAL_ERROR
3. WHEN an operation starts, THE System SHALL log the operation name and parameters
4. WHEN an operation completes, THE System SHALL log the operation name, result summary, and duration
5. WHEN an operation fails, THE System SHALL log the operation name, error details, and duration
6. THE System SHALL use the existing logger utility for all logging operations
7. THE System SHALL include request timing information in all log entries

### Requirement 23: Consistency with Existing Patterns

**User Story:** As a developer, I want Service Portal management to follow existing architectural patterns, so that the codebase remains maintainable and consistent.

#### Acceptance Criteria

1. THE System SHALL implement a WidgetService class following the same pattern as IncidentService and ScriptIncludeService
2. THE System SHALL implement a PageService class following the same pattern as existing service classes
3. THE System SHALL implement a PortalService class following the same pattern as existing service classes
4. THE System SHALL implement a WidgetInstanceService class following the same pattern as existing service classes
5. THE System SHALL implement tool handlers following the same pattern as existing handlers with parameter validation
6. THE System SHALL use the existing ServiceNowClient for all API communication
7. THE System SHALL define TypeScript types for all entities following existing type patterns
8. THE System SHALL use the appropriate ServiceNow tables: sp_widget, sp_page, sp_portal, sp_instance
9. THE System SHALL transform ServiceNow records to typed objects using private transformation methods

### Requirement 24: Widget Data Tables

**User Story:** As an AI assistant, I want to understand and manage widget data table associations, so that I can create widgets that work with specific ServiceNow tables.

#### Acceptance Criteria

1. WHEN creating a widget with a data_table, THE System SHALL validate that the table exists in ServiceNow
2. WHEN querying widgets by data_table, THE System SHALL return only widgets associated with that table
3. WHEN retrieving widget details, THE System SHALL include the data_table field
4. WHEN a widget has demo_data, THE System SHALL validate that it conforms to the data_table schema
5. THE System SHALL allow creating widgets without a data_table for generic widgets

### Requirement 25: Widget Categories

**User Story:** As an AI assistant, I want to organize widgets by category, so that I can find related widgets easily.

#### Acceptance Criteria

1. WHEN creating a widget with a category, THE System SHALL validate that the category exists in ServiceNow
2. WHEN querying widgets by category, THE System SHALL return only widgets in that category
3. WHEN retrieving widget details, THE System SHALL include the category name and sys_id
4. THE System SHALL allow creating widgets without a category
5. WHEN listing categories, THE System SHALL return all available widget categories

### Requirement 26: JSON Validation

**User Story:** As an AI assistant, I want JSON fields to be validated, so that I can ensure data integrity for demo_data and widget options.

#### Acceptance Criteria

1. WHEN creating or updating a widget with demo_data, THE System SHALL validate that it is valid JSON
2. WHEN creating or updating a widget instance with options, THE System SHALL validate that it is valid JSON
3. WHEN JSON is invalid, THE System SHALL return a VALIDATION_ERROR with details about the JSON parsing error
4. WHEN JSON is valid, THE System SHALL store it as a string in ServiceNow
5. WHEN retrieving demo_data or options, THE System SHALL parse the JSON and return it as an object

### Requirement 27: Widget Public/Private Access

**User Story:** As an AI assistant, I want to control widget visibility, so that I can manage which widgets are available for general use.

#### Acceptance Criteria

1. WHEN creating a widget, THE System SHALL allow setting the public field to true or false
2. WHEN querying widgets with public filter set to true, THE System SHALL return only public widgets
3. WHEN querying widgets with public filter set to false, THE System SHALL return only private widgets
4. WHEN no public filter is provided, THE System SHALL return both public and private widgets
5. THE System SHALL default new widgets to public: false if not specified

### Requirement 28: Page Public/Private Access

**User Story:** As an AI assistant, I want to control page visibility, so that I can manage which pages are available for general use.

#### Acceptance Criteria

1. WHEN creating a page, THE System SHALL allow setting the public field to true or false
2. WHEN querying pages with public filter set to true, THE System SHALL return only public pages
3. WHEN querying pages with public filter set to false, THE System SHALL return only private pages
4. WHEN no public filter is provided, THE System SHALL return both public and private pages
5. THE System SHALL default new pages to public: false if not specified

### Requirement 29: Page Role-Based Access

**User Story:** As an AI assistant, I want to manage page access control through roles, so that I can restrict pages to specific user groups.

#### Acceptance Criteria

1. WHEN creating a page with roles, THE System SHALL validate that all role sys_ids exist in ServiceNow
2. WHEN updating page roles, THE System SHALL validate that all role sys_ids exist in ServiceNow
3. WHEN retrieving page details, THE System SHALL include the list of role sys_ids
4. WHEN a page has no roles, THE System SHALL allow access to all users
5. WHEN a page has roles, THE System SHALL restrict access to users with at least one of the specified roles

### Requirement 30: Widget Instance Positioning

**User Story:** As an AI assistant, I want to understand widget positioning on pages, so that I can manage page layout.

#### Acceptance Criteria

1. WHEN retrieving widget instances for a page, THE System SHALL include the order field indicating position
2. WHEN retrieving widget instances for a page, THE System SHALL include the size field indicating column width
3. WHEN retrieving widget instances for a page, THE System SHALL include the color field for visual styling
4. THE System SHALL order widget instances by their order field when returning page details
5. WHEN a widget instance has bootstrap_alt_text, THE System SHALL include it in the response

### Requirement 31: Widget Option Schema Support

**User Story:** As an AI assistant, I want to manage widget option schemas, so that widgets can be configured by portal administrators without code changes.

#### Acceptance Criteria

1. WHEN creating or updating a widget with an option_schema, THE System SHALL validate that it is valid JSON
2. WHEN retrieving widget details, THE System SHALL include the option_schema field
3. THE System SHALL support option schema field types: string, boolean, integer, reference, field_name, field_list
4. WHEN an option schema is defined, THE System SHALL store instance-specific options in the sp_instance table's options field
5. WHEN validating option schemas, THE System SHALL check for required fields: name, label, type

### Requirement 32: Widget Link Function Support

**User Story:** As an AI assistant, I want to manage widget link functions, so that widgets can perform direct DOM manipulation.

#### Acceptance Criteria

1. WHEN creating or updating a widget with a link function, THE System SHALL validate the JavaScript code for security issues
2. WHEN retrieving widget details, THE System SHALL include the link field
3. THE System SHALL validate that link functions do not contain dangerous DOM manipulation patterns
4. WHEN a link function is provided, THE System SHALL ensure it follows AngularJS link function signature: function(scope, element, attrs, controller)
5. THE System SHALL warn about direct DOM manipulation that could be done in the controller instead

### Requirement 33: Widget SCSS Support

**User Story:** As an AI assistant, I want to support SCSS in widget CSS, so that widgets can use SCSS variables and features.

#### Acceptance Criteria

1. WHEN creating or updating a widget with CSS, THE System SHALL accept both CSS and SCSS syntax
2. THE System SHALL validate SCSS syntax for compilation errors
3. THE System SHALL support SCSS variables, nesting, mixins, and imports
4. WHEN validating SCSS, THE System SHALL check for dangerous patterns in both CSS and SCSS syntax
5. THE System SHALL recognize SCSS variable references (e.g., $primary-color) as valid

### Requirement 34: Widget Server API ($sp) Usage

**User Story:** As an AI assistant, I want to understand $sp API usage in server scripts, so that I can validate proper ServiceNow API patterns.

#### Acceptance Criteria

1. THE System SHALL recognize valid $sp API methods: getRecord(), getParameter(), getWidget(), getMenuHREF(), getDisplayValue(), getStream(), getValues(), getListColumns(), getForm(), getCatalogItem(), getPortal()
2. WHEN validating server scripts, THE System SHALL check for proper $sp API usage patterns
3. THE System SHALL warn about deprecated patterns like GlideRecord when $sp.getRecord() is available
4. THE System SHALL validate that input, options, and data objects are used correctly in server scripts
5. THE System SHALL recognize server.update() and server.get() patterns for client-server communication

### Requirement 35: Widget Client API (spUtil) Usage

**User Story:** As an AI assistant, I want to understand spUtil API usage in client scripts, so that I can validate proper client-side patterns.

#### Acceptance Criteria

1. THE System SHALL recognize valid spUtil methods: recordWatch(), update(), addTrivialMessage(), addInfoMessage(), addErrorMessage(), get()
2. WHEN validating client scripts, THE System SHALL check for proper dependency injection of spUtil
3. THE System SHALL validate that c.server.get() and c.server.update() are used for client-server communication
4. THE System SHALL recognize proper use of $scope, $rootScope, and controller (c) objects
5. THE System SHALL warn about using $scope.$apply() when not necessary (discouraged pattern)

### Requirement 36: Widget Performance Best Practices

**User Story:** As an AI assistant, I want to validate widget performance best practices, so that widgets perform optimally.

#### Acceptance Criteria

1. THE System SHALL recommend one-time bindings ({{::variable}}) for static data in HTML templates
2. THE System SHALL warn about excessive $scope.$watch() usage in client scripts
3. THE System SHALL recommend using Script Includes for data operations instead of inline server script code
4. THE System SHALL validate that widgets use getDisplayValue() for reference fields to reduce database queries
5. THE System SHALL warn about using $window.location.href instead of $location.search() for navigation

### Requirement 37: Widget Bootstrap 3.3.7 Support

**User Story:** As an AI assistant, I want to validate Bootstrap usage in widgets, so that widgets use proper Bootstrap classes.

#### Acceptance Criteria

1. THE System SHALL recognize Bootstrap 3.3.7 classes as valid in HTML templates
2. THE System SHALL validate that widgets use responsive Bootstrap grid classes (col-xs, col-sm, col-md, col-lg)
3. THE System SHALL recognize Bootstrap components: panels, modals, alerts, buttons, forms, navs
4. WHEN validating HTML, THE System SHALL not flag Bootstrap classes as errors
5. THE System SHALL recommend Bootstrap classes over custom CSS when appropriate

### Requirement 38: Widget AngularJS Directive Support

**User Story:** As an AI assistant, I want to validate AngularJS directive usage, so that widgets use proper Angular patterns.

#### Acceptance Criteria

1. THE System SHALL recognize standard AngularJS directives: ng-if, ng-repeat, ng-model, ng-click, ng-show, ng-hide, ng-class, ng-style, ng-bind, ng-bind-html
2. THE System SHALL validate proper ng-repeat syntax with track by for performance
3. THE System SHALL recognize Angular filters: orderBy, filter, limitTo, date, currency, number
4. WHEN validating HTML templates, THE System SHALL check for proper Angular expression syntax
5. THE System SHALL warn about using ng-bind-html without proper sanitization

### Requirement 39: Widget Embedded Widget Support

**User Story:** As an AI assistant, I want to understand embedded widget patterns, so that widgets can include other widgets.

#### Acceptance Criteria

1. THE System SHALL recognize <widget> tag syntax for embedding widgets
2. THE System SHALL validate that embedded widgets pass options correctly: <widget id="widget-id" options="c.options"></widget>
3. WHEN a widget embeds another widget, THE System SHALL validate that the embedded widget exists
4. THE System SHALL recognize $sp.getWidget() pattern for server-side widget embedding
5. THE System SHALL validate that widget options are passed as objects, not strings

### Requirement 40: Widget Data Table Extension

**User Story:** As an AI assistant, I want to understand widget data table extensions, so that widgets can have custom configuration tables.

#### Acceptance Criteria

1. WHEN a widget has a data_table specified, THE System SHALL validate that the table extends sp_instance
2. THE System SHALL recognize that data_table creates a custom configuration table for widget instances
3. WHEN retrieving widget details with a data_table, THE System SHALL include information about the extended table
4. THE System SHALL validate that data_table references are valid table names
5. THE System SHALL explain that data_table allows for complex widget configuration beyond simple option schemas
