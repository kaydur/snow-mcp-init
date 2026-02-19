/**
 * MCP Tool Handlers for Widget Operations
 * 
 * Implements handlers for all Widget MCP tools, providing parameter validation,
 * service method invocation, and structured error handling.
 */

import { WidgetService } from '../service/WidgetService.js';
import { logger } from '../utils/logger.js';
import {
  CreateWidgetParams,
  CreateWidgetResponse,
  GetWidgetParams,
  GetWidgetResponse,
  UpdateWidgetParams,
  UpdateWidgetResponse,
  CloneWidgetParams,
  CloneWidgetResponse,
  QueryWidgetsParams,
  QueryWidgetsResponse,
  ListRecentWidgetsParams,
  ListRecentWidgetsResponse,
  ValidateWidgetParams,
  ValidateWidgetResponse,
  GetWidgetDependenciesParams,
  GetWidgetDependenciesResponse,
  GetPagesUsingWidgetParams,
  GetPagesUsingWidgetResponse
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
 * Handler for the create_widget tool
 */
export async function createWidgetHandler(
  params: CreateWidgetParams,
  service: WidgetService
): Promise<CreateWidgetResponse | ErrorResponse> {
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

    if (!params.id) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "id" is required',
          detail: 'The id parameter must be provided'
        }
      };
    }

    if (typeof params.id !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "id" must be a string',
          detail: `Received type: ${typeof params.id}`
        }
      };
    }

    // Validate optional parameters
    if (params.html !== undefined && typeof params.html !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "html" must be a string',
          detail: `Received type: ${typeof params.html}`
        }
      };
    }

    if (params.css !== undefined && typeof params.css !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "css" must be a string',
          detail: `Received type: ${typeof params.css}`
        }
      };
    }

    if (params.client_script !== undefined && typeof params.client_script !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "client_script" must be a string',
          detail: `Received type: ${typeof params.client_script}`
        }
      };
    }

    if (params.server_script !== undefined && typeof params.server_script !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "server_script" must be a string',
          detail: `Received type: ${typeof params.server_script}`
        }
      };
    }

    if (params.link !== undefined && typeof params.link !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "link" must be a string',
          detail: `Received type: ${typeof params.link}`
        }
      };
    }

    if (params.option_schema !== undefined && typeof params.option_schema !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "option_schema" must be a string',
          detail: `Received type: ${typeof params.option_schema}`
        }
      };
    }

    if (params.data_table !== undefined && typeof params.data_table !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "data_table" must be a string',
          detail: `Received type: ${typeof params.data_table}`
        }
      };
    }

    if (params.demo_data !== undefined && typeof params.demo_data !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "demo_data" must be a string',
          detail: `Received type: ${typeof params.demo_data}`
        }
      };
    }

    if (params.public !== undefined && typeof params.public !== 'boolean') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "public" must be a boolean',
          detail: `Received type: ${typeof params.public}`
        }
      };
    }

    if (params.category !== undefined && typeof params.category !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "category" must be a string',
          detail: `Received type: ${typeof params.category}`
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

    // Call service to create widget
    const sysId = await service.createWidget(params);

    // Return success response
    return {
      sys_id: sysId,
      message: `Widget '${params.name}' created successfully`
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
        message: 'An unexpected error occurred while creating widget',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the get_widget tool
 */
export async function getWidgetHandler(
  params: GetWidgetParams,
  service: WidgetService
): Promise<GetWidgetResponse | ErrorResponse> {
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

    // Call service to get widget
    const widget = await service.getWidget(params.identifier);

    // Return response with found flag
    if (widget === null) {
      return {
        widget: null,
        found: false
      };
    }

    return {
      widget: widget,
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
        message: 'An unexpected error occurred while retrieving widget',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the update_widget tool
 */
export async function updateWidgetHandler(
  params: UpdateWidgetParams,
  service: WidgetService
): Promise<UpdateWidgetResponse | ErrorResponse> {
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
    if (params.id !== undefined) updates.id = params.id;
    if (params.html !== undefined) updates.html = params.html;
    if (params.css !== undefined) updates.css = params.css;
    if (params.client_script !== undefined) updates.client_script = params.client_script;
    if (params.server_script !== undefined) updates.server_script = params.server_script;
    if (params.link !== undefined) updates.link = params.link;
    if (params.option_schema !== undefined) updates.option_schema = params.option_schema;
    if (params.data_table !== undefined) updates.data_table = params.data_table;
    if (params.demo_data !== undefined) updates.demo_data = params.demo_data;
    if (params.public !== undefined) updates.public = params.public;
    if (params.category !== undefined) updates.category = params.category;
    if (params.description !== undefined) updates.description = params.description;

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

    if (updates.id !== undefined && typeof updates.id !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "id" must be a string',
          detail: `Received type: ${typeof updates.id}`
        }
      };
    }

    if (updates.html !== undefined && typeof updates.html !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "html" must be a string',
          detail: `Received type: ${typeof updates.html}`
        }
      };
    }

    if (updates.css !== undefined && typeof updates.css !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "css" must be a string',
          detail: `Received type: ${typeof updates.css}`
        }
      };
    }

    if (updates.client_script !== undefined && typeof updates.client_script !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "client_script" must be a string',
          detail: `Received type: ${typeof updates.client_script}`
        }
      };
    }

    if (updates.server_script !== undefined && typeof updates.server_script !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "server_script" must be a string',
          detail: `Received type: ${typeof updates.server_script}`
        }
      };
    }

    if (updates.link !== undefined && typeof updates.link !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "link" must be a string',
          detail: `Received type: ${typeof updates.link}`
        }
      };
    }

    if (updates.option_schema !== undefined && typeof updates.option_schema !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "option_schema" must be a string',
          detail: `Received type: ${typeof updates.option_schema}`
        }
      };
    }

    if (updates.data_table !== undefined && typeof updates.data_table !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "data_table" must be a string',
          detail: `Received type: ${typeof updates.data_table}`
        }
      };
    }

    if (updates.demo_data !== undefined && typeof updates.demo_data !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "demo_data" must be a string',
          detail: `Received type: ${typeof updates.demo_data}`
        }
      };
    }

    if (updates.public !== undefined && typeof updates.public !== 'boolean') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "public" must be a boolean',
          detail: `Received type: ${typeof updates.public}`
        }
      };
    }

    if (updates.category !== undefined && typeof updates.category !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "category" must be a string',
          detail: `Received type: ${typeof updates.category}`
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

    // Call service to update widget
    const sysId = await service.updateWidget(params.sys_id, updates);

    // Return success response
    return {
      sys_id: sysId,
      message: 'Widget updated successfully'
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
        message: 'An unexpected error occurred while updating widget',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the clone_widget tool
 */
export async function cloneWidgetHandler(
  params: CloneWidgetParams,
  service: WidgetService
): Promise<CloneWidgetResponse | ErrorResponse> {
  try {
    // Validate required parameters
    if (!params.source_sys_id) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "source_sys_id" is required',
          detail: 'The source_sys_id parameter must be provided'
        }
      };
    }

    if (typeof params.source_sys_id !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "source_sys_id" must be a string',
          detail: `Received type: ${typeof params.source_sys_id}`
        }
      };
    }

    if (!params.new_id) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "new_id" is required',
          detail: 'The new_id parameter must be provided'
        }
      };
    }

    if (typeof params.new_id !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "new_id" must be a string',
          detail: `Received type: ${typeof params.new_id}`
        }
      };
    }

    if (!params.new_name) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "new_name" is required',
          detail: 'The new_name parameter must be provided'
        }
      };
    }

    if (typeof params.new_name !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "new_name" must be a string',
          detail: `Received type: ${typeof params.new_name}`
        }
      };
    }

    // Call service to clone widget
    const sysId = await service.cloneWidget(params.source_sys_id, params.new_id, params.new_name);

    // Return success response
    return {
      sys_id: sysId,
      message: `Widget cloned successfully as '${params.new_name}'`
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
        message: 'An unexpected error occurred while cloning widget',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the query_widgets tool
 */
export async function queryWidgetsHandler(
  params: QueryWidgetsParams,
  service: WidgetService
): Promise<QueryWidgetsResponse | ErrorResponse> {
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

    if (params.id !== undefined && typeof params.id !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "id" must be a string',
          detail: `Received type: ${typeof params.id}`
        }
      };
    }

    if (params.public !== undefined && typeof params.public !== 'boolean') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "public" must be a boolean',
          detail: `Received type: ${typeof params.public}`
        }
      };
    }

    if (params.category !== undefined && typeof params.category !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "category" must be a string',
          detail: `Received type: ${typeof params.category}`
        }
      };
    }

    if (params.data_table !== undefined && typeof params.data_table !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "data_table" must be a string',
          detail: `Received type: ${typeof params.data_table}`
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

    // Call service to query widgets
    const widgets = await service.queryWidgets(params);

    // Return formatted response
    return {
      widgets: widgets,
      count: widgets.length
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
        message: 'An unexpected error occurred while querying widgets',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the list_recent_widgets tool
 */
export async function listRecentWidgetsHandler(
  params: ListRecentWidgetsParams,
  service: WidgetService
): Promise<ListRecentWidgetsResponse | ErrorResponse> {
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

    // Call service to list recent widgets
    const widgets = await service.listRecentWidgets(limit);

    // Return formatted response
    return {
      widgets: widgets,
      count: widgets.length
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
        message: 'An unexpected error occurred while listing recent widgets',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the validate_widget tool
 */
export async function validateWidgetHandler(
  params: ValidateWidgetParams,
  service: WidgetService
): Promise<ValidateWidgetResponse | ErrorResponse> {
  try {
    // Validate parameter types
    if (params.html !== undefined && typeof params.html !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "html" must be a string',
          detail: `Received type: ${typeof params.html}`
        }
      };
    }

    if (params.css !== undefined && typeof params.css !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "css" must be a string',
          detail: `Received type: ${typeof params.css}`
        }
      };
    }

    if (params.client_script !== undefined && typeof params.client_script !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "client_script" must be a string',
          detail: `Received type: ${typeof params.client_script}`
        }
      };
    }

    if (params.server_script !== undefined && typeof params.server_script !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "server_script" must be a string',
          detail: `Received type: ${typeof params.server_script}`
        }
      };
    }

    if (params.link !== undefined && typeof params.link !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "link" must be a string',
          detail: `Received type: ${typeof params.link}`
        }
      };
    }

    if (params.option_schema !== undefined && typeof params.option_schema !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "option_schema" must be a string',
          detail: `Received type: ${typeof params.option_schema}`
        }
      };
    }

    if (params.demo_data !== undefined && typeof params.demo_data !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "demo_data" must be a string',
          detail: `Received type: ${typeof params.demo_data}`
        }
      };
    }

    // Call service to validate widget
    const result = await service.validateWidget(params);

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
        message: 'An unexpected error occurred while validating widget',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the get_widget_dependencies tool
 */
export async function getWidgetDependenciesHandler(
  params: GetWidgetDependenciesParams,
  service: WidgetService
): Promise<GetWidgetDependenciesResponse | ErrorResponse> {
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

    // Call service to get widget dependencies
    const dependencies = await service.getWidgetDependencies(params.sys_id);

    // Return formatted response
    return {
      dependencies: dependencies,
      count: dependencies.length
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
        message: 'An unexpected error occurred while retrieving widget dependencies',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the get_pages_using_widget tool
 */
export async function getPagesUsingWidgetHandler(
  params: GetPagesUsingWidgetParams,
  service: WidgetService
): Promise<GetPagesUsingWidgetResponse | ErrorResponse> {
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

    // Call service to get pages using widget
    const pages = await service.getPagesUsingWidget(params.sys_id);

    // Return formatted response
    return {
      pages: pages,
      count: pages.length
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
        message: 'An unexpected error occurred while retrieving pages using widget',
        detail: error?.message || String(error)
      }
    };
  }
}
