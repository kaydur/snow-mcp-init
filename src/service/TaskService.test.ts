import { TaskService } from './TaskService.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { TaskFilters } from '../types/task.js';
import { ServiceNowResponse, ServiceNowRecord } from '../types/interfaces.js';

// Mock ServiceNowClient
jest.mock('../client/ServiceNowClient.js');

describe('TaskService', () => {
  let taskService: TaskService;
  let mockClient: jest.Mocked<ServiceNowClient>;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      get: jest.fn(),
      getById: jest.fn()
    } as any;

    taskService = new TaskService(mockClient);
  });

  describe('constructor', () => {
    it('should accept ServiceNowClient', () => {
      expect(taskService).toBeInstanceOf(TaskService);
    });
  });

  describe('queryTasks', () => {
    it('should query tasks with no filters', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'TASK0001',
            short_description: 'Test task',
            state: '1',
            priority: 3,
            assigned_to: 'user1',
            assignment_group: 'group1',
            sys_updated_on: '2024-01-01 10:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await taskService.queryTasks();

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: undefined,
        sysparm_limit: 25,
        sysparm_display_value: false
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        sys_id: '123',
        number: 'TASK0001',
        short_description: 'Test task',
        state: '1',
        priority: 3,
        assigned_to: 'user1',
        assignment_group: 'group1',
        sys_updated_on: '2024-01-01 10:00:00'
      });
    });

    it('should query tasks with state filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        state: ['1', '2']
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: '(state=1^ORstate=2)',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query tasks with priority filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        priority: [1, 2]
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: '(priority=1^ORpriority=2)',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query tasks with assigned_to filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        assigned_to: 'user123'
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: 'assigned_to=user123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query tasks with assignment_group filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        assignment_group: 'group123'
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: 'assignment_group=group123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query tasks with company filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        company: 'company123'
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: 'company=company123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query tasks with location filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        location: 'location123'
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: 'location=location123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query tasks with opened_by filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        opened_by: 'user123'
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: 'opened_by=user123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query tasks with parent filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        parent: 'parent123'
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: 'parent=parent123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query tasks with custom query', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        query: 'active=true^state=1'
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: 'active=true^state=1',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query tasks with combined filters', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        state: ['1', '2'],
        priority: [1, 2],
        assigned_to: 'user123',
        assignment_group: 'group123'
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: '(state=1^ORstate=2)^(priority=1^ORpriority=2)^assigned_to=user123^assignment_group=group123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should apply custom limit', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        limit: 50
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: undefined,
        sysparm_limit: 50,
        sysparm_display_value: false
      });
    });

    it('should enforce maximum limit of 100', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: TaskFilters = {
        limit: 200
      };

      await taskService.queryTasks(filters);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: undefined,
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });

    it('should validate priority values', async () => {
      const filters: TaskFilters = {
        priority: [0, 6]
      };

      await expect(taskService.queryTasks(filters)).rejects.toThrow(
        'Invalid priority value: 0. Priority must be between 1 and 5.'
      );
    });

    it('should handle empty results', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await taskService.queryTasks();

      expect(results).toEqual([]);
    });
  });

  describe('getTask', () => {
    it('should retrieve task by sys_id', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '12345678901234567890123456789012',
        number: 'TASK0001',
        short_description: 'Test task',
        description: 'Detailed description',
        state: '1',
        priority: 3,
        assigned_to: 'user1',
        assignment_group: 'group1',
        opened_by: 'admin',
        closed_by: null,
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00',
        opened: '2024-01-01 09:00:00',
        closed: null,
        due_date: '2024-01-15 17:00:00',
        sys_created_by: 'admin',
        sys_updated_by: 'admin',
        sys_mod_count: 1,
        escalation: 0,
        impact: 3,
        urgency: 3,
        knowledge: false,
        made_sla: true,
        order: 0,
        reassignment_count: 0
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await taskService.getTask('12345678901234567890123456789012');

      expect(mockClient.getById).toHaveBeenCalledWith('task', '12345678901234567890123456789012');
      expect(result?.sys_id).toBe('12345678901234567890123456789012');
      expect(result?.number).toBe('TASK0001');
      expect(result?.short_description).toBe('Test task');
    });

    it('should retrieve task by number', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'TASK0001',
            short_description: 'Test task',
            description: 'Detailed description',
            state: '1',
            priority: 3,
            assigned_to: 'user1',
            assignment_group: 'group1',
            opened_by: 'admin',
            closed_by: null,
            sys_created_on: '2024-01-01 09:00:00',
            sys_updated_on: '2024-01-01 10:00:00',
            opened: '2024-01-01 09:00:00',
            closed: null,
            sys_created_by: 'admin',
            sys_updated_by: 'admin',
            sys_mod_count: 1,
            escalation: 0,
            impact: 3,
            urgency: 3,
            knowledge: false,
            made_sla: true,
            order: 0,
            reassignment_count: 0
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await taskService.getTask('TASK0001');

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: 'number=TASK0001',
        sysparm_limit: 1,
        sysparm_display_value: false
      });
      expect(result?.number).toBe('TASK0001');
    });

    it('should return null for non-existent task number', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await taskService.getTask('TASK9999');

      expect(result).toBeNull();
    });

    it('should return null for non-existent sys_id', async () => {
      mockClient.getById.mockRejectedValue({
        code: 'NOT_FOUND',
        message: 'Record not found'
      });

      const result = await taskService.getTask('12345678901234567890123456789012');

      expect(result).toBeNull();
    });

    it('should handle tasks with null fields', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '12345678901234567890123456789012',
        number: 'TASK0001',
        short_description: 'Test task',
        description: '',
        state: '1',
        priority: 3,
        assigned_to: null,
        assignment_group: null,
        opened_by: 'admin',
        closed_by: null,
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00',
        opened: '2024-01-01 09:00:00',
        closed: null,
        due_date: null,
        work_notes: null,
        company: null,
        location: null,
        parent: null,
        sys_created_by: 'admin',
        sys_updated_by: 'admin',
        sys_mod_count: 0,
        escalation: 0,
        impact: 0,
        urgency: 0,
        knowledge: false,
        made_sla: false,
        order: 0,
        reassignment_count: 0
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await taskService.getTask('12345678901234567890123456789012');

      expect(result?.assigned_to).toBeNull();
      expect(result?.assignment_group).toBeNull();
      expect(result?.closed_by).toBeNull();
      expect(result?.due_date).toBeNull();
    });

    it('should propagate non-NOT_FOUND errors', async () => {
      mockClient.getById.mockRejectedValue({
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      });

      await expect(
        taskService.getTask('12345678901234567890123456789012')
      ).rejects.toEqual({
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      });
    });
  });

  describe('listRecentTasks', () => {
    it('should list recent tasks with default limit', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'TASK0001',
            short_description: 'Test task',
            state: '1',
            priority: 3,
            assigned_to: 'user1',
            assignment_group: 'group1',
            sys_updated_on: '2024-01-01 10:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await taskService.listRecentTasks();

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 25,
        sysparm_display_value: false
      });

      expect(results).toHaveLength(1);
    });

    it('should list recent tasks with custom limit', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await taskService.listRecentTasks(50);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 50,
        sysparm_display_value: false
      });
    });

    it('should enforce maximum limit of 100', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await taskService.listRecentTasks(200);

      expect(mockClient.get).toHaveBeenCalledWith('task', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });

    it('should return tasks ordered by updated_at', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'TASK0002',
            short_description: 'Recent task',
            state: '1',
            priority: 3,
            assigned_to: 'user1',
            assignment_group: 'group1',
            sys_updated_on: '2024-01-02 10:00:00'
          },
          {
            sys_id: '124',
            number: 'TASK0001',
            short_description: 'Older task',
            state: '1',
            priority: 3,
            assigned_to: 'user1',
            assignment_group: 'group1',
            sys_updated_on: '2024-01-01 10:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await taskService.listRecentTasks();

      expect(results).toHaveLength(2);
      expect(results[0].number).toBe('TASK0002');
      expect(results[1].number).toBe('TASK0001');
    });
  });
});
