import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { UserFilters, UserSummary, UserDetail } from '../types/user.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * UserService provides business logic for user operations
 * 
 * Handles querying, retrieving, and listing users from ServiceNow,
 * including filter application, query building, and data transformation.
 */
export class UserService {
  private client: ServiceNowClient;

  /**
   * Create a UserService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Query users with filters
   * 
   * @param filters - Filter criteria for users
   * @returns Promise resolving to array of user summaries
   * @throws ServiceNowError if query fails
   */
  async queryUsers(filters: UserFilters = {}): Promise<UserSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_users', 'Querying users', {
        params: { filters }
      });
      
      // Validate filters
      this.validateFilters(filters);
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('sys_user', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to user summaries
      const results = response.result.map(record => this.toUserSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_users', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_users', 'Query failed', {
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
  private validateFilters(filters: UserFilters): void {
    // Currently no specific validation needed for user filters
    // Active is boolean, other filters are strings
    // This method is here for consistency and future validation needs
  }

  /**
   * Get a specific user by sys_id or username
   * 
   * @param identifier - User sys_id or username
   * @returns Promise resolving to user detail or null if not found
   * @throws ServiceNowError if retrieval fails
   */
  async getUser(identifier: string): Promise<UserDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_user', 'Retrieving user', {
        params: { identifier }
      });
      
      // Check if identifier looks like a sys_id (32 character hex string)
      const isSysId = /^[0-9a-f]{32}$/i.test(identifier);
      
      let result: UserDetail | null = null;
      
      if (isSysId) {
        // Retrieve by sys_id
        const record = await this.client.getById('sys_user', identifier);
        result = this.toUserDetail(record);
      } else {
        // Search by username
        const response = await this.client.get('sys_user', {
          sysparm_query: `user_name=${identifier}`,
          sysparm_limit: 1,
          sysparm_display_value: false
        });
        
        if (response.result.length === 0) {
          result = null;
        } else {
          result = this.toUserDetail(response.result[0]);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_user', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_user', 'User not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_user', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * List recent users ordered by updated timestamp
   * 
   * @param limit - Maximum number of users to return (default 25, max 100)
   * @returns Promise resolving to array of user summaries
   * @throws ServiceNowError if list operation fails
   */
  async listRecentUsers(limit: number = 25): Promise<UserSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_recent_users', 'Listing recent users', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by updated_at descending
      const response = await this.client.get('sys_user', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to user summaries
      const results = response.result.map(record => this.toUserSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_recent_users', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_recent_users', 'List failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Build ServiceNow encoded query string from filters
   * 
   * @param filters - Filter criteria
   * @returns Encoded query string
   */
  private buildQuery(filters: UserFilters): string {
    const queryParts: string[] = [];
    
    // Add active filter
    if (filters.active !== undefined) {
      queryParts.push(`active=${filters.active}`);
    }
    
    // Add department filter
    if (filters.department) {
      queryParts.push(`department=${filters.department}`);
    }
    
    // Add role filter
    if (filters.role) {
      queryParts.push(`roles=${filters.role}`);
    }
    
    // Add name filter (search in name field)
    if (filters.name) {
      queryParts.push(`nameLIKE${filters.name}`);
    }
    
    // Add company filter
    if (filters.company) {
      queryParts.push(`company=${filters.company}`);
    }
    
    // Add location filter
    if (filters.location) {
      queryParts.push(`location=${filters.location}`);
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }

  /**
   * Transform ServiceNow record to UserSummary
   * 
   * @param record - ServiceNow record
   * @returns UserSummary object
   */
  private toUserSummary(record: ServiceNowRecord): UserSummary {
    return {
      sys_id: record.sys_id,
      user_name: String(record.user_name || ''),
      name: String(record.name || ''),
      email: String(record.email || ''),
      active: Boolean(record.active === 'true' || record.active === true),
      title: record.title ? String(record.title) : null
    };
  }

  /**
   * Transform ServiceNow record to UserDetail
   * 
   * @param record - ServiceNow record
   * @returns UserDetail object
   */
  private toUserDetail(record: ServiceNowRecord): UserDetail {
    return {
      // Base fields from UserSummary
      sys_id: record.sys_id,
      user_name: String(record.user_name || ''),
      name: String(record.name || ''),
      email: String(record.email || ''),
      active: Boolean(record.active === 'true' || record.active === true),
      title: record.title ? String(record.title) : null,
      
      // Contact information
      phone: record.phone ? String(record.phone) : null,
      mobile_phone: record.mobile_phone ? String(record.mobile_phone) : null,
      home_phone: record.home_phone ? String(record.home_phone) : null,
      business_phone: record.business_phone ? String(record.business_phone) : null,
      fax: record.fax ? String(record.fax) : null,
      
      // Organizational information
      department: record.department ? String(record.department) : null,
      company: record.company ? String(record.company) : null,
      location: record.location ? String(record.location) : null,
      building: record.building ? String(record.building) : null,
      cost_center: record.cost_center ? String(record.cost_center) : null,
      manager: record.manager ? String(record.manager) : null,
      
      // Personal information
      first_name: record.first_name ? String(record.first_name) : null,
      middle_name: record.middle_name ? String(record.middle_name) : null,
      last_name: record.last_name ? String(record.last_name) : null,
      gender: record.gender ? String(record.gender) : null,
      
      // System information
      employee_number: record.employee_number ? String(record.employee_number) : null,
      user_id: record.user_id ? String(record.user_id) : null,
      domain: record.domain ? String(record.domain) : null,
      domain_path: record.domain_path ? String(record.domain_path) : null,
      
      // Authentication and access
      password_needs_reset: Boolean(record.password_needs_reset === 'true' || record.password_needs_reset === true),
      locked_out: Boolean(record.locked_out === 'true' || record.locked_out === true),
      failed_login_attempts: Number(record.failed_login_attempts || 0),
      last_login: record.last_login ? String(record.last_login) : null,
      last_login_time: record.last_login_time ? String(record.last_login_time) : null,
      last_login_device: record.last_login_device ? String(record.last_login_device) : null,
      
      // Preferences and settings
      time_zone: record.time_zone ? String(record.time_zone) : null,
      time_format: record.time_format ? String(record.time_format) : null,
      date_format: record.date_format ? String(record.date_format) : null,
      default_perspective: record.default_perspective ? String(record.default_perspective) : null,
      calendar_integration: Number(record.calendar_integration || 0),
      enable_multifactor_authn: Boolean(record.enable_multifactor_authn === 'true' || record.enable_multifactor_authn === true),
      
      // LDAP and external integration
      ldap_server: record.ldap_server ? String(record.ldap_server) : null,
      internal_integration_user: Boolean(record.internal_integration_user === 'true' || record.internal_integration_user === true),
      
      // Additional fields
      avatar: record.avatar ? String(record.avatar) : null,
      photo: record.photo ? String(record.photo) : null,
      city: record.city ? String(record.city) : null,
      state: record.state ? String(record.state) : null,
      street: record.street ? String(record.street) : null,
      country: record.country ? String(record.country) : null,
      zip: record.zip ? String(record.zip) : null,
      
      // Roles and access
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
