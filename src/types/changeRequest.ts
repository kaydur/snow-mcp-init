/**
 * Change request state enum with numeric values matching ServiceNow
 */
export enum ChangeRequestState {
  New = -5,
  Assess = -4,
  Authorize = -3,
  Scheduled = -2,
  Implement = -1,
  Review = 0,
  Closed = 3,
  Canceled = 4
}

/**
 * Change request priority enum with numeric values matching ServiceNow
 */
export enum ChangeRequestPriority {
  Critical = 1,
  High = 2,
  Moderate = 3,
  Low = 4,
  Planning = 5
}

/**
 * Change request risk enum with numeric values matching ServiceNow
 */
export enum ChangeRequestRisk {
  High = 1,
  Moderate = 2,
  Low = 3
}

/**
 * Change request type enum with string values matching ServiceNow
 */
export enum ChangeRequestType {
  Standard = 'standard',
  Normal = 'normal',
  Emergency = 'emergency'
}

/**
 * Summary view of a change request (used in query and list operations)
 */
export interface ChangeRequestSummary {
  sys_id: string;
  number: string;
  short_description: string;
  state: string;
  priority: number;
  risk: number;
  type: string;
  assigned_to: string | null;
  sys_updated_on: string;
}

/**
 * Detailed view of a change request (used in get operations)
 * Includes all task fields plus change request-specific fields
 */
export interface ChangeRequestDetail extends ChangeRequestSummary {
  // Inherits all Task fields
  description: string;
  opened_by: string;
  closed_by: string | null;
  sys_created_on: string;
  opened: string;
  closed: string | null;
  due_date: string | null;
  work_notes: string | null;
  assignment_group: string | null;
  company: string | null;
  location: string | null;
  parent: string | null;
  
  // Change request-specific fields
  category: string | null;
  start_date: string | null;
  end_date: string | null;
  
  // Change management fields
  backout_plan: string | null;
  cab_date: string | null;
  cab_delegate: string | null;
  cab_recommendation: string | null;
  cab_required: boolean;
  change_plan: string | null;
  chg_model: string | null;
  conflict_last_run: string | null;
  conflict_status: string | null;
  implementation_plan: string | null;
  justification: string | null;
  on_hold: boolean;
  on_hold_reason: string | null;
  on_hold_task: string | null;
  outside_maintenance_schedule: boolean;
  phase: string | null;
  phase_state: string | null;
  production_system: boolean;
  reason: string | null;
  requested_by: string | null;
  requested_by_date: string | null;
  review_comments: string | null;
  review_date: string | null;
  review_status: string | null;
  scope: string | null;
  std_change_producer_version: string | null;
  test_plan: string | null;
  unauthorized: boolean;
  
  // Task fields (inherited from task table)
  activity_due: string | null;
  actual_end: string | null;
  actual_start: string | null;
  additional_assignee_list: string | null;
  approval: string | null;
  approval_history: string | null;
  approval_set: string | null;
  business_duration: string | null;
  close_notes: string | null;
  comments_and_work_notes: string | null;
  configuration_item: string | null;
  contact_type: string | null;
  correlation_display: string | null;
  correlation_id: string | null;
  delivery_plan: string | null;
  delivery_task: string | null;
  domain: string | null;
  domain_path: string | null;
  duration: string | null;
  escalation: number;
  expected_start: string | null;
  follow_up: string | null;
  group_list: string | null;
  impact: number;
  knowledge: boolean;
  made_sla: boolean;
  order: number;
  reassignment_count: number;
  rejection_goto: string | null;
  service_offering: string | null;
  sla_due: string | null;
  sys_tags: string | null;
  task_type: string | null;
  time_worked: string | null;
  transfer_reason: string | null;
  universal_request: string | null;
  upon_approval: string | null;
  upon_reject: string | null;
  urgency: number;
  user_input: string | null;
  variables: string | null;
  watch_list: string | null;
  work_notes_list: string | null;
  workflow_activity: string | null;
  
  // Audit fields
  sys_created_by: string;
  sys_updated_by: string;
  sys_mod_count: number;
}

/**
 * Filter parameters for querying change requests
 */
export interface ChangeRequestFilters {
  state?: string[];
  priority?: number[];
  risk?: number[];
  type?: string[];
  assigned_to?: string;
  assignment_group?: string;
  category?: string;
  requested_by?: string;
  cab_required?: boolean;
  on_hold?: boolean;
  production_system?: boolean;
  query?: string;
  limit?: number;
}
