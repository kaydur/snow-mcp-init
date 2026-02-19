/**
 * MCP Tool Handlers for Portal and Widget Instance Operations
 * 
 * Implements handlers for Portal and Widget Instance MCP tools, providing parameter validation,
 * service method invocation, and structured error handling.
 */

import { PortalService } from '../service/PortalService.js';
import { WidgetInstanceService } from '../service/WidgetInstanceService.js';
import { logger } from '../utils/logger.js';
import {
  QueryPortalsParams,
  QueryPortalsResponse,
  GetPortalParams,
  GetPortalResponse,
  ListPortalsParams,
  ListPortalsResponse,
  QueryWidgetInstancesParams,
  QueryWidgetInstancesResponse,
  GetWidgetInstanceParams,
  GetWidgetInstanceResponse
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
 * Handler for the query_portals tool
 */
export async function queryPortalsHandler(
  params: QueryPortalsParams,
  service: PortalService
): Promise<QueryPortalsResponse | ErrorResponse> {
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

    if (params.url_suffix !== undefined && typeof params.url_suffix !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "url_suffix" must be a string',
          detail: `Received type: ${typeof params.url_suffix}`
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

    // Call service to query portals
    const portals = await service.queryPortals(params);

    // Return formatted response
    return {
      portals: portals,
      count: portals.length
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
        message: 'An unexpected error occurred while querying portals',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the get_portal tool
 */
export async function getPortalHandler(
  params: GetPortalParams,
  service: PortalService
): Promise<GetPortalResponse | ErrorResponse> {
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

    // Call service to get portal
    const portal = await service.getPortal(params.identifier);

    // Return response with found flag
    if (portal === null) {
      return {
        portal: null,
        found: false
      };
    }

    return {
      portal: portal,
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
        message: 'An unexpected error occurred while retrieving portal',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the list_portals tool
 */
export async function listPortalsHandler(
  params: ListPortalsParams,
  service: PortalService
): Promise<ListPortalsResponse | ErrorResponse> {
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

    // Call service to list portals
    const portals = await service.listPortals(limit);

    // Return formatted response
    return {
      portals: portals,
      count: portals.length
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
        message: 'An unexpected error occurred while listing portals',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the query_widget_instances tool
 */
export async function queryWidgetInstancesHandler(
  params: QueryWidgetInstancesParams,
  service: WidgetInstanceService
): Promise<QueryWidgetInstancesResponse | ErrorResponse> {
  try {
    // Validate parameter types
    if (params.page !== undefined && typeof params.page !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "page" must be a string',
          detail: `Received type: ${typeof params.page}`
        }
      };
    }

    if (params.widget !== undefined && typeof params.widget !== 'string') {
      return {
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "widget" must be a string',
          detail: `Received type: ${typeof params.widget}`
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

    // Call service to query widget instances
    const widgetInstances = await service.queryWidgetInstances(params);

    // Return formatted response
    return {
      widget_instances: widgetInstances,
      count: widgetInstances.length
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
        message: 'An unexpected error occurred while querying widget instances',
        detail: error?.message || String(error)
      }
    };
  }
}

/**
 * Handler for the get_widget_instance tool
 */
export async function getWidgetInstanceHandler(
  params: GetWidgetInstanceParams,
  service: WidgetInstanceService
): Promise<GetWidgetInstanceResponse | ErrorResponse> {
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

    // Call service to get widget instance
    const widgetInstance = await service.getWidgetInstance(params.identifier);

    // Return response with found flag
    if (widgetInstance === null) {
      return {
        widget_instance: null,
        found: false
      };
    }

    return {
      widget_instance: widgetInstance,
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
        message: 'An unexpected error occurred while retrieving widget instance',
        detail: error?.message || String(error)
      }
    };
  }
}
