/**
 * MCP Tool Handlers for Script Include Operations
 * 
 * Implements handlers for all Script Include MCP tools, providing parameter validation,
 * service method invocation, and structured error handling.
 */

import { ScriptIncludeService } from '../service/ScriptIncludeService.js';
import { logger } from '../utils/logger.js';
import {
  CreateScriptIncludeParams,
  CreateScriptIncludeResponse,
  GetScriptIncludeParams,
  GetScriptIncludeResponse,
  UpdateScriptIncludeParams,
  UpdateScriptIncludeResponse,
  DeleteScriptIncludeParams,
  DeleteScriptIncludeResponse,
  QueryScriptIncludesParams,
  QueryScriptIncludesResponse,
  ListRecentScriptIncludesParams,
  ListRecentScriptIncludesResponse,
  ValidateScriptIncludeParams,
  ValidateScriptIncludeResponse,
  TestScriptIncludeParams,
  TestScriptIncludeResponse
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
 * Handler for the create_script_include tool
 * 
 * Validates parameters, creates a Script Include using the ScriptIncludeService,
 * and returns the sys_id with a success message.
 * 
 * @param params - Creation parameters including name, api_name, and script
 * @param service - ScriptIncludeService instance for creation
 * @returns Promise resolving to CreateScriptIncludeResponse or ErrorResponse
 */
export async function createScriptIncludeHandler(
  params: CreateScriptIncludeParams,
  service: ScriptIncludeService
): Promise<CreateScriptIncludeResponse | ErrorResponse> {
  try {
    // Validate required parameters
    if (!params.name) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "name" is required',
          detail: 'The name parameter must be provided'
        }
      };
    }

    if (typeof params.name !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "name" must be a string',
          detail: `Received type: ${typeof params.name}`
        }
      };
    }

    if (!params.api_name) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "api_name" is required',
          detail: 'The api_name parameter must be provided'
        }
      };
    }

    if (typeof params.api_name !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "api_name" must be a string',
          detail: `Received type: ${typeof params.api_name}`
        }
      };
    }

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

    // Validate optional parameters
    if (params.active !== undefined && typeof params.active !== 'boolean') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "active" must be a boolean',
          detail: `Received type: ${typeof params.active}`
        }
      };
    }

    if (params.access !== undefined && typeof params.access !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "access" must be a string',
          detail: `Received type: ${typeof params.access}`
        }
      };
    }

    if (params.description !== undefined && typeof params.description !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "description" must be a string',
          detail: `Received type: ${typeof params.description}`
        }
      };
    }

    if (params.client_callable !== undefined && typeof params.client_callable !== 'boolean') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "client_callable" must be a boolean',
          detail: `Received type: ${typeof params.client_callable}`
        }
      };
    }

    // Call service to create Script Include
    const sysId = await service.createScriptInclude(params);

    // Return success response
    return {
      sys_id: sysId,
      message: `Script Include '${params.name}' created successfully`
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
        message: 'An unexpected error occurred while creating Script Include',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the get_script_include tool
 * 
 * Validates the identifier parameter, retrieves the Script Include using the ScriptIncludeService,
 * and returns the Script Include details with a found flag.
 * 
 * @param params - Parameters including the Script Include identifier (sys_id or api_name)
 * @param service - ScriptIncludeService instance for retrieval
 * @returns Promise resolving to GetScriptIncludeResponse or ErrorResponse
 */
export async function getScriptIncludeHandler(
  params: GetScriptIncludeParams,
  service: ScriptIncludeService
): Promise<GetScriptIncludeResponse | ErrorResponse> {
  try {
    // Validate identifier parameter
    if (!params.identifier || typeof params.identifier !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "identifier" is required',
          detail: 'The identifier parameter must be provided'
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

    // Call service to get Script Include
    const scriptInclude = await service.getScriptInclude(params.identifier);

    // Return response with found flag
    if (scriptInclude === null) {
      return {
        script_include: null,
        found: false
      };
    }

    return {
      script_include: scriptInclude,
      found: true
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
        message: 'An unexpected error occurred while retrieving Script Include',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the update_script_include tool
 * 
 * Validates parameters, updates a Script Include using the ScriptIncludeService,
 * and returns the sys_id with a success message.
 * 
 * @param params - Update parameters including sys_id and fields to update
 * @param service - ScriptIncludeService instance for updating
 * @returns Promise resolving to UpdateScriptIncludeResponse or ErrorResponse
 */
export async function updateScriptIncludeHandler(
  params: UpdateScriptIncludeParams,
  service: ScriptIncludeService
): Promise<UpdateScriptIncludeResponse | ErrorResponse> {
  try {
    // Validate sys_id parameter
    if (!params.sys_id) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "sys_id" is required',
          detail: 'The sys_id parameter must be provided'
        }
      };
    }

    if (typeof params.sys_id !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "sys_id" must be a string',
          detail: `Received type: ${typeof params.sys_id}`
        }
      };
    }

    // Extract update fields
    const updates: any = {};
    if (params.name !== undefined) updates.name = params.name;
    if (params.api_name !== undefined) updates.api_name = params.api_name;
    if (params.script !== undefined) updates.script = params.script;
    if (params.active !== undefined) updates.active = params.active;
    if (params.access !== undefined) updates.access = params.access;
    if (params.description !== undefined) updates.description = params.description;
    if (params.client_callable !== undefined) updates.client_callable = params.client_callable;

    // Validate at least one update field is provided
    if (Object.keys(updates).length === 0) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'No update fields provided',
          detail: 'At least one field must be provided for update'
        }
      };
    }

    // Validate update field types
    if (updates.name !== undefined && typeof updates.name !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "name" must be a string',
          detail: `Received type: ${typeof updates.name}`
        }
      };
    }

    if (updates.api_name !== undefined && typeof updates.api_name !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "api_name" must be a string',
          detail: `Received type: ${typeof updates.api_name}`
        }
      };
    }

    if (updates.script !== undefined && typeof updates.script !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" must be a string',
          detail: `Received type: ${typeof updates.script}`
        }
      };
    }

    if (updates.active !== undefined && typeof updates.active !== 'boolean') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "active" must be a boolean',
          detail: `Received type: ${typeof updates.active}`
        }
      };
    }

    if (updates.access !== undefined && typeof updates.access !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "access" must be a string',
          detail: `Received type: ${typeof updates.access}`
        }
      };
    }

    if (updates.description !== undefined && typeof updates.description !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "description" must be a string',
          detail: `Received type: ${typeof updates.description}`
        }
      };
    }

    if (updates.client_callable !== undefined && typeof updates.client_callable !== 'boolean') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "client_callable" must be a boolean',
          detail: `Received type: ${typeof updates.client_callable}`
        }
      };
    }

    // Call service to update Script Include
    const sysId = await service.updateScriptInclude(params.sys_id, updates);

    // Return success response
    return {
      sys_id: sysId,
      message: 'Script Include updated successfully'
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
        message: 'An unexpected error occurred while updating Script Include',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the delete_script_include tool
 * 
 * Validates the sys_id parameter, deletes the Script Include using the ScriptIncludeService,
 * and returns a success message.
 * 
 * @param params - Parameters including the Script Include sys_id
 * @param service - ScriptIncludeService instance for deletion
 * @returns Promise resolving to DeleteScriptIncludeResponse or ErrorResponse
 */
export async function deleteScriptIncludeHandler(
  params: DeleteScriptIncludeParams,
  service: ScriptIncludeService
): Promise<DeleteScriptIncludeResponse | ErrorResponse> {
  try {
    // Validate sys_id parameter
    if (!params.sys_id) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "sys_id" is required',
          detail: 'The sys_id parameter must be provided'
        }
      };
    }

    if (typeof params.sys_id !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "sys_id" must be a string',
          detail: `Received type: ${typeof params.sys_id}`
        }
      };
    }

    if (params.sys_id.trim() === '') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "sys_id" cannot be empty',
          detail: 'The sys_id must be a non-empty string'
        }
      };
    }

    // Call service to delete Script Include
    await service.deleteScriptInclude(params.sys_id);

    // Return success response
    return {
      success: true,
      message: 'Script Include deleted successfully'
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
        message: 'An unexpected error occurred while deleting Script Include',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the query_script_includes tool
 * 
 * Validates parameters, queries Script Includes using the ScriptIncludeService,
 * and returns formatted results with Script Include array and count.
 * 
 * @param params - Query parameters including filters
 * @param service - ScriptIncludeService instance for querying
 * @returns Promise resolving to QueryScriptIncludesResponse or ErrorResponse
 */
export async function queryScriptIncludesHandler(
  params: QueryScriptIncludesParams,
  service: ScriptIncludeService
): Promise<QueryScriptIncludesResponse | ErrorResponse> {
  try {
    // Validate parameter types
    if (params.name !== undefined && typeof params.name !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "name" must be a string',
          detail: `Received type: ${typeof params.name}`
        }
      };
    }

    if (params.api_name !== undefined && typeof params.api_name !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "api_name" must be a string',
          detail: `Received type: ${typeof params.api_name}`
        }
      };
    }

    if (params.active !== undefined && typeof params.active !== 'boolean') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "active" must be a boolean',
          detail: `Received type: ${typeof params.active}`
        }
      };
    }

    if (params.access !== undefined && typeof params.access !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "access" must be a string',
          detail: `Received type: ${typeof params.access}`
        }
      };
    }

    if (params.client_callable !== undefined && typeof params.client_callable !== 'boolean') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "client_callable" must be a boolean',
          detail: `Received type: ${typeof params.client_callable}`
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

    // Call service to query Script Includes
    const scriptIncludes = await service.queryScriptIncludes(params);

    // Return formatted response
    return {
      script_includes: scriptIncludes,
      count: scriptIncludes.length
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
        message: 'An unexpected error occurred while querying Script Includes',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the list_recent_script_includes tool
 * 
 * Validates the limit parameter, retrieves recent Script Includes using the ScriptIncludeService,
 * and returns formatted results with Script Include array and count.
 * 
 * @param params - Parameters including optional limit (default 25, max 100)
 * @param service - ScriptIncludeService instance for listing
 * @returns Promise resolving to ListRecentScriptIncludesResponse or ErrorResponse
 */
export async function listRecentScriptIncludesHandler(
  params: ListRecentScriptIncludesParams,
  service: ScriptIncludeService
): Promise<ListRecentScriptIncludesResponse | ErrorResponse> {
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

    // Call service to list recent Script Includes
    const scriptIncludes = await service.listRecentScriptIncludes(limit);

    // Return formatted response
    return {
      script_includes: scriptIncludes,
      count: scriptIncludes.length
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
        message: 'An unexpected error occurred while listing recent Script Includes',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the validate_script_include tool
 * 
 * Validates the script parameter, validates the JavaScript code using the ScriptIncludeService,
 * and returns validation results with warnings and errors.
 * 
 * @param params - Parameters including the script to validate
 * @param service - ScriptIncludeService instance for validation
 * @returns Promise resolving to ValidateScriptIncludeResponse or ErrorResponse
 */
export async function validateScriptIncludeHandler(
  params: ValidateScriptIncludeParams,
  service: ScriptIncludeService
): Promise<ValidateScriptIncludeResponse | ErrorResponse> {
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

    // Call service to validate script
    const result = await service.validateScript(params.script);

    // Return validation result
    return {
      valid: result.valid,
      warnings: result.warnings,
      errors: result.errors
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
        message: 'An unexpected error occurred while validating script',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the test_script_include tool
 * 
 * Validates parameters, tests a Script Include method using the ScriptIncludeService,
 * and returns test execution results.
 * 
 * @param params - Test parameters including sys_id, method_name, and parameters
 * @param service - ScriptIncludeService instance for testing
 * @returns Promise resolving to TestScriptIncludeResponse or ErrorResponse
 */
export async function testScriptIncludeHandler(
  params: TestScriptIncludeParams,
  service: ScriptIncludeService
): Promise<TestScriptIncludeResponse | ErrorResponse> {
  try {
    // Validate sys_id parameter
    if (!params.sys_id) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "sys_id" is required',
          detail: 'The sys_id parameter must be provided'
        }
      };
    }

    if (typeof params.sys_id !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "sys_id" must be a string',
          detail: `Received type: ${typeof params.sys_id}`
        }
      };
    }

    // Validate method_name parameter
    if (!params.method_name) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "method_name" is required',
          detail: 'The method_name parameter must be provided'
        }
      };
    }

    if (typeof params.method_name !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "method_name" must be a string',
          detail: `Received type: ${typeof params.method_name}`
        }
      };
    }

    // Validate optional parameters
    if (params.parameters !== undefined && typeof params.parameters !== 'object') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "parameters" must be an object',
          detail: `Received type: ${typeof params.parameters}`
        }
      };
    }

    if (params.initialize_params !== undefined && !Array.isArray(params.initialize_params)) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "initialize_params" must be an array',
          detail: `Received type: ${typeof params.initialize_params}`
        }
      };
    }

    // Call service to test Script Include
    const result = await service.testScriptInclude(params.sys_id, params.method_name, {
      method_name: params.method_name,
      parameters: params.parameters,
      initialize_params: params.initialize_params
    });

    // Return test result
    return {
      success: result.success,
      result: result.result,
      error: result.error,
      executionTime: result.executionTime,
      logs: result.logs
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
        message: 'An unexpected error occurred while testing Script Include',
        detail: error?.message || String(error)
      }
    };
  }
}
