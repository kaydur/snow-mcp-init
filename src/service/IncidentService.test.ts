import { IncidentService } from './IncidentService.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { IncidentFilters } from '../types/incident.js';
import { ServiceNowResponse, ServiceNowRecord } from '../types/interfaces.js';

// Mock ServiceNowClient
jest.mock('../client/ServiceNowClient.js');

describe('IncidentService', () => {
  let incidentService: IncidentService;
  let mockClient: jest.Mocked<ServiceNowClient>;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      get: jest.fn(),
      getById: jest.fn()
    } as any;

    incidentService = new IncidentService(mockClient);
  });

  describe('constructor', () => {
    it('should accept ServiceNowClient', () => {
      expect(incidentService).toBeInstanceOf(IncidentService);
    });
  });

  describe('queryIncidents', () => {
    it('should query incidents with no filters', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'INC0010001',
            short_description: 'Test incident',
            state: '1',
            priority: 2,
            assigned_to: 'user1',
            sys_updated_on: '2024-01-01 10:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await incidentService.queryIncidents();

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: undefined,
        sysparm_limit: 25,
        sysparm_display_value: false
      });

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        sys_id: '123',
        number: 'INC0010001',
        short_description: 'Test incident',
        state: '1',
        priority: 2,
        assigned_to: 'user1',
        updated_at: '2024-01-01 10:00:00'
      });
    });

    it('should query incidents with state filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        state: ['1', '2']
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: 'state=1^ORstate=2',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query incidents with priority filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        priority: [1, 2]
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: 'priority=1^ORpriority=2',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query incidents with assigned_to filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        assigned_to: 'user123'
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: 'assigned_to=user123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query incidents with assignment_group filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        assignment_group: 'group123'
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: 'assignment_group=group123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query incidents with both assigned_to and assignment_group using OR logic', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        assigned_to: 'user123',
        assignment_group: 'group456'
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: 'assigned_to=user123^ORassignment_group=group456',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query incidents with custom query', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        query: 'active=true^priority=1'
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: 'active=true^priority=1',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query incidents with combined filters', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        state: ['1'],
        priority: [1, 2],
        assigned_to: 'user123'
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: 'state=1^priority=1^ORpriority=2^assigned_to=user123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should apply custom limit', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        limit: 50
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: undefined,
        sysparm_limit: 50,
        sysparm_display_value: false
      });
    });

    it('should enforce maximum limit of 100', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        limit: 200
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: undefined,
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });

    it('should handle unassigned incidents (null assigned_to)', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'INC0010001',
            short_description: 'Unassigned incident',
            state: '1',
            priority: 2,
            assigned_to: null,
            sys_updated_on: '2024-01-01 10:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await incidentService.queryIncidents();

      expect(results[0].assigned_to).toBeNull();
    });

    it('should handle empty results', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const results = await incidentService.queryIncidents();

      expect(results).toEqual([]);
    });

    it('should throw validation error for invalid state value', async () => {
      const filters: IncidentFilters = {
        state: ['InvalidState']
      };

      await expect(incidentService.queryIncidents(filters)).rejects.toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Invalid state value: InvalidState. Valid states are: New, In Progress, On Hold, Resolved, Closed',
        detail: 'Received state: InvalidState'
      });
    });

    it('should throw validation error for invalid priority value', async () => {
      const filters: IncidentFilters = {
        priority: [6]
      };

      await expect(incidentService.queryIncidents(filters)).rejects.toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Invalid priority value: 6. Priority must be an integer between 1 and 5',
        detail: 'Received priority: 6'
      });
    });

    it('should throw validation error for priority value less than 1', async () => {
      const filters: IncidentFilters = {
        priority: [0]
      };

      await expect(incidentService.queryIncidents(filters)).rejects.toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Invalid priority value: 0. Priority must be an integer between 1 and 5',
        detail: 'Received priority: 0'
      });
    });

    it('should throw validation error for non-integer priority value', async () => {
      const filters: IncidentFilters = {
        priority: [2.5]
      };

      await expect(incidentService.queryIncidents(filters)).rejects.toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Invalid priority value: 2.5. Priority must be an integer between 1 and 5',
        detail: 'Received priority: 2.5'
      });
    });

    it('should accept valid state numeric values', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        state: ['1', '2', '3', '6', '7']
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalled();
    });

    it('should accept valid state label values', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        state: ['New', 'In Progress', 'On Hold', 'Resolved', 'Closed']
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalled();
    });

    it('should accept valid priority values', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const filters: IncidentFilters = {
        priority: [1, 2, 3, 4, 5]
      };

      await incidentService.queryIncidents(filters);

      expect(mockClient.get).toHaveBeenCalled();
    });

    it('should throw validation error for multiple invalid states', async () => {
      const filters: IncidentFilters = {
        state: ['1', 'InvalidState', '2']
      };

      await expect(incidentService.queryIncidents(filters)).rejects.toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Invalid state value: InvalidState. Valid states are: New, In Progress, On Hold, Resolved, Closed',
        detail: 'Received state: InvalidState'
      });
    });

    it('should throw validation error for multiple invalid priorities', async () => {
      const filters: IncidentFilters = {
        priority: [1, 6, 2]
      };

      await expect(incidentService.queryIncidents(filters)).rejects.toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Invalid priority value: 6. Priority must be an integer between 1 and 5',
        detail: 'Received priority: 6'
      });
    });
  });

  describe('getIncident', () => {
    it('should retrieve incident by sys_id', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '12345678901234567890123456789012',
        number: 'INC0010001',
        short_description: 'Test incident',
        description: 'Full description',
        state: '1',
        priority: 2,
        category: 'software',
        assigned_to: 'user1',
        opened_by: 'user2',
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00',
        close_notes: null
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await incidentService.getIncident('12345678901234567890123456789012');

      expect(mockClient.getById).toHaveBeenCalledWith('incident', '12345678901234567890123456789012');
      expect(result).toEqual({
        sys_id: '12345678901234567890123456789012',
        number: 'INC0010001',
        short_description: 'Test incident',
        description: 'Full description',
        state: '1',
        priority: 2,
        category: 'software',
        assigned_to: 'user1',
        opened_by: 'user2',
        opened_at: '2024-01-01 09:00:00',
        updated_at: '2024-01-01 10:00:00',
        resolution_notes: null
      });
    });

    it('should retrieve incident by incident number', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'INC0010001',
            short_description: 'Test incident',
            description: 'Full description',
            state: '1',
            priority: 2,
            category: 'software',
            assigned_to: 'user1',
            opened_by: 'user2',
            sys_created_on: '2024-01-01 09:00:00',
            sys_updated_on: '2024-01-01 10:00:00',
            close_notes: null
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await incidentService.getIncident('INC0010001');

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: 'number=INC0010001',
        sysparm_limit: 1,
        sysparm_display_value: false
      });
      expect(result).toBeDefined();
      expect(result?.number).toBe('INC0010001');
    });

    it('should return null for non-existent incident number', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await incidentService.getIncident('INC9999999');

      expect(result).toBeNull();
    });

    it('should return null for non-existent sys_id', async () => {
      mockClient.getById.mockRejectedValue({
        code: 'NOT_FOUND',
        message: 'Record not found'
      });

      const result = await incidentService.getIncident('12345678901234567890123456789012');

      expect(result).toBeNull();
    });

    it('should handle incidents with resolution notes', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '123',
        number: 'INC0010001',
        short_description: 'Resolved incident',
        description: 'Full description',
        state: '6',
        priority: 2,
        category: 'software',
        assigned_to: 'user1',
        opened_by: 'user2',
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00',
        close_notes: 'Issue was resolved by restarting the service'
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await incidentService.getIncident('12345678901234567890123456789012');

      expect(result?.resolution_notes).toBe('Issue was resolved by restarting the service');
    });

    it('should handle incidents with null category', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '123',
        number: 'INC0010001',
        short_description: 'Test incident',
        description: 'Full description',
        state: '1',
        priority: 2,
        category: null,
        assigned_to: 'user1',
        opened_by: 'user2',
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00',
        close_notes: null
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await incidentService.getIncident('12345678901234567890123456789012');

      expect(result?.category).toBeNull();
    });

    it('should propagate non-NOT_FOUND errors', async () => {
      mockClient.getById.mockRejectedValue({
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      });

      await expect(
        incidentService.getIncident('12345678901234567890123456789012')
      ).rejects.toEqual({
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      });
    });
  });

  describe('listRecentIncidents', () => {
    it('should list recent incidents with default limit', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'INC0010001',
            short_description: 'Recent incident',
            state: '1',
            priority: 2,
            assigned_to: 'user1',
            sys_updated_on: '2024-01-01 10:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await incidentService.listRecentIncidents();

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 25,
        sysparm_display_value: false
      });

      expect(results).toHaveLength(1);
    });

    it('should list recent incidents with custom limit', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await incidentService.listRecentIncidents(50);

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 50,
        sysparm_display_value: false
      });
    });

    it('should enforce maximum limit of 100', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await incidentService.listRecentIncidents(200);

      expect(mockClient.get).toHaveBeenCalledWith('incident', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });

    it('should return incidents ordered by updated_at', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: '123',
            number: 'INC0010002',
            short_description: 'Newer incident',
            state: '1',
            priority: 2,
            assigned_to: 'user1',
            sys_updated_on: '2024-01-02 10:00:00'
          },
          {
            sys_id: '124',
            number: 'INC0010001',
            short_description: 'Older incident',
            state: '1',
            priority: 2,
            assigned_to: 'user1',
            sys_updated_on: '2024-01-01 10:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await incidentService.listRecentIncidents();

      expect(results).toHaveLength(2);
      expect(results[0].updated_at).toBe('2024-01-02 10:00:00');
      expect(results[1].updated_at).toBe('2024-01-01 10:00:00');
    });
  });
});
