/**
 * Task data models for ServiceNow MCP Server
 */

/**
 * Task state enum with numeric values matching ServiceNow
 */
export enum TaskState {
  Open = 1,
  WorkInProgress = 2,
  Closed = 3,
  Pending = -5,
  Canceled = 4
}

/**
 * Task priority enum with numeric values matching ServiceNow
 */
export enum TaskPriority {
  Critical = 1,
  High = 2,
  Moderate = 3,
  Low = 4,
  Planning = 5
}

/**
 * Summary view of a task (used in query and list operations)
 */
export interface TaskSummary {
  sys_id: string;
  number: string;
  short_description: string;
  state: string;
  priority: number;
  assigned_to: string | null;
  assignment_group: string | null;
  sys_updated_on: string;
}

/**
 * Detailed view of a task (used in get operations)
 * Includes all standard task fields from ServiceNow
 */
export interface TaskDetail extends TaskSummary {
  // Description and details
  description: string;
  
  // Assignment and ownership
  opened_by: string;
  closed_by: string | null;
  
  // Dates and timing
  sys_created_on: string;
  opened: string;
  closed: string | null;
  due_date: string | null;
  activity_due: string | null;
  actual_start: string | null;
  actual_end: string | null;
  
  // Work tracking
  work_notes: string | null;
  work_notes_list: string | null;
  additional_comments: string | null;
  comments_and_work_notes: string | null;
  close_notes: string | null;
  
  // Organizational context
  company: string | null;
  location: string | null;
  configuration_item: string | null;
  
  // Relationships
  parent: string | null;
  
  // Approval and workflow
  approval: string | null;
  approval_history: string | null;
  approval_set: string | null;
  
  // Business context
  business_duration: string | null;
  
  // Contact information
  contact_type: string | null;
  
  // Correlation and integration
  correlation_id: string | null;
  correlation_display: string | null;
  
  // Delivery and execution
  delivery_plan: string | null;
  delivery_task: string | null;
  
  // Domain and path
  domain: string | null;
  domain_path: string | null;
  
  // Duration and effort
  duration: string | null;
  
  // Escalation
  escalation: number;
  expected_start: string | null;
  
  // Follow-up
  follow_up: string | null;
  
  // Group management
  group_list: string | null;
  
  // Impact and urgency
  impact: number;
  urgency: number;
  
  // Knowledge
  knowledge: boolean;
  
  // Made SLA
  made_sla: boolean;
  
  // Order
  order: number;
  
  // Reassignment
  reassignment_count: number;
  rejection_goto: string | null;
  
  // Service and offering
  service_offering: string | null;
  
  // SLA
  sla_due: string | null;
  
  // State tracking
  state_tracking: string | null;
  
  // Tags
  sys_tags: string | null;
  
  // Task type
  task_type: string | null;
  
  // Time worked
  time_worked: string | null;
  
  // Transfer reason
  transfer_reason: string | null;
  
  // Universal request
  universal_request: string | null;
  
  // Upon approval/reject
  upon_approval: string | null;
  upon_reject: string | null;
  
  // User input
  user_input: string | null;
  
  // Variables
  variables: string | null;
  
  // Watch list
  watch_list: string | null;
  
  // Workflow activity
  workflow_activity: string | null;
  
  // Audit fields
  sys_created_by: string;
  sys_updated_by: string;
  sys_mod_count: number;
}

/**
 * Filter parameters for querying tasks
 */
export interface TaskFilters {
  state?: string[];
  priority?: number[];
  assigned_to?: string;
  assignment_group?: string;
  company?: string;
  location?: string;
  opened_by?: string;
  parent?: string;
  query?: string;
  limit?: number;
}
