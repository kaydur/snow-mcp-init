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
