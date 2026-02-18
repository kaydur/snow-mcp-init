import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { IncidentFilters, IncidentSummary, IncidentDetail } from '../types/incident.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * IncidentService provides business logic for incident operations
 * 
 * Handles querying, retrieving, and listing incidents from ServiceNow,
 * including filter application, query building, and data transformation.
 */
export class IncidentService {
  private client: ServiceNowClient;

  /**
   * Create an IncidentService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Query incidents with filters
   * 
   * @param filters - Filter criteria for incidents
   * @returns Promise resolving to array of incident summaries
   * @throws ServiceNowError if query fails
   */
  async queryIncidents(filters: IncidentFilters = {}): Promise<IncidentSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_incidents', 'Querying incidents', {
        params: { filters }
      });
      
      // Validate filters
      this.validateFilters(filters);
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('incident', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to incident summaries
      const results = response.result.map(record => this.toIncidentSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_incidents', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_incidents', 'Query failed', {
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
  private validateFilters(filters: IncidentFilters): void {
    // Valid state values (numeric strings matching ServiceNow state enum)
    const validStates = ['1', '2', '3', '6', '7'];
    const validStateLabels = ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed'];

    // Validate state filter
    if (filters.state && filters.state.length > 0) {
      for (const state of filters.state) {
        // Accept both numeric strings and labels
        if (!validStates.includes(state) && !validStateLabels.includes(state)) {
          throw {
            code: 'VALIDATION_ERROR',
            message: `Invalid state value: ${state}. Valid states are: New, In Progress, On Hold, Resolved, Closed`,
            detail: `Received state: ${state}`
          };
        }
      }
    }

    // Validate priority filter
    if (filters.priority && filters.priority.length > 0) {
      for (const priority of filters.priority) {
        if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
          throw {
            code: 'VALIDATION_ERROR',
            message: `Invalid priority value: ${priority}. Priority must be an integer between 1 and 5`,
            detail: `Received priority: ${priority}`
          };
        }
      }
    }
  }


  /**
   * Get a specific incident by sys_id or incident number
   * 
   * @param identifier - Incident sys_id or number (e.g., INC0010001)
   * @returns Promise resolving to incident detail or null if not found
   * @throws ServiceNowError if retrieval fails
   */
  async getIncident(identifier: string): Promise<IncidentDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_incident', 'Retrieving incident', {
        params: { identifier }
      });
      
      // Check if identifier looks like a sys_id (32 character hex string)
      const isSysId = /^[0-9a-f]{32}$/i.test(identifier);
      
      let result: IncidentDetail | null = null;
      
      if (isSysId) {
        // Retrieve by sys_id
        const record = await this.client.getById('incident', identifier);
        result = this.toIncidentDetail(record);
      } else {
        // Search by incident number
        const response = await this.client.get('incident', {
          sysparm_query: `number=${identifier}`,
          sysparm_limit: 1,
          sysparm_display_value: false
        });
        
        if (response.result.length === 0) {
          result = null;
        } else {
          result = this.toIncidentDetail(response.result[0]);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_incident', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_incident', 'Incident not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_incident', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * List recent incidents ordered by updated timestamp
   * 
   * @param limit - Maximum number of incidents to return (default 25, max 100)
   * @returns Promise resolving to array of incident summaries
   * @throws ServiceNowError if list operation fails
   */
  async listRecentIncidents(limit: number = 25): Promise<IncidentSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_recent_incidents', 'Listing recent incidents', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by updated_at descending
      const response = await this.client.get('incident', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to incident summaries
      const results = response.result.map(record => this.toIncidentSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_recent_incidents', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_recent_incidents', 'List failed', {
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
  private buildQuery(filters: IncidentFilters): string {
    const queryParts: string[] = [];
    
    // Add state filter
    if (filters.state && filters.state.length > 0) {
      const stateParts = filters.state.map(state => `state=${state}`);
      queryParts.push(stateParts.join('^OR'));
    }
    
    // Add priority filter
    if (filters.priority && filters.priority.length > 0) {
      const priorityParts = filters.priority.map(priority => `priority=${priority}`);
      queryParts.push(priorityParts.join('^OR'));
    }
    
    // Add assignment filters with OR logic when both are present (Requirement 8.5)
    const assignmentParts: string[] = [];
    if (filters.assigned_to) {
      assignmentParts.push(`assigned_to=${filters.assigned_to}`);
    }
    if (filters.assignment_group) {
      assignmentParts.push(`assignment_group=${filters.assignment_group}`);
    }
    if (assignmentParts.length > 0) {
      queryParts.push(assignmentParts.join('^OR'));
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }

  /**
   * Transform ServiceNow record to IncidentSummary
   * 
   * @param record - ServiceNow record
   * @returns IncidentSummary object
   */
  private toIncidentSummary(record: ServiceNowRecord): IncidentSummary {
    return {
      sys_id: record.sys_id,
      number: String(record.number || ''),
      short_description: String(record.short_description || ''),
      state: String(record.state || ''),
      priority: Number(record.priority || 0),
      assigned_to: record.assigned_to ? String(record.assigned_to) : null,
      updated_at: String(record.sys_updated_on || '')
    };
  }

  /**
   * Transform ServiceNow record to IncidentDetail
   * 
   * @param record - ServiceNow record
   * @returns IncidentDetail object
   */
  private toIncidentDetail(record: ServiceNowRecord): IncidentDetail {
    return {
      sys_id: record.sys_id,
      number: String(record.number || ''),
      short_description: String(record.short_description || ''),
      description: String(record.description || ''),
      state: String(record.state || ''),
      priority: Number(record.priority || 0),
      category: record.category ? String(record.category) : null,
      assigned_to: record.assigned_to ? String(record.assigned_to) : null,
      opened_by: String(record.opened_by || ''),
      opened_at: String(record.sys_created_on || ''),
      updated_at: String(record.sys_updated_on || ''),
      resolution_notes: record.close_notes ? String(record.close_notes) : null
    };
  }
}
