# Design Document: ServiceNow Multi-Table Support

## Overview

This design extends the ServiceNow MCP Server to support seven additional ServiceNow tables: Users (sys_user), Groups (sys_user_group), Group Members (sys_user_grmember), Tasks (task), Stories (rm_story), Scrum Tasks (rm_scrum_task), and Change Requests (change_request). The implementation follows the established architectural patterns from the IncidentService, ensuring consistency, maintainability, and code reuse.

The design leverages the existing infrastructure components (ServiceNowClient, AuthenticationManager, ConfigurationManager) and replicates the proven service layer pattern for each new table. Each table will have its own Service class, data models (Summary and Detail interfaces), filter interfaces, tool handlers, and MCP tool registration.

Note: The Task table is a base table that is extended by many ServiceNow tables including Incident, Stories, and Scrum Tasks. Supporting the Task table directly provides access to all task-based records in ServiceNow.

## Architecture

### High-Level Architecture

The architecture follows the layered pattern established in the servicenow-mcp-server spec:

```
┌─────────────────────────────────────────────────────────────┐
│                      MCP Protocol Layer                      │
│  (MCPServer - Tool Registration & Request Routing)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Tool Handler Layer                      │
│  (Parameter Validation & Response Formatting)               │
│  - queryUsersHandler      - queryStoriesHandler             │
│  - getUserHandler         - getStoryHandler                  │
│  - queryGroupsHandler     - queryScrumTasksHandler          │
│  - getGroupHandler        - getScrumTaskHandler             │
│  - queryGroupMembersHandler - queryTasksHandler             │
│  - getGroupMemberHandler    - getTaskHandler                │
│  - queryChangeRequestsHandler                                │
│  - getChangeRequestHandler                                   │
│  - listRecentHandler (generic for all tables)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  (Business Logic & Data Transformation)                     │
│  - UserService           - StoryService                      │
│  - GroupService          - ScrumTaskService                  │
│  - GroupMemberService    - TaskService                       │
│  - ChangeRequestService                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      API Client Layer                        │
│  (ServiceNowClient - HTTP Communication)                    │
│  - Reused from existing implementation                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer                       │
│  - AuthenticationManager (Reused)                           │
│  - ConfigurationManager (Reused)                            │
│  - Logger (Reused)                                          │
└─────────────────────────────────────────────────────────────┘
```

### Integration with Existing Components

All new services integrate with existing infrastructure:

1. **ServiceNowClient**: All services use the existing `client.get()` and `client.getById()` methods
2. **AuthenticationManager**: Authentication is handled transparently by the client
3. **ConfigurationManager**: Configuration is managed centrally
4. **Logger**: All services use the existing logger for structured logging
5. **Error Handling**: All services follow the established error handling patterns

## Components and Interfaces

### UserService

The UserService provides operations for querying and retrieving user records from the sys_user table.

```typescript
class UserService {
  private client: ServiceNowClient;

  constructor(client: ServiceNowClient);

  /**
   * Query users with filters
   * @param filters - Filter criteria for users
   * @returns Promise resolving to array of user summaries
   */
  async queryUsers(filters: UserFilters): Promise<UserSummary[]>;

  /**
   * Get a specific user by sys_id or username
   * @param identifier - User sys_id or username
   * @returns Promise resolving to user detail or null if not found
   */
  async getUser(identifier: string): Promise<UserDetail | null>;

  /**
   * List recent users ordered by updated timestamp
   * @param limit - Maximum number of users to return (default 25, max 100)
   * @returns Promise resolving to array of user summaries
   */
  async listRecentUsers(limit: number): Promise<UserSummary[]>;

  // Private helper methods
  private validateFilters(filters: UserFilters): void;
  private buildQuery(filters: UserFilters): string;
  private toUserSummary(record: ServiceNowRecord): UserSummary;
  private toUserDetail(record: ServiceNowRecord): UserDetail;
}
```

### GroupService

The GroupService provides operations for querying and retrieving group records from the sys_user_group table.

```typescript
class GroupService {
  private client: ServiceNowClient;

  constructor(client: ServiceNowClient);

  /**
   * Query groups with filters
   * @param filters - Filter criteria for groups
   * @returns Promise resolving to array of group summaries
   */
  async queryGroups(filters: GroupFilters): Promise<GroupSummary[]>;

  /**
   * Get a specific group by sys_id or name
   * @param identifier - Group sys_id or name
   * @returns Promise resolving to group detail or null if not found
   */
  async getGroup(identifier: string): Promise<GroupDetail | null>;

  /**
   * List recent groups ordered by updated timestamp
   * @param limit - Maximum number of groups to return (default 25, max 100)
   * @returns Promise resolving to array of group summaries
   */
  async listRecentGroups(limit: number): Promise<GroupSummary[]>;

  // Private helper methods
  private validateFilters(filters: GroupFilters): void;
  private buildQuery(filters: GroupFilters): string;
  private toGroupSummary(record: ServiceNowRecord): GroupSummary;
  private toGroupDetail(record: ServiceNowRecord): GroupDetail;
}
```

### GroupMemberService

The GroupMemberService provides operations for querying and retrieving group member records from the sys_user_grmember table.

```typescript
class GroupMemberService {
  private client: ServiceNowClient;

  constructor(client: ServiceNowClient);

  /**
   * Query group members with filters
   * @param filters - Filter criteria for group members
   * @returns Promise resolving to array of group member summaries
   */
  async queryGroupMembers(filters: GroupMemberFilters): Promise<GroupMemberSummary[]>;

  /**
   * Get a specific group member by sys_id
   * @param identifier - Group member sys_id
   * @returns Promise resolving to group member detail or null if not found
   */
  async getGroupMember(identifier: string): Promise<GroupMemberDetail | null>;

  /**
   * List recent group members ordered by updated timestamp
   * @param limit - Maximum number of group members to return (default 25, max 100)
   * @returns Promise resolving to array of group member summaries
   */
  async listRecentGroupMembers(limit: number): Promise<GroupMemberSummary[]>;

  // Private helper methods
  private validateFilters(filters: GroupMemberFilters): void;
  private buildQuery(filters: GroupMemberFilters): string;
  private toGroupMemberSummary(record: ServiceNowRecord): GroupMemberSummary;
  private toGroupMemberDetail(record: ServiceNowRecord): GroupMemberDetail;
}
```

### TaskService

The TaskService provides operations for querying and retrieving task records from the task table (base table for many ServiceNow tables).

```typescript
class TaskService {
  private client: ServiceNowClient;

  constructor(client: ServiceNowClient);

  /**
   * Query tasks with filters
   * @param filters - Filter criteria for tasks
   * @returns Promise resolving to array of task summaries
   */
  async queryTasks(filters: TaskFilters): Promise<TaskSummary[]>;

  /**
   * Get a specific task by sys_id or number
   * @param identifier - Task sys_id or number
   * @returns Promise resolving to task detail or null if not found
   */
  async getTask(identifier: string): Promise<TaskDetail | null>;

  /**
   * List recent tasks ordered by updated timestamp
   * @param limit - Maximum number of tasks to return (default 25, max 100)
   * @returns Promise resolving to array of task summaries
   */
  async listRecentTasks(limit: number): Promise<TaskSummary[]>;

  // Private helper methods
  private validateFilters(filters: TaskFilters): void;
  private buildQuery(filters: TaskFilters): string;
  private toTaskSummary(record: ServiceNowRecord): TaskSummary;
  private toTaskDetail(record: ServiceNowRecord): TaskDetail;
}
```

### StoryService

The StoryService provides operations for querying and retrieving story records from the rm_story table.

```typescript
class StoryService {
  private client: ServiceNowClient;

  constructor(client: ServiceNowClient);

  /**
   * Query stories with filters
   * @param filters - Filter criteria for stories
   * @returns Promise resolving to array of story summaries
   */
  async queryStories(filters: StoryFilters): Promise<StorySummary[]>;

  /**
   * Get a specific story by sys_id or number
   * @param identifier - Story sys_id or number
   * @returns Promise resolving to story detail or null if not found
   */
  async getStory(identifier: string): Promise<StoryDetail | null>;

  /**
   * List recent stories ordered by updated timestamp
   * @param limit - Maximum number of stories to return (default 25, max 100)
   * @returns Promise resolving to array of story summaries
   */
  async listRecentStories(limit: number): Promise<StorySummary[]>;

  // Private helper methods
  private validateFilters(filters: StoryFilters): void;
  private buildQuery(filters: StoryFilters): string;
  private toStorySummary(record: ServiceNowRecord): StorySummary;
  private toStoryDetail(record: ServiceNowRecord): StoryDetail;
}
```

### ScrumTaskService

The ScrumTaskService provides operations for querying and retrieving scrum task records from the rm_scrum_task table.

```typescript
class ScrumTaskService {
  private client: ServiceNowClient;

  constructor(client: ServiceNowClient);

  /**
   * Query scrum tasks with filters
   * @param filters - Filter criteria for scrum tasks
   * @returns Promise resolving to array of scrum task summaries
   */
  async queryScrumTasks(filters: ScrumTaskFilters): Promise<ScrumTaskSummary[]>;

  /**
   * Get a specific scrum task by sys_id or number
   * @param identifier - Scrum task sys_id or number
   * @returns Promise resolving to scrum task detail or null if not found
   */
  async getScrumTask(identifier: string): Promise<ScrumTaskDetail | null>;

  /**
   * List recent scrum tasks ordered by updated timestamp
   * @param limit - Maximum number of scrum tasks to return (default 25, max 100)
   * @returns Promise resolving to array of scrum task summaries
   */
  async listRecentScrumTasks(limit: number): Promise<ScrumTaskSummary[]>;

  // Private helper methods
  private validateFilters(filters: ScrumTaskFilters): void;
  private buildQuery(filters: ScrumTaskFilters): string;
  private toScrumTaskSummary(record: ServiceNowRecord): ScrumTaskSummary;
  private toScrumTaskDetail(record: ServiceNowRecord): ScrumTaskDetail;
}
```

### ChangeRequestService

The ChangeRequestService provides operations for querying and retrieving change request records from the change_request table.

```typescript
class ChangeRequestService {
  private client: ServiceNowClient;

  constructor(client: ServiceNowClient);

  /**
   * Query change requests with filters
   * @param filters - Filter criteria for change requests
   * @returns Promise resolving to array of change request summaries
   */
  async queryChangeRequests(filters: ChangeRequestFilters): Promise<ChangeRequestSummary[]>;

  /**
   * Get a specific change request by sys_id or number
   * @param identifier - Change request sys_id or number
   * @returns Promise resolving to change request detail or null if not found
   */
  async getChangeRequest(identifier: string): Promise<ChangeRequestDetail | null>;

  /**
   * List recent change requests ordered by updated timestamp
   * @param limit - Maximum number of change requests to return (default 25, max 100)
   * @returns Promise resolving to array of change request summaries
   */
  async listRecentChangeRequests(limit: number): Promise<ChangeRequestSummary[]>;

  // Private helper methods
  private validateFilters(filters: ChangeRequestFilters): void;
  private buildQuery(filters: ChangeRequestFilters): string;
  private toChangeRequestSummary(record: ServiceNowRecord): ChangeRequestSummary;
  private toChangeRequestDetail(record: ServiceNowRecord): ChangeRequestDetail;
}
```

## Data Models

### User Data Models

```typescript
/**
 * Summary view of a user (used in query and list operations)
 */
interface UserSummary {
  sys_id: string;
  user_name: string;
  name: string;
  email: string;
  active: boolean;
  title: string | null;
}

/**
 * Detailed view of a user (used in get operations)
 * Includes all standard sys_user fields from ServiceNow
 */
interface UserDetail extends UserSummary {
  // Contact information
  phone: string | null;
  mobile_phone: string | null;
  home_phone: string | null;
  business_phone: string | null;
  fax: string | null;
  
  // Organizational information
  department: string | null;
  company: string | null;
  location: string | null;
  building: string | null;
  cost_center: string | null;
  manager: string | null;
  
  // Personal information
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender: string | null;
  
  // System information
  employee_number: string | null;
  user_id: string | null;
  domain: string | null;
  domain_path: string | null;
  
  // Authentication and access
  password_needs_reset: boolean;
  locked_out: boolean;
  failed_login_attempts: number;
  last_login: string | null;
  last_login_time: string | null;
  last_login_device: string | null;
  
  // Preferences and settings
  time_zone: string | null;
  time_format: string | null;
  date_format: string | null;
  default_perspective: string | null;
  calendar_integration: number;
  enable_multifactor_authn: boolean;
  
  // LDAP and external integration
  ldap_server: string | null;
  internal_integration_user: boolean;
  
  // Additional fields
  avatar: string | null;
  photo: string | null;
  city: string | null;
  state: string | null;
  street: string | null;
  country: string | null;
  zip: string | null;
  
  // Roles and access
  roles: string | null;
  
  // Audit fields
  sys_created_on: string;
  sys_created_by: string;
  sys_updated_on: string;
  sys_updated_by: string;
  sys_mod_count: number;
}

/**
 * Filter parameters for querying users
 */
interface UserFilters {
  active?: boolean;
  department?: string;
  role?: string;
  name?: string;
  company?: string;
  location?: string;
  query?: string;
  limit?: number;
}
```

### Group Data Models

```typescript
/**
 * Summary view of a group (used in query and list operations)
 */
interface GroupSummary {
  sys_id: string;
  name: string;
  description: string | null;
  active: boolean;
  type: string | null;
  manager: string | null;
}

/**
 * Detailed view of a group (used in get operations)
 * Includes all standard sys_user_group fields from ServiceNow
 */
interface GroupDetail extends GroupSummary {
  // Contact information
  email: string | null;
  
  // Organizational information
  cost_center: string | null;
  default_assignee: string | null;
  parent: string | null;
  
  // Group settings
  exclude_manager: boolean;
  include_members: boolean;
  group_capacity_points: number | null;
  
  // Source and roles
  source: string | null;
  roles: string | null;
  
  // Audit fields
  sys_created_on: string;
  sys_created_by: string;
  sys_updated_on: string;
  sys_updated_by: string;
  sys_mod_count: number;
}

/**
 * Filter parameters for querying groups
 */
interface GroupFilters {
  active?: boolean;
  type?: string;
  name?: string;
  manager?: string;
  parent?: string;
  query?: string;
  limit?: number;
}
```

### Group Member Data Models

```typescript
/**
 * Summary view of a group member (used in query and list operations)
 */
interface GroupMemberSummary {
  sys_id: string;
  group: string;
  user: string;
}

/**
 * Detailed view of a group member (used in get operations)
 * Includes all standard sys_user_grmember fields from ServiceNow
 */
interface GroupMemberDetail extends GroupMemberSummary {
  // Scrum-specific fields
  scrum_role: string | null;
  average_points_per_sprint: number | null;
  
  // Audit fields
  sys_created_on: string;
  sys_created_by: string;
  sys_updated_on: string;
  sys_updated_by: string;
  sys_mod_count: number;
}

/**
 * Filter parameters for querying group members
 */
interface GroupMemberFilters {
  group?: string;
  user?: string;
  scrum_role?: string;
  query?: string;
  limit?: number;
}
```

### Task Data Models

```typescript
/**
 * Task state enum with numeric values matching ServiceNow
 */
enum TaskState {
  Open = 1,
  WorkInProgress = 2,
  Closed = 3,
  Pending = -5,
  Canceled = 4
}

/**
 * Task priority enum with numeric values matching ServiceNow
 */
enum TaskPriority {
  Critical = 1,
  High = 2,
  Moderate = 3,
  Low = 4,
  Planning = 5
}

/**
 * Summary view of a task (used in query and list operations)
 */
interface TaskSummary {
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
interface TaskDetail extends TaskSummary {
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
interface TaskFilters {
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
```

### Story Data Models

```typescript
/**
 * Story state enum with numeric values matching ServiceNow
 */
enum StoryState {
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
enum StoryPriority {
  Critical = 1,
  High = 2,
  Moderate = 3,
  Low = 4,
  Planning = 5
}

/**
 * Summary view of a story (used in query and list operations)
 */
interface StorySummary {
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
interface StoryDetail extends StorySummary {
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
interface StoryFilters {
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
```

### Scrum Task Data Models

```typescript
/**
 * Scrum task state enum with numeric values matching ServiceNow
 */
enum ScrumTaskState {
  Ready = 1,
  WorkInProgress = 2,
  Complete = 3,
  Canceled = 4
}

/**
 * Scrum task priority enum with numeric values matching ServiceNow
 */
enum ScrumTaskPriority {
  Critical = 1,
  High = 2,
  Moderate = 3,
  Low = 4,
  Planning = 5
}

/**
 * Summary view of a scrum task (used in query and list operations)
 */
interface ScrumTaskSummary {
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
interface ScrumTaskDetail extends ScrumTaskSummary {
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
  
  // Release columns
  // (inherits from task)
  
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
interface ScrumTaskFilters {
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
```

### Change Request Data Models

```typescript
/**
 * Change request state enum with numeric values matching ServiceNow
 */
enum ChangeRequestState {
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
enum ChangeRequestPriority {
  Critical = 1,
  High = 2,
  Moderate = 3,
  Low = 4,
  Planning = 5
}

/**
 * Change request risk enum with numeric values matching ServiceNow
 */
enum ChangeRequestRisk {
  High = 1,
  Moderate = 2,
  Low = 3
}

/**
 * Change request type enum with numeric values matching ServiceNow
 */
enum ChangeRequestType {
  Standard = 'standard',
  Normal = 'normal',
  Emergency = 'emergency'
}

/**
 * Summary view of a change request (used in query and list operations)
 */
interface ChangeRequestSummary {
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
interface ChangeRequestDetail extends ChangeRequestSummary {
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
interface ChangeRequestFilters {
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
```

## Tool Handler Interfaces

### User Tool Handlers

```typescript
/**
 * Handler for the query_users tool
 */
async function queryUsersHandler(
  params: QueryUsersParams,
  userService: UserService
): Promise<QueryUsersResponse | ErrorResponse>;

/**
 * Handler for the get_user tool
 */
async function getUserHandler(
  params: GetUserParams,
  userService: UserService
): Promise<GetUserResponse | ErrorResponse>;

/**
 * Handler for the list_recent_users tool
 */
async function listRecentUsersHandler(
  params: ListRecentParams,
  userService: UserService
): Promise<ListRecentUsersResponse | ErrorResponse>;
```

### Group Tool Handlers

```typescript
/**
 * Handler for the query_groups tool
 */
async function queryGroupsHandler(
  params: QueryGroupsParams,
  groupService: GroupService
): Promise<QueryGroupsResponse | ErrorResponse>;

/**
 * Handler for the get_group tool
 */
async function getGroupHandler(
  params: GetGroupParams,
  groupService: GroupService
): Promise<GetGroupResponse | ErrorResponse>;

/**
 * Handler for the list_recent_groups tool
 */
async function listRecentGroupsHandler(
  params: ListRecentParams,
  groupService: GroupService
): Promise<ListRecentGroupsResponse | ErrorResponse>;
```

### Group Member Tool Handlers

```typescript
/**
 * Handler for the query_group_members tool
 */
async function queryGroupMembersHandler(
  params: QueryGroupMembersParams,
  groupMemberService: GroupMemberService
): Promise<QueryGroupMembersResponse | ErrorResponse>;

/**
 * Handler for the get_group_member tool
 */
async function getGroupMemberHandler(
  params: GetGroupMemberParams,
  groupMemberService: GroupMemberService
): Promise<GetGroupMemberResponse | ErrorResponse>;

/**
 * Handler for the list_recent_group_members tool
 */
async function listRecentGroupMembersHandler(
  params: ListRecentParams,
  groupMemberService: GroupMemberService
): Promise<ListRecentGroupMembersResponse | ErrorResponse>;
```

### Task Tool Handlers

```typescript
/**
 * Handler for the query_tasks tool
 */
async function queryTasksHandler(
  params: QueryTasksParams,
  taskService: TaskService
): Promise<QueryTasksResponse | ErrorResponse>;

/**
 * Handler for the get_task tool
 */
async function getTaskHandler(
  params: GetTaskParams,
  taskService: TaskService
): Promise<GetTaskResponse | ErrorResponse>;

/**
 * Handler for the list_recent_tasks tool
 */
async function listRecentTasksHandler(
  params: ListRecentParams,
  taskService: TaskService
): Promise<ListRecentTasksResponse | ErrorResponse>;
```

### Story Tool Handlers

```typescript
/**
 * Handler for the query_stories tool
 */
async function queryStoriesHandler(
  params: QueryStoriesParams,
  storyService: StoryService
): Promise<QueryStoriesResponse | ErrorResponse>;

/**
 * Handler for the get_story tool
 */
async function getStoryHandler(
  params: GetStoryParams,
  storyService: StoryService
): Promise<GetStoryResponse | ErrorResponse>;

/**
 * Handler for the list_recent_stories tool
 */
async function listRecentStoriesHandler(
  params: ListRecentParams,
  storyService: StoryService
): Promise<ListRecentStoriesResponse | ErrorResponse>;
```

### Scrum Task Tool Handlers

```typescript
/**
 * Handler for the query_scrum_tasks tool
 */
async function queryScrumTasksHandler(
  params: QueryScrumTasksParams,
  scrumTaskService: ScrumTaskService
): Promise<QueryScrumTasksResponse | ErrorResponse>;

/**
 * Handler for the get_scrum_task tool
 */
async function getScrumTaskHandler(
  params: GetScrumTaskParams,
  scrumTaskService: ScrumTaskService
): Promise<GetScrumTaskResponse | ErrorResponse>;

/**
 * Handler for the list_recent_scrum_tasks tool
 */
async function listRecentScrumTasksHandler(
  params: ListRecentParams,
  scrumTaskService: ScrumTaskService
): Promise<ListRecentScrumTasksResponse | ErrorResponse>;
```

### Change Request Tool Handlers

```typescript
/**
 * Handler for the query_change_requests tool
 */
async function queryChangeRequestsHandler(
  params: QueryChangeRequestsParams,
  changeRequestService: ChangeRequestService
): Promise<QueryChangeRequestsResponse | ErrorResponse>;

/**
 * Handler for the get_change_request tool
 */
async function getChangeRequestHandler(
  params: GetChangeRequestParams,
  changeRequestService: ChangeRequestService
): Promise<GetChangeRequestResponse | ErrorResponse>;

/**
 * Handler for the list_recent_change_requests tool
 */
async function listRecentChangeRequestsHandler(
  params: ListRecentParams,
  changeRequestService: ChangeRequestService
): Promise<ListRecentChangeRequestsResponse | ErrorResponse>;
```

## ServiceNow Table Field Mappings

### sys_user Table Fields

**Summary Fields:**
- sys_id (string)
- user_name (string)
- name (string)
- email (string)
- active (boolean)
- title (string, nullable)

**Detail Fields (additional):**
- phone (string, nullable)
- department (reference to department, nullable)
- manager (reference to sys_user, nullable)
- sys_created_on (datetime)

### sys_user_group Table Fields

**Summary Fields:**
- sys_id (string)
- name (string)
- description (string, nullable)
- active (boolean)
- type (string, nullable)
- manager (reference to sys_user, nullable)

**Detail Fields (additional):**
- email (string, nullable)
- sys_created_on (datetime)

### sys_user_grmember Table Fields

**Summary Fields:**
- sys_id (string)
- group (reference to sys_user_group)
- user (reference to sys_user)

**Detail Fields (additional):**
- sys_created_on (datetime)

### task Table Fields

**Summary Fields:**
- sys_id (string)
- number (string)
- short_description (string)
- state (choice)
- priority (integer)
- assigned_to (reference to sys_user, nullable)
- assignment_group (reference to sys_user_group, nullable)
- sys_updated_on (datetime)

**Detail Fields (additional):**
- description (string)
- opened_by (reference to sys_user)
- sys_created_on (datetime)
- due_date (datetime, nullable)
- work_notes (string, nullable)

### rm_story Table Fields

**Summary Fields:**
- sys_id (string)
- number (string)
- short_description (string)
- state (choice)
- priority (integer)
- assigned_to (reference to sys_user, nullable)
- story_points (integer, nullable)
- sys_updated_on (datetime)

**Detail Fields (additional):**
- description (string)
- sprint (reference to rm_sprint, nullable)
- product (reference to rm_product, nullable)
- opened_by (reference to sys_user)
- sys_created_on (datetime)

### rm_scrum_task Table Fields

**Summary Fields:**
- sys_id (string)
- number (string)
- short_description (string)
- state (choice)
- priority (integer)
- assigned_to (reference to sys_user, nullable)
- remaining_work (decimal, nullable)
- sys_updated_on (datetime)

**Detail Fields (additional):**
- description (string)
- parent (reference to rm_story, nullable)
- sprint (reference to rm_sprint, nullable)
- opened_by (reference to sys_user)
- sys_created_on (datetime)

### change_request Table Fields

**Summary Fields:**
- sys_id (string)
- number (string)
- short_description (string)
- state (choice)
- priority (integer)
- risk (integer)
- type (string)
- assigned_to (reference to sys_user, nullable)
- sys_updated_on (datetime)

**Detail Fields (additional):**
- description (string)
- category (string, nullable)
- assignment_group (reference to sys_user_group, nullable)
- start_date (datetime, nullable)
- end_date (datetime, nullable)
- opened_by (reference to sys_user)
- sys_created_on (datetime)

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several patterns of redundancy:

1. **Summary field properties (1.2, 3.2, 5.2, 7.2, 9.2)** - These can be combined into a single property about summary field transformation across all tables
2. **Detail field properties (2.3, 4.3, 6.3, 8.3, 10.3)** - These can be combined into a single property about detail field transformation across all tables
3. **Query construction properties (1.1, 3.1, 5.1, 7.1, 9.1)** - These follow the same pattern and can be combined
4. **Result limit properties (1.4, 3.4, 5.4, 7.4, 9.4)** - These are identical across tables and can be combined
5. **Retrieval by sys_id properties (2.1, 4.1, 6.1, 8.1, 10.1)** - These follow the same pattern and can be combined
6. **Retrieval by identifier properties (2.2, 4.2, 6.2, 8.2, 10.2)** - These follow the same pattern and can be combined
7. **Filter support properties (1.3, 3.3, 5.3, 7.3, 9.3)** - These test the same behavior and can be combined
8. **Ordering properties (11.1, 11.4)** - These are duplicates
9. **Validation properties (14.1, 14.3, 14.4)** - 14.3 and 14.4 are specific cases of 14.1

By consolidating these redundant properties, we reduce from 75+ individual properties to approximately 25 unique properties that provide comprehensive coverage without duplication.

### Correctness Properties

Property 1: Query construction with filters
*For any* supported table and any valid filter combination, constructing a query should produce a valid ServiceNow encoded query string that includes all provided filter criteria
**Validates: Requirements 1.1, 3.1, 5.1, 7.1, 9.1**

Property 2: Summary field transformation
*For any* ServiceNow record from any supported table, transforming to a summary view should include all required summary fields for that table type (sys_id, identifier field, description, state/active, and updated_at)
**Validates: Requirements 1.2, 3.2, 5.2, 7.2, 9.2**

Property 3: Filter support
*For any* supported table, the service should correctly build queries for all supported filter types for that table
**Validates: Requirements 1.3, 3.3, 5.3, 7.3, 9.3**

Property 4: Result limit enforcement
*For any* query on any supported table, regardless of the limit parameter value, the number of returned results should never exceed 100
**Validates: Requirements 1.4, 3.4, 5.4, 7.4, 9.4**

Property 5: Retrieval by sys_id
*For any* supported table and any valid sys_id, retrieving a record by sys_id should return the complete record with all detail fields
**Validates: Requirements 2.1, 4.1, 6.1, 8.1, 10.1**

Property 6: Retrieval by identifier
*For any* supported table and any valid identifier (username, name, or number), searching by identifier should return the matching record
**Validates: Requirements 2.2, 4.2, 6.2, 8.2, 10.2**

Property 7: Detail field transformation
*For any* ServiceNow record from any supported table, transforming to a detail view should include all standard fields for that table type (all summary fields plus additional detail fields)
**Validates: Requirements 2.3, 4.3, 6.3, 8.3, 10.3**

Property 8: Structured response format
*For any* successful operation on any supported table, the response should conform to the expected interface structure (Summary or Detail)
**Validates: Requirements 2.5, 4.5, 6.5, 8.5, 10.5**

Property 9: Recent records ordering
*For any* list operation on any supported table, results should be ordered by updated timestamp in descending order (most recent first)
**Validates: Requirements 11.1**

Property 10: Limit parameter respect
*For any* list operation with a specified limit parameter, the number of returned results should match the limit (or be less if fewer records exist)
**Validates: Requirements 11.2**

Property 11: Schema validation error handling
*For any* tool invocation with invalid parameters, the handler should return a structured validation error with code, message, and detail
**Validates: Requirements 12.4**

Property 12: Null field handling
*For any* ServiceNow record with null or missing fields, the transformation should handle nulls gracefully without throwing errors, providing null or appropriate default values
**Validates: Requirements 13.2**

Property 13: Type conversion correctness
*For any* ServiceNow record field, the transformed value should match the expected TypeScript type (string, number, boolean, or date)
**Validates: Requirements 13.3**

Property 14: Filter validation
*For any* query with filter values, invalid filter values should be rejected with a validation error before the query is executed
**Validates: Requirements 14.1, 14.2**

Property 15: Required parameter validation
*For any* operation requiring specific parameters, missing required parameters should be rejected with a validation error
**Validates: Requirements 14.5**

Property 16: Error response structure
*For any* failed operation on any supported table, the error response should include error code, message, and optional detail fields
**Validates: Requirements 15.1**

Property 17: ServiceNow error propagation
*For any* ServiceNow API error, the error details from ServiceNow should be included in the service error response
**Validates: Requirements 15.2**

Property 18: Success response consistency
*For any* successful operation on any supported table, the response should include the operation result and relevant metadata (count, found flag, etc.)
**Validates: Requirements 15.3**

Property 19: Operation logging
*For any* operation on any supported table, the operation should be logged with operation name, parameters, result summary, and duration
**Validates: Requirements 15.4**

Property 20: Not found handling
*For any* get operation where the record doesn't exist, the service should return null rather than throwing an exception
**Validates: Requirements 15.5**

## JSON Schemas for MCP Tools

Each table requires JSON Schema definitions for its three tools: query, get, and list_recent.

### User Tool Schemas

```typescript
/**
 * JSON Schema for query_users tool parameters
 */
export const queryUsersSchema: JSONSchema = {
  type: 'object',
  properties: {
    active: {
      type: 'boolean',
      description: 'Filter by active status'
    },
    department: {
      type: 'string',
      description: 'Filter by department (name or sys_id)'
    },
    role: {
      type: 'string',
      description: 'Filter by role (name or sys_id)'
    },
    name: {
      type: 'string',
      description: 'Filter by user name (partial match)'
    },
    query: {
      type: 'string',
      description: 'Custom ServiceNow encoded query string'
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};

/**
 * JSON Schema for get_user tool parameters
 */
export const getUserSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'User sys_id or username'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_users tool parameters
 */
export const listRecentUsersSchema: JSONSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};
```

### Group Tool Schemas

```typescript
/**
 * JSON Schema for query_groups tool parameters
 */
export const queryGroupsSchema: JSONSchema = {
  type: 'object',
  properties: {
    active: {
      type: 'boolean',
      description: 'Filter by active status'
    },
    type: {
      type: 'string',
      description: 'Filter by group type'
    },
    name: {
      type: 'string',
      description: 'Filter by group name (partial match)'
    },
    query: {
      type: 'string',
      description: 'Custom ServiceNow encoded query string'
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};

/**
 * JSON Schema for get_group tool parameters
 */
export const getGroupSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Group sys_id or name'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_groups tool parameters
 */
export const listRecentGroupsSchema: JSONSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};
```

### Group Member Tool Schemas

```typescript
/**
 * JSON Schema for query_group_members tool parameters
 */
export const queryGroupMembersSchema: JSONSchema = {
  type: 'object',
  properties: {
    group: {
      type: 'string',
      description: 'Filter by group (name or sys_id)'
    },
    user: {
      type: 'string',
      description: 'Filter by user (username or sys_id)'
    },
    query: {
      type: 'string',
      description: 'Custom ServiceNow encoded query string'
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};

/**
 * JSON Schema for get_group_member tool parameters
 */
export const getGroupMemberSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Group member sys_id'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_group_members tool parameters
 */
export const listRecentGroupMembersSchema: JSONSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};
```

### Task Tool Schemas

```typescript
/**
 * JSON Schema for query_tasks tool parameters
 */
export const queryTasksSchema: JSONSchema = {
  type: 'object',
  properties: {
    state: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by task states (Open, Work In Progress, Closed, Pending, Canceled)'
    },
    priority: {
      type: 'array',
      items: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 5 
      },
      description: 'Filter by priority levels (1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning)'
    },
    assigned_to: {
      type: 'string',
      description: 'Filter by assigned user (name or sys_id)'
    },
    assignment_group: {
      type: 'string',
      description: 'Filter by assignment group (name or sys_id)'
    },
    query: {
      type: 'string',
      description: 'Custom ServiceNow encoded query string'
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};

/**
 * JSON Schema for get_task tool parameters
 */
export const getTaskSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Task sys_id or number'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_tasks tool parameters
 */
export const listRecentTasksSchema: JSONSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};
```

### Story Tool Schemas

```typescript
/**
 * JSON Schema for query_stories tool parameters
 */
export const queryStoriesSchema: JSONSchema = {
  type: 'object',
  properties: {
    state: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by story states (Draft, Ready, In Progress, Review, Complete, Accepted)'
    },
    priority: {
      type: 'array',
      items: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 5 
      },
      description: 'Filter by priority levels (1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning)'
    },
    sprint: {
      type: 'string',
      description: 'Filter by sprint (name or sys_id)'
    },
    assigned_to: {
      type: 'string',
      description: 'Filter by assigned user (name or sys_id)'
    },
    story_points: {
      type: 'integer',
      minimum: 0,
      description: 'Filter by story points'
    },
    query: {
      type: 'string',
      description: 'Custom ServiceNow encoded query string'
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};

/**
 * JSON Schema for get_story tool parameters
 */
export const getStorySchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Story sys_id or number'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_stories tool parameters
 */
export const listRecentStoriesSchema: JSONSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};
```

### Scrum Task Tool Schemas

```typescript
/**
 * JSON Schema for query_scrum_tasks tool parameters
 */
export const queryScrumTasksSchema: JSONSchema = {
  type: 'object',
  properties: {
    state: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by scrum task states (Ready, Work In Progress, Complete, Canceled)'
    },
    priority: {
      type: 'array',
      items: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 5 
      },
      description: 'Filter by priority levels (1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning)'
    },
    sprint: {
      type: 'string',
      description: 'Filter by sprint (name or sys_id)'
    },
    assigned_to: {
      type: 'string',
      description: 'Filter by assigned user (name or sys_id)'
    },
    parent_story: {
      type: 'string',
      description: 'Filter by parent story (number or sys_id)'
    },
    query: {
      type: 'string',
      description: 'Custom ServiceNow encoded query string'
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};

/**
 * JSON Schema for get_scrum_task tool parameters
 */
export const getScrumTaskSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Scrum task sys_id or number'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_scrum_tasks tool parameters
 */
export const listRecentScrumTasksSchema: JSONSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};
```

### Change Request Tool Schemas

```typescript
/**
 * JSON Schema for query_change_requests tool parameters
 */
export const queryChangeRequestsSchema: JSONSchema = {
  type: 'object',
  properties: {
    state: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by change request states (New, Assess, Authorize, Scheduled, Implement, Review, Closed, Canceled)'
    },
    priority: {
      type: 'array',
      items: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 5 
      },
      description: 'Filter by priority levels (1=Critical, 2=High, 3=Moderate, 4=Low, 5=Planning)'
    },
    risk: {
      type: 'array',
      items: { 
        type: 'integer', 
        minimum: 1, 
        maximum: 3 
      },
      description: 'Filter by risk levels (1=High, 2=Moderate, 3=Low)'
    },
    type: {
      type: 'array',
      items: { type: 'string' },
      description: 'Filter by change request types (standard, normal, emergency)'
    },
    assigned_to: {
      type: 'string',
      description: 'Filter by assigned user (name or sys_id)'
    },
    assignment_group: {
      type: 'string',
      description: 'Filter by assignment group (name or sys_id)'
    },
    query: {
      type: 'string',
      description: 'Custom ServiceNow encoded query string'
    },
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};

/**
 * JSON Schema for get_change_request tool parameters
 */
export const getChangeRequestSchema: JSONSchema = {
  type: 'object',
  properties: {
    identifier: {
      type: 'string',
      description: 'Change request sys_id or number'
    }
  },
  required: ['identifier']
};

/**
 * JSON Schema for list_recent_change_requests tool parameters
 */
export const listRecentChangeRequestsSchema: JSONSchema = {
  type: 'object',
  properties: {
    limit: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 25,
      description: 'Maximum number of results to return'
    }
  }
};
```

## Error Handling

### Error Response Structure

All errors follow a consistent structure across all services:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    detail?: string;
  };
}
```

### Error Categories

1. **Validation Errors** (code: 'VALIDATION_ERROR')
   - Invalid filter values (state, priority, risk, type)
   - Invalid parameter types
   - Missing required parameters
   - Out-of-range values (limit, priority)

2. **Not Found Errors** (code: 'NOT_FOUND')
   - Record not found by sys_id
   - Record not found by identifier
   - Handled by returning null instead of throwing

3. **API Errors** (code: varies)
   - ServiceNow API errors
   - Network connectivity issues
   - Authentication failures
   - Propagated from ServiceNowClient

4. **Internal Errors** (code: 'INTERNAL_ERROR')
   - Unexpected exceptions
   - Data transformation failures
   - Unhandled edge cases

### Error Handling Strategy

1. **Validation First**: All parameters are validated before making API calls
2. **Graceful Degradation**: Not found cases return null rather than throwing
3. **Error Propagation**: ServiceNow errors are wrapped and propagated with context
4. **Structured Logging**: All errors are logged with operation context and duration
5. **Consistent Format**: All error responses follow the same structure

### Null Handling

All services handle null and missing fields gracefully:

- Reference fields (assigned_to, manager, etc.) default to null
- Optional fields (description, category, etc.) default to null
- Required fields (sys_id, number, name) are always present
- Type conversion handles null by returning null for nullable fields

## Testing Strategy

### Dual Testing Approach

This feature requires both unit testing and property-based testing to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of query construction
- Edge cases (empty results, not found, null fields)
- Error conditions (invalid parameters, API failures)
- Integration points (service initialization, client usage)
- Tool handler parameter validation
- MCP tool registration

**Property-Based Tests** focus on:
- Universal properties across all inputs
- Data transformation correctness
- Filter validation across all filter combinations
- Response structure consistency
- Error handling consistency

### Property-Based Testing Configuration

**Library**: fast-check (TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: `Feature: servicenow-multi-table-support, Property {number}: {property_text}`

**Generator Strategy**:
- Generate random ServiceNow records with all field types
- Generate random filter combinations
- Generate random valid and invalid identifiers
- Generate edge cases (null fields, empty strings, boundary values)

### Test Organization

Tests are organized by service:

```
src/service/
  UserService.test.ts           # Unit tests for UserService
  UserService.property.test.ts  # Property tests for UserService
  GroupService.test.ts          # Unit tests for GroupService
  GroupService.property.test.ts # Property tests for GroupService
  GroupMemberService.test.ts    # Unit tests for GroupMemberService
  GroupMemberService.property.test.ts # Property tests for GroupMemberService
  TaskService.test.ts           # Unit tests for TaskService
  TaskService.property.test.ts  # Property tests for TaskService
  StoryService.test.ts          # Unit tests for StoryService
  StoryService.property.test.ts # Property tests for StoryService
  ScrumTaskService.test.ts      # Unit tests for ScrumTaskService
  ScrumTaskService.property.test.ts # Property tests for ScrumTaskService
  ChangeRequestService.test.ts  # Unit tests for ChangeRequestService
  ChangeRequestService.property.test.ts # Property tests for ChangeRequestService

src/tools/
  handlers.test.ts              # Unit tests for all tool handlers (extended)

src/types/
  user.test.ts                  # Unit tests for user type definitions
  group.test.ts                 # Unit tests for group type definitions
  groupMember.test.ts           # Unit tests for group member type definitions
  task.test.ts                  # Unit tests for task type definitions
  story.test.ts                 # Unit tests for story type definitions
  scrumTask.test.ts             # Unit tests for scrum task type definitions
  changeRequest.test.ts         # Unit tests for change request type definitions
```

### Coverage Goals

- **Line Coverage**: Minimum 90% for all service classes
- **Branch Coverage**: Minimum 85% for all conditional logic
- **Property Coverage**: All 20 correctness properties implemented as property tests
- **Edge Case Coverage**: All edge cases identified in prework analysis

### Testing Dependencies

All tests use existing infrastructure:
- Mock ServiceNowClient for unit tests
- Real ServiceNowClient with test instance for integration tests
- fast-check for property-based testing
- Jest as the test runner

### Test Execution

- Unit tests run on every commit
- Property tests run on every commit (100 iterations minimum)
- Integration tests run on pull requests
- Full test suite runs before release
