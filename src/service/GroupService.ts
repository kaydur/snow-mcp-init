import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { GroupFilters, GroupSummary, GroupDetail } from '../types/group.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * GroupService provides business logic for group operations
 * 
 * Handles querying, retrieving, and listing groups from ServiceNow,
 * including filter application, query building, and data transformation.
 */
export class GroupService {
  private client: ServiceNowClient;

  /**
   * Create a GroupService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Query groups with filters
   * 
   * @param filters - Filter criteria for groups
   * @returns Promise resolving to array of group summaries
   * @throws ServiceNowError if query fails
   */
  async queryGroups(filters: GroupFilters = {}): Promise<GroupSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_groups', 'Querying groups', {
        params: { filters }
      });
      
      // Validate filters
      this.validateFilters(filters);
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('sys_user_group', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to group summaries
      const results = response.result.map(record => this.toGroupSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_groups', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_groups', 'Query failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get a specific group by sys_id or name
   * 
   * @param identifier - Group sys_id or name
   * @returns Promise resolving to group detail or null if not found
   * @throws ServiceNowError if retrieval fails
   */
  async getGroup(identifier: string): Promise<GroupDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_group', 'Retrieving group', {
        params: { identifier }
      });
      
      // Check if identifier looks like a sys_id (32 character hex string)
      const isSysId = /^[0-9a-f]{32}$/i.test(identifier);
      
      let result: GroupDetail | null = null;
      
      if (isSysId) {
        // Retrieve by sys_id
        const record = await this.client.getById('sys_user_group', identifier);
        result = this.toGroupDetail(record);
      } else {
        // Search by name
        const response = await this.client.get('sys_user_group', {
          sysparm_query: `name=${identifier}`,
          sysparm_limit: 1,
          sysparm_display_value: false
        });
        
        if (response.result.length === 0) {
          result = null;
        } else {
          result = this.toGroupDetail(response.result[0]);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_group', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_group', 'Group not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_group', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * List recent groups ordered by updated timestamp
   * 
   * @param limit - Maximum number of groups to return (default 25, max 100)
   * @returns Promise resolving to array of group summaries
   * @throws ServiceNowError if list operation fails
   */
  async listRecentGroups(limit: number = 25): Promise<GroupSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_recent_groups', 'Listing recent groups', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by updated_at descending
      const response = await this.client.get('sys_user_group', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to group summaries
      const results = response.result.map(record => this.toGroupSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_recent_groups', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_recent_groups', 'List failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Validate filter parameters
   *
   * @param filters - Filter criteria to validate
   * @throws Error if validation fails
   */
  private validateFilters(filters: GroupFilters): void {
    // Currently no specific validation needed for group filters
    // Active is boolean, other filters are strings
    // This method is here for consistency and future validation needs
  }

  /**
   * Build ServiceNow encoded query string from filters
   * 
   * @param filters - Filter criteria
   * @returns Encoded query string
   */
  private buildQuery(filters: GroupFilters): string {
    const queryParts: string[] = [];
    
    // Add active filter
    if (filters.active !== undefined) {
      queryParts.push(`active=${filters.active}`);
    }
    
    // Add type filter
    if (filters.type) {
      queryParts.push(`type=${filters.type}`);
    }
    
    // Add name filter (search in name field)
    if (filters.name) {
      queryParts.push(`nameLIKE${filters.name}`);
    }
    
    // Add manager filter
    if (filters.manager) {
      queryParts.push(`manager=${filters.manager}`);
    }
    
    // Add parent filter
    if (filters.parent) {
      queryParts.push(`parent=${filters.parent}`);
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }

  /**
   * Transform ServiceNow record to GroupSummary
   * 
   * @param record - ServiceNow record
   * @returns GroupSummary object
   */
  private toGroupSummary(record: ServiceNowRecord): GroupSummary {
    return {
      sys_id: record.sys_id,
      name: String(record.name || ''),
      description: record.description ? String(record.description) : null,
      active: Boolean(record.active === 'true' || record.active === true),
      type: record.type ? String(record.type) : null,
      manager: record.manager ? String(record.manager) : null
    };
  }

  /**
   * Transform ServiceNow record to GroupDetail
   * 
   * @param record - ServiceNow record
   * @returns GroupDetail object
   */
  private toGroupDetail(record: ServiceNowRecord): GroupDetail {
    return {
      // Base fields from GroupSummary
      sys_id: record.sys_id,
      name: String(record.name || ''),
      description: record.description ? String(record.description) : null,
      active: Boolean(record.active === 'true' || record.active === true),
      type: record.type ? String(record.type) : null,
      manager: record.manager ? String(record.manager) : null,
      
      // Contact information
      email: record.email ? String(record.email) : null,
      
      // Organizational information
      cost_center: record.cost_center ? String(record.cost_center) : null,
      default_assignee: record.default_assignee ? String(record.default_assignee) : null,
      parent: record.parent ? String(record.parent) : null,
      
      // Group settings
      exclude_manager: Boolean(record.exclude_manager === 'true' || record.exclude_manager === true),
      include_members: Boolean(record.include_members === 'true' || record.include_members === true),
      group_capacity_points: record.group_capacity_points ? Number(record.group_capacity_points) : null,
      
      // Source and roles
      source: record.source ? String(record.source) : null,
      roles: record.roles ? String(record.roles) : null,
      
      // Audit fields
      sys_created_on: String(record.sys_created_on || ''),
      sys_created_by: String(record.sys_created_by || ''),
      sys_updated_on: String(record.sys_updated_on || ''),
      sys_updated_by: String(record.sys_updated_by || ''),
      sys_mod_count: Number(record.sys_mod_count || 0)
    };
  }
}
