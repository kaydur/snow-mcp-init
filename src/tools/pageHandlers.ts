/**
 * MCP Tool Handlers for Page Operations
 * 
 * Implements handlers for all Page MCP tools, providing parameter validation,
 * service method invocation, and structured error handling.
 */

import { PageService } from '../service/PageService.js';
import { logger } from '../utils/logger.js';
import {
  CreatePageParams,
  CreatePageResponse,
  GetPageParams,
  GetPageResponse,
  UpdatePageParams,
  UpdatePageResponse,
  QueryPagesParams,
  QueryPagesResponse,
  ListRecentPagesParams,
  ListRecentPagesResponse,
  GetWidgetsByPageParams,
  GetWidgetsByPageResponse
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
 * Handler for the create_page tool
 */
export async function createPageHandler(
  params: CreatePageParams,
  service: PageService
): Promise<CreatePageResponse | ErrorResponse> {
  try {
    // Validate required parameters
    if (!params.title) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "title" is required',
          detail: 'The title parameter must be provided'
        }
      };
    }

    if (typeof params.title !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "title" must be a string',
          detail: `Received type: ${typeof params.title}`
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
    if (params.public !== undefined && typeof params.public !== 'boolean') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "public" must be a boolean',
          detail: `Received type: ${typeof params.public}`
        }
      };
    }

    if (params.portal !== undefined && typeof params.portal !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "portal" must be a string',
          detail: `Received type: ${typeof params.portal}`
        }
      };
    }

    if (params.roles !== undefined && !Array.isArray(params.roles)) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "roles" must be an array',
          detail: `Received type: ${typeof params.roles}`
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

    // Call service to create page
    const sysId = await service.createPage(params);

    // Return success response
    return {
      sys_id: sysId,
      message: `Page '${params.title}' created successfully`
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
        message: 'An unexpected error occurred while creating page',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the get_page tool
 */
export async function getPageHandler(
  params: GetPageParams,
  service: PageService
): Promise<GetPageResponse | ErrorResponse> {
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

    // Call service to get page
    const page = await service.getPage(params.identifier);

    // Return response with found flag
    if (page === null) {
      return {
        page: null,
        found: false
      };
    }

    return {
      page: page,
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
        message: 'An unexpected error occurred while retrieving page',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the update_page tool
 */
export async function updatePageHandler(
  params: UpdatePageParams,
  service: PageService
): Promise<UpdatePageResponse | ErrorResponse> {
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
    if (params.title !== undefined) updates.title = params.title;
    if (params.id !== undefined) updates.id = params.id;
    if (params.public !== undefined) updates.public = params.public;
    if (params.portal !== undefined) updates.portal = params.portal;
    if (params.roles !== undefined) updates.roles = params.roles;
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
    if (updates.title !== undefined && typeof updates.title !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "title" must be a string',
          detail: `Received type: ${typeof updates.title}`
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

    if (updates.public !== undefined && typeof updates.public !== 'boolean') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "public" must be a boolean',
          detail: `Received type: ${typeof updates.public}`
        }
      };
    }

    if (updates.portal !== undefined && typeof updates.portal !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "portal" must be a string',
          detail: `Received type: ${typeof updates.portal}`
        }
      };
    }

    if (updates.roles !== undefined && !Array.isArray(updates.roles)) {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "roles" must be an array',
          detail: `Received type: ${typeof updates.roles}`
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

    // Call service to update page
    const sysId = await service.updatePage(params.sys_id, updates);

    // Return success response
    return {
      sys_id: sysId,
      message: 'Page updated successfully'
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
        message: 'An unexpected error occurred while updating page',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the query_pages tool
 */
export async function queryPagesHandler(
  params: QueryPagesParams,
  service: PageService
): Promise<QueryPagesResponse | ErrorResponse> {
  try {
    // Validate parameter types
    if (params.title !== undefined && typeof params.title !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "title" must be a string',
          detail: `Received type: ${typeof params.title}`
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

    if (params.portal !== undefined && typeof params.portal !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "portal" must be a string',
          detail: `Received type: ${typeof params.portal}`
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

    // Call service to query pages
    const pages = await service.queryPages(params);

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
        message: 'An unexpected error occurred while querying pages',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the list_recent_pages tool
 */
export async function listRecentPagesHandler(
  params: ListRecentPagesParams,
  service: PageService
): Promise<ListRecentPagesResponse | ErrorResponse> {
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

    // Call service to list recent pages
    const pages = await service.listRecentPages(limit);

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
        message: 'An unexpected error occurred while listing recent pages',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the get_widgets_by_page tool
 */
export async function getWidgetsByPageHandler(
  params: GetWidgetsByPageParams,
  service: PageService
): Promise<GetWidgetsByPageResponse | ErrorResponse> {
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

    // Call service to get widgets by page
    const widgets = await service.getWidgetsByPage(params.sys_id);

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
        message: 'An unexpected error occurred while retrieving widgets by page',
        detail: error?.message || String(error)
      }
    };
  }
}
