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

/**
 * Parameters for the create_script_include tool
 */
export interface CreateScriptIncludeParams {
  /** Display name of the Script Include */
  name: string;
  
  /** Unique API name used in code */
  api_name: string;
  
  /** The JavaScript code */
  script: string;
  
  /** Whether the Script Include is active (optional, defaults to true) */
  active?: boolean;
  
  /** Access level (optional, defaults to "public") */
  access?: string;
  
  /** Description of the Script Include's purpose (optional) */
  description?: string;
  
  /** Whether callable from client-side via GlideAjax (optional, defaults to false) */
  client_callable?: boolean;
}

/**
 * Response from the create_script_include tool
 */
export interface CreateScriptIncludeResponse {
  /** System ID of the created Script Include */
  sys_id: string;
  
  /** Success message */
  message: string;
}

/**
 * Parameters for the get_script_include tool
 */
export interface GetScriptIncludeParams {
  /** Script Include sys_id or api_name */
  identifier: string;
}

/**
 * Response from the get_script_include tool
 */
export interface GetScriptIncludeResponse {
  /** The Script Include details (null if not found) */
  script_include: import('./scriptInclude.js').ScriptIncludeDetail | null;
  
  /** Whether the Script Include was found */
  found: boolean;
}

/**
 * Parameters for the update_script_include tool
 */
export interface UpdateScriptIncludeParams {
  /** Script Include sys_id */
  sys_id: string;
  
  /** Display name of the Script Include */
  name?: string;
  
  /** Unique API name used in code */
  api_name?: string;
  
  /** The JavaScript code */
  script?: string;
  
  /** Whether the Script Include is active */
  active?: boolean;
  
  /** Access level */
  access?: string;
  
  /** Description of the Script Include's purpose */
  description?: string;
  
  /** Whether callable from client-side via GlideAjax */
  client_callable?: boolean;
}

/**
 * Response from the update_script_include tool
 */
export interface UpdateScriptIncludeResponse {
  /** System ID of the updated Script Include */
  sys_id: string;
  
  /** Success message */
  message: string;
}

/**
 * Parameters for the delete_script_include tool
 */
export interface DeleteScriptIncludeParams {
  /** Script Include sys_id */
  sys_id: string;
}

/**
 * Response from the delete_script_include tool
 */
export interface DeleteScriptIncludeResponse {
  /** Success flag */
  success: boolean;
  
  /** Success message */
  message: string;
}

/**
 * Parameters for the query_script_includes tool
 */
export interface QueryScriptIncludesParams {
  /** Filter by name (partial match, case-insensitive) */
  name?: string;
  
  /** Filter by api_name (exact match) */
  api_name?: string;
  
  /** Filter by active status */
  active?: boolean;
  
  /** Filter by access level */
  access?: string;
  
  /** Filter by client-callable flag */
  client_callable?: boolean;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_script_includes tool
 */
export interface QueryScriptIncludesResponse {
  /** Array of Script Includes matching the query criteria */
  script_includes: import('./scriptInclude.js').ScriptIncludeSummary[];
  
  /** Total number of Script Includes returned */
  count: number;
}

/**
 * Parameters for the list_recent_script_includes tool
 */
export interface ListRecentScriptIncludesParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_recent_script_includes tool
 */
export interface ListRecentScriptIncludesResponse {
  /** Array of recent Script Includes ordered by sys_updated_on descending */
  script_includes: import('./scriptInclude.js').ScriptIncludeSummary[];
  
  /** Total number of Script Includes returned */
  count: number;
}

/**
 * Parameters for the validate_script_include tool
 */
export interface ValidateScriptIncludeParams {
  /** JavaScript code to validate */
  script: string;
}

/**
 * Response from the validate_script_include tool
 */
export interface ValidateScriptIncludeResponse {
  /** Whether the script is valid */
  valid: boolean;
  
  /** Warning messages (discouraged patterns) */
  warnings: import('./scriptInclude.js').ValidationMessage[];
  
  /** Error messages (security violations, syntax errors) */
  errors: import('./scriptInclude.js').ValidationMessage[];
}

/**
 * Parameters for the test_script_include tool
 */
export interface TestScriptIncludeParams {
  /** Script Include sys_id */
  sys_id: string;
  
  /** Name of the method to test */
  method_name: string;
  
  /** Parameters to pass to the method */
  parameters?: Record<string, any>;
  
  /** Parameters to pass to the initialize function */
  initialize_params?: any[];
}

/**
 * Response from the test_script_include tool
 */
export interface TestScriptIncludeResponse {
  /** Whether the test executed successfully */
  success: boolean;
  
  /** Result returned by the method */
  result?: any;
  
  /** Error message if execution failed */
  error?: string;
  
  /** Execution time in milliseconds */
  executionTime: number;
  
  /** Log messages from execution */
  logs: string[];
}

// ============================================================================
// Widget Tool Types
// ============================================================================

/**
 * Parameters for the query_widgets tool
 */
export interface QueryWidgetsParams {
  /** Filter by name (partial match, case-insensitive) */
  name?: string;
  
  /** Filter by id (exact match) */
  id?: string;
  
  /** Filter by public status */
  public?: boolean;
  
  /** Filter by category sys_id */
  category?: string;
  
  /** Filter by associated table */
  data_table?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_widgets tool
 */
export interface QueryWidgetsResponse {
  /** Array of widget summaries */
  widgets: import('./widget.js').WidgetSummary[];
  
  /** Total count of widgets returned */
  count: number;
}

/**
 * Parameters for the get_widget tool
 */
export interface GetWidgetParams {
  /** Widget sys_id or widget id */
  identifier: string;
}

/**
 * Response from the get_widget tool
 */
export interface GetWidgetResponse {
  /** Widget details (null if not found) */
  widget: import('./widget.js').WidgetDetail | null;
  
  /** Whether the widget was found */
  found: boolean;
}

/**
 * Parameters for the list_recent_widgets tool
 */
export interface ListRecentWidgetsParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_recent_widgets tool
 */
export interface ListRecentWidgetsResponse {
  /** Array of widget summaries */
  widgets: import('./widget.js').WidgetSummary[];
  
  /** Total count of widgets returned */
  count: number;
}

/**
 * Parameters for the create_widget tool
 */
export interface CreateWidgetParams {
  /** Display name of the widget */
  name: string;
  
  /** Unique identifier for code */
  id: string;
  
  /** HTML template with AngularJS directives (optional) */
  html?: string;
  
  /** CSS/SCSS styles (optional) */
  css?: string;
  
  /** Angular controller JavaScript code (optional) */
  client_script?: string;
  
  /** Server-side JavaScript code (optional) */
  server_script?: string;
  
  /** AngularJS link function for DOM manipulation (optional) */
  link?: string;
  
  /** JSON schema defining configurable parameters (optional) */
  option_schema?: string;
  
  /** Associated table (optional) */
  data_table?: string;
  
  /** JSON demo data for testing (optional) */
  demo_data?: string;
  
  /** Public visibility (optional, defaults to false) */
  public?: boolean;
  
  /** Category sys_id (optional) */
  category?: string;
  
  /** Description (optional) */
  description?: string;
}

/**
 * Response from the create_widget tool
 */
export interface CreateWidgetResponse {
  /** sys_id of the created widget */
  sys_id: string;
  
  /** Success message */
  message: string;
}

/**
 * Parameters for the update_widget tool
 */
export interface UpdateWidgetParams {
  /** Widget sys_id */
  sys_id: string;
  
  /** Display name of the widget */
  name?: string;
  
  /** Unique identifier for code */
  id?: string;
  
  /** HTML template with AngularJS directives */
  html?: string;
  
  /** CSS/SCSS styles */
  css?: string;
  
  /** Angular controller JavaScript code */
  client_script?: string;
  
  /** Server-side JavaScript code */
  server_script?: string;
  
  /** AngularJS link function for DOM manipulation */
  link?: string;
  
  /** JSON schema defining configurable parameters */
  option_schema?: string;
  
  /** Associated table */
  data_table?: string;
  
  /** JSON demo data for testing */
  demo_data?: string;
  
  /** Public visibility */
  public?: boolean;
  
  /** Category sys_id */
  category?: string;
  
  /** Description */
  description?: string;
}

/**
 * Response from the update_widget tool
 */
export interface UpdateWidgetResponse {
  /** sys_id of the updated widget */
  sys_id: string;
  
  /** Success message */
  message: string;
}

/**
 * Parameters for the clone_widget tool
 */
export interface CloneWidgetParams {
  /** Source widget sys_id to clone from */
  source_sys_id: string;
  
  /** New unique identifier for the cloned widget */
  new_id: string;
  
  /** New name for the cloned widget */
  new_name: string;
}

/**
 * Response from the clone_widget tool
 */
export interface CloneWidgetResponse {
  /** sys_id of the cloned widget */
  sys_id: string;
  
  /** Success message */
  message: string;
}

/**
 * Parameters for the validate_widget tool
 */
export interface ValidateWidgetParams {
  /** HTML template to validate (optional) */
  html?: string;
  
  /** CSS/SCSS to validate (optional) */
  css?: string;
  
  /** Client script to validate (optional) */
  client_script?: string;
  
  /** Server script to validate (optional) */
  server_script?: string;
  
  /** Link function to validate (optional) */
  link?: string;
  
  /** Option schema to validate (optional) */
  option_schema?: string;
  
  /** Demo data to validate (optional) */
  demo_data?: string;
}

/**
 * Response from the validate_widget tool
 */
export interface ValidateWidgetResponse {
  /** Whether the widget code is valid */
  valid: boolean;
  
  /** Warning messages (discouraged patterns) */
  warnings: import('./widget.js').WidgetValidationMessage[];
  
  /** Error messages (security violations, syntax errors) */
  errors: import('./widget.js').WidgetValidationMessage[];
}

/**
 * Parameters for the get_widget_dependencies tool
 */
export interface GetWidgetDependenciesParams {
  /** Widget sys_id */
  sys_id: string;
}

/**
 * Response from the get_widget_dependencies tool
 */
export interface GetWidgetDependenciesResponse {
  /** Array of widget dependencies */
  dependencies: import('./widget.js').WidgetDependency[];
  
  /** Total count of dependencies */
  count: number;
}

/**
 * Parameters for the get_pages_using_widget tool
 */
export interface GetPagesUsingWidgetParams {
  /** Widget sys_id */
  sys_id: string;
}

/**
 * Response from the get_pages_using_widget tool
 */
export interface GetPagesUsingWidgetResponse {
  /** Array of page summaries */
  pages: import('./page.js').PageSummary[];
  
  /** Total count of pages */
  count: number;
}

// ============================================================================
// Page Tool Types
// ============================================================================

/**
 * Parameters for the query_pages tool
 */
export interface QueryPagesParams {
  /** Filter by title (partial match, case-insensitive) */
  title?: string;
  
  /** Filter by id (exact match) */
  id?: string;
  
  /** Filter by public status */
  public?: boolean;
  
  /** Filter by portal sys_id */
  portal?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_pages tool
 */
export interface QueryPagesResponse {
  /** Array of page summaries */
  pages: import('./page.js').PageSummary[];
  
  /** Total count of pages returned */
  count: number;
}

/**
 * Parameters for the get_page tool
 */
export interface GetPageParams {
  /** Page sys_id or page id */
  identifier: string;
}

/**
 * Response from the get_page tool
 */
export interface GetPageResponse {
  /** Page details (null if not found) */
  page: import('./page.js').PageDetail | null;
  
  /** Whether the page was found */
  found: boolean;
}

/**
 * Parameters for the list_recent_pages tool
 */
export interface ListRecentPagesParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_recent_pages tool
 */
export interface ListRecentPagesResponse {
  /** Array of page summaries */
  pages: import('./page.js').PageSummary[];
  
  /** Total count of pages returned */
  count: number;
}

/**
 * Parameters for the create_page tool
 */
export interface CreatePageParams {
  /** Page title */
  title: string;
  
  /** URL suffix */
  id: string;
  
  /** Public visibility (optional, defaults to false) */
  public?: boolean;
  
  /** Portal sys_id (optional) */
  portal?: string;
  
  /** Role sys_ids (optional) */
  roles?: string[];
  
  /** Description (optional) */
  description?: string;
}

/**
 * Response from the create_page tool
 */
export interface CreatePageResponse {
  /** sys_id of the created page */
  sys_id: string;
  
  /** Success message */
  message: string;
}

/**
 * Parameters for the update_page tool
 */
export interface UpdatePageParams {
  /** Page sys_id */
  sys_id: string;
  
  /** Page title */
  title?: string;
  
  /** URL suffix */
  id?: string;
  
  /** Public visibility */
  public?: boolean;
  
  /** Portal sys_id */
  portal?: string;
  
  /** Role sys_ids */
  roles?: string[];
  
  /** Description */
  description?: string;
}

/**
 * Response from the update_page tool
 */
export interface UpdatePageResponse {
  /** sys_id of the updated page */
  sys_id: string;
  
  /** Success message */
  message: string;
}

/**
 * Parameters for the get_widgets_by_page tool
 */
export interface GetWidgetsByPageParams {
  /** Page sys_id */
  sys_id: string;
}

/**
 * Response from the get_widgets_by_page tool
 */
export interface GetWidgetsByPageResponse {
  /** Array of widgets on the page */
  widgets: import('./page.js').WidgetOnPage[];
  
  /** Total count of widgets */
  count: number;
}

// ============================================================================
// Portal Tool Types
// ============================================================================

/**
 * Parameters for the query_portals tool
 */
export interface QueryPortalsParams {
  /** Filter by title (partial match, case-insensitive) */
  title?: string;
  
  /** Filter by url_suffix (exact match) */
  url_suffix?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_portals tool
 */
export interface QueryPortalsResponse {
  /** Array of portal summaries */
  portals: import('./portal.js').PortalSummary[];
  
  /** Total count of portals returned */
  count: number;
}

/**
 * Parameters for the get_portal tool
 */
export interface GetPortalParams {
  /** Portal sys_id or url_suffix */
  identifier: string;
}

/**
 * Response from the get_portal tool
 */
export interface GetPortalResponse {
  /** Portal details (null if not found) */
  portal: import('./portal.js').PortalDetail | null;
  
  /** Whether the portal was found */
  found: boolean;
}

/**
 * Parameters for the list_portals tool
 */
export interface ListPortalsParams {
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the list_portals tool
 */
export interface ListPortalsResponse {
  /** Array of portal summaries */
  portals: import('./portal.js').PortalSummary[];
  
  /** Total count of portals returned */
  count: number;
}

// ============================================================================
// Widget Instance Tool Types
// ============================================================================

/**
 * Parameters for the query_widget_instances tool
 */
export interface QueryWidgetInstancesParams {
  /** Filter by page sys_id */
  page?: string;
  
  /** Filter by widget sys_id */
  widget?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return (default: 25, max: 100) */
  limit?: number;
}

/**
 * Response from the query_widget_instances tool
 */
export interface QueryWidgetInstancesResponse {
  /** Array of widget instance summaries */
  widget_instances: import('./widgetInstance.js').WidgetInstanceSummary[];
  
  /** Total count of widget instances returned */
  count: number;
}

/**
 * Parameters for the get_widget_instance tool
 */
export interface GetWidgetInstanceParams {
  /** Widget instance sys_id */
  identifier: string;
}

/**
 * Response from the get_widget_instance tool
 */
export interface GetWidgetInstanceResponse {
  /** Widget instance details (null if not found) */
  widget_instance: import('./widgetInstance.js').WidgetInstanceDetail | null;
  
  /** Whether the widget instance was found */
  found: boolean;
}
