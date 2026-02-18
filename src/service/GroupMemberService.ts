import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { GroupMemberFilters, GroupMemberSummary, GroupMemberDetail } from '../types/groupMember.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * GroupMemberService provides business logic for group member operations
 * 
 * Handles querying, retrieving, and listing group members from ServiceNow,
 * including filter application, query building, and data transformation.
 */
export class GroupMemberService {
  private client: ServiceNowClient;

  /**
   * Create a GroupMemberService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Query group members with filters
   * 
   * @param filters - Filter criteria for group members
   * @returns Promise resolving to array of group member summaries
   * @throws ServiceNowError if query fails
   */
  async queryGroupMembers(filters: GroupMemberFilters = {}): Promise<GroupMemberSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_group_members', 'Querying group members', {
        params: { filters }
      });
      
      // Validate filters
      this.validateFilters(filters);
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('sys_user_grmember', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to group member summaries
      const results = response.result.map(record => this.toGroupMemberSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_group_members', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_group_members', 'Query failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get a specific group member by sys_id
   * 
   * @param identifier - Group member sys_id
   * @returns Promise resolving to group member detail or null if not found
   * @throws ServiceNowError if retrieval fails
   */
  async getGroupMember(identifier: string): Promise<GroupMemberDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_group_member', 'Retrieving group member', {
        params: { identifier }
      });
      
      let result: GroupMemberDetail | null = null;
      
      // Group members are only retrieved by sys_id
      const record = await this.client.getById('sys_user_grmember', identifier);
      result = this.toGroupMemberDetail(record);
      
      const duration = Date.now() - startTime;
      logger.info('get_group_member', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_group_member', 'Group member not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_group_member', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * List recent group members ordered by updated timestamp
   * 
   * @param limit - Maximum number of group members to return (default 25, max 100)
   * @returns Promise resolving to array of group member summaries
   * @throws ServiceNowError if list operation fails
   */
  async listRecentGroupMembers(limit: number = 25): Promise<GroupMemberSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_recent_group_members', 'Listing recent group members', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by updated_at descending
      const response = await this.client.get('sys_user_grmember', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to group member summaries
      const results = response.result.map(record => this.toGroupMemberSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_recent_group_members', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_recent_group_members', 'List failed', {
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
  private validateFilters(filters: GroupMemberFilters): void {
    // Currently no specific validation needed for group member filters
    // All filters are strings
    // This method is here for consistency and future validation needs
  }

  /**
   * Build ServiceNow encoded query string from filters
   * 
   * @param filters - Filter criteria
   * @returns Encoded query string
   */
  private buildQuery(filters: GroupMemberFilters): string {
    const queryParts: string[] = [];
    
    // Add group filter
    if (filters.group) {
      queryParts.push(`group=${filters.group}`);
    }
    
    // Add user filter
    if (filters.user) {
      queryParts.push(`user=${filters.user}`);
    }
    
    // Add scrum_role filter
    if (filters.scrum_role) {
      queryParts.push(`scrum_role=${filters.scrum_role}`);
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }

  /**
   * Transform ServiceNow record to GroupMemberSummary
   * 
   * @param record - ServiceNow record
   * @returns GroupMemberSummary object
   */
  private toGroupMemberSummary(record: ServiceNowRecord): GroupMemberSummary {
    return {
      sys_id: record.sys_id,
      group: String(record.group || ''),
      user: String(record.user || '')
    };
  }

  /**
   * Transform ServiceNow record to GroupMemberDetail
   * 
   * @param record - ServiceNow record
   * @returns GroupMemberDetail object
   */
  private toGroupMemberDetail(record: ServiceNowRecord): GroupMemberDetail {
    return {
      // Base fields from GroupMemberSummary
      sys_id: record.sys_id,
      group: String(record.group || ''),
      user: String(record.user || ''),
      
      // Scrum-specific fields
      scrum_role: record.scrum_role ? String(record.scrum_role) : null,
      average_points_per_sprint: record.average_points_per_sprint ? Number(record.average_points_per_sprint) : null,
      
      // Audit fields
      sys_created_on: String(record.sys_created_on || ''),
      sys_created_by: String(record.sys_created_by || ''),
      sys_updated_on: String(record.sys_updated_on || ''),
      sys_updated_by: String(record.sys_updated_by || ''),
      sys_mod_count: Number(record.sys_mod_count || 0)
    };
  }
}
