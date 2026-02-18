/**
 * New Table Tool Handlers
 * 
 * Handlers for Users, Groups, GroupMembers, Tasks, Stories, ScrumTasks, and ChangeRequests
 */

import { UserService } from '../service/UserService.js';
import { GroupService } from '../service/GroupService.js';
import { GroupMemberService } from '../service/GroupMemberService.js';
import { TaskService } from '../service/TaskService.js';
import { StoryService } from '../service/StoryService.js';
import { ScrumTaskService } from '../service/ScrumTaskService.js';
import { ChangeRequestService } from '../service/ChangeRequestService.js';
import {
  QueryUsersParams, QueryUsersResponse, GetUserParams, GetUserResponse,
  ListRecentUsersParams, ListRecentUsersResponse,
  QueryGroupsParams, QueryGroupsResponse, GetGroupParams, GetGroupResponse,
  ListRecentGroupsParams, ListRecentGroupsResponse,
  QueryGroupMembersParams, QueryGroupMembersResponse, GetGroupMemberParams, GetGroupMemberResponse,
  ListRecentGroupMembersParams, ListRecentGroupMembersResponse,
  QueryTasksParams, QueryTasksResponse, GetTaskParams, GetTaskResponse,
  ListRecentTasksParams, ListRecentTasksResponse,
  QueryStoriesParams, QueryStoriesResponse, GetStoryParams, GetStoryResponse,
  ListRecentStoriesParams, ListRecentStoriesResponse,
  QueryScrumTasksParams, QueryScrumTasksResponse, GetScrumTaskParams, GetScrumTaskResponse,
  ListRecentScrumTasksParams, ListRecentScrumTasksResponse,
  QueryChangeRequestsParams, QueryChangeRequestsResponse, GetChangeRequestParams, GetChangeRequestResponse,
  ListRecentChangeRequestsParams, ListRecentChangeRequestsResponse
} from '../types/tools.js';

interface ErrorResponse {
  error: { code: string; message: string; detail?: string; };
}


// ============================================================================
// USER HANDLERS
// ============================================================================

export async function queryUsersHandler(
  params: QueryUsersParams,
  userService: UserService
): Promise<QueryUsersResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const users = await userService.queryUsers(params);
    return { users, count: users.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while querying users', detail: error?.message || String(error) } };
  }
}

export async function getUserHandler(
  params: GetUserParams,
  userService: UserService
): Promise<GetUserResponse | ErrorResponse> {
  try {
    if (!params.identifier) {
      return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "identifier" is required', detail: 'The identifier parameter must be provided' } };
    }
    const user = await userService.getUser(params.identifier);
    return { user, found: user !== null };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while retrieving user', detail: error?.message || String(error) } };
  }
}

export async function listRecentUsersHandler(
  params: ListRecentUsersParams,
  userService: UserService
): Promise<ListRecentUsersResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const users = await userService.listRecentUsers(params.limit || 25);
    return { users, count: users.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while listing recent users', detail: error?.message || String(error) } };
  }
}


// ============================================================================
// GROUP HANDLERS
// ============================================================================

export async function queryGroupsHandler(
  params: QueryGroupsParams,
  groupService: GroupService
): Promise<QueryGroupsResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const groups = await groupService.queryGroups(params);
    return { groups, count: groups.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while querying groups', detail: error?.message || String(error) } };
  }
}

export async function getGroupHandler(
  params: GetGroupParams,
  groupService: GroupService
): Promise<GetGroupResponse | ErrorResponse> {
  try {
    if (!params.identifier) {
      return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "identifier" is required', detail: 'The identifier parameter must be provided' } };
    }
    const group = await groupService.getGroup(params.identifier);
    return { group, found: group !== null };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while retrieving group', detail: error?.message || String(error) } };
  }
}

export async function listRecentGroupsHandler(
  params: ListRecentGroupsParams,
  groupService: GroupService
): Promise<ListRecentGroupsResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const groups = await groupService.listRecentGroups(params.limit || 25);
    return { groups, count: groups.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while listing recent groups', detail: error?.message || String(error) } };
  }
}


// ============================================================================
// GROUPMEMBER HANDLERS
// ============================================================================

export async function queryGroupMembersHandler(
  params: QueryGroupMembersParams,
  groupMemberService: GroupMemberService
): Promise<QueryGroupMembersResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const group_members = await groupMemberService.queryGroupMembers(params);
    return { group_members, count: group_members.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while querying group_members', detail: error?.message || String(error) } };
  }
}

export async function getGroupMemberHandler(
  params: GetGroupMemberParams,
  groupMemberService: GroupMemberService
): Promise<GetGroupMemberResponse | ErrorResponse> {
  try {
    if (!params.identifier) {
      return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "identifier" is required', detail: 'The identifier parameter must be provided' } };
    }
    const group_member = await groupMemberService.getGroupMember(params.identifier);
    return { group_member, found: group_member !== null };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while retrieving group_member', detail: error?.message || String(error) } };
  }
}

export async function listRecentGroupMembersHandler(
  params: ListRecentGroupMembersParams,
  groupMemberService: GroupMemberService
): Promise<ListRecentGroupMembersResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const group_members = await groupMemberService.listRecentGroupMembers(params.limit || 25);
    return { group_members, count: group_members.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while listing recent group_members', detail: error?.message || String(error) } };
  }
}


// ============================================================================
// TASK HANDLERS
// ============================================================================

export async function queryTasksHandler(
  params: QueryTasksParams,
  taskService: TaskService
): Promise<QueryTasksResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const tasks = await taskService.queryTasks(params);
    return { tasks, count: tasks.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while querying tasks', detail: error?.message || String(error) } };
  }
}

export async function getTaskHandler(
  params: GetTaskParams,
  taskService: TaskService
): Promise<GetTaskResponse | ErrorResponse> {
  try {
    if (!params.identifier) {
      return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "identifier" is required', detail: 'The identifier parameter must be provided' } };
    }
    const task = await taskService.getTask(params.identifier);
    return { task, found: task !== null };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while retrieving task', detail: error?.message || String(error) } };
  }
}

export async function listRecentTasksHandler(
  params: ListRecentTasksParams,
  taskService: TaskService
): Promise<ListRecentTasksResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const tasks = await taskService.listRecentTasks(params.limit || 25);
    return { tasks, count: tasks.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while listing recent tasks', detail: error?.message || String(error) } };
  }
}


// ============================================================================
// STORY HANDLERS
// ============================================================================

export async function queryStoriesHandler(
  params: QueryStoriesParams,
  storyService: StoryService
): Promise<QueryStoriesResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const stories = await storyService.queryStories(params);
    return { stories, count: stories.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while querying stories', detail: error?.message || String(error) } };
  }
}

export async function getStoryHandler(
  params: GetStoryParams,
  storyService: StoryService
): Promise<GetStoryResponse | ErrorResponse> {
  try {
    if (!params.identifier) {
      return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "identifier" is required', detail: 'The identifier parameter must be provided' } };
    }
    const story = await storyService.getStory(params.identifier);
    return { story, found: story !== null };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while retrieving story', detail: error?.message || String(error) } };
  }
}

export async function listRecentStoriesHandler(
  params: ListRecentStoriesParams,
  storyService: StoryService
): Promise<ListRecentStoriesResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const stories = await storyService.listRecentStories(params.limit || 25);
    return { stories, count: stories.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while listing recent stories', detail: error?.message || String(error) } };
  }
}


// ============================================================================
// SCRUMTASK HANDLERS
// ============================================================================

export async function queryScrumTasksHandler(
  params: QueryScrumTasksParams,
  scrumTaskService: ScrumTaskService
): Promise<QueryScrumTasksResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const scrum_tasks = await scrumTaskService.queryScrumTasks(params);
    return { scrum_tasks, count: scrum_tasks.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while querying scrum_tasks', detail: error?.message || String(error) } };
  }
}

export async function getScrumTaskHandler(
  params: GetScrumTaskParams,
  scrumTaskService: ScrumTaskService
): Promise<GetScrumTaskResponse | ErrorResponse> {
  try {
    if (!params.identifier) {
      return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "identifier" is required', detail: 'The identifier parameter must be provided' } };
    }
    const scrum_task = await scrumTaskService.getScrumTask(params.identifier);
    return { scrum_task, found: scrum_task !== null };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while retrieving scrum_task', detail: error?.message || String(error) } };
  }
}

export async function listRecentScrumTasksHandler(
  params: ListRecentScrumTasksParams,
  scrumTaskService: ScrumTaskService
): Promise<ListRecentScrumTasksResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const scrum_tasks = await scrumTaskService.listRecentScrumTasks(params.limit || 25);
    return { scrum_tasks, count: scrum_tasks.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while listing recent scrum_tasks', detail: error?.message || String(error) } };
  }
}


// ============================================================================
// CHANGEREQUEST HANDLERS
// ============================================================================

export async function queryChangeRequestsHandler(
  params: QueryChangeRequestsParams,
  changeRequestService: ChangeRequestService
): Promise<QueryChangeRequestsResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const change_requests = await changeRequestService.queryChangeRequests(params);
    return { change_requests, count: change_requests.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while querying change_requests', detail: error?.message || String(error) } };
  }
}

export async function getChangeRequestHandler(
  params: GetChangeRequestParams,
  changeRequestService: ChangeRequestService
): Promise<GetChangeRequestResponse | ErrorResponse> {
  try {
    if (!params.identifier) {
      return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "identifier" is required', detail: 'The identifier parameter must be provided' } };
    }
    const change_request = await changeRequestService.getChangeRequest(params.identifier);
    return { change_request, found: change_request !== null };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while retrieving change_request', detail: error?.message || String(error) } };
  }
}

export async function listRecentChangeRequestsHandler(
  params: ListRecentChangeRequestsParams,
  changeRequestService: ChangeRequestService
): Promise<ListRecentChangeRequestsResponse | ErrorResponse> {
  try {
    if (params.limit !== undefined) {
      if (typeof params.limit !== 'number' || !Number.isInteger(params.limit)) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be an integer', detail: `Received: ${params.limit}` } };
      }
      if (params.limit < 1 || params.limit > 100) {
        return { error: { code: 'INVALID_PARAMETER', message: 'Parameter "limit" must be between 1 and 100', detail: `Received: ${params.limit}` } };
      }
    }
    const change_requests = await changeRequestService.listRecentChangeRequests(params.limit || 25);
    return { change_requests, count: change_requests.length };
  } catch (error: any) {
    if (error?.code) {
      return { error: { code: error.code, message: error.message || 'An error occurred', detail: error.detail } };
    }
    return { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred while listing recent change_requests', detail: error?.message || String(error) } };
  }
}

