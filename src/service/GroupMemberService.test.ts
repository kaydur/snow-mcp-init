import { GroupMemberService } from './GroupMemberService.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { GroupMemberFilters } from '../types/groupMember.js';
import { ServiceNowResponse, ServiceNowRecord } from '../types/interfaces.js';

// Mock ServiceNowClient
jest.mock('../client/ServiceNowClient.js');

describe('GroupMemberService', () => {
  let groupMemberService: GroupMemberService;
  let mockClient: jest.Mocked<ServiceNowClient>;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      get: jest.fn(),
      getById: jest.fn()
    } as any;

    groupMemberService = new GroupMemberService(mockClient);
  });

  describe('constructor', () => {
    it('should accept ServiceNowClient', () => {
      expect(groupMemberService).toBeInstanceOf(GroupMemberService);
    });
  });

  describe('queryGroupMembers', () => {
    it('should query group members with no filters', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            group: 'group1',
            user: 'user1'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await groupMemberService.queryGroupMembers();

      expect(mockClient.get).toHaveBeenCalledWith('sys_user_grmember', {
        sysparm_query: undefined,
        sysparm_limit: 25,
        sysparm_display_value: false
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        sys_id: '123',
        group: 'group1',
        user: 'user1'
      });
    });

    it('should query group members with group filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: GroupMemberFilters = {
        group: 'group123'
      };

      await groupMemberService.queryGroupMembers(filters);

      expect(mockClient.get).toHaveBeenCalledWith('sys_user_grmember', {
        sysparm_query: 'group=group123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query group members with user filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: GroupMemberFilters = {
        user: 'user123'
      };

      await groupMemberService.queryGroupMembers(filters);

      expect(mockClient.get).toHaveBeenCalledWith('sys_user_grmember', {
        sysparm_query: 'user=user123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query group members with scrum_role filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: GroupMemberFilters = {
        scrum_role: 'developer'
      };

      await groupMemberService.queryGroupMembers(filters);

      expect(mockClient.get).toHaveBeenCalledWith('sys_user_grmember', {
        sysparm_query: 'scrum_role=developer',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query group members with custom query', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: GroupMemberFilters = {
        query: 'active=true^group.name=Development'
      };

      await groupMemberService.queryGroupMembers(filters);

      expect(mockClient.get).toHaveBeenCalledWith('sys_user_grmember', {
        sysparm_query: 'active=true^group.name=Development',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query group members with combined filters', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: GroupMemberFilters = {
        group: 'group123',
        user: 'user456',
        scrum_role: 'developer'
      };

      await groupMemberService.queryGroupMembers(filters);

      expect(mockClient.get).toHaveBeenCalledWith('sys_user_grmember', {
        sysparm_query: 'group=group123^user=user456^scrum_role=developer',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should apply custom limit', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: GroupMemberFilters = {
        limit: 50
      };

      await groupMemberService.queryGroupMembers(filters);

      expect(mockClient.get).toHaveBeenCalledWith('sys_user_grmember', {
        sysparm_query: undefined,
        sysparm_limit: 50,
        sysparm_display_value: false
      });
    });

    it('should enforce maximum limit of 100', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: GroupMemberFilters = {
        limit: 200
      };

      await groupMemberService.queryGroupMembers(filters);

      expect(mockClient.get).toHaveBeenCalledWith('sys_user_grmember', {
        sysparm_query: undefined,
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });

    it('should handle empty results', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await groupMemberService.queryGroupMembers();

      expect(results).toEqual([]);
    });
  });

  describe('getGroupMember', () => {
    it('should retrieve group member by sys_id', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '12345678901234567890123456789012',
        group: 'group1',
        user: 'user1',
        scrum_role: 'developer',
        average_points_per_sprint: 15,
        sys_created_on: '2024-01-01 09:00:00',
        sys_created_by: 'admin',
        sys_updated_on: '2024-01-01 10:00:00',
        sys_updated_by: 'admin',
        sys_mod_count: 1
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await groupMemberService.getGroupMember('12345678901234567890123456789012');

      expect(mockClient.getById).toHaveBeenCalledWith('sys_user_grmember', '12345678901234567890123456789012');
      expect(result).toEqual({
        sys_id: '12345678901234567890123456789012',
        group: 'group1',
        user: 'user1',
        scrum_role: 'developer',
        average_points_per_sprint: 15,
        sys_created_on: '2024-01-01 09:00:00',
        sys_created_by: 'admin',
        sys_updated_on: '2024-01-01 10:00:00',
        sys_updated_by: 'admin',
        sys_mod_count: 1
      });
    });

    it('should return null for non-existent sys_id', async () => {
      mockClient.getById.mockRejectedValue({
        code: 'NOT_FOUND',
        message: 'Record not found'
      });

      const result = await groupMemberService.getGroupMember('12345678901234567890123456789012');

      expect(result).toBeNull();
    });

    it('should handle group members with null scrum_role', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '123',
        group: 'group1',
        user: 'user1',
        scrum_role: null,
        average_points_per_sprint: null,
        sys_created_on: '2024-01-01 09:00:00',
        sys_created_by: 'admin',
        sys_updated_on: '2024-01-01 10:00:00',
        sys_updated_by: 'admin',
        sys_mod_count: 0
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await groupMemberService.getGroupMember('123');

      expect(result?.scrum_role).toBeNull();
      expect(result?.average_points_per_sprint).toBeNull();
    });

    it('should propagate non-NOT_FOUND errors', async () => {
      mockClient.getById.mockRejectedValue({
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      });

      await expect(
        groupMemberService.getGroupMember('12345678901234567890123456789012')
      ).rejects.toEqual({
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      });
    });
  });

  describe('listRecentGroupMembers', () => {
    it('should list recent group members with default limit', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            group: 'group1',
            user: 'user1'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await groupMemberService.listRecentGroupMembers();

      expect(mockClient.get).toHaveBeenCalledWith('sys_user_grmember', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 25,
        sysparm_display_value: false
      });

      expect(results).toHaveLength(1);
    });

    it('should list recent group members with custom limit', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await groupMemberService.listRecentGroupMembers(50);

      expect(mockClient.get).toHaveBeenCalledWith('sys_user_grmember', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 50,
        sysparm_display_value: false
      });
    });

    it('should enforce maximum limit of 100', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await groupMemberService.listRecentGroupMembers(200);

      expect(mockClient.get).toHaveBeenCalledWith('sys_user_grmember', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });

    it('should return group members ordered by updated_at', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            group: 'group1',
            user: 'user2'
          },
          {
            sys_id: '124',
            group: 'group1',
            user: 'user1'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await groupMemberService.listRecentGroupMembers();

      expect(results).toHaveLength(2);
      expect(results[0].sys_id).toBe('123');
      expect(results[1].sys_id).toBe('124');
    });
  });
});
