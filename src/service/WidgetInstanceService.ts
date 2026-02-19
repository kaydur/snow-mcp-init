import { ServiceNowClient } from '../client/ServiceNowClient.js';
import {
  WidgetInstanceSummary,
  WidgetInstanceDetail,
  WidgetInstanceFilters
} from '../types/widgetInstance.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * WidgetInstanceService provides business logic for Service Portal widget instance operations
 * 
 * Handles querying and retrieving widget instances, which represent specific placements
 * of widgets on pages with configuration options.
 */
export class WidgetInstanceService {
  private client: ServiceNowClient;

  /**
   * Create a WidgetInstanceService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Query widget instances with filters
   * 
   * @param filters - Filter criteria for widget instances
   * @returns Promise resolving to array of widget instance summaries
   * @throws Error if query fails
   */
  async queryWidgetInstances(filters: WidgetInstanceFilters = {}): Promise<WidgetInstanceSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_widget_instances', 'Querying widget instances', {
        params: { filters }
      });
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('sp_instance', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to widget instance summaries
      const results = response.result.map(record => this.toWidgetInstanceSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_widget_instances', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_widget_instances', 'Query failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get a specific widget instance by sys_id
   * 
   * @param sysId - Widget instance sys_id
   * @returns Promise resolving to widget instance detail or null if not found
   * @throws Error if retrieval fails
   */
  async getWidgetInstance(sysId: string): Promise<WidgetInstanceDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_widget_instance', 'Retrieving widget instance', {
        params: { sys_id: sysId }
      });
      
      // Validate sys_id parameter
      if (!sysId || typeof sysId !== 'string') {
        throw {
          code: 'INVALID_PARAMETER',
          message: 'sys_id parameter is required and must be a string',
          detail: 'Provide a valid sys_id to retrieve'
        };
      }
      
      // Retrieve by sys_id
      const record = await this.client.getById('sp_instance', sysId);
      const result = this.toWidgetInstanceDetail(record);
      
      const duration = Date.now() - startTime;
      logger.info('get_widget_instance', 'Retrieval completed', {
        result: { found: true },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_widget_instance', 'Widget instance not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_widget_instance', 'Retrieval failed', {
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
  private buildQuery(filters: WidgetInstanceFilters): string {
    const queryParts: string[] = [];
    
    // Add page filter
    if (filters.page) {
      queryParts.push(`page=${filters.page}`);
    }
    
    // Add widget filter
    if (filters.widget) {
      queryParts.push(`widget=${filters.widget}`);
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }

  /**
   * Transform ServiceNow record to WidgetInstanceSummary
   * 
   * @param record - ServiceNow record
   * @returns WidgetInstanceSummary object
   */
  private toWidgetInstanceSummary(record: ServiceNowRecord): WidgetInstanceSummary {
    // Parse options JSON if present
    let options = null;
    if (record.options) {
      try {
        options = JSON.parse(String(record.options));
      } catch (e) {
        // If JSON parsing fails, leave as null
        logger.warn('to_widget_instance_summary', 'Failed to parse options JSON');
      }
    }
    
    return {
      sys_id: record.sys_id,
      widget: String(record.widget || ''),
      page: String(record.page || ''),
      order: Number(record.order || 0),
      color: record.color ? String(record.color) : null,
      size: Number(record.size || 12),
      options,
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }

  /**
   * Transform ServiceNow record to WidgetInstanceDetail
   * 
   * @param record - ServiceNow record
   * @returns WidgetInstanceDetail object
   */
  private toWidgetInstanceDetail(record: ServiceNowRecord): WidgetInstanceDetail {
    // Parse options JSON if present
    let options = null;
    if (record.options) {
      try {
        options = JSON.parse(String(record.options));
      } catch (e) {
        // If JSON parsing fails, leave as null
        logger.warn('to_widget_instance_detail', 'Failed to parse options JSON');
      }
    }
    
    return {
      sys_id: record.sys_id,
      widget: String(record.widget || ''),
      page: String(record.page || ''),
      order: Number(record.order || 0),
      color: record.color ? String(record.color) : null,
      size: Number(record.size || 12),
      options,
      bootstrap_alt_text: record.bootstrap_alt_text ? String(record.bootstrap_alt_text) : null,
      sys_created_on: String(record.sys_created_on || ''),
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }
}
