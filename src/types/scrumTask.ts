/**
 * Scrum task state enum with numeric values matching ServiceNow
 */
export enum ScrumTaskState {
  Ready = 1,
  WorkInProgress = 2,
  Complete = 3,
  Canceled = 4
}

/**
 * Scrum task priority enum with numeric values matching ServiceNow
 */
export enum ScrumTaskPriority {
  Critical = 1,
  High = 2,
  Moderate = 3,
  Low = 4,
  Planning = 5
}

/**
 * Summary view of a scrum task (used in query and list operations)
 */
export interface ScrumTaskSummary {
  sys_id: string;
  number: string;
  short_description: string;
  state: string;
  priority: number;
  assigned_to: string | null;
  remaining_work: number | null;
  sys_updated_on: string;
}

/**
 * Detailed view of a scrum task (used in get operations)
 * Includes all task fields plus scrum task-specific fields from rm_scrum_task
 */
export interface ScrumTaskDetail extends ScrumTaskSummary {
  // Inherits all Task fields
  description: string;
  opened_by: string;
  closed_by: string | null;
  sys_created_on: string;
  opened: string;
  closed: string | null;
  due_date: string | null;
  activity_due: string | null;
  actual_start: string | null;
  actual_end: string | null;
  work_notes: string | null;
  assignment_group: string | null;
  company: string | null;
  location: string | null;
  
  // Scrum task-specific fields
  parent: string | null; // parent story
  sprint: string | null;
  
  // Additional assignees
  additional_assignee_list: string | null;
  
  // Planned task columns
  actual_cost: string | null;
  actual_duration: string | null;
  actual_effort: string | null;
  allow_dates_outside_schedule: boolean;
  budget_cost: string | null;
  calculation: string | null;
  constraint_date: string | null;
  critical_path: boolean;
  dependency: string | null;
  end_date_derived_from: string | null;
  has_conflict: boolean;
  has_issue: boolean;
  key_milestone: boolean;
  level: number;
  milestone: boolean;
  model_id: string | null;
  orig_sys_id: string | null;
  orig_top_task_id: string | null;
  original_end_date: string | null;
  original_start_date: string | null;
  override_status: boolean;
  percent_complete: number | null;
  planned_capital: string | null;
  planned_duration: string | null;
  planned_effort: string | null;
  planned_end_date: string | null;
  planned_start_date: string | null;
  relation_applied: boolean;
  remaining_duration: string | null;
  remaining_effort: string | null;
  rollup: boolean;
  run_calculation_brs: boolean;
  software_model: string | null;
  start_date_derived_from: string | null;
  status: string | null;
  sub_tree_root: string | null;
  
  // Task columns (inherited from task table)
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
 * Filter parameters for querying scrum tasks
 */
export interface ScrumTaskFilters {
  state?: string[];
  priority?: number[];
  sprint?: string;
  assigned_to?: string;
  parent_story?: string;
  assignment_group?: string;
  company?: string;
  query?: string;
  limit?: number;
}
