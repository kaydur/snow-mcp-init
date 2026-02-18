import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { ScrumTaskFilters, ScrumTaskSummary, ScrumTaskDetail } from '../types/scrumTask.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * ScrumTaskService provides business logic for scrum task operations
 * 
 * Handles querying, retrieving, and listing scrum tasks from ServiceNow,
 * including filter application, query building, and data transformation.
 */
export class ScrumTaskService {
  private client: ServiceNowClient;

  /**
   * Create a ScrumTaskService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Query scrum tasks with filters
   * 
   * @param filters - Filter criteria for scrum tasks
   * @returns Promise resolving to array of scrum task summaries
   * @throws ServiceNowError if query fails
   */
  async queryScrumTasks(filters: ScrumTaskFilters = {}): Promise<ScrumTaskSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_scrum_tasks', 'Querying scrum tasks', {
        params: { filters }
      });
      
      // Validate filters
      this.validateFilters(filters);
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('rm_scrum_task', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to scrum task summaries
      const results = response.result.map(record => this.toScrumTaskSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_scrum_tasks', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_scrum_tasks', 'Query failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get a specific scrum task by sys_id or scrum task number
   * 
   * @param identifier - Scrum task sys_id or number
   * @returns Promise resolving to scrum task detail or null if not found
   * @throws ServiceNowError if retrieval fails
   */
  async getScrumTask(identifier: string): Promise<ScrumTaskDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_scrum_task', 'Retrieving scrum task', {
        params: { identifier }
      });
      
      // Check if identifier looks like a sys_id (32 character hex string)
      const isSysId = /^[0-9a-f]{32}$/i.test(identifier);
      
      let result: ScrumTaskDetail | null = null;
      
      if (isSysId) {
        // Retrieve by sys_id
        const record = await this.client.getById('rm_scrum_task', identifier);
        result = this.toScrumTaskDetail(record);
      } else {
        // Search by number
        const response = await this.client.get('rm_scrum_task', {
          sysparm_query: `number=${identifier}`,
          sysparm_limit: 1,
          sysparm_display_value: false
        });
        
        if (response.result.length === 0) {
          result = null;
        } else {
          result = this.toScrumTaskDetail(response.result[0]);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_scrum_task', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_scrum_task', 'Scrum task not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_scrum_task', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * List recent scrum tasks ordered by updated timestamp
   * 
   * @param limit - Maximum number of scrum tasks to return (default 25, max 100)
   * @returns Promise resolving to array of scrum task summaries
   * @throws ServiceNowError if list operation fails
   */
  async listRecentScrumTasks(limit: number = 25): Promise<ScrumTaskSummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_recent_scrum_tasks', 'Listing recent scrum tasks', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by updated_at descending
      const response = await this.client.get('rm_scrum_task', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to scrum task summaries
      const results = response.result.map(record => this.toScrumTaskSummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_recent_scrum_tasks', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_recent_scrum_tasks', 'List failed', {
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
  private validateFilters(filters: ScrumTaskFilters): void {
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
  private buildQuery(filters: ScrumTaskFilters): string {
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
    
    // Add sprint filter
    if (filters.sprint) {
      queryParts.push(`sprint=${filters.sprint}`);
    }
    
    // Add assigned_to filter
    if (filters.assigned_to) {
      queryParts.push(`assigned_to=${filters.assigned_to}`);
    }
    
    // Add parent_story filter
    if (filters.parent_story) {
      queryParts.push(`parent=${filters.parent_story}`);
    }
    
    // Add assignment_group filter
    if (filters.assignment_group) {
      queryParts.push(`assignment_group=${filters.assignment_group}`);
    }
    
    // Add company filter
    if (filters.company) {
      queryParts.push(`company=${filters.company}`);
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }

  /**
   * Transform ServiceNow record to ScrumTaskSummary
   * 
   * @param record - ServiceNow record
   * @returns ScrumTaskSummary object
   */
  private toScrumTaskSummary(record: ServiceNowRecord): ScrumTaskSummary {
    return {
      sys_id: record.sys_id,
      number: String(record.number || ''),
      short_description: String(record.short_description || ''),
      state: String(record.state || ''),
      priority: Number(record.priority || 0),
      assigned_to: record.assigned_to ? String(record.assigned_to) : null,
      remaining_work: record.remaining_work !== undefined && record.remaining_work !== null && record.remaining_work !== '' 
        ? Number(record.remaining_work) 
        : null,
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }

  /**
   * Transform ServiceNow record to ScrumTaskDetail
   * 
   * @param record - ServiceNow record
   * @returns ScrumTaskDetail object
   */
  private toScrumTaskDetail(record: ServiceNowRecord): ScrumTaskDetail {
    return {
      // Base fields from ScrumTaskSummary
      sys_id: record.sys_id,
      number: String(record.number || ''),
      short_description: String(record.short_description || ''),
      state: String(record.state || ''),
      priority: Number(record.priority || 0),
      assigned_to: record.assigned_to ? String(record.assigned_to) : null,
      remaining_work: record.remaining_work !== undefined && record.remaining_work !== null && record.remaining_work !== '' 
        ? Number(record.remaining_work) 
        : null,
      sys_updated_on: String(record.sys_updated_on || ''),
      
      // Inherits all Task fields
      description: String(record.description || ''),
      opened_by: String(record.opened_by || ''),
      closed_by: record.closed_by ? String(record.closed_by) : null,
      sys_created_on: String(record.sys_created_on || ''),
      opened: String(record.opened || ''),
      closed: record.closed ? String(record.closed) : null,
      due_date: record.due_date ? String(record.due_date) : null,
      activity_due: record.activity_due ? String(record.activity_due) : null,
      actual_start: record.actual_start ? String(record.actual_start) : null,
      actual_end: record.actual_end ? String(record.actual_end) : null,
      work_notes: record.work_notes ? String(record.work_notes) : null,
      assignment_group: record.assignment_group ? String(record.assignment_group) : null,
      company: record.company ? String(record.company) : null,
      location: record.location ? String(record.location) : null,
      
      // Scrum task-specific fields
      parent: record.parent ? String(record.parent) : null,
      sprint: record.sprint ? String(record.sprint) : null,
      
      // Additional assignees
      additional_assignee_list: record.additional_assignee_list ? String(record.additional_assignee_list) : null,
      
      // Planned task columns
      actual_cost: record.actual_cost ? String(record.actual_cost) : null,
      actual_duration: record.actual_duration ? String(record.actual_duration) : null,
      actual_effort: record.actual_effort ? String(record.actual_effort) : null,
      allow_dates_outside_schedule: Boolean(record.allow_dates_outside_schedule === 'true' || record.allow_dates_outside_schedule === true),
      budget_cost: record.budget_cost ? String(record.budget_cost) : null,
      calculation: record.calculation ? String(record.calculation) : null,
      constraint_date: record.constraint_date ? String(record.constraint_date) : null,
      critical_path: Boolean(record.critical_path === 'true' || record.critical_path === true),
      dependency: record.dependency ? String(record.dependency) : null,
      end_date_derived_from: record.end_date_derived_from ? String(record.end_date_derived_from) : null,
      has_conflict: Boolean(record.has_conflict === 'true' || record.has_conflict === true),
      has_issue: Boolean(record.has_issue === 'true' || record.has_issue === true),
      key_milestone: Boolean(record.key_milestone === 'true' || record.key_milestone === true),
      level: Number(record.level || 0),
      milestone: Boolean(record.milestone === 'true' || record.milestone === true),
      model_id: record.model_id ? String(record.model_id) : null,
      orig_sys_id: record.orig_sys_id ? String(record.orig_sys_id) : null,
      orig_top_task_id: record.orig_top_task_id ? String(record.orig_top_task_id) : null,
      original_end_date: record.original_end_date ? String(record.original_end_date) : null,
      original_start_date: record.original_start_date ? String(record.original_start_date) : null,
      override_status: Boolean(record.override_status === 'true' || record.override_status === true),
      percent_complete: record.percent_complete !== undefined && record.percent_complete !== null && record.percent_complete !== '' 
        ? Number(record.percent_complete) 
        : null,
      planned_capital: record.planned_capital ? String(record.planned_capital) : null,
      planned_duration: record.planned_duration ? String(record.planned_duration) : null,
      planned_effort: record.planned_effort ? String(record.planned_effort) : null,
      planned_end_date: record.planned_end_date ? String(record.planned_end_date) : null,
      planned_start_date: record.planned_start_date ? String(record.planned_start_date) : null,
      relation_applied: Boolean(record.relation_applied === 'true' || record.relation_applied === true),
      remaining_duration: record.remaining_duration ? String(record.remaining_duration) : null,
      remaining_effort: record.remaining_effort ? String(record.remaining_effort) : null,
      rollup: Boolean(record.rollup === 'true' || record.rollup === true),
      run_calculation_brs: Boolean(record.run_calculation_brs === 'true' || record.run_calculation_brs === true),
      software_model: record.software_model ? String(record.software_model) : null,
      start_date_derived_from: record.start_date_derived_from ? String(record.start_date_derived_from) : null,
      status: record.status ? String(record.status) : null,
      sub_tree_root: record.sub_tree_root ? String(record.sub_tree_root) : null,
      
      // Task columns (inherited from task table)
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
