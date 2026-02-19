import { ServiceNowClient } from '../client/ServiceNowClient.js';
import {
  PortalSummary,
  PortalDetail,
  PortalFilters
} from '../types/portal.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * PortalService provides business logic for Service Portal portal operations
 * 
 * Handles querying, retrieving, and listing Service Portal portals.
 */
export class PortalService {
  private client: ServiceNowClient;

  /**
   * Create a PortalService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Query portals with filters
   * 
   * @param filters - Filter criteria for portals
   * @returns Promise resolving to array of portal summaries
   * @throws Error if query fails
   */
  async queryPortals(filters: PortalFilters = {}): Promise<PortalSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_portals', 'Querying portals', {
        params: { filters }
      });
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('sp_portal', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to portal summaries
      const results = response.result.map(record => this.toPortalSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_portals', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_portals', 'Query failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get a specific portal by sys_id or url_suffix
   * 
   * @param identifier - Portal sys_id or url_suffix
   * @returns Promise resolving to portal detail or null if not found
   * @throws Error if retrieval fails
   */
  async getPortal(identifier: string): Promise<PortalDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_portal', 'Retrieving portal', {
        params: { identifier }
      });
      
      // Check if identifier looks like a sys_id (32 character hex string)
      const isSysId = /^[0-9a-f]{32}$/i.test(identifier);
      
      let result: PortalDetail | null = null;
      
      if (isSysId) {
        // Retrieve by sys_id
        const record = await this.client.getById('sp_portal', identifier);
        result = this.toPortalDetail(record);
      } else {
        // Search by url_suffix
        const response = await this.client.get('sp_portal', {
          sysparm_query: `url_suffix=${identifier}`,
          sysparm_limit: 1,
          sysparm_display_value: false
        });
        
        if (response.result.length === 0) {
          result = null;
        } else {
          result = this.toPortalDetail(response.result[0]);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_portal', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_portal', 'Portal not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_portal', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * List portals ordered by title
   * 
   * @param limit - Maximum number of portals to return (default 25, max 100)
   * @returns Promise resolving to array of portal summaries
   * @throws Error if list operation fails
   */
  async listPortals(limit: number = 25): Promise<PortalSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_portals', 'Listing portals', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by title
      const response = await this.client.get('sp_portal', {
        sysparm_query: 'ORDERBYtitle',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to portal summaries
      const results = response.result.map(record => this.toPortalSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_portals', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_portals', 'List failed', {
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
  private buildQuery(filters: PortalFilters): string {
    const queryParts: string[] = [];
    
    // Add title filter (partial match, case-insensitive)
    if (filters.title) {
      queryParts.push(`titleLIKE${filters.title}`);
    }
    
    // Add url_suffix filter (exact match)
    if (filters.url_suffix) {
      queryParts.push(`url_suffix=${filters.url_suffix}`);
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }

  /**
   * Transform ServiceNow record to PortalSummary
   * 
   * @param record - ServiceNow record
   * @returns PortalSummary object
   */
  private toPortalSummary(record: ServiceNowRecord): PortalSummary {
    return {
      sys_id: record.sys_id,
      title: String(record.title || ''),
      url_suffix: String(record.url_suffix || ''),
      homepage: record.homepage ? String(record.homepage) : null,
      theme: record.theme ? String(record.theme) : null,
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }

  /**
   * Transform ServiceNow record to PortalDetail
   * 
   * @param record - ServiceNow record
   * @returns PortalDetail object
   */
  private toPortalDetail(record: ServiceNowRecord): PortalDetail {
    return {
      sys_id: record.sys_id,
      title: String(record.title || ''),
      url_suffix: String(record.url_suffix || ''),
      homepage: record.homepage ? String(record.homepage) : null,
      theme: record.theme ? String(record.theme) : null,
      logo: record.logo ? String(record.logo) : null,
      quick_start_config: record.quick_start_config ? String(record.quick_start_config) : null,
      sys_created_on: String(record.sys_created_on || ''),
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }
}
