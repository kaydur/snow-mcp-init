# Implementation Plan: ServiceNow Multi-Table Support

## Overview

This implementation plan extends the ServiceNow MCP Server to support seven additional ServiceNow tables: Users (sys_user), Groups (sys_user_group), Group Members (sys_user_grmember), Tasks (task), Stories (rm_story), Scrum Tasks (rm_scrum_task), and Change Requests (change_request). The implementation follows the established architectural patterns from IncidentService, ensuring consistency and code reuse.

Each table will have its own Service class, data models, filter interfaces, tool handlers, and MCP tool registration. The implementation leverages existing infrastructure components (ServiceNowClient, AuthenticationManager, ConfigurationManager) to maintain architectural consistency.

## Tasks

- [x] 1. Implement User data models and types
  - [x] 1.1 Create UserSummary and UserDetail interfaces
    - Define UserSummary with sys_id, user_name, name, email, active, title
    - Define UserDetail extending UserSummary with phone, department, manager, created_at
    - _Requirements: 1.2, 2.3_
  
  - [x] 1.2 Create UserFilters interface
    - Define UserFilters with active, department, role, name, query, limit
    - _Requirements: 1.3_
  
  - [x] 1.3 Create tool parameter and response interfaces
    - Define QueryUsersParams, QueryUsersResponse
    - Define GetUserParams, GetUserResponse
    - Define ListRecentUsersParams, ListRecentUsersResponse
    - _Requirements: 12.1, 12.3_

- [x] 2. Implement UserService
  - [x] 2.1 Implement UserService class core methods
    - Implement constructor accepting ServiceNowClient
    - Implement queryUsers() to query users with filters
    - Implement getUser() to retrieve user by sys_id or username
    - Implement listRecentUsers() to list recent users with optional limit
    - _Requirements: 1.1, 2.1, 2.2, 11.1_
  
  - [x] 2.2 Implement query building and data transformation
    - Implement buildQuery() to construct ServiceNow encoded query strings from UserFilters
    - Support active, department, role, name filters
    - Support custom query strings
    - Implement toUserSummary() to transform ServiceNow records to UserSummary
    - Implement toUserDetail() to transform ServiceNow records to UserDetail
    - Apply result limits (max 100, default 25)
    - Order results by updated_at descending for list operations
    - _Requirements: 1.2, 1.3, 1.4, 2.3, 11.4, 13.1, 13.2, 13.3_
  
  - [x] 2.3 Implement filter validation
    - Validate filter parameters before query execution
    - Return validation errors for invalid filter values
    - _Requirements: 14.1, 14.2, 14.5_

  - [ ]* 2.4 Write unit tests for UserService
    - Test query string building from various filter combinations
    - Test user transformation (ServiceNow record → UserSummary/UserDetail)
    - Test result limiting and ordering
    - Test empty result handling
    - Test null field handling (department, manager, phone)
    - Test getUser with sys_id and username
    - Test getUser with non-existent identifier
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.4, 13.2_
  
  - [ ]* 2.5 Write property tests for UserService
    - **Property 1: Query construction with filters**
    - **Property 2: Summary field transformation**
    - **Property 3: Filter support**
    - **Property 4: Result limit enforcement**
    - **Property 5: Retrieval by sys_id**
    - **Property 6: Retrieval by identifier**
    - **Property 7: Detail field transformation**
    - **Property 12: Null field handling**
    - **Property 13: Type conversion correctness**
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 13.2, 13.3_

- [x] 3. Implement Group data models and types
  - [x] 3.1 Create GroupSummary and GroupDetail interfaces
    - Define GroupSummary with sys_id, name, description, active, type, manager
    - Define GroupDetail extending GroupSummary with email, created_at
    - _Requirements: 3.2, 4.3_
  
  - [x] 3.2 Create GroupFilters interface
    - Define GroupFilters with active, type, name, query, limit
    - _Requirements: 3.3_
  
  - [x] 3.3 Create tool parameter and response interfaces
    - Define QueryGroupsParams, QueryGroupsResponse
    - Define GetGroupParams, GetGroupResponse
    - Define ListRecentGroupsParams, ListRecentGroupsResponse
    - _Requirements: 12.1, 12.3_

- [x] 4. Implement GroupService
  - [x] 4.1 Implement GroupService class core methods
    - Implement constructor accepting ServiceNowClient
    - Implement queryGroups() to query groups with filters
    - Implement getGroup() to retrieve group by sys_id or name
    - Implement listRecentGroups() to list recent groups with optional limit
    - _Requirements: 3.1, 4.1, 4.2, 11.1_
  
  - [x] 4.2 Implement query building and data transformation
    - Implement buildQuery() to construct ServiceNow encoded query strings from GroupFilters
    - Support active, type, name filters
    - Support custom query strings
    - Implement toGroupSummary() to transform ServiceNow records to GroupSummary
    - Implement toGroupDetail() to transform ServiceNow records to GroupDetail
    - Apply result limits (max 100, default 25)
    - Order results by updated_at descending for list operations
    - _Requirements: 3.2, 3.3, 3.4, 4.3, 11.4, 13.1, 13.2, 13.3_
  
  - [x] 4.3 Implement filter validation
    - Validate filter parameters before query execution
    - Return validation errors for invalid filter values
    - _Requirements: 14.1, 14.2, 14.5_
  
  - [ ]* 4.4 Write unit tests for GroupService
    - Test query string building from various filter combinations
    - Test group transformation (ServiceNow record → GroupSummary/GroupDetail)
    - Test result limiting and ordering
    - Test empty result handling
    - Test null field handling (description, type, manager, email)
    - Test getGroup with sys_id and name
    - Test getGroup with non-existent identifier
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.4, 13.2_
  
  - [ ]* 4.5 Write property tests for GroupService
    - **Property 1: Query construction with filters**
    - **Property 2: Summary field transformation**
    - **Property 3: Filter support**
    - **Property 4: Result limit enforcement**
    - **Property 5: Retrieval by sys_id**
    - **Property 6: Retrieval by identifier**
    - **Property 7: Detail field transformation**
    - **Property 12: Null field handling**
    - **Property 13: Type conversion correctness**
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 13.2, 13.3_

- [x] 5. Implement Group Member data models and types
  - [x] 5.1 Create GroupMemberSummary and GroupMemberDetail interfaces
    - Define GroupMemberSummary with sys_id, group, user
    - Define GroupMemberDetail extending GroupMemberSummary with created_at
    - _Requirements: 12.2_
  
  - [x] 5.2 Create GroupMemberFilters interface
    - Define GroupMemberFilters with group, user, query, limit
    - _Requirements: 12.2_
  
  - [x] 5.3 Create tool parameter and response interfaces
    - Define QueryGroupMembersParams, QueryGroupMembersResponse
    - Define GetGroupMemberParams, GetGroupMemberResponse
    - Define ListRecentGroupMembersParams, ListRecentGroupMembersResponse
    - _Requirements: 12.1, 12.3_

- [x] 6. Implement GroupMemberService
  - [x] 6.1 Implement GroupMemberService class core methods
    - Implement constructor accepting ServiceNowClient
    - Implement queryGroupMembers() to query group members with filters
    - Implement getGroupMember() to retrieve group member by sys_id
    - Implement listRecentGroupMembers() to list recent group members with optional limit
    - _Requirements: 11.1, 16.1_
  
  - [x] 6.2 Implement query building and data transformation
    - Implement buildQuery() to construct ServiceNow encoded query strings from GroupMemberFilters
    - Support group, user filters
    - Support custom query strings
    - Implement toGroupMemberSummary() to transform ServiceNow records to GroupMemberSummary
    - Implement toGroupMemberDetail() to transform ServiceNow records to GroupMemberDetail
    - Apply result limits (max 100, default 25)
    - Order results by updated_at descending for list operations
    - _Requirements: 11.4, 13.1, 13.2, 13.3_
  
  - [x] 6.3 Implement filter validation
    - Validate filter parameters before query execution
    - Return validation errors for invalid filter values
    - _Requirements: 14.1, 14.2, 14.5_
  
  - [x]* 6.4 Write unit tests for GroupMemberService
    - Test query string building from various filter combinations
    - Test group member transformation (ServiceNow record → GroupMemberSummary/GroupMemberDetail)
    - Test result limiting and ordering
    - Test empty result handling
    - Test getGroupMember with sys_id
    - Test getGroupMember with non-existent identifier
    - _Requirements: 13.2, 16.1_
  
  - [ ]* 6.5 Write property tests for GroupMemberService
    - **Property 1: Query construction with filters**
    - **Property 2: Summary field transformation**
    - **Property 3: Filter support**
    - **Property 4: Result limit enforcement**
    - **Property 5: Retrieval by sys_id**
    - **Property 7: Detail field transformation**
    - **Property 12: Null field handling**
    - **Property 13: Type conversion correctness**
    - _Requirements: 13.2, 13.3, 16.1_

- [x] 7. Implement Task data models and types
  - [x] 7.1 Create TaskSummary and TaskDetail interfaces
    - Define TaskState enum with numeric values (Open=1, WorkInProgress=2, Closed=3, Pending=-5, Canceled=4)
    - Define TaskPriority enum with numeric values (Critical=1, High=2, Moderate=3, Low=4, Planning=5)
    - Define TaskSummary with sys_id, number, short_description, state, priority, assigned_to, assignment_group, updated_at
    - Define TaskDetail extending TaskSummary with description, opened_by, opened_at, due_date, work_notes
    - _Requirements: 12.2_
  
  - [x] 7.2 Create TaskFilters interface
    - Define TaskFilters with state, priority, assigned_to, assignment_group, query, limit
    - _Requirements: 12.2_
  
  - [x] 7.3 Create tool parameter and response interfaces
    - Define QueryTasksParams, QueryTasksResponse
    - Define GetTaskParams, GetTaskResponse
    - Define ListRecentTasksParams, ListRecentTasksResponse
    - _Requirements: 12.1, 12.3_

- [x] 8. Implement TaskService
  - [x] 8.1 Implement TaskService class core methods
    - Implement constructor accepting ServiceNowClient
    - Implement queryTasks() to query tasks with filters
    - Implement getTask() to retrieve task by sys_id or number
    - Implement listRecentTasks() to list recent tasks with optional limit
    - _Requirements: 11.1, 16.1_
  
  - [x] 8.2 Implement query building and data transformation
    - Implement buildQuery() to construct ServiceNow encoded query strings from TaskFilters
    - Support state, priority, assigned_to, assignment_group filters
    - Support custom query strings
    - Implement toTaskSummary() to transform ServiceNow records to TaskSummary
    - Implement toTaskDetail() to transform ServiceNow records to TaskDetail
    - Apply result limits (max 100, default 25)
    - Order results by updated_at descending for list operations
    - _Requirements: 11.4, 13.1, 13.2, 13.3_
  
  - [x] 8.3 Implement filter validation
    - Validate state values against known states (Open, Work In Progress, Closed, Pending, Canceled)
    - Validate priority values (1-5)
    - Return validation errors for invalid filter values
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
  
  - [x]* 8.4 Write unit tests for TaskService
    - Test query string building from various filter combinations
    - Test task transformation (ServiceNow record → TaskSummary/TaskDetail)
    - Test result limiting and ordering
    - Test empty result handling
    - Test null field handling (assigned_to, assignment_group, due_date, work_notes)
    - Test getTask with sys_id and number
    - Test getTask with non-existent identifier
    - _Requirements: 13.2, 16.1_
  
  - [ ]* 8.5 Write property tests for TaskService
    - **Property 1: Query construction with filters**
    - **Property 2: Summary field transformation**
    - **Property 3: Filter support**
    - **Property 4: Result limit enforcement**
    - **Property 5: Retrieval by sys_id**
    - **Property 6: Retrieval by identifier**
    - **Property 7: Detail field transformation**
    - **Property 12: Null field handling**
    - **Property 13: Type conversion correctness**
    - **Property 14: Filter validation**
    - _Requirements: 13.2, 13.3, 14.1, 16.1_

- [x] 9. Implement Story data models and types
  - [x] 9.1 Create StorySummary and StoryDetail interfaces
    - Define StoryState enum with numeric values (Draft=-5, Ready=-4, InProgress=-3, Review=-2, Complete=-1, Accepted=3)
    - Define StoryPriority enum with numeric values (Critical=1, High=2, Moderate=3, Low=4, Planning=5)
    - Define StorySummary with sys_id, number, short_description, state, priority, assigned_to, story_points, updated_at
    - Define StoryDetail extending StorySummary with description, sprint, product, opened_by, opened_at
    - _Requirements: 5.2, 6.3_
  
  - [x] 9.2 Create StoryFilters interface
    - Define StoryFilters with state, priority, sprint, assigned_to, story_points, query, limit
    - _Requirements: 5.3_
  
  - [x] 9.3 Create tool parameter and response interfaces
    - Define QueryStoriesParams, QueryStoriesResponse
    - Define GetStoryParams, GetStoryResponse
    - Define ListRecentStoriesParams, ListRecentStoriesResponse
    - _Requirements: 12.1, 12.3_

- [x] 10. Implement StoryService
  - [x] 10.1 Implement StoryService class core methods
    - Implement constructor accepting ServiceNowClient
    - Implement queryStories() to query stories with filters
    - Implement getStory() to retrieve story by sys_id or number
    - Implement listRecentStories() to list recent stories with optional limit
    - _Requirements: 5.1, 6.1, 6.2, 11.1_
  
  - [x] 10.2 Implement query building and data transformation
    - Implement buildQuery() to construct ServiceNow encoded query strings from StoryFilters
    - Support state, priority, sprint, assigned_to, story_points filters
    - Support custom query strings
    - Implement toStorySummary() to transform ServiceNow records to StorySummary
    - Implement toStoryDetail() to transform ServiceNow records to StoryDetail
    - Apply result limits (max 100, default 25)
    - Order results by updated_at descending for list operations
    - _Requirements: 5.2, 5.3, 5.4, 6.3, 11.4, 13.1, 13.2, 13.3_

  - [x] 10.3 Implement filter validation
    - Validate state values against known states (Draft, Ready, In Progress, Review, Complete, Accepted)
    - Validate priority values (1-5)
    - Return validation errors for invalid filter values
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
  
  - [ ]* 10.4 Write unit tests for StoryService
    - Test query string building from various filter combinations
    - Test story transformation (ServiceNow record → StorySummary/StoryDetail)
    - Test result limiting and ordering
    - Test empty result handling
    - Test null field handling (assigned_to, story_points, sprint, product)
    - Test getStory with sys_id and number
    - Test getStory with non-existent identifier
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.4, 13.2_
  
  - [ ]* 10.5 Write property tests for StoryService
    - **Property 1: Query construction with filters**
    - **Property 2: Summary field transformation**
    - **Property 3: Filter support**
    - **Property 4: Result limit enforcement**
    - **Property 5: Retrieval by sys_id**
    - **Property 6: Retrieval by identifier**
    - **Property 7: Detail field transformation**
    - **Property 12: Null field handling**
    - **Property 13: Type conversion correctness**
    - **Property 14: Filter validation**
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 13.2, 13.3, 14.1_

- [x] 11. Implement Scrum Task data models and types
  - [x] 11.1 Create ScrumTaskSummary and ScrumTaskDetail interfaces
    - Define ScrumTaskState enum with numeric values (Ready=1, WorkInProgress=2, Complete=3, Canceled=4)
    - Define ScrumTaskPriority enum with numeric values (Critical=1, High=2, Moderate=3, Low=4, Planning=5)
    - Define ScrumTaskSummary with sys_id, number, short_description, state, priority, assigned_to, remaining_work, updated_at
    - Define ScrumTaskDetail extending ScrumTaskSummary with description, parent_story, sprint, opened_by, opened_at
    - _Requirements: 7.2, 8.3_
  
  - [x] 11.2 Create ScrumTaskFilters interface
    - Define ScrumTaskFilters with state, priority, sprint, assigned_to, parent_story, query, limit
    - _Requirements: 7.3_
  
  - [x] 11.3 Create tool parameter and response interfaces
    - Define QueryScrumTasksParams, QueryScrumTasksResponse
    - Define GetScrumTaskParams, GetScrumTaskResponse
    - Define ListRecentScrumTasksParams, ListRecentScrumTasksResponse
    - _Requirements: 12.1, 12.3_

- [x] 12. Implement ScrumTaskService
  - [x] 12.1 Implement ScrumTaskService class core methods
    - Implement constructor accepting ServiceNowClient
    - Implement queryScrumTasks() to query scrum tasks with filters
    - Implement getScrumTask() to retrieve scrum task by sys_id or number
    - Implement listRecentScrumTasks() to list recent scrum tasks with optional limit
    - _Requirements: 7.1, 8.1, 8.2, 11.1_
  
  - [x] 12.2 Implement query building and data transformation
    - Implement buildQuery() to construct ServiceNow encoded query strings from ScrumTaskFilters
    - Support state, priority, sprint, assigned_to, parent_story filters
    - Support custom query strings
    - Implement toScrumTaskSummary() to transform ServiceNow records to ScrumTaskSummary
    - Implement toScrumTaskDetail() to transform ServiceNow records to ScrumTaskDetail
    - Apply result limits (max 100, default 25)
    - Order results by updated_at descending for list operations
    - _Requirements: 7.2, 7.3, 7.4, 8.3, 11.4, 13.1, 13.2, 13.3_
  
  - [x] 12.3 Implement filter validation
    - Validate state values against known states (Ready, Work In Progress, Complete, Canceled)
    - Validate priority values (1-5)
    - Return validation errors for invalid filter values
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
  
  - [ ]* 12.4 Write unit tests for ScrumTaskService
    - Test query string building from various filter combinations
    - Test scrum task transformation (ServiceNow record → ScrumTaskSummary/ScrumTaskDetail)
    - Test result limiting and ordering
    - Test empty result handling
    - Test null field handling (assigned_to, remaining_work, parent_story, sprint)
    - Test getScrumTask with sys_id and number
    - Test getScrumTask with non-existent identifier
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.4, 13.2_

  - [ ]* 12.5 Write property tests for ScrumTaskService
    - **Property 1: Query construction with filters**
    - **Property 2: Summary field transformation**
    - **Property 3: Filter support**
    - **Property 4: Result limit enforcement**
    - **Property 5: Retrieval by sys_id**
    - **Property 6: Retrieval by identifier**
    - **Property 7: Detail field transformation**
    - **Property 12: Null field handling**
    - **Property 13: Type conversion correctness**
    - **Property 14: Filter validation**
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 8.1, 8.2, 8.3, 13.2, 13.3, 14.1_

- [x] 13. Implement Change Request data models and types
  - [x] 13.1 Create ChangeRequestSummary and ChangeRequestDetail interfaces
    - Define ChangeRequestState enum with numeric values (New=-5, Assess=-4, Authorize=-3, Scheduled=-2, Implement=-1, Review=0, Closed=3, Canceled=4)
    - Define ChangeRequestPriority enum with numeric values (Critical=1, High=2, Moderate=3, Low=4, Planning=5)
    - Define ChangeRequestRisk enum with numeric values (High=1, Moderate=2, Low=3)
    - Define ChangeRequestType enum with string values (standard, normal, emergency)
    - Define ChangeRequestSummary with sys_id, number, short_description, state, priority, risk, type, assigned_to, updated_at
    - Define ChangeRequestDetail extending ChangeRequestSummary with description, category, assignment_group, start_date, end_date, opened_by, opened_at
    - _Requirements: 9.2, 10.3_
  
  - [x] 13.2 Create ChangeRequestFilters interface
    - Define ChangeRequestFilters with state, priority, risk, type, assigned_to, assignment_group, query, limit
    - _Requirements: 9.3_
  
  - [x] 13.3 Create tool parameter and response interfaces
    - Define QueryChangeRequestsParams, QueryChangeRequestsResponse
    - Define GetChangeRequestParams, GetChangeRequestResponse
    - Define ListRecentChangeRequestsParams, ListRecentChangeRequestsResponse
    - _Requirements: 12.1, 12.3_

- [x] 14. Implement ChangeRequestService
  - [x] 14.1 Implement ChangeRequestService class core methods
    - Implement constructor accepting ServiceNowClient
    - Implement queryChangeRequests() to query change requests with filters
    - Implement getChangeRequest() to retrieve change request by sys_id or number
    - Implement listRecentChangeRequests() to list recent change requests with optional limit
    - _Requirements: 9.1, 10.1, 10.2, 11.1_
  
  - [x] 14.2 Implement query building and data transformation
    - Implement buildQuery() to construct ServiceNow encoded query strings from ChangeRequestFilters
    - Support state, priority, risk, type, assigned_to, assignment_group filters
    - Support custom query strings
    - Implement toChangeRequestSummary() to transform ServiceNow records to ChangeRequestSummary
    - Implement toChangeRequestDetail() to transform ServiceNow records to ChangeRequestDetail
    - Apply result limits (max 100, default 25)
    - Order results by updated_at descending for list operations
    - _Requirements: 9.2, 9.3, 9.4, 10.3, 11.4, 13.1, 13.2, 13.3_
  
  - [x] 14.3 Implement filter validation
    - Validate state values against known states (New, Assess, Authorize, Scheduled, Implement, Review, Closed, Canceled)
    - Validate priority values (1-5)
    - Validate risk values (1-3)
    - Validate type values (standard, normal, emergency)
    - Return validation errors for invalid filter values
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
  
  - [ ]* 14.4 Write unit tests for ChangeRequestService
    - Test query string building from various filter combinations
    - Test change request transformation (ServiceNow record → ChangeRequestSummary/ChangeRequestDetail)
    - Test result limiting and ordering
    - Test empty result handling
    - Test null field handling (assigned_to, assignment_group, category, start_date, end_date)
    - Test getChangeRequest with sys_id and number
    - Test getChangeRequest with non-existent identifier
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.4, 13.2_
  
  - [ ]* 14.5 Write property tests for ChangeRequestService
    - **Property 1: Query construction with filters**
    - **Property 2: Summary field transformation**
    - **Property 3: Filter support**
    - **Property 4: Result limit enforcement**
    - **Property 5: Retrieval by sys_id**
    - **Property 6: Retrieval by identifier**
    - **Property 7: Detail field transformation**
    - **Property 12: Null field handling**
    - **Property 13: Type conversion correctness**
    - **Property 14: Filter validation**
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 13.2, 13.3, 14.1_

- [x] 15. Implement tool handlers for all tables
  - [x] 15.1 Implement User tool handlers
    - Implement queryUsersHandler to validate parameters and call userService.queryUsers()
    - Implement getUserHandler to validate identifier and call userService.getUser()
    - Implement listRecentUsersHandler to validate limit and call userService.listRecentUsers()
    - Handle errors and return structured error responses
    - _Requirements: 1.1, 1.5, 2.1, 2.4, 11.1, 11.2, 12.4, 15.1, 15.2_
  
  - [x] 15.2 Implement Group tool handlers
    - Implement queryGroupsHandler to validate parameters and call groupService.queryGroups()
    - Implement getGroupHandler to validate identifier and call groupService.getGroup()
    - Implement listRecentGroupsHandler to validate limit and call groupService.listRecentGroups()
    - Handle errors and return structured error responses
    - _Requirements: 3.1, 3.5, 4.1, 4.4, 11.1, 11.2, 12.4, 15.1, 15.2_
  
  - [x] 15.3 Implement Group Member tool handlers
    - Implement queryGroupMembersHandler to validate parameters and call groupMemberService.queryGroupMembers()
    - Implement getGroupMemberHandler to validate identifier and call groupMemberService.getGroupMember()
    - Implement listRecentGroupMembersHandler to validate limit and call groupMemberService.listRecentGroupMembers()
    - Handle errors and return structured error responses
    - _Requirements: 11.1, 11.2, 12.4, 15.1, 15.2_
  
  - [x] 15.4 Implement Task tool handlers
    - Implement queryTasksHandler to validate parameters and call taskService.queryTasks()
    - Implement getTaskHandler to validate identifier and call taskService.getTask()
    - Implement listRecentTasksHandler to validate limit and call taskService.listRecentTasks()
    - Handle errors and return structured error responses
    - _Requirements: 11.1, 11.2, 12.4, 15.1, 15.2_
  
  - [x] 15.5 Implement Story tool handlers
    - Implement queryStoriesHandler to validate parameters and call storyService.queryStories()
    - Implement getStoryHandler to validate identifier and call storyService.getStory()
    - Implement listRecentStoriesHandler to validate limit and call storyService.listRecentStories()
    - Handle errors and return structured error responses
    - _Requirements: 5.1, 5.5, 6.1, 6.4, 11.1, 11.2, 12.4, 15.1, 15.2_
  
  - [x] 15.6 Implement Scrum Task tool handlers
    - Implement queryScrumTasksHandler to validate parameters and call scrumTaskService.queryScrumTasks()
    - Implement getScrumTaskHandler to validate identifier and call scrumTaskService.getScrumTask()
    - Implement listRecentScrumTasksHandler to validate limit and call scrumTaskService.listRecentScrumTasks()
    - Handle errors and return structured error responses
    - _Requirements: 7.1, 7.5, 8.1, 8.4, 11.1, 11.2, 12.4, 15.1, 15.2_
  
  - [x] 15.7 Implement Change Request tool handlers
    - Implement queryChangeRequestsHandler to validate parameters and call changeRequestService.queryChangeRequests()
    - Implement getChangeRequestHandler to validate identifier and call changeRequestService.getChangeRequest()
    - Implement listRecentChangeRequestsHandler to validate limit and call changeRequestService.listRecentChangeRequests()
    - Handle errors and return structured error responses
    - _Requirements: 9.1, 9.5, 10.1, 10.4, 11.1, 11.2, 12.4, 15.1, 15.2_
  
  - [ ]* 15.8 Write unit tests for all tool handlers
    - Test parameter validation for each tool
    - Test successful tool invocations
    - Test error responses
    - Test response formatting
    - Test not found handling in get handlers
    - _Requirements: 12.4, 15.1, 15.2, 15.3_

- [x] 16. Create JSON schemas for all tools
  - [x] 16.1 Create User tool schemas
    - Create queryUsersSchema with active, department, role, name, query, limit parameters
    - Create getUserSchema with identifier parameter (required)
    - Create listRecentUsersSchema with limit parameter
    - _Requirements: 12.3_
  
  - [x] 16.2 Create Group tool schemas
    - Create queryGroupsSchema with active, type, name, query, limit parameters
    - Create getGroupSchema with identifier parameter (required)
    - Create listRecentGroupsSchema with limit parameter
    - _Requirements: 12.3_
  
  - [x] 16.3 Create Group Member tool schemas
    - Create queryGroupMembersSchema with group, user, query, limit parameters
    - Create getGroupMemberSchema with identifier parameter (required)
    - Create listRecentGroupMembersSchema with limit parameter
    - _Requirements: 12.3_

  - [x] 16.4 Create Task tool schemas
    - Create queryTasksSchema with state, priority, assigned_to, assignment_group, query, limit parameters
    - Create getTaskSchema with identifier parameter (required)
    - Create listRecentTasksSchema with limit parameter
    - _Requirements: 12.3_
  
  - [x] 16.5 Create Story tool schemas
    - Create queryStoriesSchema with state, priority, sprint, assigned_to, story_points, query, limit parameters
    - Create getStorySchema with identifier parameter (required)
    - Create listRecentStoriesSchema with limit parameter
    - _Requirements: 12.3_
  
  - [x] 16.6 Create Scrum Task tool schemas
    - Create queryScrumTasksSchema with state, priority, sprint, assigned_to, parent_story, query, limit parameters
    - Create getScrumTaskSchema with identifier parameter (required)
    - Create listRecentScrumTasksSchema with limit parameter
    - _Requirements: 12.3_
  
  - [x] 16.7 Create Change Request tool schemas
    - Create queryChangeRequestsSchema with state, priority, risk, type, assigned_to, assignment_group, query, limit parameters
    - Create getChangeRequestSchema with identifier parameter (required)
    - Create listRecentChangeRequestsSchema with limit parameter
    - _Requirements: 12.3_

- [x] 17. Register all tools with MCP Server
  - [x] 17.1 Register User tools
    - Register query_users tool with schema and queryUsersHandler
    - Register get_user tool with schema and getUserHandler
    - Register list_recent_users tool with schema and listRecentUsersHandler
    - Include tool descriptions in registration
    - _Requirements: 12.1, 12.2, 12.5_
  
  - [x] 17.2 Register Group tools
    - Register query_groups tool with schema and queryGroupsHandler
    - Register get_group tool with schema and getGroupHandler
    - Register list_recent_groups tool with schema and listRecentGroupsHandler
    - Include tool descriptions in registration
    - _Requirements: 12.1, 12.2, 12.5_
  
  - [x] 17.3 Register Group Member tools
    - Register query_group_members tool with schema and queryGroupMembersHandler
    - Register get_group_member tool with schema and getGroupMemberHandler
    - Register list_recent_group_members tool with schema and listRecentGroupMembersHandler
    - Include tool descriptions in registration
    - _Requirements: 12.1, 12.2, 12.5_
  
  - [x] 17.4 Register Task tools
    - Register query_tasks tool with schema and queryTasksHandler
    - Register get_task tool with schema and getTaskHandler
    - Register list_recent_tasks tool with schema and listRecentTasksHandler
    - Include tool descriptions in registration
    - _Requirements: 12.1, 12.2, 12.5_
  
  - [x] 17.5 Register Story tools
    - Register query_stories tool with schema and queryStoriesHandler
    - Register get_story tool with schema and getStoryHandler
    - Register list_recent_stories tool with schema and listRecentStoriesHandler
    - Include tool descriptions in registration
    - _Requirements: 12.1, 12.2, 12.5_
  
  - [x] 17.6 Register Scrum Task tools
    - Register query_scrum_tasks tool with schema and queryScrumTasksHandler
    - Register get_scrum_task tool with schema and getScrumTaskHandler
    - Register list_recent_scrum_tasks tool with schema and listRecentScrumTasksHandler
    - Include tool descriptions in registration
    - _Requirements: 12.1, 12.2, 12.5_
  
  - [x] 17.7 Register Change Request tools
    - Register query_change_requests tool with schema and queryChangeRequestsHandler
    - Register get_change_request tool with schema and getChangeRequestHandler
    - Register list_recent_change_requests tool with schema and listRecentChangeRequestsHandler
    - Include tool descriptions in registration
    - _Requirements: 12.1, 12.2, 12.5_

- [x] 18. Add logging for all new services
  - [x] 18.1 Add logging to UserService
    - Log query operations with filters, result count, and duration
    - Log get operations with identifier, found status, and duration
    - Log list operations with limit, result count, and duration
    - Sanitize sensitive data from logs
    - _Requirements: 15.4_
  
  - [x] 18.2 Add logging to GroupService
    - Log query operations with filters, result count, and duration
    - Log get operations with identifier, found status, and duration
    - Log list operations with limit, result count, and duration
    - _Requirements: 15.4_

  - [x] 18.3 Add logging to GroupMemberService
    - Log query operations with filters, result count, and duration
    - Log get operations with identifier, found status, and duration
    - Log list operations with limit, result count, and duration
    - _Requirements: 15.4_
  
  - [x] 18.4 Add logging to TaskService
    - Log query operations with filters, result count, and duration
    - Log get operations with identifier, found status, and duration
    - Log list operations with limit, result count, and duration
    - _Requirements: 15.4_
  
  - [x] 18.5 Add logging to StoryService
    - Log query operations with filters, result count, and duration
    - Log get operations with identifier, found status, and duration
    - Log list operations with limit, result count, and duration
    - _Requirements: 15.4_
  
  - [x] 18.6 Add logging to ScrumTaskService
    - Log query operations with filters, result count, and duration
    - Log get operations with identifier, found status, and duration
    - Log list operations with limit, result count, and duration
    - _Requirements: 15.4_
  
  - [x] 18.7 Add logging to ChangeRequestService
    - Log query operations with filters, result count, and duration
    - Log get operations with identifier, found status, and duration
    - Log list operations with limit, result count, and duration
    - _Requirements: 15.4_

- [x] 19. Update main entry point and exports
  - [x] 19.1 Update service exports
    - Export UserService, GroupService, GroupMemberService, TaskService, StoryService, ScrumTaskService, ChangeRequestService from src/service/index.ts
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [x] 19.2 Update type exports
    - Export all new interfaces and enums from src/types/index.ts
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [x] 19.3 Update tool handler exports
    - Export all new tool handlers from src/tools/index.ts
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [x] 19.4 Initialize new services in MCPServer
    - Create instances of all new services in MCPServer constructor
    - Pass ServiceNowClient to each service constructor
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 20. Update documentation
  - [x] 20.1 Update README.md
    - Document all new tools and their parameters
    - Provide usage examples for each table
    - Update tool list with all 21 new tools (3 per table × 7 tables)
    - _Requirements: 12.1, 12.2_
  
  - [x] 20.2 Add inline code documentation
    - Add JSDoc comments to all new service classes and methods
    - Document parameter types and return types
    - Document error conditions
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 21. Final checkpoint - Ensure all tests pass
  - Run all unit tests for new services
  - Run all property tests for new services
  - Test tool registration and discovery
  - Test end-to-end tool invocation for each table
  - Verify consistent error handling across all tables
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests should run with minimum 100 iterations each
- All property tests must include the tag comment: `// Feature: servicenow-multi-table-support, Property N: [property text]`
- The implementation reuses existing infrastructure (ServiceNowClient, AuthenticationManager, ConfigurationManager, Logger)
- All services follow the same architectural pattern as IncidentService for consistency
- ServiceNow table names: sys_user, sys_user_group, sys_user_grmember, task, rm_story, rm_scrum_task, change_request
- Total of 21 new MCP tools will be registered (3 per table: query, get, list_recent)
- All services use the existing ServiceNowClient.get() and getById() methods
- Filter validation follows the same patterns as IncidentService
- Error handling follows the established error response structure
- Null handling is consistent across all services (nullable fields default to null)
