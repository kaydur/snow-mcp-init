import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { ChangeRequestFilters, ChangeRequestSummary, ChangeRequestDetail } from '../types/changeRequest.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * ChangeRequestService provides business logic for change request operations
 * 
 * Handles querying, retrieving, and listing change requests from ServiceNow,
 * including filter application, query building, and data transformation.
 */
export class ChangeRequestService {
  private client: ServiceNowClient;

  /**
   * Create a ChangeRequestService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Query change requests with filters
   * 
   * @param filters - Filter criteria for change requests
   * @returns Promise resolving to array of change request summaries
   * @throws ServiceNowError if query fails
   */
  async queryChangeRequests(filters: ChangeRequestFilters = {}): Promise<ChangeRequestSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_change_requests', 'Querying change requests', {
        params: { filters }
      });
      
      // Validate filters
      this.validateFilters(filters);
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('change_request', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to change request summaries
      const results = response.result.map(record => this.toChangeRequestSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_change_requests', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_change_requests', 'Query failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get a specific change request by sys_id or change request number
   * 
   * @param identifier - Change request sys_id or number
   * @returns Promise resolving to change request detail or null if not found
   * @throws ServiceNowError if retrieval fails
   */
  async getChangeRequest(identifier: string): Promise<ChangeRequestDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_change_request', 'Retrieving change request', {
        params: { identifier }
      });
      
      // Check if identifier looks like a sys_id (32 character hex string)
      const isSysId = /^[0-9a-f]{32}$/i.test(identifier);
      
      let result: ChangeRequestDetail | null = null;
      
      if (isSysId) {
        // Retrieve by sys_id
        const record = await this.client.getById('change_request', identifier);
        result = this.toChangeRequestDetail(record);
      } else {
        // Search by number
        const response = await this.client.get('change_request', {
          sysparm_query: `number=${identifier}`,
          sysparm_limit: 1,
          sysparm_display_value: false
        });
        
        if (response.result.length === 0) {
          result = null;
        } else {
          result = this.toChangeRequestDetail(response.result[0]);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_change_request', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_change_request', 'Change request not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_change_request', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * List recent change requests ordered by updated timestamp
   * 
   * @param limit - Maximum number of change requests to return (default 25, max 100)
   * @returns Promise resolving to array of change request summaries
   * @throws ServiceNowError if list operation fails
   */
  async listRecentChangeRequests(limit: number = 25): Promise<ChangeRequestSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_recent_change_requests', 'Listing recent change requests', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by updated_at descending
      const response = await this.client.get('change_request', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to change request summaries
      const results = response.result.map(record => this.toChangeRequestSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_recent_change_requests', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_recent_change_requests', 'List failed', {
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
  private validateFilters(filters: ChangeRequestFilters): void {
    // Validate priority values if provided
    if (filters.priority) {
      for (const priority of filters.priority) {
        if (priority < 1 || priority > 5) {
          throw new Error(`Invalid priority value: ${priority}. Priority must be between 1 and 5.`);
        }
      }
    }
    
    // Validate risk values if provided
    if (filters.risk) {
      for (const risk of filters.risk) {
        if (risk < 1 || risk > 3) {
          throw new Error(`Invalid risk value: ${risk}. Risk must be between 1 and 3.`);
        }
      }
    }
    
    // Validate type values if provided
    if (filters.type) {
      const validTypes = ['standard', 'normal', 'emergency'];
      for (const type of filters.type) {
        if (!validTypes.includes(type)) {
          throw new Error(`Invalid type value: ${type}. Type must be one of: ${validTypes.join(', ')}.`);
        }
      }
    }
  }

  /**
   * Build ServiceNow encoded query string from filters
   * 
   * @param filters - Filter criteria
   * @returns Encoded query string
   */
  private buildQuery(filters: ChangeRequestFilters): string {
    const queryParts: string[] = [];
    
    // Add state filter
    if (filters.state && filters.state.length > 0) {
      const stateQuery = filters.state.map(s => `state=${s}`).join('^OR');
      queryParts.push(`(${stateQuery})`);
    }
    
    // Add priority filter
    if (filters.priority && filters.priority.length > 0) {
      const priorityQuery = filters.priority.map(p => `priority=${p}`).join('^OR');
      queryParts.push(`(${priorityQuery})`);
    }
    
    // Add risk filter
    if (filters.risk && filters.risk.length > 0) {
      const riskQuery = filters.risk.map(r => `risk=${r}`).join('^OR');
      queryParts.push(`(${riskQuery})`);
    }
    
    // Add type filter
    if (filters.type && filters.type.length > 0) {
      const typeQuery = filters.type.map(t => `type=${t}`).join('^OR');
      queryParts.push(`(${typeQuery})`);
    }
    
    // Add assigned_to filter
    if (filters.assigned_to) {
      queryParts.push(`assigned_to=${filters.assigned_to}`);
    }
    
    // Add assignment_group filter
    if (filters.assignment_group) {
      queryParts.push(`assignment_group=${filters.assignment_group}`);
    }
    
    // Add category filter
    if (filters.category) {
      queryParts.push(`category=${filters.category}`);
    }
    
    // Add requested_by filter
    if (filters.requested_by) {
      queryParts.push(`requested_by=${filters.requested_by}`);
    }
    
    // Add cab_required filter
    if (filters.cab_required !== undefined) {
      queryParts.push(`cab_required=${filters.cab_required}`);
    }
    
    // Add on_hold filter
    if (filters.on_hold !== undefined) {
      queryParts.push(`on_hold=${filters.on_hold}`);
    }
    
    // Add production_system filter
    if (filters.production_system !== undefined) {
      queryParts.push(`production_system=${filters.production_system}`);
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }

  /**
   * Transform ServiceNow record to ChangeRequestSummary
   * 
   * @param record - ServiceNow record
   * @returns ChangeRequestSummary object
   */
  private toChangeRequestSummary(record: ServiceNowRecord): ChangeRequestSummary {
    return {
      sys_id: record.sys_id,
      number: String(record.number || ''),
      short_description: String(record.short_description || ''),
      state: String(record.state || ''),
      priority: Number(record.priority || 0),
      risk: Number(record.risk || 0),
      type: String(record.type || ''),
      assigned_to: record.assigned_to ? String(record.assigned_to) : null,
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }

  /**
   * Transform ServiceNow record to ChangeRequestDetail
   * 
   * @param record - ServiceNow record
   * @returns ChangeRequestDetail object
   */
  private toChangeRequestDetail(record: ServiceNowRecord): ChangeRequestDetail {
    return {
      // Base fields from ChangeRequestSummary
      sys_id: record.sys_id,
      number: String(record.number || ''),
      short_description: String(record.short_description || ''),
      state: String(record.state || ''),
      priority: Number(record.priority || 0),
      risk: Number(record.risk || 0),
      type: String(record.type || ''),
      assigned_to: record.assigned_to ? String(record.assigned_to) : null,
      sys_updated_on: String(record.sys_updated_on || ''),
      
      // Inherits all Task fields
      description: String(record.description || ''),
      opened_by: String(record.opened_by || ''),
      closed_by: record.closed_by ? String(record.closed_by) : null,
      sys_created_on: String(record.sys_created_on || ''),
      opened: String(record.opened || ''),
      closed: record.closed ? String(record.closed) : null,
      due_date: record.due_date ? String(record.due_date) : null,
      work_notes: record.work_notes ? String(record.work_notes) : null,
      assignment_group: record.assignment_group ? String(record.assignment_group) : null,
      company: record.company ? String(record.company) : null,
      location: record.location ? String(record.location) : null,
      parent: record.parent ? String(record.parent) : null,
      
      // Change request-specific fields
      category: record.category ? String(record.category) : null,
      start_date: record.start_date ? String(record.start_date) : null,
      end_date: record.end_date ? String(record.end_date) : null,
      
      // Change management fields
      backout_plan: record.backout_plan ? String(record.backout_plan) : null,
      cab_date: record.cab_date ? String(record.cab_date) : null,
      cab_delegate: record.cab_delegate ? String(record.cab_delegate) : null,
      cab_recommendation: record.cab_recommendation ? String(record.cab_recommendation) : null,
      cab_required: Boolean(record.cab_required === 'true' || record.cab_required === true),
      change_plan: record.change_plan ? String(record.change_plan) : null,
      chg_model: record.chg_model ? String(record.chg_model) : null,
      conflict_last_run: record.conflict_last_run ? String(record.conflict_last_run) : null,
      conflict_status: record.conflict_status ? String(record.conflict_status) : null,
      implementation_plan: record.implementation_plan ? String(record.implementation_plan) : null,
      justification: record.justification ? String(record.justification) : null,
      on_hold: Boolean(record.on_hold === 'true' || record.on_hold === true),
      on_hold_reason: record.on_hold_reason ? String(record.on_hold_reason) : null,
      on_hold_task: record.on_hold_task ? String(record.on_hold_task) : null,
      outside_maintenance_schedule: Boolean(record.outside_maintenance_schedule === 'true' || record.outside_maintenance_schedule === true),
      phase: record.phase ? String(record.phase) : null,
      phase_state: record.phase_state ? String(record.phase_state) : null,
      production_system: Boolean(record.production_system === 'true' || record.production_system === true),
      reason: record.reason ? String(record.reason) : null,
      requested_by: record.requested_by ? String(record.requested_by) : null,
      requested_by_date: record.requested_by_date ? String(record.requested_by_date) : null,
      review_comments: record.review_comments ? String(record.review_comments) : null,
      review_date: record.review_date ? String(record.review_date) : null,
      review_status: record.review_status ? String(record.review_status) : null,
      scope: record.scope ? String(record.scope) : null,
      std_change_producer_version: record.std_change_producer_version ? String(record.std_change_producer_version) : null,
      test_plan: record.test_plan ? String(record.test_plan) : null,
      unauthorized: Boolean(record.unauthorized === 'true' || record.unauthorized === true),
      
      // Task fields (inherited from task table)
      activity_due: record.activity_due ? String(record.activity_due) : null,
      actual_end: record.actual_end ? String(record.actual_end) : null,
      actual_start: record.actual_start ? String(record.actual_start) : null,
      additional_assignee_list: record.additional_assignee_list ? String(record.additional_assignee_list) : null,
      approval: record.approval ? String(record.approval) : null,
      approval_history: record.approval_history ? String(record.approval_history) : null,
      approval_set: record.approval_set ? String(record.approval_set) : null,
      business_duration: record.business_duration ? String(record.business_duration) : null,
      close_notes: record.close_notes ? String(record.close_notes) : null,
      comments_and_work_notes: record.comments_and_work_notes ? String(record.comments_and_work_notes) : null,
      configuration_item: record.configuration_item ? String(record.configuration_item) : null,
      contact_type: record.contact_type ? String(record.contact_type) : null,
      correlation_display: record.correlation_display ? String(record.correlation_display) : null,
      correlation_id: record.correlation_id ? String(record.correlation_id) : null,
      delivery_plan: record.delivery_plan ? String(record.delivery_plan) : null,
      delivery_task: record.delivery_task ? String(record.delivery_task) : null,
      domain: record.domain ? String(record.domain) : null,
      domain_path: record.domain_path ? String(record.domain_path) : null,
      duration: record.duration ? String(record.duration) : null,
      escalation: Number(record.escalation || 0),
      expected_start: record.expected_start ? String(record.expected_start) : null,
      follow_up: record.follow_up ? String(record.follow_up) : null,
      group_list: record.group_list ? String(record.group_list) : null,
      impact: Number(record.impact || 0),
      knowledge: Boolean(record.knowledge === 'true' || record.knowledge === true),
      made_sla: Boolean(record.made_sla === 'true' || record.made_sla === true),
      order: Number(record.order || 0),
      reassignment_count: Number(record.reassignment_count || 0),
      rejection_goto: record.rejection_goto ? String(record.rejection_goto) : null,
      service_offering: record.service_offering ? String(record.service_offering) : null,
      sla_due: record.sla_due ? String(record.sla_due) : null,
      sys_tags: record.sys_tags ? String(record.sys_tags) : null,
      task_type: record.task_type ? String(record.task_type) : null,
      time_worked: record.time_worked ? String(record.time_worked) : null,
      transfer_reason: record.transfer_reason ? String(record.transfer_reason) : null,
      universal_request: record.universal_request ? String(record.universal_request) : null,
      upon_approval: record.upon_approval ? String(record.upon_approval) : null,
      upon_reject: record.upon_reject ? String(record.upon_reject) : null,
      urgency: Number(record.urgency || 0),
      user_input: record.user_input ? String(record.user_input) : null,
      variables: record.variables ? String(record.variables) : null,
      watch_list: record.watch_list ? String(record.watch_list) : null,
      work_notes_list: record.work_notes_list ? String(record.work_notes_list) : null,
      workflow_activity: record.workflow_activity ? String(record.workflow_activity) : null,
      
      // Audit fields
      sys_created_by: String(record.sys_created_by || ''),
      sys_updated_by: String(record.sys_updated_by || ''),
      sys_mod_count: Number(record.sys_mod_count || 0)
    };
  }
}
