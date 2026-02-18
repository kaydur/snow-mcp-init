import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { StoryFilters, StorySummary, StoryDetail } from '../types/story.js';
import { ServiceNowRecord } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * StoryService provides business logic for story operations
 * 
 * Handles querying, retrieving, and listing stories from ServiceNow,
 * including filter application, query building, and data transformation.
 */
export class StoryService {
  private client: ServiceNowClient;

  /**
   * Create a StoryService instance
   * 
   * @param client - ServiceNowClient for API communication
   */
  constructor(client: ServiceNowClient) {
    this.client = client;
  }

  /**
   * Query stories with filters
   * 
   * @param filters - Filter criteria for stories
   * @returns Promise resolving to array of story summaries
   * @throws ServiceNowError if query fails
   */
  async queryStories(filters: StoryFilters = {}): Promise<StorySummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('query_stories', 'Querying stories', {
        params: { filters }
      });
      
      // Validate filters
      this.validateFilters(filters);
      
      // Build query string from filters
      const query = this.buildQuery(filters);
      
      // Apply limit (default 25, max 100)
      const limit = Math.min(filters.limit || 25, 100);
      
      // Execute query
      const response = await this.client.get('rm_story', {
        sysparm_query: query || undefined,
        sysparm_limit: limit,
        sysparm_display_value: false
      });
      
      // Transform results to story summaries
      const results = response.result.map(record => this.toStorySummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('query_stories', 'Query completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('query_stories', 'Query failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * Get a specific story by sys_id or story number
   * 
   * @param identifier - Story sys_id or number
   * @returns Promise resolving to story detail or null if not found
   * @throws ServiceNowError if retrieval fails
   */
  async getStory(identifier: string): Promise<StoryDetail | null> {
    const startTime = Date.now();
    
    try {
      logger.info('get_story', 'Retrieving story', {
        params: { identifier }
      });
      
      // Check if identifier looks like a sys_id (32 character hex string)
      const isSysId = /^[0-9a-f]{32}$/i.test(identifier);
      
      let result: StoryDetail | null = null;
      
      if (isSysId) {
        // Retrieve by sys_id
        const record = await this.client.getById('rm_story', identifier);
        result = this.toStoryDetail(record);
      } else {
        // Search by number
        const response = await this.client.get('rm_story', {
          sysparm_query: `number=${identifier}`,
          sysparm_limit: 1,
          sysparm_display_value: false
        });
        
        if (response.result.length === 0) {
          result = null;
        } else {
          result = this.toStoryDetail(response.result[0]);
        }
      }
      
      const duration = Date.now() - startTime;
      logger.info('get_story', 'Retrieval completed', {
        result: { found: result !== null },
        duration
      });
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      // If it's a NOT_FOUND error, return null instead of throwing
      if (error?.code === 'NOT_FOUND') {
        logger.info('get_story', 'Story not found', {
          result: { found: false },
          duration
        });
        return null;
      }
      
      logger.error('get_story', 'Retrieval failed', {
        error: error,
        duration
      });
      throw error;
    }
  }

  /**
   * List recent stories ordered by updated timestamp
   * 
   * @param limit - Maximum number of stories to return (default 25, max 100)
   * @returns Promise resolving to array of story summaries
   * @throws ServiceNowError if list operation fails
   */
  async listRecentStories(limit: number = 25): Promise<StorySummary[]> {
    const startTime = Date.now();
    
    try {
      logger.info('list_recent_stories', 'Listing recent stories', {
        params: { limit }
      });
      
      // Apply limit (max 100)
      const effectiveLimit = Math.min(limit, 100);
      
      // Query with ordering by updated_at descending
      const response = await this.client.get('rm_story', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: effectiveLimit,
        sysparm_display_value: false
      });
      
      // Transform results to story summaries
      const results = response.result.map(record => this.toStorySummary(record));
      const duration = Date.now() - startTime;
      
      logger.info('list_recent_stories', 'List completed', {
        result: { count: results.length },
        duration
      });
      
      return results;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('list_recent_stories', 'List failed', {
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
  private validateFilters(filters: StoryFilters): void {
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
  private buildQuery(filters: StoryFilters): string {
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
    
    // Add story_points filter
    if (filters.story_points !== undefined) {
      queryParts.push(`story_points=${filters.story_points}`);
    }
    
    // Add product filter
    if (filters.product) {
      queryParts.push(`product=${filters.product}`);
    }
    
    // Add epic filter
    if (filters.epic) {
      queryParts.push(`epic=${filters.epic}`);
    }
    
    // Add blocked filter
    if (filters.blocked !== undefined) {
      queryParts.push(`blocked=${filters.blocked}`);
    }
    
    // Add release filter
    if (filters.release) {
      queryParts.push(`release=${filters.release}`);
    }
    
    // Add parent_feature filter
    if (filters.parent_feature) {
      queryParts.push(`parent_feature=${filters.parent_feature}`);
    }
    
    // Add custom query
    if (filters.query) {
      queryParts.push(filters.query);
    }
    
    // Join all parts with AND operator
    return queryParts.join('^');
  }

  /**
   * Transform ServiceNow record to StorySummary
   * 
   * @param record - ServiceNow record
   * @returns StorySummary object
   */
  private toStorySummary(record: ServiceNowRecord): StorySummary {
    return {
      sys_id: record.sys_id,
      number: String(record.number || ''),
      short_description: String(record.short_description || ''),
      state: String(record.state || ''),
      priority: Number(record.priority || 0),
      assigned_to: record.assigned_to ? String(record.assigned_to) : null,
      story_points: record.story_points !== undefined && record.story_points !== null && record.story_points !== '' 
        ? Number(record.story_points) 
        : null,
      sys_updated_on: String(record.sys_updated_on || '')
    };
  }

  /**
   * Transform ServiceNow record to StoryDetail
   * 
   * @param record - ServiceNow record
   * @returns StoryDetail object
   */
  private toStoryDetail(record: ServiceNowRecord): StoryDetail {
    return {
      // Base fields from StorySummary
      sys_id: record.sys_id,
      number: String(record.number || ''),
      short_description: String(record.short_description || ''),
      state: String(record.state || ''),
      priority: Number(record.priority || 0),
      assigned_to: record.assigned_to ? String(record.assigned_to) : null,
      story_points: record.story_points !== undefined && record.story_points !== null && record.story_points !== '' 
        ? Number(record.story_points) 
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
      work_notes: record.work_notes ? String(record.work_notes) : null,
      assignment_group: record.assignment_group ? String(record.assignment_group) : null,
      company: record.company ? String(record.company) : null,
      location: record.location ? String(record.location) : null,
      parent: record.parent ? String(record.parent) : null,
      
      // Story-specific fields
      acceptance_criteria: record.acceptance_criteria ? String(record.acceptance_criteria) : null,
      backlog_type: record.backlog_type ? String(record.backlog_type) : null,
      blocked: Boolean(record.blocked === 'true' || record.blocked === true),
      blocked_reason: record.blocked_reason ? String(record.blocked_reason) : null,
      classification: record.classification ? String(record.classification) : null,
      defect: record.defect ? String(record.defect) : null,
      enhancement: record.enhancement ? String(record.enhancement) : null,
      epic: record.epic ? String(record.epic) : null,
      global_rank: record.global_rank !== undefined && record.global_rank !== null && record.global_rank !== '' 
        ? Number(record.global_rank) 
        : null,
      group_rank: record.group_rank !== undefined && record.group_rank !== null && record.group_rank !== '' 
        ? Number(record.group_rank) 
        : null,
      points: record.points !== undefined && record.points !== null && record.points !== '' 
        ? Number(record.points) 
        : null,
      prerequisites: record.prerequisites ? String(record.prerequisites) : null,
      product: record.product ? String(record.product) : null,
      product_index: record.product_index !== undefined && record.product_index !== null && record.product_index !== '' 
        ? Number(record.product_index) 
        : null,
      product_rank: record.product_rank !== undefined && record.product_rank !== null && record.product_rank !== '' 
        ? Number(record.product_rank) 
        : null,
      rank: record.rank !== undefined && record.rank !== null && record.rank !== '' 
        ? Number(record.rank) 
        : null,
      release: record.release ? String(record.release) : null,
      release_index: record.release_index !== undefined && record.release_index !== null && record.release_index !== '' 
        ? Number(record.release_index) 
        : null,
      split_from: record.split_from ? String(record.split_from) : null,
      sprint: record.sprint ? String(record.sprint) : null,
      sprint_index: record.sprint_index !== undefined && record.sprint_index !== null && record.sprint_index !== '' 
        ? Number(record.sprint_index) 
        : null,
      theme: record.theme ? String(record.theme) : null,
      type: record.type ? String(record.type) : null,
      
      // Feature columns
      parent_feature: record.parent_feature ? String(record.parent_feature) : null,
      primary_goal: record.primary_goal ? String(record.primary_goal) : null,
      
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
      
      // Audit fields
      sys_created_by: String(record.sys_created_by || ''),
      sys_updated_by: String(record.sys_updated_by || ''),
      sys_mod_count: Number(record.sys_mod_count || 0)
    };
  }
}
