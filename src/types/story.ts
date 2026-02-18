/**
 * Story data models for ServiceNow MCP Server
 */

/**
 * Story state enum with numeric values matching ServiceNow
 */
export enum StoryState {
  Draft = -5,
  Ready = -4,
  InProgress = -3,
  Review = -2,
  Complete = -1,
  Accepted = 3
}

/**
 * Story priority enum with numeric values matching ServiceNow
 */
export enum StoryPriority {
  Critical = 1,
  High = 2,
  Moderate = 3,
  Low = 4,
  Planning = 5
}

/**
 * Summary view of a story (used in query and list operations)
 */
export interface StorySummary {
  sys_id: string;
  number: string;
  short_description: string;
  state: string;
  priority: number;
  assigned_to: string | null;
  story_points: number | null;
  sys_updated_on: string;
}

/**
 * Detailed view of a story (used in get operations)
 * Includes all task fields plus story-specific fields from rm_story
 */
export interface StoryDetail extends StorySummary {
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
  
  // Story-specific fields
  acceptance_criteria: string | null;
  backlog_type: string | null;
  blocked: boolean;
  blocked_reason: string | null;
  classification: string | null;
  defect: string | null;
  enhancement: string | null;
  epic: string | null;
  global_rank: number | null;
  group_rank: number | null;
  points: number | null;
  prerequisites: string | null;
  product: string | null;
  product_index: number | null;
  product_rank: number | null;
  rank: number | null;
  release: string | null;
  release_index: number | null;
  split_from: string | null;
  sprint: string | null;
  sprint_index: number | null;
  theme: string | null;
  type: string | null;
  
  // Feature columns
  parent_feature: string | null;
  primary_goal: string | null;
  
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
  
  // Audit fields
  sys_created_by: string;
  sys_updated_by: string;
  sys_mod_count: number;
}

/**
 * Filter parameters for querying stories
 */
export interface StoryFilters {
  state?: string[];
  priority?: number[];
  sprint?: string;
  assigned_to?: string;
  story_points?: number;
  product?: string;
  epic?: string;
  blocked?: boolean;
  release?: string;
  parent_feature?: string;
  query?: string;
  limit?: number;
}
