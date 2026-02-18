/**
 * Tool parameter and response interfaces for MCP tools
 */

import { IncidentSummary, IncidentDetail } from './incident.js';

/**
 * Parameters for the query_incidents tool
 */
export interface QueryIncidentsParams {
  /** Filter by incident states (New, In Progress, On Hold, Resolved, Closed) */
  state?: string[];
  
  /** Filter by priority levels (1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning) */
  priority?: number[];
  
  /** Filter by assigned user (name or sys_id) */
  assigned_to?: string;
  
  /** Filter by assignment group (name or sys_id) */
  assignment_group?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_incidents tool
 */
export interface QueryIncidentsResponse {
  /** Array of incidents matching the query criteria */
  incidents: IncidentSummary[];
  
  /** Total number of incidents returned */
  count: number;
}

/**
 * Parameters for the get_incident tool
 */
export interface GetIncidentParams {
  /** Incident sys_id or incident number (e.g., INC0010001) */
  identifier: string;
}

/**
 * Response from the get_incident tool
 */
export interface GetIncidentResponse {
  /** The incident details (null if not found) */
  incident: IncidentDetail | null;
  
  /** Whether the incident was found */
  found: boolean;
}

/**
 * Parameters for the list_recent_incidents tool
 */
export interface ListRecentParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_recent_incidents tool
 */
export interface ListRecentResponse {
  /** Array of recent incidents ordered by updated_at descending */
  incidents: IncidentSummary[];
  
  /** Total number of incidents returned */
  count: number;
}

/**
 * Parameters for the execute_glidequery tool
 */
export interface ExecuteGlideQueryParams {
  /** GlideQuery script to execute */
  script: string;
  
  /** Optional timeout in milliseconds (default: 30000, max: 60000) */
  timeout?: number;
}

/**
 * Response from the execute_glidequery tool
 */
export interface ExecuteGlideQueryResponse {
  /** Whether execution was successful */
  success: boolean;
  
  /** Result data from script execution (if successful) */
  result?: any;
  
  /** Log messages generated during execution */
  logs?: string[];
  
  /** Error message if execution failed */
  error?: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
  
  /** Number of records returned (if applicable) */
  recordCount?: number;
}

/**
 * Parameters for the generate_glidequery tool
 */
export interface GenerateGlideQueryParams {
  /** Natural language description of the query */
  description: string;
  
  /** Optional table name hint */
  table?: string;
  
  /** Whether to include explanatory comments (default: true) */
  includeComments?: boolean;
}

/**
 * Response from the generate_glidequery tool
 */
export interface GenerateGlideQueryResponse {
  /** Generated GlideQuery code */
  code: string;
  
  /** Optional explanation of the generated code */
  explanation?: string;
  
  /** Optional warnings about the generation */
  warnings?: string[];
}

/**
 * Parameters for the test_glidequery tool
 */
export interface TestGlideQueryParams {
  /** GlideQuery script to test */
  script: string;
  
  /** Maximum number of results to return (default: 100) */
  maxResults?: number;
}

/**
 * Response from the test_glidequery tool
 */
export interface TestGlideQueryResponse {
  /** Whether execution was successful */
  success: boolean;
  
  /** Result data from script execution (if successful) */
  result?: any;
  
  /** Warnings about the test execution */
  warnings?: string[];
  
  /** Error message if execution failed */
  error?: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
  
  /** Number of records returned (if applicable) */
  recordCount?: number;
  
  /** Whether results were truncated */
  truncated?: boolean;
}

/**
 * Parameters for the query_users tool
 */
export interface QueryUsersParams {
  /** Filter by active status */
  active?: boolean;
  
  /** Filter by department (name or sys_id) */
  department?: string;
  
  /** Filter by role (name or sys_id) */
  role?: string;
  
  /** Filter by user name (partial match) */
  name?: string;
  
  /** Filter by company (name or sys_id) */
  company?: string;
  
  /** Filter by location (name or sys_id) */
  location?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_users tool
 */
export interface QueryUsersResponse {
  /** Array of users matching the query criteria */
  users: import('./user.js').UserSummary[];
  
  /** Total number of users returned */
  count: number;
}

/**
 * Parameters for the get_user tool
 */
export interface GetUserParams {
  /** User sys_id or username */
  identifier: string;
}

/**
 * Response from the get_user tool
 */
export interface GetUserResponse {
  /** The user details (null if not found) */
  user: import('./user.js').UserDetail | null;
  
  /** Whether the user was found */
  found: boolean;
}

/**
 * Parameters for the list_recent_users tool
 */
export interface ListRecentUsersParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_recent_users tool
 */
export interface ListRecentUsersResponse {
  /** Array of recent users ordered by sys_updated_on descending */
  users: import('./user.js').UserSummary[];
  
  /** Total number of users returned */
  count: number;
}

/**
 * Parameters for the query_groups tool
 */
export interface QueryGroupsParams {
  /** Filter by active status */
  active?: boolean;
  
  /** Filter by group type */
  type?: string;
  
  /** Filter by group name (partial match) */
  name?: string;
  
  /** Filter by manager (name or sys_id) */
  manager?: string;
  
  /** Filter by parent group (name or sys_id) */
  parent?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_groups tool
 */
export interface QueryGroupsResponse {
  /** Array of groups matching the query criteria */
  groups: import('./group.js').GroupSummary[];
  
  /** Total number of groups returned */
  count: number;
}

/**
 * Parameters for the get_group tool
 */
export interface GetGroupParams {
  /** Group sys_id or name */
  identifier: string;
}

/**
 * Response from the get_group tool
 */
export interface GetGroupResponse {
  /** The group details (null if not found) */
  group: import('./group.js').GroupDetail | null;
  
  /** Whether the group was found */
  found: boolean;
}

/**
 * Parameters for the list_recent_groups tool
 */
export interface ListRecentGroupsParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_recent_groups tool
 */
export interface ListRecentGroupsResponse {
  /** Array of recent groups ordered by sys_updated_on descending */
  groups: import('./group.js').GroupSummary[];
  
  /** Total number of groups returned */
  count: number;
}

/**
 * Parameters for the query_group_members tool
 */
export interface QueryGroupMembersParams {
  /** Filter by group (name or sys_id) */
  group?: string;
  
  /** Filter by user (username or sys_id) */
  user?: string;
  
  /** Filter by scrum role */
  scrum_role?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_group_members tool
 */
export interface QueryGroupMembersResponse {
  /** Array of group members matching the query criteria */
  group_members: import('./groupMember.js').GroupMemberSummary[];
  
  /** Total number of group members returned */
  count: number;
}

/**
 * Parameters for the get_group_member tool
 */
export interface GetGroupMemberParams {
  /** Group member sys_id */
  identifier: string;
}

/**
 * Response from the get_group_member tool
 */
export interface GetGroupMemberResponse {
  /** The group member details (null if not found) */
  group_member: import('./groupMember.js').GroupMemberDetail | null;
  
  /** Whether the group member was found */
  found: boolean;
}

/**
 * Parameters for the list_recent_group_members tool
 */
export interface ListRecentGroupMembersParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_recent_group_members tool
 */
export interface ListRecentGroupMembersResponse {
  /** Array of recent group members ordered by sys_updated_on descending */
  group_members: import('./groupMember.js').GroupMemberSummary[];
  
  /** Total number of group members returned */
  count: number;
}

/**
 * Parameters for the query_tasks tool
 */
export interface QueryTasksParams {
  /** Filter by task states */
  state?: string[];
  
  /** Filter by priority levels (1-5) */
  priority?: number[];
  
  /** Filter by assigned user (name or sys_id) */
  assigned_to?: string;
  
  /** Filter by assignment group (name or sys_id) */
  assignment_group?: string;
  
  /** Filter by company (name or sys_id) */
  company?: string;
  
  /** Filter by location (name or sys_id) */
  location?: string;
  
  /** Filter by opened by user (name or sys_id) */
  opened_by?: string;
  
  /** Filter by parent task (sys_id) */
  parent?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_tasks tool
 */
export interface QueryTasksResponse {
  /** Array of tasks matching the query criteria */
  tasks: import('./task.js').TaskSummary[];
  
  /** Total number of tasks returned */
  count: number;
}

/**
 * Parameters for the get_task tool
 */
export interface GetTaskParams {
  /** Task sys_id or number */
  identifier: string;
}

/**
 * Response from the get_task tool
 */
export interface GetTaskResponse {
  /** The task details (null if not found) */
  task: import('./task.js').TaskDetail | null;
  
  /** Whether the task was found */
  found: boolean;
}

/**
 * Parameters for the list_recent_tasks tool
 */
export interface ListRecentTasksParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_recent_tasks tool
 */
export interface ListRecentTasksResponse {
  /** Array of recent tasks ordered by sys_updated_on descending */
  tasks: import('./task.js').TaskSummary[];
  
  /** Total number of tasks returned */
  count: number;
}

/**
 * Parameters for the query_stories tool
 */
export interface QueryStoriesParams {
  /** Filter by story states */
  state?: string[];
  
  /** Filter by priority levels (1-5) */
  priority?: number[];
  
  /** Filter by sprint (name or sys_id) */
  sprint?: string;
  
  /** Filter by assigned user (name or sys_id) */
  assigned_to?: string;
  
  /** Filter by story points */
  story_points?: number;
  
  /** Filter by product (name or sys_id) */
  product?: string;
  
  /** Filter by epic (name or sys_id) */
  epic?: string;
  
  /** Filter by blocked status */
  blocked?: boolean;
  
  /** Filter by release (name or sys_id) */
  release?: string;
  
  /** Filter by parent feature (name or sys_id) */
  parent_feature?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_stories tool
 */
export interface QueryStoriesResponse {
  /** Array of stories matching the query criteria */
  stories: import('./story.js').StorySummary[];
  
  /** Total number of stories returned */
  count: number;
}

/**
 * Parameters for the get_story tool
 */
export interface GetStoryParams {
  /** Story sys_id or number */
  identifier: string;
}

/**
 * Response from the get_story tool
 */
export interface GetStoryResponse {
  /** The story details (null if not found) */
  story: import('./story.js').StoryDetail | null;
  
  /** Whether the story was found */
  found: boolean;
}

/**
 * Parameters for the list_recent_stories tool
 */
export interface ListRecentStoriesParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_recent_stories tool
 */
export interface ListRecentStoriesResponse {
  /** Array of recent stories ordered by sys_updated_on descending */
  stories: import('./story.js').StorySummary[];
  
  /** Total number of stories returned */
  count: number;
}

/**
 * Parameters for the query_scrum_tasks tool
 */
export interface QueryScrumTasksParams {
  /** Filter by scrum task states */
  state?: string[];
  
  /** Filter by priority levels (1-5) */
  priority?: number[];
  
  /** Filter by sprint (name or sys_id) */
  sprint?: string;
  
  /** Filter by assigned user (name or sys_id) */
  assigned_to?: string;
  
  /** Filter by parent story (sys_id or number) */
  parent_story?: string;
  
  /** Filter by assignment group (name or sys_id) */
  assignment_group?: string;
  
  /** Filter by company (name or sys_id) */
  company?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_scrum_tasks tool
 */
export interface QueryScrumTasksResponse {
  /** Array of scrum tasks matching the query criteria */
  scrum_tasks: import('./scrumTask.js').ScrumTaskSummary[];
  
  /** Total number of scrum tasks returned */
  count: number;
}

/**
 * Parameters for the get_scrum_task tool
 */
export interface GetScrumTaskParams {
  /** Scrum task sys_id or number */
  identifier: string;
}

/**
 * Response from the get_scrum_task tool
 */
export interface GetScrumTaskResponse {
  /** The scrum task details (null if not found) */
  scrum_task: import('./scrumTask.js').ScrumTaskDetail | null;
  
  /** Whether the scrum task was found */
  found: boolean;
}

/**
 * Parameters for the list_recent_scrum_tasks tool
 */
export interface ListRecentScrumTasksParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_recent_scrum_tasks tool
 */
export interface ListRecentScrumTasksResponse {
  /** Array of recent scrum tasks ordered by sys_updated_on descending */
  scrum_tasks: import('./scrumTask.js').ScrumTaskSummary[];
  
  /** Total number of scrum tasks returned */
  count: number;
}

/**
 * Parameters for the query_change_requests tool
 */
export interface QueryChangeRequestsParams {
  /** Filter by change request states */
  state?: string[];
  
  /** Filter by priority levels (1-5) */
  priority?: number[];
  
  /** Filter by risk levels (1-3) */
  risk?: number[];
  
  /** Filter by change request type (standard, normal, emergency) */
  type?: string[];
  
  /** Filter by assigned user (name or sys_id) */
  assigned_to?: string;
  
  /** Filter by assignment group (name or sys_id) */
  assignment_group?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_change_requests tool
 */
export interface QueryChangeRequestsResponse {
  /** Array of change requests matching the query criteria */
  change_requests: import('./changeRequest.js').ChangeRequestSummary[];
  
  /** Total number of change requests returned */
  count: number;
}

/**
 * Parameters for the get_change_request tool
 */
export interface GetChangeRequestParams {
  /** Change request sys_id or number */
  identifier: string;
}

/**
 * Response from the get_change_request tool
 */
export interface GetChangeRequestResponse {
  /** The change request details (null if not found) */
  change_request: import('./changeRequest.js').ChangeRequestDetail | null;
  
  /** Whether the change request was found */
  found: boolean;
}

/**
 * Parameters for the list_recent_change_requests tool
 */
export interface ListRecentChangeRequestsParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_recent_change_requests tool
 */
export interface ListRecentChangeRequestsResponse {
  /** Array of recent change requests ordered by sys_updated_on descending */
  change_requests: import('./changeRequest.js').ChangeRequestSummary[];
  
  /** Total number of change requests returned */
  count: number;
}
