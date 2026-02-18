/**
 * MCP Tool Handlers
 * 
 * Implements handlers for all MCP tools, providing parameter validation,
 * service method invocation, and structured error handling.
 */

import { IncidentService } from '../service/IncidentService.js';
import { UserService } from '../service/UserService.js';
import { GroupService } from '../service/GroupService.js';
import { GroupMemberService } from '../service/GroupMemberService.js';
import { TaskService } from '../service/TaskService.js';
import { StoryService } from '../service/StoryService.js';
import { ScrumTaskService } from '../service/ScrumTaskService.js';
import { ChangeRequestService } from '../service/ChangeRequestService.js';
import { GlideQueryExecutor } from '../service/GlideQueryExecutor.js';
import { GlideQueryGenerator } from '../service/GlideQueryGenerator.js';
import { logger } from '../utils/logger.js';
import {
  QueryIncidentsParams,
  QueryIncidentsResponse,
  GetIncidentParams,
  GetIncidentResponse,
  ListRecentParams,
  ListRecentResponse,
  ExecuteGlideQueryParams,
  ExecuteGlideQueryResponse,
  GenerateGlideQueryParams,
  GenerateGlideQueryResponse,
  TestGlideQueryParams,
  TestGlideQueryResponse,
  QueryUsersParams,
  QueryUsersResponse,
  GetUserParams,
  GetUserResponse,
  ListRecentUsersParams,
  ListRecentUsersResponse,
  QueryGroupsParams,
  QueryGroupsResponse,
  GetGroupParams,
  GetGroupResponse,
  ListRecentGroupsParams,
  ListRecentGroupsResponse,
  QueryGroupMembersParams,
  QueryGroupMembersResponse,
  GetGroupMemberParams,
  GetGroupMemberResponse,
  ListRecentGroupMembersParams,
  ListRecentGroupMembersResponse,
  QueryTasksParams,
  QueryTasksResponse,
  GetTaskParams,
  GetTaskResponse,
  ListRecentTasksParams,
  ListRecentTasksResponse,
  QueryStoriesParams,
  QueryStoriesResponse,
  GetStoryParams,
  GetStoryResponse,
  ListRecentStoriesParams,
  ListRecentStoriesResponse,
  QueryScrumTasksParams,
  QueryScrumTasksResponse,
  GetScrumTaskParams,
  GetScrumTaskResponse,
  ListRecentScrumTasksParams,
  ListRecentScrumTasksResponse,
  QueryChangeRequestsParams,
  QueryChangeRequestsResponse,
  GetChangeRequestParams,
  GetChangeRequestResponse,
  ListRecentChangeRequestsParams,
  ListRecentChangeRequestsResponse
} from '../types/tools.js';

/**
 * Error response structure for tool handlers
 */
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    detail?: string;
  };
}

/**
 * Handler for the query_incidents tool
 * 
 * Validates parameters, queries incidents using the IncidentService,
 * and returns formatted results with incident array and count.
 * 
 * @param params - Query parameters including filters
 * @param incidentService - IncidentService instance for querying
 * @returns Promise resolving to QueryIncidentsResponse or ErrorResponse
 */
export async function queryIncidentsHandler(
  params: QueryIncidentsParams,
  incidentService: IncidentService
): Promise<QueryIncidentsResponse | ErrorResponse> {
  try {
    // Validate parameter types
    if (params.state !== undefined && !Array.isArray(params.state)) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "state" must be an array',
          detail: `Received type: ${typeof params.state}`
        }
      };
    }

    if (params.priority !== undefined && !Array.isArray(params.priority)) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "priority" must be an array',
          detail: `Received type: ${typeof params.priority}`
        }
      };
    }

    if (params.assigned_to !== undefined && typeof params.assigned_to !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "assigned_to" must be a string',
          detail: `Received type: ${typeof params.assigned_to}`
        }
      };
    }

    if (params.assignment_group !== undefined && typeof params.assignment_group !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "assignment_group" must be a string',
          detail: `Received type: ${typeof params.assignment_group}`
        }
      };
    }

    if (params.query !== undefined && typeof params.query !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "query" must be a string',
          detail: `Received type: ${typeof params.query}`
        }
      };
    }

    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Parameter "limit" must be an integer',
            detail: `Received: ${params.limit}`
          }
        };
      }

      if (params.limit < 1 || params.limit > 100) {
        return {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Parameter "limit" must be between 1 and 100',
            detail: `Received: ${params.limit}`
          }
        };
      }
    }

    // Validate priority array values
    if (params.priority !== undefined) {
      for (const priority of params.priority) {
        if (typeof priority !== 'number' || !Number.isInteger(priority)) {
          return {
            error: {
              code: 'INVALID_PARAMETER',
              message: 'Priority values must be integers',
              detail: `Received: ${priority}`
            }
          };
        }
      }
    }

    // Validate state array values
    if (params.state !== undefined) {
      for (const state of params.state) {
        if (typeof state !== 'string') {
          return {
            error: {
              code: 'INVALID_PARAMETER',
              message: 'State values must be strings',
              detail: `Received: ${state}`
            }
          };
        }
      }
    }

    // Call incidentService.queryIncidents() with filters
    const incidents = await incidentService.queryIncidents({
      state: params.state,
      priority: params.priority,
      assigned_to: params.assigned_to,
      assignment_group: params.assignment_group,
      query: params.query,
      limit: params.limit
    });

    // Format results as QueryIncidentsResponse
    return {
      incidents,
      count: incidents.length
    };

  } catch (error: any) {
    // Handle errors and return structured error responses
    if (error?.code) {
      // Error already has structured format (from validation or service)
      return {
        error: {
          code: error.code,
          message: error.message || 'An error occurred',
          detail: error.detail
        }
      };
    }

    // Unexpected error
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while querying incidents',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the get_incident tool
 * 
 * Validates the identifier parameter, retrieves the incident using the IncidentService,
 * and returns the incident details with a found flag. Returns found: false for non-existent incidents.
 * 
 * @param params - Parameters including the incident identifier (sys_id or number)
 * @param incidentService - IncidentService instance for retrieval
 * @returns Promise resolving to GetIncidentResponse or ErrorResponse
 */
export async function getIncidentHandler(
  params: GetIncidentParams,
  incidentService: IncidentService
): Promise<GetIncidentResponse | ErrorResponse> {
  try {
    // Validate identifier parameter
    if (!params.identifier) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "identifier" is required',
          detail: 'The identifier parameter must be provided'
        }
      };
    }

    if (typeof params.identifier !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "identifier" must be a string',
          detail: `Received type: ${typeof params.identifier}`
        }
      };
    }

    if (params.identifier.trim() === '') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "identifier" cannot be empty',
          detail: 'The identifier must be a non-empty string'
        }
      };
    }

    // Call incidentService.getIncident() with identifier
    const incident = await incidentService.getIncident(params.identifier);

    // Return GetIncidentResponse with incident and found flag
    if (incident === null) {
      // Handle not found case (return found: false)
      return {
        incident: null,
        found: false
      };
    }

    return {
      incident,
      found: true
    };

  } catch (error: any) {
    // Handle errors and return structured error responses
    if (error?.code) {
      // Error already has structured format (from validation or service)
      return {
        error: {
          code: error.code,
          message: error.message || 'An error occurred',
          detail: error.detail
        }
      };
    }

    // Unexpected error
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while retrieving incident',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the list_recent_incidents tool
 * 
 * Validates the limit parameter, retrieves recent incidents using the IncidentService,
 * and returns formatted results with incident array and count.
 * 
 * @param params - Parameters including optional limit (default 25, max 100)
 * @param incidentService - IncidentService instance for listing
 * @returns Promise resolving to ListRecentResponse or ErrorResponse
 */
export async function listRecentIncidentsHandler(
  params: ListRecentParams,
  incidentService: IncidentService
): Promise<ListRecentResponse | ErrorResponse> {
  try {
    // Validate limit parameter
    let limit = 25; // Default limit

    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Parameter "limit" must be an integer',
            detail: `Received: ${params.limit}`
          }
        };
      }

      if (params.limit < 1 || params.limit > 100) {
        return {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Parameter "limit" must be between 1 and 100',
            detail: `Received: ${params.limit}`
          }
        };
      }

      limit = params.limit;
    }

    // Call incidentService.listRecentIncidents() with limit
    const incidents = await incidentService.listRecentIncidents(limit);

    // Format results as ListRecentResponse with incidents array and count
    return {
      incidents,
      count: incidents.length
    };

  } catch (error: any) {
    // Handle errors and return structured error responses
    if (error?.code) {
      // Error already has structured format (from validation or service)
      return {
        error: {
          code: error.code,
          message: error.message || 'An error occurred',
          detail: error.detail
        }
      };
    }

    // Unexpected error
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while listing recent incidents',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the execute_glidequery tool
 * 
 * Validates parameters, executes GlideQuery script using the GlideQueryExecutor,
 * and returns formatted results with execution details.
 * 
 * @param params - Execution parameters including script and optional timeout
 * @param executor - GlideQueryExecutor instance for script execution
 * @returns Promise resolving to ExecuteGlideQueryResponse or ErrorResponse
 */
export async function executeGlideQueryHandler(
  params: ExecuteGlideQueryParams,
  executor: GlideQueryExecutor
): Promise<ExecuteGlideQueryResponse | ErrorResponse> {
  try {
    // Validate script parameter
    if (!params.script) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" is required',
          detail: 'The script parameter must be provided'
        }
      };
    }

    if (typeof params.script !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" must be a string',
          detail: `Received type: ${typeof params.script}`
        }
      };
    }

    if (params.script.trim() === '') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" cannot be empty',
          detail: 'The script must be a non-empty string'
        }
      };
    }

    // Validate timeout parameter if provided
    if (params.timeout !== undefined) {
      if (typeof params.timeout !== 'number' || !Number.isInteger(params.timeout)) {
        return {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Parameter "timeout" must be an integer',
            detail: `Received: ${params.timeout}`
          }
        };
      }

      if (params.timeout < 1000 || params.timeout > 60000) {
        return {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Parameter "timeout" must be between 1000 and 60000 milliseconds',
            detail: `Received: ${params.timeout}`
          }
        };
      }
    }

    // Execute script using GlideQueryExecutor
    const result = await executor.execute(params.script, {
      timeout: params.timeout
    });

    // Format response as ExecuteGlideQueryResponse
    return {
      success: result.success,
      result: result.data,
      logs: result.logs,
      error: result.error,
      executionTime: result.executionTime,
      recordCount: result.recordCount
    };

  } catch (error: any) {
    // Handle errors and return structured error responses
    if (error?.code) {
      return {
        error: {
          code: error.code,
          message: error.message || 'An error occurred',
          detail: error.detail
        }
      };
    }

    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while executing GlideQuery script',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the generate_glidequery tool
 * 
 * Validates parameters, generates GlideQuery code using the GlideQueryGenerator,
 * and returns the generated code with explanation and warnings.
 * 
 * @param params - Generation parameters including description and options
 * @param generator - GlideQueryGenerator instance for code generation
 * @returns GenerateGlideQueryResponse or ErrorResponse
 */
export function generateGlideQueryHandler(
  params: GenerateGlideQueryParams,
  generator: GlideQueryGenerator
): GenerateGlideQueryResponse | ErrorResponse {
  const startTime = Date.now();

  // Log generation start
  logger.info('glidequery_generate', 'Starting GlideQuery code generation', {
    params: {
      descriptionLength: params.description?.length || 0,
      table: params.table,
      includeComments: params.includeComments
    }
  });

  try {
    // Validate description parameter
    if (!params.description) {
      const duration = Date.now() - startTime;
      logger.warn('glidequery_generate', 'Code generation failed: missing description', {
        error: { code: 'INVALID_PARAMETER', message: 'Parameter "description" is required' },
        duration
      });
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "description" is required',
          detail: 'The description parameter must be provided'
        }
      };
    }

    if (typeof params.description !== 'string') {
      const duration = Date.now() - startTime;
      logger.warn('glidequery_generate', 'Code generation failed: invalid description type', {
        error: { code: 'INVALID_PARAMETER', message: 'Parameter "description" must be a string' },
        duration
      });
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "description" must be a string',
          detail: `Received type: ${typeof params.description}`
        }
      };
    }

    if (params.description.trim() === '') {
      const duration = Date.now() - startTime;
      logger.warn('glidequery_generate', 'Code generation failed: empty description', {
        error: { code: 'INVALID_PARAMETER', message: 'Parameter "description" cannot be empty' },
        duration
      });
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "description" cannot be empty',
          detail: 'The description must be a non-empty string'
        }
      };
    }

    // Validate table parameter if provided
    if (params.table !== undefined && typeof params.table !== 'string') {
      const duration = Date.now() - startTime;
      logger.warn('glidequery_generate', 'Code generation failed: invalid table type', {
        error: { code: 'INVALID_PARAMETER', message: 'Parameter "table" must be a string' },
        duration
      });
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "table" must be a string',
          detail: `Received type: ${typeof params.table}`
        }
      };
    }

    // Validate includeComments parameter if provided
    if (params.includeComments !== undefined && typeof params.includeComments !== 'boolean') {
      const duration = Date.now() - startTime;
      logger.warn('glidequery_generate', 'Code generation failed: invalid includeComments type', {
        error: { code: 'INVALID_PARAMETER', message: 'Parameter "includeComments" must be a boolean' },
        duration
      });
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "includeComments" must be a boolean',
          detail: `Received type: ${typeof params.includeComments}`
        }
      };
    }

    // Generate code using GlideQueryGenerator
    const result = generator.generate({
      description: params.description,
      table: params.table,
      includeComments: params.includeComments
    });

    // Log successful generation
    const duration = Date.now() - startTime;
    logger.info('glidequery_generate', 'Code generation completed successfully', {
      result: {
        codeLength: result.code.length,
        hasExplanation: !!result.explanation,
        warningCount: result.warnings?.length || 0
      },
      duration
    });

    // Return GenerateGlideQueryResponse
    return {
      code: result.code,
      explanation: result.explanation,
      warnings: result.warnings
    };

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Log generation error
    logger.error('glidequery_generate', 'Code generation failed with exception', {
      error: { message: error.message || String(error), stack: error.stack },
      duration
    });

    // Handle errors and return structured error responses
    if (error?.code) {
      return {
        error: {
          code: error.code,
          message: error.message || 'An error occurred',
          detail: error.detail
        }
      };
    }

    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while generating GlideQuery code',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the test_glidequery tool
 * 
 * Validates parameters, executes GlideQuery script in test mode using the GlideQueryExecutor,
 * and returns formatted results with warnings and truncation information.
 * 
 * @param params - Test parameters including script and optional maxResults
 * @param executor - GlideQueryExecutor instance for script execution
 * @returns Promise resolving to TestGlideQueryResponse or ErrorResponse
 */
export async function testGlideQueryHandler(
  params: TestGlideQueryParams,
  executor: GlideQueryExecutor
): Promise<TestGlideQueryResponse | ErrorResponse> {
  try {
    // Validate script parameter
    if (!params.script) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" is required',
          detail: 'The script parameter must be provided'
        }
      };
    }

    if (typeof params.script !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" must be a string',
          detail: `Received type: ${typeof params.script}`
        }
      };
    }

    if (params.script.trim() === '') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" cannot be empty',
          detail: 'The script must be a non-empty string'
        }
      };
    }

    // Validate maxResults parameter if provided
    if (params.maxResults !== undefined) {
      if (typeof params.maxResults !== 'number' || !Number.isInteger(params.maxResults)) {
        return {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Parameter "maxResults" must be an integer',
            detail: `Received: ${params.maxResults}`
          }
        };
      }

      if (params.maxResults < 1 || params.maxResults > 1000) {
        return {
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Parameter "maxResults" must be between 1 and 1000',
            detail: `Received: ${params.maxResults}`
          }
        };
      }
    }

    // Execute script in test mode using GlideQueryExecutor
    const result = await executor.execute(params.script, {
      testMode: true,
      maxResults: params.maxResults
    });

    // Format response as TestGlideQueryResponse
    // Convert logs to warnings for test mode
    const warnings = result.logs || [];

    return {
      success: result.success,
      result: result.data,
      warnings: warnings.length > 0 ? warnings : undefined,
      error: result.error,
      executionTime: result.executionTime,
      recordCount: result.recordCount,
      truncated: result.truncated
    };

  } catch (error: any) {
    // Handle errors and return structured error responses
    if (error?.code) {
      return {
        error: {
          code: error.code,
          message: error.message || 'An error occurred',
          detail: error.detail
        }
      };
    }

    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred while testing GlideQuery script',
        detail: error?.message || String(error)
      }
    };
  }
}
