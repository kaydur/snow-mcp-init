import { ServiceNowClient } from '../client/ServiceNowClient.js';
import {
  PageSummary,
  PageDetail,
  PageFilters,
  CreatePageData,
  UpdatePageData,
  WidgetOnPage
} from '../types/page.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * PageService provides business logic for Service Portal page operations
 * 
 * Handles creating, reading, updating, and querying Service Portal pages,
 * including validation of portal and role references.
 */
export class PageService {
  private client: ServiceNowClient;

  /**
   * Create a PageService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Create a new page
   * 
   * @param data - Page creation data
   * @returns Promise resolving to sys_id of created page
   * @throws Error if validation fails or creation fails
   */
  async createPage(data: CreatePageData): Promise<string> {
    const startTime = Date.now();
    
    try {
      logger.info('create_page', 'Creating page', {
        params: { title: data.title, id: data.id }
      });
      
      // Validate required fields
      if (!data.title || data.title.trim().length === 0) {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'Title field is required',
          detail: 'The title field must be provided and non-empty'
        };
      }
      
      if (!data.id || data.id.trim().length === 0) {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'ID field is required',
          detail: 'The id field must be provided and non-empty'
        };
      }
      
      // Check for duplicate id
      const existing = await this.getPage(data.id);
      if (existing) {
        throw {
          code: 'DUPLICATE_ERROR',
          message: 'Page with this ID already exists',
          detail: `A page with id '${data.id}' already exists`
        };
      }
      
      // Validate portal exists if provided
      if (data.portal) {
        const portalExists = await this.validatePortalExists(data.portal);
        if (!portalExists) {
          throw {
            code: 'VALIDATION_ERROR',
            message: 'Portal not found',
            detail: `No portal found with sys_id: ${data.portal}`
          };
        }
      }
      
      // Validate roles exist if provided
      if (data.roles && data.roles.length > 0) {
        const rolesExist = await this.validateRolesExist(data.roles);
        if (!rolesExist) {
          throw {
            code: 'VALIDATION_ERROR',
            message: 'One or more roles not found',
            detail: 'All role sys_ids must exist in the sys_user_role table'
          };
        }
      }
      
      // Prepare record for creation
      const record: any = {
        title: data.title,
        id: data.id,
        public: data.public !== undefined ? data.public : false
      };
      
      if (data.portal) record.portal = data.portal;
      if (data.roles && data.roles.length > 0) record.roles = data.roles.join(',');
      if (data.description) record.description = data.description;
      
      // Create page
      const response = await this.client.post('sp_page', record);
      const sysId = response.sys_id;
      
      const duration = Date.now() - startTime;
      logger.info('create_page', 'Page created', {
        result: { sys_id: sysId },
        duration
      });
      
      return sysId;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('create_page', 'Creation failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get a specific page by sys_id or id
   * 
   * @param identifier - Page sys_id or id
   * @returns Promise resolving to page detail or null if not found
   * @throws Error if retrieval fails
   */
  async getPage(identifier: string): Promise<PageDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_page', 'Retrieving page', {
        params: { identifier }
      });
      
      // Check if identifier looks like a sys_id (32 character hex string)
      const isSysId = /^[0-9a-f]{32}$/i.test(identifier);
      
      let result: PageDetail | null = null;
      
      if (isSysId) {
        // Retrieve by sys_id
        const record = await this.client.getById('sp_page', identifier);
        result = this.toPageDetail(record);
      } else {
        // Search by id
        const response = await this.client.get('sp_page', {
          sysparm_query: `id=${identifier}`,
          sysparm_limit: 1,
          sysparm_display_value: false
        });
        
        if (response.result.length === 0) {
          result = null;
        } else {
          result = this.toPageDetail(response.result[0]);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_page', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_page', 'Page not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_page', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Update an existing page
   * 
   * @param sysId - Page sys_id
   * @param updates - Fields to update
   * @returns Promise resolving to sys_id of updated page
   * @throws Error if validation fails or update fails
   */
  async updatePage(sysId: string, updates: UpdatePageData): Promise<string> {
    const startTime = Date.now();
    
    try {
      logger.info('update_page', 'Updating page', {
        params: { sys_id: sysId, updates: Object.keys(updates) }
      });
      
      // Validate sys_id parameter
      if (!sysId || typeof sysId !== 'string') {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'sys_id parameter is required and must be a string',
          detail: 'Provide a valid sys_id to update'
        };
      }
      
      // Validate at least one update field is provided
      if (Object.keys(updates).length === 0) {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'No update fields provided',
          detail: 'At least one field must be provided for update'
        };
      }
      
      // Validate portal exists if being updated
      if (updates.portal !== undefined && updates.portal !== null) {
        const portalExists = await this.validatePortalExists(updates.portal);
        if (!portalExists) {
          throw {
            code: 'VALIDATION_ERROR',
            message: 'Portal not found',
            detail: `No portal found with sys_id: ${updates.portal}`
          };
        }
      }
      
      // Validate roles exist if being updated
      if (updates.roles !== undefined && updates.roles.length > 0) {
        const rolesExist = await this.validateRolesExist(updates.roles);
        if (!rolesExist) {
          throw {
            code: 'VALIDATION_ERROR',
            message: 'One or more roles not found',
            detail: 'All role sys_ids must exist in the sys_user_role table'
          };
        }
      }
      
      // Prepare update record
      const record: any = {};
      if (updates.title !== undefined) record.title = updates.title;
      if (updates.id !== undefined) record.id = updates.id;
      if (updates.public !== undefined) record.public = updates.public;
      if (updates.portal !== undefined) record.portal = updates.portal;
      if (updates.roles !== undefined) record.roles = updates.roles.join(',');
      if (updates.description !== undefined) record.description = updates.description;
      
      // Update page
      await this.client.put('sp_page', sysId, record);
      
      const duration = Date.now() - startTime;
      logger.info('update_page', 'Page updated', {
        result: { sys_id: sysId },
        duration
      });
      
      return sysId;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, throw with appropriate code
      if (error?.code === 'NOT_FOUND') {
        throw {
          code: 'NOT_FOUND',
          message: 'Page not found',
          detail: `No page found with sys_id: ${sysId}`
        };
      }
      
      logger.error('update_page', 'Update failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Query pages with filters
   * 
   * @param filters - Filter criteria for pages
   * @returns Promise resolving to array of page summaries
   * @throws Error if query fails
   */
  async queryPages(filters: PageFilters = {}): Promise<PageSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_pages', 'Querying pages', {
        params: { filters }
      });
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('sp_page', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to page summaries
      const results = response.result.map(record => this.toPageSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_pages', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_pages', 'Query failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * List recent pages ordered by updated timestamp
   * 
   * @param limit - Maximum number of pages to return (default 25, max 100)
   * @returns Promise resolving to array of page summaries
   * @throws Error if list operation fails
   */
  async listRecentPages(limit: number = 25): Promise<PageSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_recent_pages', 'Listing recent pages', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by updated_on descending
      const response = await this.client.get('sp_page', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to page summaries
      const results = response.result.map(record => this.toPageSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_recent_pages', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_recent_pages', 'List failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get widgets on a specific page
   * 
   * @param pageSysId - Page sys_id
   * @returns Promise resolving to array of widgets on page
   * @throws Error if page not found or retrieval fails
   */
  async getWidgetsByPage(pageSysId: string): Promise<WidgetOnPage[]> {
    const startTime = Date.now();
    
    try {
      logger.info('get_widgets_by_page', 'Retrieving widgets by page', {
        params: { page_sys_id: pageSysId }
      });
      
      // Verify page exists
      const page = await this.getPage(pageSysId);
      if (!page) {
        throw {
          code: 'NOT_FOUND',
          message: 'Page not found',
          detail: `No page found with sys_id: ${pageSysId}`
        };
      }
      
      // Query sp_instance table for widget instances on this page
      const response = await this.client.get('sp_instance', {
        sysparm_query: `page=${pageSysId}^ORDERBYorder`,
        sysparm_display_value: false
      });
      
      // Transform results to WidgetOnPage objects
      const results: WidgetOnPage[] = [];
      
      for (const instance of response.result) {
        // Get widget details for each instance
        const widgetSysId = String(instance.widget || '');
        if (!widgetSysId) continue;
        
        const widgetResponse = await this.client.getById('sp_widget', widgetSysId);
        
        // Parse options if present
        let options = null;
        if (instance.options) {
          try {
            options = JSON.parse(String(instance.options));
          } catch (e) {
            options = null;
          }
        }
        
        results.push({
          sys_id: instance.sys_id,
          widget_sys_id: widgetSysId,
          widget_name: String(widgetResponse.name || ''),
          widget_id: String(widgetResponse.id || ''),
          order: Number(instance.order || 0),
          size: Number(instance.size || 12),
          color: instance.color ? String(instance.color) : null,
          options
        });
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_widgets_by_page', 'Widgets retrieved', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('get_widgets_by_page', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Validate that a portal exists
   * 
   * @param portalSysId - Portal sys_id to validate
   * @returns Promise resolving to true if portal exists, false otherwise
   */
  private async validatePortalExists(portalSysId: string): Promise<boolean> {
    try {
      await this.client.getById('sp_portal', portalSysId);
      return true;
    } catch (error: any) {
      if (error?.code === 'NOT_FOUND') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Validate that all roles exist
   * 
   * @param roleSysIds - Array of role sys_ids to validate
   * @returns Promise resolving to true if all roles exist, false otherwise
   */
  private async validateRolesExist(roleSysIds: string[]): Promise<boolean> {
    try {
      // Query for all roles at once
      const query = roleSysIds.map(id => `sys_id=${id}`).join('^OR');
      const response = await this.client.get('sys_user_role', {
        sysparm_query: query,
        sysparm_display_value: false
      });
      
      // Check if we found all roles
      return response.result.length === roleSysIds.length;
    } catch (error) {
      return false;
    }
  }

  /**
   * Build ServiceNow encoded query string from filters
   * 
   * @param filters - Filter criteria
   * @returns Encoded query string
   */
  private buildQuery(filters: PageFilters): string {
    const queryParts: string[] = [];
    
    // Add title filter (partial match, case-insensitive)
    if (filters.title) {
      queryParts.push(`titleLIKE${filters.title}`);
    }
    
    // Add id filter (exact match)
    if (filters.id) {
      queryParts.push(`id=${filters.id}`);
    }
    
    // Add public filter
    if (filters.public !== undefined) {
      queryParts.push(`public=${filters.public}`);
    }
    
    // Add portal filter
    if (filters.portal) {
      queryParts.push(`portal=${filters.portal}`);
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }

  /**
   * Transform ServiceNow record to PageSummary
   * 
   * @param record - ServiceNow record
   * @returns PageSummary object
   */
  private toPageSummary(record: ServiceNowRecord): PageSummary {
    // Parse roles (comma-separated sys_ids)
    let roles: string[] = [];
    if (record.roles) {
      roles = String(record.roles).split(',').filter(r => r.trim().length > 0);
    }
    
    return {
      sys_id: record.sys_id,
      title: String(record.title || ''),
      id: String(record.id || ''),
      public: Boolean(record.public),
      portal: record.portal ? String(record.portal) : null,
      roles,
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }

  /**
   * Transform ServiceNow record to PageDetail
   * 
   * @param record - ServiceNow record
   * @returns PageDetail object
   */
  private toPageDetail(record: ServiceNowRecord): PageDetail {
    // Parse roles (comma-separated sys_ids)
    let roles: string[] = [];
    if (record.roles) {
      roles = String(record.roles).split(',').filter(r => r.trim().length > 0);
    }
    
    return {
      sys_id: record.sys_id,
      title: String(record.title || ''),
      id: String(record.id || ''),
      public: Boolean(record.public),
      portal: record.portal ? String(record.portal) : null,
      roles,
      description: record.description ? String(record.description) : null,
      sys_created_on: String(record.sys_created_on || ''),
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }
}
