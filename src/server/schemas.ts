/**
 * JSON Schemas for MCP Tools
 * 
 * Defines JSON Schema definitions for all tool parameters.
 * These schemas are used for parameter validation before tool invocation.
 */

import { JSONSchema } from '../types/mcp.js';

/**
 * JSON Schema for query_incidents tool parameters
 * 
 * Supports filtering by state, priority, assigned_to, assignment_group,
 * custom query strings, and result limits.
 */
export const queryIncidentsSchema: JSONSchema = {
  type: 'object',
  properties: {
    state: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by incident states (New, In Progress, On Hold, Resolved, Closed)'
    },
    priority: {
      type: 'array',
      items: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 5 
      },
      description: 'Filter by priority levels (1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning)'
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
};

/**
 * JSON Schema for get_incident tool parameters
 * 
 * Requires an identifier (sys_id or incident number) to retrieve a specific incident.
 */
export const getIncidentSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Incident sys_id or incident number (e.g., INC0010001)'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_incidents tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listRecentIncidentsSchema: JSONSchema = {
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
};

/**
 * JSON Schema for execute_glidequery tool parameters
 * 
 * Requires a GlideQuery script and supports an optional timeout parameter.
 */
export const executeGlideQuerySchema: JSONSchema = {
  type: 'object',
  properties: {
    script: {
      type: 'string',
      description: 'GlideQuery script to execute on the ServiceNow instance'
    },
    timeout: {
      type: 'integer',
      minimum: 1000,
      maximum: 60000,
      default: 30000,
      description: 'Execution timeout in milliseconds (default: 30000, max: 60000)'
    }
  },
  required: ['script']
};

/**
 * JSON Schema for generate_glidequery tool parameters
 * 
 * Requires a natural language description and supports optional table hint and comment inclusion.
 */
export const generateGlideQuerySchema: JSONSchema = {
  type: 'object',
  properties: {
    description: {
      type: 'string',
      description: 'Natural language description of the desired GlideQuery operation'
    },
    table: {
      type: 'string',
      description: 'Optional ServiceNow table name hint for code generation'
    },
    includeComments: {
      type: 'boolean',
      default: true,
      description: 'Whether to include explanatory comments in the generated code (default: true)'
    }
  },
  required: ['description']
};

/**
 * JSON Schema for test_glidequery tool parameters
 * 
 * Requires a GlideQuery script and supports an optional maxResults parameter for result limiting.
 */
export const testGlideQuerySchema: JSONSchema = {
  type: 'object',
  properties: {
    script: {
      type: 'string',
      description: 'GlideQuery script to test in a safe mode with result limiting'
    },
    maxResults: {
      type: 'integer',
      minimum: 1,
      maximum: 1000,
      default: 100,
      description: 'Maximum number of results to return in test mode (default: 100, max: 1000)'
    }
  },
  required: ['script']
};

/**
 * JSON Schema for query_users tool parameters
 * 
 * Supports filtering by active status, department, role, name, and custom query strings.
 */
export const queryUsersSchema: JSONSchema = {
  type: 'object',
  properties: {
    active: {
      type: 'boolean',
      description: 'Filter by active status (true for active users, false for inactive)'
    },
    department: {
      type: 'string',
      description: 'Filter by department (name or sys_id)'
    },
    role: {
      type: 'string',
      description: 'Filter by role (name or sys_id)'
    },
    name: {
      type: 'string',
      description: 'Filter by user name (partial match)'
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
};

/**
 * JSON Schema for get_user tool parameters
 * 
 * Requires an identifier (sys_id or username) to retrieve a specific user.
 */
export const getUserSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'User sys_id or username (e.g., admin)'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_users tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listRecentUsersSchema: JSONSchema = {
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
};

/**
 * JSON Schema for query_groups tool parameters
 * 
 * Supports filtering by active status, type, name, and custom query strings.
 */
export const queryGroupsSchema: JSONSchema = {
  type: 'object',
  properties: {
    active: {
      type: 'boolean',
      description: 'Filter by active status (true for active groups, false for inactive)'
    },
    type: {
      type: 'string',
      description: 'Filter by group type'
    },
    name: {
      type: 'string',
      description: 'Filter by group name (partial match)'
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
};

/**
 * JSON Schema for get_group tool parameters
 * 
 * Requires an identifier (sys_id or group name) to retrieve a specific group.
 */
export const getGroupSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Group sys_id or group name'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_groups tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listRecentGroupsSchema: JSONSchema = {
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
};

/**
 * JSON Schema for query_group_members tool parameters
 * 
 * Supports filtering by group, user, and custom query strings.
 */
export const queryGroupMembersSchema: JSONSchema = {
  type: 'object',
  properties: {
    group: {
      type: 'string',
      description: 'Filter by group (name or sys_id)'
    },
    user: {
      type: 'string',
      description: 'Filter by user (username or sys_id)'
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
};

/**
 * JSON Schema for get_group_member tool parameters
 * 
 * Requires an identifier (sys_id) to retrieve a specific group member.
 */
export const getGroupMemberSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Group member sys_id'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_group_members tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listRecentGroupMembersSchema: JSONSchema = {
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
};

/**
 * JSON Schema for query_tasks tool parameters
 * 
 * Supports filtering by state, priority, assigned user, assignment group, and custom query strings.
 */
export const queryTasksSchema: JSONSchema = {
  type: 'object',
  properties: {
    state: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by task states (Open, Work In Progress, Closed, Pending, Canceled)'
    },
    priority: {
      type: 'array',
      items: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 5 
      },
      description: 'Filter by priority levels (1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning)'
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
};

/**
 * JSON Schema for get_task tool parameters
 * 
 * Requires an identifier (sys_id or task number) to retrieve a specific task.
 */
export const getTaskSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Task sys_id or task number (e.g., TASK0010001)'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_tasks tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listRecentTasksSchema: JSONSchema = {
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
};

/**
 * JSON Schema for query_stories tool parameters
 * 
 * Supports filtering by state, priority, sprint, assigned user, story points, and custom query strings.
 */
export const queryStoriesSchema: JSONSchema = {
  type: 'object',
  properties: {
    state: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by story states (Draft, Ready, In Progress, Review, Complete, Accepted)'
    },
    priority: {
      type: 'array',
      items: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 5 
      },
      description: 'Filter by priority levels (1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning)'
    },
    sprint: {
      type: 'string',
      description: 'Filter by sprint (name or sys_id)'
    },
    assigned_to: {
      type: 'string',
      description: 'Filter by assigned user (name or sys_id)'
    },
    story_points: {
      type: 'integer',
      minimum: 0,
      description: 'Filter by story points'
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
};

/**
 * JSON Schema for get_story tool parameters
 * 
 * Requires an identifier (sys_id or story number) to retrieve a specific story.
 */
export const getStorySchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Story sys_id or story number (e.g., STRY0010001)'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_stories tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listRecentStoriesSchema: JSONSchema = {
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
};

/**
 * JSON Schema for query_scrum_tasks tool parameters
 * 
 * Supports filtering by state, priority, sprint, assigned user, parent story, and custom query strings.
 */
export const queryScrumTasksSchema: JSONSchema = {
  type: 'object',
  properties: {
    state: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by scrum task states (Ready, Work In Progress, Complete, Canceled)'
    },
    priority: {
      type: 'array',
      items: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 5 
      },
      description: 'Filter by priority levels (1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning)'
    },
    sprint: {
      type: 'string',
      description: 'Filter by sprint (name or sys_id)'
    },
    assigned_to: {
      type: 'string',
      description: 'Filter by assigned user (name or sys_id)'
    },
    parent_story: {
      type: 'string',
      description: 'Filter by parent story (number or sys_id)'
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
};

/**
 * JSON Schema for get_scrum_task tool parameters
 * 
 * Requires an identifier (sys_id or scrum task number) to retrieve a specific scrum task.
 */
export const getScrumTaskSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Scrum task sys_id or scrum task number (e.g., SCTASK0010001)'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_scrum_tasks tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listRecentScrumTasksSchema: JSONSchema = {
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
};

/**
 * JSON Schema for query_change_requests tool parameters
 * 
 * Supports filtering by state, priority, risk, type, assigned user, assignment group, and custom query strings.
 */
export const queryChangeRequestsSchema: JSONSchema = {
  type: 'object',
  properties: {
    state: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by change request states (New, Assess, Authorize, Scheduled, Implement, Review, Closed, Canceled)'
    },
    priority: {
      type: 'array',
      items: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 5 
      },
      description: 'Filter by priority levels (1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning)'
    },
    risk: {
      type: 'array',
      items: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 3 
      },
      description: 'Filter by risk levels (1=High, 2=Moderate, 3=Low)'
    },
    type: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by change request type (standard, normal, emergency)'
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
};

/**
 * JSON Schema for get_change_request tool parameters
 * 
 * Requires an identifier (sys_id or change request number) to retrieve a specific change request.
 */
export const getChangeRequestSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Change request sys_id or change request number (e.g., CHG0010001)'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_change_requests tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listRecentChangeRequestsSchema: JSONSchema = {
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
};

/**
 * JSON Schema for create_script_include tool parameters
 * 
 * Requires name, api_name, and script. Supports optional active, access, description, and client_callable parameters.
 */
export const createScriptIncludeSchema: JSONSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Display name of the Script Include'
    },
    api_name: {
      type: 'string',
      description: 'Unique API name used in code (e.g., "TaskManager")'
    },
    script: {
      type: 'string',
      description: 'The JavaScript code'
    },
    active: {
      type: 'boolean',
      default: true,
      description: 'Whether the Script Include is active (optional, defaults to true)'
    },
    access: {
      type: 'string',
      enum: ['public', 'package_private', 'private'],
      default: 'public',
      description: 'Access level (optional, defaults to "public")'
    },
    description: {
      type: 'string',
      description: 'Description of the Script Include\'s purpose (optional)'
    },
    client_callable: {
      type: 'boolean',
      default: false,
      description: 'Whether callable from client-side via GlideAjax (optional, defaults to false)'
    }
  },
  required: ['name', 'api_name', 'script']
};

/**
 * JSON Schema for get_script_include tool parameters
 * 
 * Requires an identifier (sys_id or api_name) to retrieve a specific Script Include.
 */
export const getScriptIncludeSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Script Include sys_id or api_name'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for update_script_include tool parameters
 * 
 * Requires sys_id and at least one field to update.
 */
export const updateScriptIncludeSchema: JSONSchema = {
  type: 'object',
  properties: {
    sys_id: {
      type: 'string',
      description: 'Script Include sys_id'
    },
    name: {
      type: 'string',
      description: 'Display name of the Script Include'
    },
    api_name: {
      type: 'string',
      description: 'Unique API name used in code'
    },
    script: {
      type: 'string',
      description: 'The JavaScript code'
    },
    active: {
      type: 'boolean',
      description: 'Whether the Script Include is active'
    },
    access: {
      type: 'string',
      enum: ['public', 'package_private', 'private'],
      description: 'Access level'
    },
    description: {
      type: 'string',
      description: 'Description of the Script Include\'s purpose'
    },
    client_callable: {
      type: 'boolean',
      description: 'Whether callable from client-side via GlideAjax'
    }
  },
  required: ['sys_id']
};

/**
 * JSON Schema for delete_script_include tool parameters
 * 
 * Requires sys_id to delete a specific Script Include.
 */
export const deleteScriptIncludeSchema: JSONSchema = {
  type: 'object',
  properties: {
    sys_id: {
      type: 'string',
      description: 'Script Include sys_id'
    }
  },
  required: ['sys_id']
};

/**
 * JSON Schema for query_script_includes tool parameters
 * 
 * Supports filtering by name, api_name, active, access, client_callable, custom query, and limit.
 */
export const queryScriptIncludesSchema: JSONSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Filter by name (partial match, case-insensitive)'
    },
    api_name: {
      type: 'string',
      description: 'Filter by api_name (exact match)'
    },
    active: {
      type: 'boolean',
      description: 'Filter by active status'
    },
    access: {
      type: 'string',
      enum: ['public', 'package_private', 'private'],
      description: 'Filter by access level'
    },
    client_callable: {
      type: 'boolean',
      description: 'Filter by client-callable flag'
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
      description: 'Maximum number of results to return (default: 25, max: 100)'
    }
  }
};

/**
 * JSON Schema for list_recent_script_includes tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listRecentScriptIncludesSchema: JSONSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return (default: 25, max: 100)'
    }
  }
};

/**
 * JSON Schema for validate_script_include tool parameters
 * 
 * Requires JavaScript code to validate.
 */
export const validateScriptIncludeSchema: JSONSchema = {
  type: 'object',
  properties: {
    script: {
      type: 'string',
      description: 'JavaScript code to validate'
    }
  },
  required: ['script']
};

/**
 * JSON Schema for test_script_include tool parameters
 * 
 * Requires sys_id and method_name. Supports optional parameters and initialize_params.
 */
export const testScriptIncludeSchema: JSONSchema = {
  type: 'object',
  properties: {
    sys_id: {
      type: 'string',
      description: 'Script Include sys_id'
    },
    method_name: {
      type: 'string',
      description: 'Name of the method to test'
    },
    parameters: {
      type: 'object',
      description: 'Parameters to pass to the method'
    },
    initialize_params: {
      type: 'array',
      description: 'Parameters to pass to the initialize function'
    }
  },
  required: ['sys_id', 'method_name']
};

/**
 * JSON Schema for query_widgets tool parameters
 * 
 * Supports filtering by name, id, public status, category, data_table, custom query, and limit.
 */
export const queryWidgetsSchema: JSONSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Filter by name (partial match, case-insensitive)'
    },
    id: {
      type: 'string',
      description: 'Filter by id (exact match)'
    },
    public: {
      type: 'boolean',
      description: 'Filter by public status'
    },
    category: {
      type: 'string',
      description: 'Filter by category sys_id'
    },
    data_table: {
      type: 'string',
      description: 'Filter by associated table'
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
      description: 'Maximum number of results to return (default: 25, max: 100)'
    }
  }
};

/**
 * JSON Schema for get_widget tool parameters
 * 
 * Requires an identifier (sys_id or widget id) to retrieve a specific widget.
 */
export const getWidgetSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Widget sys_id or widget id'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_widgets tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listRecentWidgetsSchema: JSONSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return (default: 25, max: 100)'
    }
  }
};

/**
 * JSON Schema for create_widget tool parameters
 * 
 * Requires name and id. Supports optional html, css, client_script, server_script, link, option_schema, data_table, demo_data, public, category, and description.
 */
export const createWidgetSchema: JSONSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: 'Display name of the widget'
    },
    id: {
      type: 'string',
      description: 'Unique identifier for code'
    },
    html: {
      type: 'string',
      description: 'HTML template with AngularJS directives (optional)'
    },
    css: {
      type: 'string',
      description: 'CSS/SCSS styles (optional)'
    },
    client_script: {
      type: 'string',
      description: 'Angular controller JavaScript code (optional)'
    },
    server_script: {
      type: 'string',
      description: 'Server-side JavaScript code (optional)'
    },
    link: {
      type: 'string',
      description: 'AngularJS link function for DOM manipulation (optional)'
    },
    option_schema: {
      type: 'string',
      description: 'JSON schema defining configurable parameters (optional)'
    },
    data_table: {
      type: 'string',
      description: 'Associated table (optional)'
    },
    demo_data: {
      type: 'string',
      description: 'JSON demo data for testing (optional)'
    },
    public: {
      type: 'boolean',
      default: false,
      description: 'Public visibility (optional, defaults to false)'
    },
    category: {
      type: 'string',
      description: 'Category sys_id (optional)'
    },
    description: {
      type: 'string',
      description: 'Description (optional)'
    }
  },
  required: ['name', 'id']
};

/**
 * JSON Schema for update_widget tool parameters
 * 
 * Requires sys_id and at least one field to update.
 */
export const updateWidgetSchema: JSONSchema = {
  type: 'object',
  properties: {
    sys_id: {
      type: 'string',
      description: 'Widget sys_id'
    },
    name: {
      type: 'string',
      description: 'Display name of the widget'
    },
    id: {
      type: 'string',
      description: 'Unique identifier for code'
    },
    html: {
      type: 'string',
      description: 'HTML template with AngularJS directives'
    },
    css: {
      type: 'string',
      description: 'CSS/SCSS styles'
    },
    client_script: {
      type: 'string',
      description: 'Angular controller JavaScript code'
    },
    server_script: {
      type: 'string',
      description: 'Server-side JavaScript code'
    },
    link: {
      type: 'string',
      description: 'AngularJS link function for DOM manipulation'
    },
    option_schema: {
      type: 'string',
      description: 'JSON schema defining configurable parameters'
    },
    data_table: {
      type: 'string',
      description: 'Associated table'
    },
    demo_data: {
      type: 'string',
      description: 'JSON demo data for testing'
    },
    public: {
      type: 'boolean',
      description: 'Public visibility'
    },
    category: {
      type: 'string',
      description: 'Category sys_id'
    },
    description: {
      type: 'string',
      description: 'Description'
    }
  },
  required: ['sys_id']
};

/**
 * JSON Schema for clone_widget tool parameters
 * 
 * Requires source_sys_id, new_id, and new_name.
 */
export const cloneWidgetSchema: JSONSchema = {
  type: 'object',
  properties: {
    source_sys_id: {
      type: 'string',
      description: 'Source widget sys_id to clone from'
    },
    new_id: {
      type: 'string',
      description: 'New unique identifier for the cloned widget'
    },
    new_name: {
      type: 'string',
      description: 'New name for the cloned widget'
    }
  },
  required: ['source_sys_id', 'new_id', 'new_name']
};

/**
 * JSON Schema for validate_widget tool parameters
 * 
 * Supports optional html, css, client_script, server_script, link, option_schema, and demo_data for validation.
 */
export const validateWidgetSchema: JSONSchema = {
  type: 'object',
  properties: {
    html: {
      type: 'string',
      description: 'HTML template to validate (optional)'
    },
    css: {
      type: 'string',
      description: 'CSS/SCSS to validate (optional)'
    },
    client_script: {
      type: 'string',
      description: 'Client script to validate (optional)'
    },
    server_script: {
      type: 'string',
      description: 'Server script to validate (optional)'
    },
    link: {
      type: 'string',
      description: 'Link function to validate (optional)'
    },
    option_schema: {
      type: 'string',
      description: 'Option schema to validate (optional)'
    },
    demo_data: {
      type: 'string',
      description: 'Demo data to validate (optional)'
    }
  }
};

/**
 * JSON Schema for get_widget_dependencies tool parameters
 * 
 * Requires widget sys_id.
 */
export const getWidgetDependenciesSchema: JSONSchema = {
  type: 'object',
  properties: {
    sys_id: {
      type: 'string',
      description: 'Widget sys_id'
    }
  },
  required: ['sys_id']
};

/**
 * JSON Schema for get_pages_using_widget tool parameters
 * 
 * Requires widget sys_id.
 */
export const getPagesUsingWidgetSchema: JSONSchema = {
  type: 'object',
  properties: {
    sys_id: {
      type: 'string',
      description: 'Widget sys_id'
    }
  },
  required: ['sys_id']
};

/**
 * JSON Schema for query_pages tool parameters
 * 
 * Supports filtering by title, id, public status, portal, custom query, and limit.
 */
export const queryPagesSchema: JSONSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Filter by title (partial match, case-insensitive)'
    },
    id: {
      type: 'string',
      description: 'Filter by id (exact match)'
    },
    public: {
      type: 'boolean',
      description: 'Filter by public status'
    },
    portal: {
      type: 'string',
      description: 'Filter by portal sys_id'
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
      description: 'Maximum number of results to return (default: 25, max: 100)'
    }
  }
};

/**
 * JSON Schema for get_page tool parameters
 * 
 * Requires an identifier (sys_id or page id) to retrieve a specific page.
 */
export const getPageSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Page sys_id or page id'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_pages tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listRecentPagesSchema: JSONSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return (default: 25, max: 100)'
    }
  }
};

/**
 * JSON Schema for create_page tool parameters
 * 
 * Requires title and id. Supports optional public, portal, roles, and description.
 */
export const createPageSchema: JSONSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Page title'
    },
    id: {
      type: 'string',
      description: 'URL suffix'
    },
    public: {
      type: 'boolean',
      default: false,
      description: 'Public visibility (optional, defaults to false)'
    },
    portal: {
      type: 'string',
      description: 'Portal sys_id (optional)'
    },
    roles: {
      type: 'array',
      items: { type: 'string' },
      description: 'Role sys_ids (optional)'
    },
    description: {
      type: 'string',
      description: 'Description (optional)'
    }
  },
  required: ['title', 'id']
};

/**
 * JSON Schema for update_page tool parameters
 * 
 * Requires sys_id and at least one field to update.
 */
export const updatePageSchema: JSONSchema = {
  type: 'object',
  properties: {
    sys_id: {
      type: 'string',
      description: 'Page sys_id'
    },
    title: {
      type: 'string',
      description: 'Page title'
    },
    id: {
      type: 'string',
      description: 'URL suffix'
    },
    public: {
      type: 'boolean',
      description: 'Public visibility'
    },
    portal: {
      type: 'string',
      description: 'Portal sys_id'
    },
    roles: {
      type: 'array',
      items: { type: 'string' },
      description: 'Role sys_ids'
    },
    description: {
      type: 'string',
      description: 'Description'
    }
  },
  required: ['sys_id']
};

/**
 * JSON Schema for get_widgets_by_page tool parameters
 * 
 * Requires page sys_id.
 */
export const getWidgetsByPageSchema: JSONSchema = {
  type: 'object',
  properties: {
    sys_id: {
      type: 'string',
      description: 'Page sys_id'
    }
  },
  required: ['sys_id']
};

/**
 * JSON Schema for query_portals tool parameters
 * 
 * Supports filtering by title, url_suffix, custom query, and limit.
 */
export const queryPortalsSchema: JSONSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'Filter by title (partial match, case-insensitive)'
    },
    url_suffix: {
      type: 'string',
      description: 'Filter by url_suffix (exact match)'
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
      description: 'Maximum number of results to return (default: 25, max: 100)'
    }
  }
};

/**
 * JSON Schema for get_portal tool parameters
 * 
 * Requires an identifier (sys_id or url_suffix) to retrieve a specific portal.
 */
export const getPortalSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Portal sys_id or url_suffix'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_portals tool parameters
 * 
 * Supports an optional limit parameter to control the number of results.
 */
export const listPortalsSchema: JSONSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return (default: 25, max: 100)'
    }
  }
};

/**
 * JSON Schema for query_widget_instances tool parameters
 * 
 * Supports filtering by page, widget, custom query, and limit.
 */
export const queryWidgetInstancesSchema: JSONSchema = {
  type: 'object',
  properties: {
    page: {
      type: 'string',
      description: 'Filter by page sys_id'
    },
    widget: {
      type: 'string',
      description: 'Filter by widget sys_id'
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
      description: 'Maximum number of results to return (default: 25, max: 100)'
    }
  }
};

/**
 * JSON Schema for get_widget_instance tool parameters
 * 
 * Requires an identifier (sys_id) to retrieve a specific widget instance.
 */
export const getWidgetInstanceSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Widget instance sys_id'
    }
  },
  required: ['identifier']
};
