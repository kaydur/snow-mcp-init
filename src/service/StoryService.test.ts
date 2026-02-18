import { StoryService } from './StoryService.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { StoryFilters } from '../types/story.js';
import { ServiceNowResponse } from '../types/interfaces.js';

// Mock ServiceNowClient
jest.mock('../client/ServiceNowClient.js');

describe('StoryService', () => {
  let storyService: StoryService;
  let mockClient: jest.Mocked<ServiceNowClient>;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      get: jest.fn(),
      getById: jest.fn()
    } as any;

    storyService = new StoryService(mockClient);
  });

  describe('constructor', () => {
    it('should accept ServiceNowClient', () => {
      expect(storyService).toBeInstanceOf(StoryService);
    });
  });

  describe('queryStories', () => {
    it('should query stories with no filters', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'STRY0001',
            short_description: 'Test story',
            state: '-3',
            priority: 3,
            assigned_to: 'user1',
            story_points: 5,
            sys_updated_on: '2024-01-01 10:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await storyService.queryStories();

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: undefined,
        sysparm_limit: 25,
        sysparm_display_value: false
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        sys_id: '123',
        number: 'STRY0001',
        short_description: 'Test story',
        state: '-3',
        priority: 3,
        assigned_to: 'user1',
        story_points: 5,
        sys_updated_on: '2024-01-01 10:00:00'
      });
    });

    it('should query stories with state filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: StoryFilters = {
        state: ['-3', '-2']
      };

      await storyService.queryStories(filters);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: '(state=-3^ORstate=-2)',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query stories with priority filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: StoryFilters = {
        priority: [1, 2]
      };

      await storyService.queryStories(filters);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: '(priority=1^ORpriority=2)',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query stories with sprint filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: StoryFilters = {
        sprint: 'sprint123'
      };

      await storyService.queryStories(filters);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: 'sprint=sprint123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query stories with story_points filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: StoryFilters = {
        story_points: 5
      };

      await storyService.queryStories(filters);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: 'story_points=5',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query stories with product filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: StoryFilters = {
        product: 'product123'
      };

      await storyService.queryStories(filters);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: 'product=product123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query stories with epic filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: StoryFilters = {
        epic: 'epic123'
      };

      await storyService.queryStories(filters);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: 'epic=epic123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query stories with blocked filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: StoryFilters = {
        blocked: true
      };

      await storyService.queryStories(filters);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: 'blocked=true',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query stories with release filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: StoryFilters = {
        release: 'release123'
      };

      await storyService.queryStories(filters);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: 'release=release123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query stories with parent_feature filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: StoryFilters = {
        parent_feature: 'feature123'
      };

      await storyService.queryStories(filters);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: 'parent_feature=feature123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query stories with multiple filters', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: StoryFilters = {
        state: ['-3'],
        priority: [1, 2],
        sprint: 'sprint123',
        assigned_to: 'user1'
      };

      await storyService.queryStories(filters);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: '(state=-3)^(priority=1^ORpriority=2)^sprint=sprint123^assigned_to=user1',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should enforce maximum limit of 100', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: StoryFilters = {
        limit: 200
      };

      await storyService.queryStories(filters);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: undefined,
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });

    it('should handle null story_points in response', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'STRY0001',
            short_description: 'Test story',
            state: '-3',
            priority: 3,
            assigned_to: null,
            story_points: null,
            sys_updated_on: '2024-01-01 10:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await storyService.queryStories();

      expect(results[0].story_points).toBeNull();
      expect(results[0].assigned_to).toBeNull();
    });

    it('should throw error for invalid priority', async () => {
      const filters: StoryFilters = {
        priority: [6]
      };

      await expect(storyService.queryStories(filters)).rejects.toThrow(
        'Invalid priority value: 6. Priority must be between 1 and 5.'
      );
    });
  });

  describe('getStory', () => {
    it('should retrieve story by sys_id', async () => {
      const mockRecord = {
        sys_id: '12345678901234567890123456789012',
        number: 'STRY0001',
        short_description: 'Test story',
        state: '-3',
        priority: 3,
        assigned_to: 'user1',
        story_points: 5,
        sys_updated_on: '2024-01-01 10:00:00',
        description: 'Full description',
        opened_by: 'user2',
        sys_created_on: '2024-01-01 09:00:00',
        opened: '2024-01-01 09:00:00',
        sys_created_by: 'user2',
        sys_updated_by: 'user1',
        sys_mod_count: 1,
        blocked: false,
        allow_dates_outside_schedule: false,
        critical_path: false,
        has_conflict: false,
        has_issue: false,
        key_milestone: false,
        level: 0,
        milestone: false,
        override_status: false,
        relation_applied: false,
        rollup: false,
        run_calculation_brs: false
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await storyService.getStory('12345678901234567890123456789012');

      expect(mockClient.getById).toHaveBeenCalledWith('rm_story', '12345678901234567890123456789012');
      expect(result).not.toBeNull();
      expect(result?.sys_id).toBe('12345678901234567890123456789012');
      expect(result?.number).toBe('STRY0001');
    });

    it('should retrieve story by number', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'STRY0001',
            short_description: 'Test story',
            state: '-3',
            priority: 3,
            assigned_to: 'user1',
            story_points: 5,
            sys_updated_on: '2024-01-01 10:00:00',
            description: 'Full description',
            opened_by: 'user2',
            sys_created_on: '2024-01-01 09:00:00',
            opened: '2024-01-01 09:00:00',
            sys_created_by: 'user2',
            sys_updated_by: 'user1',
            sys_mod_count: 1,
            blocked: false,
            allow_dates_outside_schedule: false,
            critical_path: false,
            has_conflict: false,
            has_issue: false,
            key_milestone: false,
            level: 0,
            milestone: false,
            override_status: false,
            relation_applied: false,
            rollup: false,
            run_calculation_brs: false
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await storyService.getStory('STRY0001');

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: 'number=STRY0001',
        sysparm_limit: 1,
        sysparm_display_value: false
      });
      expect(result).not.toBeNull();
      expect(result?.number).toBe('STRY0001');
    });

    it('should return null when story not found by number', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await storyService.getStory('STRY9999');

      expect(result).toBeNull();
    });

    it('should return null when story not found by sys_id', async () => {
      const error: any = new Error('Not found');
      error.code = 'NOT_FOUND';
      mockClient.getById.mockRejectedValue(error);

      const result = await storyService.getStory('12345678901234567890123456789012');

      expect(result).toBeNull();
    });
  });

  describe('listRecentStories', () => {
    it('should list recent stories with default limit', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'STRY0001',
            short_description: 'Test story',
            state: '-3',
            priority: 3,
            assigned_to: 'user1',
            story_points: 5,
            sys_updated_on: '2024-01-01 10:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await storyService.listRecentStories();

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 25,
        sysparm_display_value: false
      });

      expect(results).toHaveLength(1);
    });

    it('should list recent stories with custom limit', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await storyService.listRecentStories(50);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 50,
        sysparm_display_value: false
      });
    });

    it('should enforce maximum limit of 100', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await storyService.listRecentStories(200);

      expect(mockClient.get).toHaveBeenCalledWith('rm_story', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });
  });
});
