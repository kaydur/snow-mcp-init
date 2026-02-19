# Requirements Document: Script Include Management

## Introduction

This feature adds Script Include management capabilities to the ServiceNow MCP Server, enabling AI assistants to create, read, update, delete, query, and test Script Includes. Script Includes are server-side JavaScript code libraries in ServiceNow that provide reusable functions and classes. This feature follows the existing layered architecture pattern (MCP Protocol Layer → Tool Handlers → Service Layer → API Client Layer → ServiceNow REST APIs) and maintains consistency with existing entity management patterns.

## Glossary

- **Script_Include**: A server-side JavaScript code library in ServiceNow stored in the sys_script_include table that provides reusable functions or classes
- **API_Name**: The unique identifier used to reference a Script Include in code (e.g., "MyUtility" or "IncidentHelper")
- **Access_Level**: The visibility scope of a Script Include (public, package_private, or private)
- **Client_Callable**: A boolean flag indicating whether a Script Include can be called from client-side scripts via GlideAjax
- **On_Demand_Script_Include**: A classless Script Include with a single function where the function name matches the Script Include name (server-side only)
- **Class_Based_Script_Include**: A Script Include that defines a new class with prototype methods for object-oriented programming (server-side only)
- **GlideAjax_Script_Include**: A Script Include that extends AbstractAjaxProcessor to enable client-to-server communication
- **MCP_Server**: The ServiceNow Model Context Protocol server that provides AI assistants with ServiceNow access
- **Tool_Handler**: The layer that validates parameters and orchestrates service calls
- **Service_Layer**: The business logic layer that handles entity operations
- **API_Client**: The layer that communicates with ServiceNow REST APIs
- **Security_Validator**: A component that validates JavaScript code for dangerous patterns
- **Syntax_Validator**: A component that checks JavaScript code for syntax errors
- **AbstractAjaxProcessor**: The base class that Script Includes extend to become client-callable via GlideAjax

## Requirements

### Requirement 1: Create Script Includes

**User Story:** As an AI assistant, I want to create new Script Includes with validated code, so that I can add reusable server-side functionality to ServiceNow.

#### Acceptance Criteria

1. WHEN a Script Include creation request is received with valid parameters, THE System SHALL create the Script Include in ServiceNow and return the sys_id
2. WHEN creating a Script Include, THE System SHALL validate that the name field is provided and non-empty
3. WHEN creating a Script Include, THE System SHALL validate that the api_name field is provided and non-empty
4. WHEN creating a Script Include, THE System SHALL validate that the script field contains valid JavaScript code
5. WHEN creating a Script Include with an access level, THE System SHALL validate that the access level is one of: "public", "package_private", or "private"
6. WHEN creating a Script Include, THE System SHALL validate the JavaScript code for dangerous security patterns before submission
7. WHEN the JavaScript code contains blacklisted patterns, THE System SHALL reject the creation and return a SECURITY_VIOLATION error
8. WHEN the JavaScript code exceeds the maximum allowed length, THE System SHALL reject the creation and return a VALIDATION_ERROR
9. WHEN a Script Include with the same api_name already exists, THE System SHALL return a DUPLICATE_ERROR
10. WHEN the ServiceNow API returns an error during creation, THE System SHALL return a structured error response with the error code and details
11. WHEN creating a client-callable Script Include, THE System SHALL validate that the script extends AbstractAjaxProcessor
12. WHEN creating an on-demand Script Include, THE System SHALL validate that the function name matches the api_name

#### Examples

**Example 1: Create a Class-Based Script Include (Server-Side Only)**
```json
{
  "name": "create_script_include",
  "arguments": {
    "name": "Task Manager",
    "api_name": "TaskManager",
    "script": "var TaskManager = Class.create();\nTaskManager.prototype = {\n    initialize: function(taskSysId) {\n        this.task = new GlideRecord('task');\n        this.task.get(taskSysId);\n    },\n    isOverdue: function() {\n        return this.task.due_date < new GlideDateTime();\n    },\n    type: 'TaskManager'\n};",
    "active": true,
    "access": "public",
    "description": "Utility class for task management operations",
    "client_callable": false
  }
}
```

**Example 2: Create a Client-Callable Script Include (GlideAjax)**
```json
{
  "name": "create_script_include",
  "arguments": {
    "name": "User Info Ajax",
    "api_name": "UserInfoAjax",
    "script": "var UserInfoAjax = Class.create();\nUserInfoAjax.prototype = Object.extendsObject(AbstractAjaxProcessor, {\n    getUserDepartment: function() {\n        var sysID = this.getParameter('sysparm_user_id');\n        var gr = new GlideRecord('sys_user');\n        if (gr.get(sysID)) {\n            return gr.department.name.toString();\n        }\n        return '';\n    },\n    type: 'UserInfoAjax'\n});",
    "active": true,
    "access": "public",
    "description": "Ajax processor for fetching user information",
    "client_callable": true
  }
}
```

**Example 3: Create an On-Demand Script Include**
```json
{
  "name": "create_script_include",
  "arguments": {
    "name": "Get Formatted Date",
    "api_name": "getFormattedDate",
    "script": "function getFormattedDate() {\n    return new GlideDateTime().getDisplayValue();\n}",
    "active": true,
    "access": "public",
    "description": "Returns current date in display format",
    "client_callable": false
  }
}
```

**Example 4: Security Violation - Rejected Creation**
```json
{
  "name": "create_script_include",
  "arguments": {
    "name": "Dangerous Script",
    "api_name": "DangerousScript",
    "script": "var DangerousScript = Class.create();\nDangerousScript.prototype = {\n    initialize: function() {},\n    executeCode: function(code) {\n        eval(code); // SECURITY VIOLATION\n    },\n    type: 'DangerousScript'\n};",
    "active": true
  }
}
```

**Response:**
```json
{
  "error": {
    "code": "SECURITY_VIOLATION",
    "message": "Script contains blacklisted security patterns",
    "detail": "Detected dangerous pattern: eval() - arbitrary code execution is not allowed"
  }
}
```

### Requirement 2: Retrieve Script Includes

**User Story:** As an AI assistant, I want to retrieve existing Script Includes by sys_id or api_name, so that I can view their code and properties.

#### Acceptance Criteria

1. WHEN a retrieval request is received with a valid sys_id, THE System SHALL return the complete Script Include details
2. WHEN a retrieval request is received with an api_name, THE System SHALL search by api_name and return the Script Include details
3. WHEN a Script Include is not found, THE System SHALL return a response with found: false
4. WHEN the identifier parameter is missing or empty, THE System SHALL return an INVALID_PARAMETER error
5. WHEN the identifier parameter is not a string, THE System SHALL return an INVALID_PARAMETER error
6. THE System SHALL return all key fields including: sys_id, name, api_name, script, active, access, description, client_callable, sys_created_on, sys_updated_on

#### Examples

**Example 1: Retrieve by API Name**
```json
{
  "name": "get_script_include",
  "arguments": {
    "identifier": "TaskManager"
  }
}
```

**Response:**
```json
{
  "script_include": {
    "sys_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "name": "Task Manager",
    "api_name": "TaskManager",
    "script": "var TaskManager = Class.create();\nTaskManager.prototype = {\n    initialize: function(taskSysId) {\n        this.task = new GlideRecord('task');\n        this.task.get(taskSysId);\n    },\n    isOverdue: function() {\n        return this.task.due_date < new GlideDateTime();\n    },\n    type: 'TaskManager'\n};",
    "active": true,
    "access": "public",
    "description": "Utility class for task management operations",
    "client_callable": false,
    "sys_created_on": "2024-01-15T10:30:00Z",
    "sys_updated_on": "2024-01-20T14:45:00Z"
  },
  "found": true
}
```

**Example 2: Script Include Not Found**
```json
{
  "name": "get_script_include",
  "arguments": {
    "identifier": "NonExistentScript"
  }
}
```

**Response:**
```json
{
  "script_include": null,
  "found": false
}
```

### Requirement 3: Update Script Includes

**User Story:** As an AI assistant, I want to update existing Script Includes, so that I can modify their code and properties.

#### Acceptance Criteria

1. WHEN an update request is received with a valid sys_id and update fields, THE System SHALL update the Script Include and return the updated sys_id
2. WHEN updating the script field, THE System SHALL validate the JavaScript code for syntax errors
3. WHEN updating the script field, THE System SHALL validate the JavaScript code for dangerous security patterns
4. WHEN the script field contains blacklisted patterns, THE System SHALL reject the update and return a SECURITY_VIOLATION error
5. WHEN updating the access field, THE System SHALL validate that the value is one of: "public", "package_private", or "private"
6. WHEN the sys_id parameter is missing or invalid, THE System SHALL return an INVALID_PARAMETER error
7. WHEN the Script Include to update is not found, THE System SHALL return a NOT_FOUND error
8. WHEN no update fields are provided, THE System SHALL return an INVALID_PARAMETER error
9. THE System SHALL allow updating the following fields: name, api_name, script, active, access, description, client_callable

### Requirement 4: Delete Script Includes

**User Story:** As an AI assistant, I want to delete Script Includes, so that I can remove obsolete or incorrect code libraries.

#### Acceptance Criteria

1. WHEN a delete request is received with a valid sys_id, THE System SHALL delete the Script Include and return success: true
2. WHEN the sys_id parameter is missing or empty, THE System SHALL return an INVALID_PARAMETER error
3. WHEN the sys_id parameter is not a string, THE System SHALL return an INVALID_PARAMETER error
4. WHEN the Script Include to delete is not found, THE System SHALL return a NOT_FOUND error
5. WHEN the ServiceNow API returns an error during deletion, THE System SHALL return a structured error response

### Requirement 5: Query Script Includes

**User Story:** As an AI assistant, I want to query Script Includes by various criteria, so that I can find specific Script Includes based on their properties.

#### Acceptance Criteria

1. WHEN a query request is received with filters, THE System SHALL return Script Includes matching all provided filter criteria
2. WHEN filtering by name, THE System SHALL perform a case-insensitive partial match search
3. WHEN filtering by api_name, THE System SHALL perform an exact match search
4. WHEN filtering by active status, THE System SHALL return only Script Includes with the specified active value
5. WHEN filtering by access level, THE System SHALL return only Script Includes with the specified access level
6. WHEN filtering by client_callable, THE System SHALL return only Script Includes with the specified client_callable value
7. WHEN a custom query string is provided, THE System SHALL append it to the ServiceNow encoded query
8. WHEN a limit parameter is provided, THE System SHALL validate it is between 1 and 100
9. WHEN no limit is specified, THE System SHALL default to 25 results
10. WHEN the limit exceeds 100, THE System SHALL cap it at 100
11. WHEN access level filter is provided, THE System SHALL validate it is one of: "public", "package_private", or "private"
12. THE System SHALL return summary information including: sys_id, name, api_name, active, access, client_callable, sys_updated_on

### Requirement 6: List Recent Script Includes

**User Story:** As an AI assistant, I want to list recently updated Script Includes, so that I can see the most recent changes to the code library.

#### Acceptance Criteria

1. WHEN a list recent request is received, THE System SHALL return Script Includes ordered by sys_updated_on descending
2. WHEN a limit parameter is provided, THE System SHALL validate it is a positive integer
3. WHEN no limit is specified, THE System SHALL default to 25 results
4. WHEN the limit exceeds 100, THE System SHALL cap it at 100
5. THE System SHALL return summary information including: sys_id, name, api_name, active, access, client_callable, sys_updated_on

### Requirement 7: Validate Script Include Code

**User Story:** As an AI assistant, I want to validate Script Include JavaScript code before saving, so that I can catch syntax errors and security issues early.

#### Acceptance Criteria

1. WHEN a validation request is received with JavaScript code, THE System SHALL check for syntax errors
2. WHEN a validation request is received with JavaScript code, THE System SHALL check for blacklisted security patterns
3. WHEN the code is valid and safe, THE System SHALL return valid: true
4. WHEN the code contains syntax errors, THE System SHALL return valid: false with syntax error details
5. WHEN the code contains blacklisted patterns, THE System SHALL return valid: false with security violation details
6. WHEN the code exceeds maximum length, THE System SHALL return valid: false with a length violation message
7. THE System SHALL check for dangerous patterns including: eval, Function constructor, require, import, file system access, network requests
8. THE System SHALL detect dangerous operations including: GlideRecord usage (discouraged in favor of GlideQuery)
9. THE System SHALL provide warnings for discouraged patterns that are not strictly forbidden

#### Examples

**Example 1: Valid Script Include Code**
```json
{
  "name": "validate_script_include",
  "arguments": {
    "script": "var CommonUtils = Class.create();\nCommonUtils.prototype = {\n    initialize: function() {},\n    getFormattedDate: function() {\n        return new GlideDateTime().getDisplayValue();\n    },\n    type: 'CommonUtils'\n};"
  }
}
```

**Response:**
```json
{
  "valid": true,
  "warnings": [],
  "errors": []
}
```

**Example 2: Security Violation - eval()**
```json
{
  "name": "validate_script_include",
  "arguments": {
    "script": "function executeCode(code) {\n    eval(code);\n}"
  }
}
```

**Response:**
```json
{
  "valid": false,
  "warnings": [],
  "errors": [
    {
      "type": "SECURITY_VIOLATION",
      "message": "Detected dangerous pattern: eval()",
      "detail": "Arbitrary code execution is not allowed for security reasons"
    }
  ]
}
```

**Example 3: Discouraged Pattern - GlideRecord**
```json
{
  "name": "validate_script_include",
  "arguments": {
    "script": "var MyScript = Class.create();\nMyScript.prototype = {\n    initialize: function() {},\n    getUsers: function() {\n        var gr = new GlideRecord('sys_user');\n        gr.query();\n        return gr;\n    },\n    type: 'MyScript'\n};"
  }
}
```

**Response:**
```json
{
  "valid": true,
  "warnings": [
    {
      "type": "DISCOURAGED_PATTERN",
      "message": "GlideRecord usage detected",
      "detail": "Consider using GlideQuery for better performance and modern API"
    }
  ],
  "errors": []
}
```

**Example 4: Multiple Security Violations**
```json
{
  "name": "validate_script_include",
  "arguments": {
    "script": "var BadScript = Class.create();\nBadScript.prototype = {\n    initialize: function() {},\n    dangerousMethod: function() {\n        eval('some code');\n        var fn = new Function('return 1');\n        var http = new GlideHTTPRequest('http://evil.com');\n    },\n    type: 'BadScript'\n};"
  }
}
```

**Response:**
```json
{
  "valid": false,
  "warnings": [],
  "errors": [
    {
      "type": "SECURITY_VIOLATION",
      "message": "Detected dangerous pattern: eval()",
      "detail": "Arbitrary code execution is not allowed"
    },
    {
      "type": "SECURITY_VIOLATION",
      "message": "Detected dangerous pattern: Function constructor",
      "detail": "Dynamic function creation is not allowed"
    },
    {
      "type": "SECURITY_VIOLATION",
      "message": "Detected dangerous pattern: GlideHTTPRequest",
      "detail": "Unrestricted network requests are not allowed"
    }
  ]
}
```

### Requirement 8: Test Script Include Methods

**User Story:** As an AI assistant, I want to test Script Include methods with sample inputs, so that I can verify the code works correctly before deploying.

#### Acceptance Criteria

1. WHEN a test request is received with a sys_id and method name, THE System SHALL execute the specified method and return the result
2. WHEN a test request includes method parameters, THE System SHALL pass them to the method during execution
3. WHEN the Script Include is not found, THE System SHALL return a NOT_FOUND error
4. WHEN the specified method does not exist, THE System SHALL return a METHOD_NOT_FOUND error
5. WHEN the method execution throws an error, THE System SHALL return the error details in a structured format
6. WHEN the method executes successfully, THE System SHALL return the method result and execution time
7. THE System SHALL validate that the sys_id parameter is provided and is a string
8. THE System SHALL validate that the method_name parameter is provided and is a string
9. WHEN testing a Script Include with an initialize function, THE System SHALL support passing initialization parameters
10. WHEN testing methods that call other methods using `this`, THE System SHALL properly maintain the execution context

#### Examples

**Example 1: Test a Simple Method**
```json
{
  "name": "test_script_include",
  "arguments": {
    "sys_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "method_name": "isOverdue",
    "parameters": {}
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": true,
  "executionTime": 45,
  "logs": []
}
```

**Example 2: Test Method with Initialize Parameters**
```json
{
  "name": "test_script_include",
  "arguments": {
    "sys_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "method_name": "addDaysToCurrentDate",
    "initialize_params": [5],
    "parameters": {
      "noOfDays": 10
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": "2024-02-05 10:30:00",
  "executionTime": 32,
  "logs": []
}
```

**Example 3: Test Method That Calls Other Methods**
```json
{
  "name": "test_script_include",
  "arguments": {
    "sys_id": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "method_name": "addDaysToCurrentDate",
    "parameters": {
      "noOfDays": 7
    }
  }
}
```

**Script Include Code:**
```javascript
var CommunityArticle = Class.create();
CommunityArticle.prototype = {
    initialize: function(days) {
        this.dateTime = new GlideDateTime();
        this.days = days;
    },
    getCurrentDate: function() {
        return this.dateTime;
    },
    addDaysToCurrentDate: function(noOfDays) {
        var currentDate = this.getCurrentDate(); // Calls another method using 'this'
        currentDate.addDaysLocalTime(noOfDays);
        return currentDate;
    },
    type: 'CommunityArticle'
};
```

**Response:**
```json
{
  "success": true,
  "result": "2024-02-01 10:30:00",
  "executionTime": 28,
  "logs": ["Called getCurrentDate() internally"]
}
```

### Requirement 9: Security and Validation

**User Story:** As a system administrator, I want Script Include code to be validated for security issues, so that dangerous code cannot be executed in ServiceNow.

#### Acceptance Criteria

1. THE System SHALL validate all JavaScript code against a blacklist of dangerous patterns before creation or update
2. THE System SHALL reject code containing: eval, Function constructor, require, import, XMLDocument, SOAPMessage, file system access patterns
3. THE System SHALL reject code containing: GlideHTTPRequest, RESTMessageV2, SOAPMessageV2 (network request patterns)
4. THE System SHALL enforce a maximum script length limit to prevent resource exhaustion
5. WHEN dangerous patterns are detected, THE System SHALL return a SECURITY_VIOLATION error with specific pattern details
6. THE System SHALL log all security violations for audit purposes
7. THE System SHALL use the existing ScriptSecurityValidator component for validation
8. THE System SHALL provide warnings (not errors) for discouraged patterns like GlideRecord
9. THE System SHALL validate that client-callable Script Includes properly extend AbstractAjaxProcessor

#### Security Pattern Examples

**Blacklisted Patterns (Will Reject):**
- `eval()` - Arbitrary code execution
- `new Function()` - Dynamic function creation
- `require()` - Module loading
- `import` - ES6 module imports
- `GlideHTTPRequest` - Unrestricted HTTP requests
- `RESTMessageV2` - REST API calls without proper configuration
- `SOAPMessageV2` - SOAP calls without proper configuration
- `XMLDocument` - XML parsing with potential XXE vulnerabilities
- `gs.executeNow()` - Immediate script execution
- File system patterns: `readFile`, `writeFile`, `fs.`

**Discouraged Patterns (Will Warn):**
- `new GlideRecord()` - Recommend GlideQuery instead for better performance
- `gs.print()` - Recommend gs.info() or gs.log() for proper logging

**Allowed Patterns:**
- `new GlideDateTime()` - Date/time operations
- `new GlideQuery()` - Modern query API
- `gs.info()`, `gs.log()`, `gs.warn()`, `gs.error()` - Proper logging
- `gs.getProperty()` - System property access
- `gs.getUserID()`, `gs.getUserName()` - User context
- `Class.create()` - Class definition
- `Object.extendsObject()` - Class inheritance

### Requirement 10: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can troubleshoot issues and monitor Script Include operations.

#### Acceptance Criteria

1. WHEN any operation fails, THE System SHALL return a structured error response with code, message, and detail fields
2. THE System SHALL use standardized error codes: INVALID_PARAMETER, VALIDATION_ERROR, SECURITY_VIOLATION, NOT_FOUND, DUPLICATE_ERROR, INTERNAL_ERROR
3. WHEN an operation starts, THE System SHALL log the operation name and parameters
4. WHEN an operation completes, THE System SHALL log the operation name, result summary, and duration
5. WHEN an operation fails, THE System SHALL log the operation name, error details, and duration
6. THE System SHALL use the existing logger utility for all logging operations
7. THE System SHALL include request timing information in all log entries

### Requirement 11: Consistency with Existing Patterns

**User Story:** As a developer, I want Script Include management to follow existing architectural patterns, so that the codebase remains maintainable and consistent.

#### Acceptance Criteria

1. THE System SHALL implement a ScriptIncludeService class following the same pattern as IncidentService and UserService
2. THE System SHALL implement tool handlers following the same pattern as existing handlers with parameter validation
3. THE System SHALL use the existing ServiceNowClient for all API communication
4. THE System SHALL define TypeScript types for ScriptIncludeSummary and ScriptIncludeDetail following existing type patterns
5. THE System SHALL implement three standard tools: query_script_includes, get_script_include, list_recent_script_includes
6. THE System SHALL implement additional tools: create_script_include, update_script_include, delete_script_include, validate_script_include, test_script_include
7. THE System SHALL use the sys_script_include table for all Script Include operations
8. THE System SHALL transform ServiceNow records to typed objects using private transformation methods

#### sys_script_include Table Fields

**Core Fields:**
- `sys_id` (string, 32 chars) - Unique identifier
- `name` (string) - Display name of the Script Include
- `api_name` (string) - Unique API name used in code (e.g., "TaskManager")
- `script` (string, large text) - The JavaScript code
- `active` (boolean) - Whether the Script Include is active
- `access` (string) - Access level: "public", "package_private", or "private"
- `description` (string) - Description of the Script Include's purpose
- `client_callable` (boolean) - Whether callable from client-side via GlideAjax

**Metadata Fields:**
- `sys_created_on` (datetime) - Creation timestamp
- `sys_created_by` (string) - User who created it
- `sys_updated_on` (datetime) - Last update timestamp
- `sys_updated_by` (string) - User who last updated it
- `sys_mod_count` (integer) - Number of modifications
- `sys_package` (reference) - Application scope package

**Summary View Fields (for query/list operations):**
- sys_id, name, api_name, active, access, client_callable, sys_updated_on

**Detail View Fields (for get operation):**
- All fields including the full script content


### Requirement 12: Script Include Inheritance

**User Story:** As an AI assistant, I want to create Script Includes that extend other Script Includes, so that I can reuse and build upon existing functionality.

#### Acceptance Criteria

1. WHEN creating a Script Include that extends another Script Include, THE System SHALL validate that the parent Script Include exists
2. WHEN a child Script Include extends a parent, THE System SHALL allow access to all parent methods
3. WHEN querying Script Includes, THE System SHALL support filtering by parent Script Include
4. WHEN retrieving a Script Include, THE System SHALL include information about its parent if it extends another Script Include
5. THE System SHALL validate that circular inheritance is not created (Script Include A extends B, B extends A)
6. WHEN testing a child Script Include method, THE System SHALL properly resolve parent methods called via `this`

#### Examples

**Example 1: Create Parent Script Include**
```json
{
  "name": "create_script_include",
  "arguments": {
    "name": "Incident Helper",
    "api_name": "isActiveIncident",
    "script": "var isActiveIncident = Class.create();\nisActiveIncident.prototype = {\n    initialize: function() {},\n    getCurrentState: function(incNumber) {\n        var gr = new GlideRecord('incident');\n        if (gr.get('number', incNumber)) {\n            return gr.state.toString();\n        }\n        return null;\n    },\n    isActive: function(incNumber) {\n        var gr = new GlideRecord('incident');\n        if (gr.get('number', incNumber)) {\n            return gr.active.toString() === 'true';\n        }\n        return false;\n    },\n    type: 'isActiveIncident'\n};",
    "active": true,
    "access": "public"
  }
}
```

**Example 2: Create Child Script Include That Extends Parent**
```json
{
  "name": "create_script_include",
  "arguments": {
    "name": "Extended Incident Helper",
    "api_name": "sample_Extend_Script_Include",
    "script": "var sample_Extend_Script_Include = Class.create();\nsample_Extend_Script_Include.prototype = Object.extendsObject(isActiveIncident, {\n    initialize: function() {},\n    callChildFunction: function(message) {\n        gs.info('Child function called: ' + message);\n        // Can also call parent methods using this.getCurrentState()\n        return 'Child method executed';\n    },\n    type: 'sample_Extend_Script_Include'\n});",
    "active": true,
    "access": "public",
    "description": "Extends isActiveIncident with additional functionality"
  }
}
```

**Example 3: Test Child Script Include Calling Parent Method**
```json
{
  "name": "test_script_include",
  "arguments": {
    "sys_id": "child_script_include_sys_id",
    "method_name": "getCurrentState",
    "parameters": {
      "incNumber": "INC0010001"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "result": "2",
  "executionTime": 42,
  "logs": ["Called parent method getCurrentState from child Script Include"]
}
```

### Requirement 13: Script Include Usage in Reports

**User Story:** As an AI assistant, I want to use Script Includes in report conditions, so that I can create dynamic filters based on complex logic.

#### Acceptance Criteria

1. WHEN a Script Include is used in report conditions, THE System SHALL support returning arrays of sys_ids
2. WHEN creating a Script Include for report filtering, THE System SHALL validate that it returns an array
3. THE System SHALL document that Script Includes used in reports must be client-callable or have appropriate access
4. WHEN a Script Include returns sys_ids for filtering, THE System SHALL support using them with the IN operator in queries
5. WHEN a Script Include is used as an advanced reference qualifier, THE System SHALL support returning encoded query strings
6. WHEN creating on-demand Script Includes for reference qualifiers, THE System SHALL validate the function returns a valid query string

#### Examples

**Example 1: Script Include for Dynamic Report Filtering**
```json
{
  "name": "create_script_include",
  "arguments": {
    "name": "Get Current Cycle Incidents",
    "api_name": "getCurrentCycle",
    "script": "var getCurrentCycle = Class.create();\ngetCurrentCycle.prototype = Object.extendsObject(AbstractAjaxProcessor, {\n    getCurrentCycleIncident: function() {\n        var incArr = [];\n        var currentDate = new GlideDate();\n        var startDate, endDate;\n        \n        if (currentDate.getMonth() >= 1 && currentDate.getMonth() <= 6) {\n            startDate = currentDate.getYear() + '-01-01';\n            endDate = currentDate.getYear() + '-06-30';\n        } else {\n            startDate = currentDate.getYear() + '-07-01';\n            endDate = currentDate.getYear() + '-12-31';\n        }\n        \n        var grINC = new GlideRecord('incident');\n        grINC.addQuery('sys_created_on', '>=', startDate);\n        grINC.addQuery('sys_created_on', '<=', endDate);\n        grINC.query();\n        \n        while (grINC.next()) {\n            incArr.push(grINC.sys_id.toString());\n        }\n        \n        return incArr;\n    },\n    type: 'getCurrentCycle'\n});",
    "active": true,
    "access": "public",
    "client_callable": true,
    "description": "Returns incident sys_ids for current period (Jan-Jun or Jul-Dec)"
  }
}
```

**Usage in Report Filter:**
```
sys_id IN javascript:new getCurrentCycle().getCurrentCycleIncident()
```

**Example 2: On-Demand Script Include for Advanced Reference Qualifier**
```json
{
  "name": "create_script_include",
  "arguments": {
    "name": "Backfill Assignment Group",
    "api_name": "u_backfillAssignmentGroup",
    "script": "function u_backfillAssignmentGroup() {\n    var gp = '';\n    var a = current.assigned_to;\n    \n    // Return everything if assigned_to is empty\n    if (!a) return;\n    \n    // sys_user_grmember has the user to group relationship\n    var grp = new GlideRecord('sys_user_grmember');\n    grp.addQuery('user', a);\n    grp.query();\n    \n    while (grp.next()) {\n        if (gp.length > 0) {\n            // Build comma-separated string of groups\n            gp += (',' + grp.group);\n        } else {\n            gp = grp.group;\n        }\n    }\n    \n    // Return encoded query for IN operator\n    return 'sys_idIN' + gp;\n}",
    "active": true,
    "access": "public",
    "description": "Filters assignment groups to show only groups the assigned user belongs to"
  }
}
```

**Usage in Dictionary Reference Qualifier:**
```
javascript:u_backfillAssignmentGroup()
```

**Example 3: Advanced Reference Qualifier for Service Catalog Variables**
```json
{
  "name": "create_script_include",
  "arguments": {
    "name": "Reference Field Functions",
    "api_name": "dvt_ReferenceFieldFunctions",
    "script": "var dvt_ReferenceFieldFunctions = Class.create();\ndvt_ReferenceFieldFunctions.prototype = {\n    initialize: function() {},\n    \n    getAdvancedQualifier: function(targetTable, filterField, filterValueField) {\n        var answer = '';\n        var includes = current[filterValueField];\n        \n        // Check for Service Catalog variables\n        if (!includes) {\n            includes = current.variables[filterValueField];\n        }\n        \n        var GlRec = new GlideRecord(targetTable);\n        GlRec.addQuery(filterField, 'CONTAINS', includes);\n        GlRec.query();\n        \n        while (GlRec.next()) {\n            if (answer.length > 0) {\n                answer += (',' + GlRec.sys_id);\n            } else {\n                answer = '' + GlRec.sys_id;\n            }\n        }\n        \n        return 'sys_idIN' + answer;\n    },\n    \n    type: 'dvt_ReferenceFieldFunctions'\n};",
    "active": true,
    "access": "public",
    "description": "Generic reference qualifier for filtering based on current form values"
  }
}
```

**Usage in Catalog Variable Reference Qualifier:**
```
javascript:new dvt_ReferenceFieldFunctions().getAdvancedQualifier("cmdb_ci_hardware","assigned_to","caller_id")
```

