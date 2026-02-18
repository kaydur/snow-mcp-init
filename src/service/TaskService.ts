import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { TaskFilters, TaskSummary, TaskDetail } from '../types/task.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * TaskService provides business logic for task operations
 * 
 * Handles querying, retrieving, and listing tasks from ServiceNow,
 * including filter application, query building, and data transformation.
 */
export class TaskService {
  private client: ServiceNowClient;

  /**
   * Create a TaskService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Query tasks with filters
   * 
   * @param filters - Filter criteria for tasks
   * @returns Promise resolving to array of task summaries
   * @throws ServiceNowError if query fails
   */
  async queryTasks(filters: TaskFilters = {}): Promise<TaskSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_tasks', 'Querying tasks', {
        params: { filters }
      });
      
      // Validate filters
      this.validateFilters(filters);
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('task', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to task summaries
      const results = response.result.map(record => this.toTaskSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_tasks', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_tasks', 'Query failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get a specific task by sys_id or task number
   * 
   * @param identifier - Task sys_id or number
   * @returns Promise resolving to task detail or null if not found
   * @throws ServiceNowError if retrieval fails
   */
  async getTask(identifier: string): Promise<TaskDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_task', 'Retrieving task', {
        params: { identifier }
      });
      
      // Check if identifier looks like a sys_id (32 character hex string)
      const isSysId = /^[0-9a-f]{32}$/i.test(identifier);
      
      let result: TaskDetail | null = null;
      
      if (isSysId) {
        // Retrieve by sys_id
        const record = await this.client.getById('task', identifier);
        result = this.toTaskDetail(record);
      } else {
        // Search by number
        const response = await this.client.get('task', {
          sysparm_query: `number=${identifier}`,
          sysparm_limit: 1,
          sysparm_display_value: false
        });
        
        if (response.result.length === 0) {
          result = null;
        } else {
          result = this.toTaskDetail(response.result[0]);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_task', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_task', 'Task not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_task', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * List recent tasks ordered by updated timestamp
   * 
   * @param limit - Maximum number of tasks to return (default 25, max 100)
   * @returns Promise resolving to array of task summaries
   * @throws ServiceNowError if list operation fails
   */
  async listRecentTasks(limit: number = 25): Promise<TaskSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_recent_tasks', 'Listing recent tasks', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by updated_at descending
      const response = await this.client.get('task', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to task summaries
      const results = response.result.map(record => this.toTaskSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_recent_tasks', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_recent_tasks', 'List failed', {
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
  private validateFilters(filters: TaskFilters): void {
    // Validate priority values if provided
    if (filters.priority) {
      for (const priority of filters.priority) {
        if (priority < 1 || priority > 5) {
          throw new Error(`Invalid priority value: ${priority}. Priority must be between 1 and 5.`);
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
  private buildQuery(filters: TaskFilters): string {
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
    
    // Add assigned_to filter
    if (filters.assigned_to) {
      queryParts.push(`assigned_to=${filters.assigned_to}`);
    }
    
    // Add assignment_group filter
    if (filters.assignment_group) {
      queryParts.push(`assignment_group=${filters.assignment_group}`);
    }
    
    // Add company filter
    if (filters.company) {
      queryParts.push(`company=${filters.company}`);
    }
    
    // Add location filter
    if (filters.location) {
      queryParts.push(`location=${filters.location}`);
    }
    
    // Add opened_by filter
    if (filters.opened_by) {
      queryParts.push(`opened_by=${filters.opened_by}`);
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
   * Transform ServiceNow record to TaskSummary
   * 
   * @param record - ServiceNow record
   * @returns TaskSummary object
   */
  private toTaskSummary(record: ServiceNowRecord): TaskSummary {
    return {
      sys_id: record.sys_id,
      number: String(record.number || ''),
      short_description: String(record.short_description || ''),
      state: String(record.state || ''),
      priority: Number(record.priority || 0),
      assigned_to: record.assigned_to ? String(record.assigned_to) : null,
      assignment_group: record.assignment_group ? String(record.assignment_group) : null,
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }

  /**
   * Transform ServiceNow record to TaskDetail
   * 
   * @param record - ServiceNow record
   * @returns TaskDetail object
   */
  private toTaskDetail(record: ServiceNowRecord): TaskDetail {
    return {
      // Base fields from TaskSummary
      sys_id: record.sys_id,
      number: String(record.number || ''),
      short_description: String(record.short_description || ''),
      state: String(record.state || ''),
      priority: Number(record.priority || 0),
      assigned_to: record.assigned_to ? String(record.assigned_to) : null,
      assignment_group: record.assignment_group ? String(record.assignment_group) : null,
      sys_updated_on: String(record.sys_updated_on || ''),
      
      // Description and details
      description: String(record.description || ''),
      
      // Assignment and ownership
      opened_by: String(record.opened_by || ''),
      closed_by: record.closed_by ? String(record.closed_by) : null,
      
      // Dates and timing
      sys_created_on: String(record.sys_created_on || ''),
      opened: String(record.opened || ''),
      closed: record.closed ? String(record.closed) : null,
      due_date: record.due_date ? String(record.due_date) : null,
      activity_due: record.activity_due ? String(record.activity_due) : null,
      actual_start: record.actual_start ? String(record.actual_start) : null,
      actual_end: record.actual_end ? String(record.actual_end) : null,
      
      // Work tracking
      work_notes: record.work_notes ? String(record.work_notes) : null,
      work_notes_list: record.work_notes_list ? String(record.work_notes_list) : null,
      additional_comments: record.additional_comments ? String(record.additional_comments) : null,
      comments_and_work_notes: record.comments_and_work_notes ? String(record.comments_and_work_notes) : null,
      close_notes: record.close_notes ? String(record.close_notes) : null,
      
      // Organizational context
      company: record.company ? String(record.company) : null,
      location: record.location ? String(record.location) : null,
      configuration_item: record.configuration_item ? String(record.configuration_item) : null,
      
      // Relationships
      parent: record.parent ? String(record.parent) : null,
      
      // Approval and workflow
      approval: record.approval ? String(record.approval) : null,
      approval_history: record.approval_history ? String(record.approval_history) : null,
      approval_set: record.approval_set ? String(record.approval_set) : null,
      
      // Business context
      business_duration: record.business_duration ? String(record.business_duration) : null,
      
      // Contact information
      contact_type: record.contact_type ? String(record.contact_type) : null,
      
      // Correlation and integration
      correlation_id: record.correlation_id ? String(record.correlation_id) : null,
      correlation_display: record.correlation_display ? String(record.correlation_display) : null,
      
      // Delivery and execution
      delivery_plan: record.delivery_plan ? String(record.delivery_plan) : null,
      delivery_task: record.delivery_task ? String(record.delivery_task) : null,
      
      // Domain and path
      domain: record.domain ? String(record.domain) : null,
      domain_path: record.domain_path ? String(record.domain_path) : null,
      
      // Duration and effort
      duration: record.duration ? String(record.duration) : null,
      
      // Escalation
      escalation: Number(record.escalation || 0),
      expected_start: record.expected_start ? String(record.expected_start) : null,
      
      // Follow-up
      follow_up: record.follow_up ? String(record.follow_up) : null,
      
      // Group management
      group_list: record.group_list ? String(record.group_list) : null,
      
      // Impact and urgency
      impact: Number(record.impact || 0),
      urgency: Number(record.urgency || 0),
      
      // Knowledge
      knowledge: Boolean(record.knowledge === 'true' || record.knowledge === true),
      
      // Made SLA
      made_sla: Boolean(record.made_sla === 'true' || record.made_sla === true),
      
      // Order
      order: Number(record.order || 0),
      
      // Reassignment
      reassignment_count: Number(record.reassignment_count || 0),
      rejection_goto: record.rejection_goto ? String(record.rejection_goto) : null,
      
      // Service and offering
      service_offering: record.service_offering ? String(record.service_offering) : null,
      
      // SLA
      sla_due: record.sla_due ? String(record.sla_due) : null,
      
      // State tracking
      state_tracking: record.state_tracking ? String(record.state_tracking) : null,
      
      // Tags
      sys_tags: record.sys_tags ? String(record.sys_tags) : null,
      
      // Task type
      task_type: record.task_type ? String(record.task_type) : null,
      
      // Time worked
      time_worked: record.time_worked ? String(record.time_worked) : null,
      
      // Transfer reason
      transfer_reason: record.transfer_reason ? String(record.transfer_reason) : null,
      
      // Universal request
      universal_request: record.universal_request ? String(record.universal_request) : null,
      
      // Upon approval/reject
      upon_approval: record.upon_approval ? String(record.upon_approval) : null,
      upon_reject: record.upon_reject ? String(record.upon_reject) : null,
      
      // User input
      user_input: record.user_input ? String(record.user_input) : null,
      
      // Variables
      variables: record.variables ? String(record.variables) : null,
      
      // Watch list
      watch_list: record.watch_list ? String(record.watch_list) : null,
      
      // Workflow activity
      workflow_activity: record.workflow_activity ? String(record.workflow_activity) : null,
      
      // Audit fields
      sys_created_by: String(record.sys_created_by || ''),
      sys_updated_by: String(record.sys_updated_by || ''),
      sys_mod_count: Number(record.sys_mod_count || 0)
    };
  }
}
