/**
 * Unit tests for MCP tool handlers
 */

import { 
  queryIncidentsHandler, 
  getIncidentHandler, 
  listRecentIncidentsHandler,
  executeGlideQueryHandler,
  generateGlideQueryHandler,
  testGlideQueryHandler
} from './handlers.js';
import { IncidentService } from '../service/IncidentService.js';
import { GlideQueryExecutor } from '../service/GlideQueryExecutor.js';
import { GlideQueryGenerator } from '../service/GlideQueryGenerator.js';
import { IncidentSummary } from '../types/incident.js';
import { QueryIncidentsParams } from '../types/tools.js';

// Mock services
jest.mock('../service/IncidentService.js');
jest.mock('../service/GlideQueryExecutor.js');
jest.mock('../service/GlideQueryGenerator.js');

describe('queryIncidentsHandler', () => {
  let mockIncidentService: jest.Mocked<IncidentService>;
  let mockIncidents: IncidentSummary[];

  beforeEach(() => {
    // Create mock incident data
    mockIncidents = [
      {
        sys_id: 'abc123',
        number: 'INC0010001',
        short_description: 'Test incident 1',
        state: '1',
        priority: 1,
        assigned_to: 'john.doe',
        updated_at: '2024-01-01T10:00:00Z'
      },
      {
        sys_id: 'def456',
        number: 'INC0010002',
        short_description: 'Test incident 2',
        state: '2',
        priority: 2,
        assigned_to: null,
        updated_at: '2024-01-01T11:00:00Z'
      }
    ];

    // Create mock service
    mockIncidentService = {
      queryIncidents: jest.fn().mockResolvedValue(mockIncidents)
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful queries', () => {
    it('should return incidents and count for valid query', async () => {
      const params: QueryIncidentsParams = {
        state: ['1', '2'],
        priority: [1, 2],
        limit: 25
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        incidents: mockIncidents,
        count: 2
      });

      expect(mockIncidentService.queryIncidents).toHaveBeenCalledWith({
        state: ['1', '2'],
        priority: [1, 2],
        assigned_to: undefined,
        assignment_group: undefined,
        query: undefined,
        limit: 25
      });
    });

    it('should handle query with all filter types', async () => {
      const params: QueryIncidentsParams = {
        state: ['1'],
        priority: [1],
        assigned_to: 'john.doe',
        assignment_group: 'IT Support',
        query: 'category=software',
        limit: 50
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        incidents: mockIncidents,
        count: 2
      });

      expect(mockIncidentService.queryIncidents).toHaveBeenCalledWith({
        state: ['1'],
        priority: [1],
        assigned_to: 'john.doe',
        assignment_group: 'IT Support',
        query: 'category=software',
        limit: 50
      });
    });

    it('should handle query with no filters', async () => {
      const params: QueryIncidentsParams = {};

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        incidents: mockIncidents,
        count: 2
      });

      expect(mockIncidentService.queryIncidents).toHaveBeenCalledWith({
        state: undefined,
        priority: undefined,
        assigned_to: undefined,
        assignment_group: undefined,
        query: undefined,
        limit: undefined
      });
    });

    it('should handle empty results', async () => {
      mockIncidentService.queryIncidents.mockResolvedValue([]);

      const params: QueryIncidentsParams = {
        state: ['7']
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        incidents: [],
        count: 0
      });
    });
  });

  describe('parameter validation', () => {
    it('should reject non-array state parameter', async () => {
      const params: any = {
        state: 'New'
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "state" must be an array',
          detail: 'Received type: string'
        }
      });

      expect(mockIncidentService.queryIncidents).not.toHaveBeenCalled();
    });

    it('should reject non-array priority parameter', async () => {
      const params: any = {
        priority: 1
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "priority" must be an array',
          detail: 'Received type: number'
        }
      });

      expect(mockIncidentService.queryIncidents).not.toHaveBeenCalled();
    });

    it('should reject non-string assigned_to parameter', async () => {
      const params: any = {
        assigned_to: 123
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "assigned_to" must be a string',
          detail: 'Received type: number'
        }
      });

      expect(mockIncidentService.queryIncidents).not.toHaveBeenCalled();
    });

    it('should reject non-string assignment_group parameter', async () => {
      const params: any = {
        assignment_group: ['IT Support']
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "assignment_group" must be a string',
          detail: 'Received type: object'
        }
      });

      expect(mockIncidentService.queryIncidents).not.toHaveBeenCalled();
    });

    it('should reject non-string query parameter', async () => {
      const params: any = {
        query: 123
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "query" must be a string',
          detail: 'Received type: number'
        }
      });

      expect(mockIncidentService.queryIncidents).not.toHaveBeenCalled();
    });

    it('should reject non-integer limit parameter', async () => {
      const params: any = {
        limit: 25.5
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "limit" must be an integer',
          detail: 'Received: 25.5'
        }
      });

      expect(mockIncidentService.queryIncidents).not.toHaveBeenCalled();
    });

    it('should reject limit below 1', async () => {
      const params: QueryIncidentsParams = {
        limit: 0
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "limit" must be between 1 and 100',
          detail: 'Received: 0'
        }
      });

      expect(mockIncidentService.queryIncidents).not.toHaveBeenCalled();
    });

    it('should reject limit above 100', async () => {
      const params: QueryIncidentsParams = {
        limit: 101
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "limit" must be between 1 and 100',
          detail: 'Received: 101'
        }
      });

      expect(mockIncidentService.queryIncidents).not.toHaveBeenCalled();
    });

    it('should reject non-integer priority values in array', async () => {
      const params: any = {
        priority: [1, 2.5, 3]
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Priority values must be integers',
          detail: 'Received: 2.5'
        }
      });

      expect(mockIncidentService.queryIncidents).not.toHaveBeenCalled();
    });

    it('should reject non-string state values in array', async () => {
      const params: any = {
        state: ['1', 2, '3']
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'State values must be strings',
          detail: 'Received: 2'
        }
      });

      expect(mockIncidentService.queryIncidents).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle validation errors from service', async () => {
      const validationError = {
        code: 'VALIDATION_ERROR',
        message: 'Invalid state value: InvalidState',
        detail: 'Received state: InvalidState'
      };

      mockIncidentService.queryIncidents.mockRejectedValue(validationError);

      const params: QueryIncidentsParams = {
        state: ['InvalidState']
      };

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: validationError
      });
    });

    it('should handle API errors from service', async () => {
      const apiError = {
        code: 'API_ERROR',
        message: 'ServiceNow API returned an error',
        detail: 'Status: 500'
      };

      mockIncidentService.queryIncidents.mockRejectedValue(apiError);

      const params: QueryIncidentsParams = {};

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: apiError
      });
    });

    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Network timeout');

      mockIncidentService.queryIncidents.mockRejectedValue(unexpectedError);

      const params: QueryIncidentsParams = {};

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while querying incidents',
          detail: 'Network timeout'
        }
      });
    });

    it('should handle errors without message property', async () => {
      mockIncidentService.queryIncidents.mockRejectedValue('String error');

      const params: QueryIncidentsParams = {};

      const result = await queryIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while querying incidents',
          detail: 'String error'
        }
      });
    });
  });
});

describe('getIncidentHandler', () => {
  let mockIncidentService: jest.Mocked<IncidentService>;
  let mockIncidentDetail: any;

  beforeEach(() => {
    // Create mock incident detail data
    mockIncidentDetail = {
      sys_id: 'abc123',
      number: 'INC0010001',
      short_description: 'Test incident',
      description: 'Detailed description',
      state: '1',
      priority: 1,
      category: 'Software',
      assigned_to: 'john.doe',
      opened_by: 'jane.smith',
      opened_at: '2024-01-01T09:00:00Z',
      updated_at: '2024-01-01T10:00:00Z',
      resolution_notes: null
    };

    // Create mock service
    mockIncidentService = {
      getIncident: jest.fn().mockResolvedValue(mockIncidentDetail)
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful retrieval', () => {
    it('should return incident with found: true for valid sys_id', async () => {
      const params = {
        identifier: 'abc123def456abc123def456abc123de'
      };

      const result = await getIncidentHandler(params, mockIncidentService);

      expect(result).toEqual({
        incident: mockIncidentDetail,
        found: true
      });

      expect(mockIncidentService.getIncident).toHaveBeenCalledWith('abc123def456abc123def456abc123de');
    });

    it('should return incident with found: true for valid incident number', async () => {
      const params = {
        identifier: 'INC0010001'
      };

      const result = await getIncidentHandler(params, mockIncidentService);

      expect(result).toEqual({
        incident: mockIncidentDetail,
        found: true
      });

      expect(mockIncidentService.getIncident).toHaveBeenCalledWith('INC0010001');
    });

    it('should handle not found case with found: false', async () => {
      mockIncidentService.getIncident.mockResolvedValue(null);

      const params = {
        identifier: 'INC9999999'
      };

      const result = await getIncidentHandler(params, mockIncidentService);

      expect(result).toEqual({
        incident: null,
        found: false
      });

      expect(mockIncidentService.getIncident).toHaveBeenCalledWith('INC9999999');
    });
  });

  describe('parameter validation', () => {
    it('should reject missing identifier parameter', async () => {
      const params: any = {};

      const result = await getIncidentHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "identifier" is required',
          detail: 'The identifier parameter must be provided'
        }
      });

      expect(mockIncidentService.getIncident).not.toHaveBeenCalled();
    });

    it('should reject non-string identifier parameter', async () => {
      const params: any = {
        identifier: 12345
      };

      const result = await getIncidentHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "identifier" must be a string',
          detail: 'Received type: number'
        }
      });

      expect(mockIncidentService.getIncident).not.toHaveBeenCalled();
    });

    it('should reject empty string identifier', async () => {
      const params = {
        identifier: '   '
      };

      const result = await getIncidentHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "identifier" cannot be empty',
          detail: 'The identifier must be a non-empty string'
        }
      });

      expect(mockIncidentService.getIncident).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle API errors from service', async () => {
      const apiError = {
        code: 'API_ERROR',
        message: 'ServiceNow API returned an error',
        detail: 'Status: 500'
      };

      mockIncidentService.getIncident.mockRejectedValue(apiError);

      const params = {
        identifier: 'INC0010001'
      };

      const result = await getIncidentHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: apiError
      });
    });

    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Network timeout');

      mockIncidentService.getIncident.mockRejectedValue(unexpectedError);

      const params = {
        identifier: 'INC0010001'
      };

      const result = await getIncidentHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while retrieving incident',
          detail: 'Network timeout'
        }
      });
    });

    it('should handle errors without message property', async () => {
      mockIncidentService.getIncident.mockRejectedValue('String error');

      const params = {
        identifier: 'INC0010001'
      };

      const result = await getIncidentHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while retrieving incident',
          detail: 'String error'
        }
      });
    });
  });
});

describe('listRecentIncidentsHandler', () => {
  let mockIncidentService: jest.Mocked<IncidentService>;
  let mockIncidents: IncidentSummary[];

  beforeEach(() => {
    // Create mock incident data ordered by updated_at descending
    mockIncidents = [
      {
        sys_id: 'xyz789',
        number: 'INC0010003',
        short_description: 'Most recent incident',
        state: '1',
        priority: 1,
        assigned_to: 'john.doe',
        updated_at: '2024-01-01T12:00:00Z'
      },
      {
        sys_id: 'def456',
        number: 'INC0010002',
        short_description: 'Second recent incident',
        state: '2',
        priority: 2,
        assigned_to: null,
        updated_at: '2024-01-01T11:00:00Z'
      },
      {
        sys_id: 'abc123',
        number: 'INC0010001',
        short_description: 'Third recent incident',
        state: '1',
        priority: 3,
        assigned_to: 'jane.smith',
        updated_at: '2024-01-01T10:00:00Z'
      }
    ];

    // Create mock service
    mockIncidentService = {
      listRecentIncidents: jest.fn().mockResolvedValue(mockIncidents)
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful listing', () => {
    it('should return incidents with default limit of 25', async () => {
      const params = {};

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        incidents: mockIncidents,
        count: 3
      });

      expect(mockIncidentService.listRecentIncidents).toHaveBeenCalledWith(25);
    });

    it('should return incidents with custom limit', async () => {
      const params = {
        limit: 10
      };

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        incidents: mockIncidents,
        count: 3
      });

      expect(mockIncidentService.listRecentIncidents).toHaveBeenCalledWith(10);
    });

    it('should handle limit of 1', async () => {
      mockIncidentService.listRecentIncidents.mockResolvedValue([mockIncidents[0]]);

      const params = {
        limit: 1
      };

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        incidents: [mockIncidents[0]],
        count: 1
      });

      expect(mockIncidentService.listRecentIncidents).toHaveBeenCalledWith(1);
    });

    it('should handle limit of 100', async () => {
      const params = {
        limit: 100
      };

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        incidents: mockIncidents,
        count: 3
      });

      expect(mockIncidentService.listRecentIncidents).toHaveBeenCalledWith(100);
    });

    it('should handle empty results', async () => {
      mockIncidentService.listRecentIncidents.mockResolvedValue([]);

      const params = {};

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        incidents: [],
        count: 0
      });

      expect(mockIncidentService.listRecentIncidents).toHaveBeenCalledWith(25);
    });
  });

  describe('parameter validation', () => {
    it('should reject non-integer limit parameter', async () => {
      const params: any = {
        limit: 25.5
      };

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "limit" must be an integer',
          detail: 'Received: 25.5'
        }
      });

      expect(mockIncidentService.listRecentIncidents).not.toHaveBeenCalled();
    });

    it('should reject string limit parameter', async () => {
      const params: any = {
        limit: '25'
      };

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "limit" must be an integer',
          detail: 'Received: 25'
        }
      });

      expect(mockIncidentService.listRecentIncidents).not.toHaveBeenCalled();
    });

    it('should reject limit below 1', async () => {
      const params = {
        limit: 0
      };

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "limit" must be between 1 and 100',
          detail: 'Received: 0'
        }
      });

      expect(mockIncidentService.listRecentIncidents).not.toHaveBeenCalled();
    });

    it('should reject negative limit', async () => {
      const params = {
        limit: -5
      };

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "limit" must be between 1 and 100',
          detail: 'Received: -5'
        }
      });

      expect(mockIncidentService.listRecentIncidents).not.toHaveBeenCalled();
    });

    it('should reject limit above 100', async () => {
      const params = {
        limit: 101
      };

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "limit" must be between 1 and 100',
          detail: 'Received: 101'
        }
      });

      expect(mockIncidentService.listRecentIncidents).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle API errors from service', async () => {
      const apiError = {
        code: 'API_ERROR',
        message: 'ServiceNow API returned an error',
        detail: 'Status: 500'
      };

      mockIncidentService.listRecentIncidents.mockRejectedValue(apiError);

      const params = {};

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: apiError
      });
    });

    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Network timeout');

      mockIncidentService.listRecentIncidents.mockRejectedValue(unexpectedError);

      const params = {};

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while listing recent incidents',
          detail: 'Network timeout'
        }
      });
    });

    it('should handle errors without message property', async () => {
      mockIncidentService.listRecentIncidents.mockRejectedValue('String error');

      const params = {};

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while listing recent incidents',
          detail: 'String error'
        }
      });
    });

    it('should handle structured errors from service', async () => {
      const structuredError = {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        detail: 'Session expired'
      };

      mockIncidentService.listRecentIncidents.mockRejectedValue(structuredError);

      const params = {
        limit: 50
      };

      const result = await listRecentIncidentsHandler(params, mockIncidentService);

      expect(result).toEqual({
        error: structuredError
      });
    });
  });
});

describe('executeGlideQueryHandler', () => {
  let mockExecutor: jest.Mocked<GlideQueryExecutor>;

  beforeEach(() => {
    // Create mock executor
    mockExecutor = {
      execute: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful execution', () => {
    it('should execute script and return results', async () => {
      const mockResult = {
        success: true,
        data: [{ sys_id: '123', number: 'INC0010001' }],
        logs: ['Query executed successfully'],
        executionTime: 150,
        recordCount: 1
      };

      mockExecutor.execute.mockResolvedValue(mockResult);

      const params = {
        script: "new GlideQuery('incident').where('active', true).select()"
      };

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        success: true,
        result: mockResult.data,
        logs: mockResult.logs,
        error: undefined,
        executionTime: 150,
        recordCount: 1
      });

      expect(mockExecutor.execute).toHaveBeenCalledWith(params.script, {
        timeout: undefined
      });
    });

    it('should execute script with custom timeout', async () => {
      const mockResult = {
        success: true,
        data: { count: 42 },
        executionTime: 200
      };

      mockExecutor.execute.mockResolvedValue(mockResult);

      const params = {
        script: "new GlideQuery('incident').count()",
        timeout: 45000
      };

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        success: true,
        result: mockResult.data,
        logs: undefined,
        error: undefined,
        executionTime: 200,
        recordCount: undefined
      });

      expect(mockExecutor.execute).toHaveBeenCalledWith(params.script, {
        timeout: 45000
      });
    });

    it('should handle execution errors', async () => {
      const mockResult = {
        success: false,
        error: 'Syntax error at line 1',
        executionTime: 50
      };

      mockExecutor.execute.mockResolvedValue(mockResult);

      const params = {
        script: "new GlideQuery('incident').invalidMethod()"
      };

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        success: false,
        result: undefined,
        logs: undefined,
        error: 'Syntax error at line 1',
        executionTime: 50,
        recordCount: undefined
      });
    });
  });

  describe('parameter validation', () => {
    it('should reject missing script parameter', async () => {
      const params: any = {};

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" is required',
          detail: 'The script parameter must be provided'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });

    it('should reject non-string script parameter', async () => {
      const params: any = {
        script: 123
      };

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" must be a string',
          detail: 'Received type: number'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });

    it('should reject empty script parameter', async () => {
      const params = {
        script: '   '
      };

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" cannot be empty',
          detail: 'The script must be a non-empty string'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });

    it('should reject non-integer timeout parameter', async () => {
      const params: any = {
        script: "new GlideQuery('incident').select()",
        timeout: 30.5
      };

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "timeout" must be an integer',
          detail: 'Received: 30.5'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });

    it('should reject timeout below 1000ms', async () => {
      const params = {
        script: "new GlideQuery('incident').select()",
        timeout: 500
      };

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "timeout" must be between 1000 and 60000 milliseconds',
          detail: 'Received: 500'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });

    it('should reject timeout above 60000ms', async () => {
      const params = {
        script: "new GlideQuery('incident').select()",
        timeout: 70000
      };

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "timeout" must be between 1000 and 60000 milliseconds',
          detail: 'Received: 70000'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle structured errors from executor', async () => {
      const structuredError = {
        code: 'SECURITY_VIOLATION',
        message: 'Blacklisted pattern detected',
        detail: 'gs.eval() is not allowed'
      };

      mockExecutor.execute.mockRejectedValue(structuredError);

      const params = {
        script: "gs.eval('malicious code')"
      };

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: structuredError
      });
    });

    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Network timeout');

      mockExecutor.execute.mockRejectedValue(unexpectedError);

      const params = {
        script: "new GlideQuery('incident').select()"
      };

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while executing GlideQuery script',
          detail: 'Network timeout'
        }
      });
    });

    it('should handle errors without message property', async () => {
      mockExecutor.execute.mockRejectedValue('String error');

      const params = {
        script: "new GlideQuery('incident').select()"
      };

      const result = await executeGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while executing GlideQuery script',
          detail: 'String error'
        }
      });
    });
  });
});

describe('generateGlideQueryHandler', () => {
  let mockGenerator: jest.Mocked<GlideQueryGenerator>;

  beforeEach(() => {
    // Create mock generator
    mockGenerator = {
      generate: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful generation', () => {
    it('should generate code from description', () => {
      const mockResult = {
        code: "new GlideQuery('incident')\n  .where('active', true)\n  .select();",
        explanation: 'This query selects records from the incident table with 1 filter condition(s).',
        warnings: undefined
      };

      mockGenerator.generate.mockReturnValue(mockResult);

      const params = {
        description: 'get all active incidents'
      };

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual(mockResult);

      expect(mockGenerator.generate).toHaveBeenCalledWith({
        description: 'get all active incidents',
        table: undefined,
        includeComments: undefined
      });
    });

    it('should generate code with table hint', () => {
      const mockResult = {
        code: "new GlideQuery('problem')\n  .where('state', 1)\n  .select();",
        explanation: 'This query selects records from the problem table.',
        warnings: undefined
      };

      mockGenerator.generate.mockReturnValue(mockResult);

      const params = {
        description: 'get problems where state is 1',
        table: 'problem'
      };

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual(mockResult);

      expect(mockGenerator.generate).toHaveBeenCalledWith({
        description: 'get problems where state is 1',
        table: 'problem',
        includeComments: undefined
      });
    });

    it('should generate code without comments', () => {
      const mockResult = {
        code: "new GlideQuery('incident').select();",
        explanation: 'This query selects records from the incident table.',
        warnings: undefined
      };

      mockGenerator.generate.mockReturnValue(mockResult);

      const params = {
        description: 'get all incidents',
        includeComments: false
      };

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual(mockResult);

      expect(mockGenerator.generate).toHaveBeenCalledWith({
        description: 'get all incidents',
        table: undefined,
        includeComments: false
      });
    });

    it('should include warnings for write operations', () => {
      const mockResult = {
        code: "new GlideQuery('incident')\n  .where('number', 'INC0010001')\n  .deleteMultiple();",
        explanation: 'This query deleteMultiples records from the incident table.',
        warnings: ['This is a write operation that will modify data in the database', 'This is a bulk operation that may affect multiple records']
      };

      mockGenerator.generate.mockReturnValue(mockResult);

      const params = {
        description: 'delete incident INC0010001'
      };

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual(mockResult);
    });
  });

  describe('parameter validation', () => {
    it('should reject missing description parameter', () => {
      const params: any = {};

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "description" is required',
          detail: 'The description parameter must be provided'
        }
      });

      expect(mockGenerator.generate).not.toHaveBeenCalled();
    });

    it('should reject non-string description parameter', () => {
      const params: any = {
        description: 123
      };

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "description" must be a string',
          detail: 'Received type: number'
        }
      });

      expect(mockGenerator.generate).not.toHaveBeenCalled();
    });

    it('should reject empty description parameter', () => {
      const params = {
        description: '   '
      };

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "description" cannot be empty',
          detail: 'The description must be a non-empty string'
        }
      });

      expect(mockGenerator.generate).not.toHaveBeenCalled();
    });

    it('should reject non-string table parameter', () => {
      const params: any = {
        description: 'get all incidents',
        table: 123
      };

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "table" must be a string',
          detail: 'Received type: number'
        }
      });

      expect(mockGenerator.generate).not.toHaveBeenCalled();
    });

    it('should reject non-boolean includeComments parameter', () => {
      const params: any = {
        description: 'get all incidents',
        includeComments: 'yes'
      };

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "includeComments" must be a boolean',
          detail: 'Received type: string'
        }
      });

      expect(mockGenerator.generate).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle structured errors from generator', () => {
      const structuredError = {
        code: 'GENERATION_ERROR',
        message: 'Failed to parse description',
        detail: 'Ambiguous table reference'
      };

      mockGenerator.generate.mockImplementation(() => {
        throw structuredError;
      });

      const params = {
        description: 'get all records'
      };

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual({
        error: structuredError
      });
    });

    it('should handle unexpected errors', () => {
      const unexpectedError = new Error('Unexpected error');

      mockGenerator.generate.mockImplementation(() => {
        throw unexpectedError;
      });

      const params = {
        description: 'get all incidents'
      };

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while generating GlideQuery code',
          detail: 'Unexpected error'
        }
      });
    });

    it('should handle errors without message property', () => {
      mockGenerator.generate.mockImplementation(() => {
        throw 'String error';
      });

      const params = {
        description: 'get all incidents'
      };

      const result = generateGlideQueryHandler(params, mockGenerator);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while generating GlideQuery code',
          detail: 'String error'
        }
      });
    });
  });
});

describe('testGlideQueryHandler', () => {
  let mockExecutor: jest.Mocked<GlideQueryExecutor>;

  beforeEach(() => {
    // Create mock executor
    mockExecutor = {
      execute: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful test execution', () => {
    it('should execute script in test mode and return results', async () => {
      const mockResult = {
        success: true,
        data: [{ sys_id: '123', number: 'INC0010001' }],
        logs: ['Query executed successfully'],
        executionTime: 150,
        recordCount: 1,
        truncated: false
      };

      mockExecutor.execute.mockResolvedValue(mockResult);

      const params = {
        script: "new GlideQuery('incident').where('active', true).select()"
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        success: true,
        result: mockResult.data,
        warnings: mockResult.logs,
        error: undefined,
        executionTime: 150,
        recordCount: 1,
        truncated: false
      });

      expect(mockExecutor.execute).toHaveBeenCalledWith(params.script, {
        testMode: true,
        maxResults: undefined
      });
    });

    it('should execute script with custom maxResults', async () => {
      const mockResult = {
        success: true,
        data: Array(50).fill({ sys_id: '123' }),
        logs: [],
        executionTime: 200,
        recordCount: 50,
        truncated: false
      };

      mockExecutor.execute.mockResolvedValue(mockResult);

      const params = {
        script: "new GlideQuery('incident').select()",
        maxResults: 50
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        success: true,
        result: mockResult.data,
        warnings: undefined,
        error: undefined,
        executionTime: 200,
        recordCount: 50,
        truncated: false
      });

      expect(mockExecutor.execute).toHaveBeenCalledWith(params.script, {
        testMode: true,
        maxResults: 50
      });
    });

    it('should include warnings for write operations', async () => {
      const mockResult = {
        success: true,
        data: { rowCount: 5 },
        logs: ['⚠️  WARNING: This script contains write operations (updateMultiple) that will persist changes to the database.'],
        executionTime: 300,
        recordCount: 5,
        truncated: false
      };

      mockExecutor.execute.mockResolvedValue(mockResult);

      const params = {
        script: "new GlideQuery('incident').where('state', 1).updateMultiple({ state: 2 })"
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        success: true,
        result: mockResult.data,
        warnings: mockResult.logs,
        error: undefined,
        executionTime: 300,
        recordCount: 5,
        truncated: false
      });
    });

    it('should indicate truncation when results are limited', async () => {
      const mockResult = {
        success: true,
        data: Array(100).fill({ sys_id: '123' }),
        logs: ['Results truncated: showing 100 of 250 records'],
        executionTime: 400,
        recordCount: 100,
        truncated: true
      };

      mockExecutor.execute.mockResolvedValue(mockResult);

      const params = {
        script: "new GlideQuery('incident').select()"
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        success: true,
        result: mockResult.data,
        warnings: mockResult.logs,
        error: undefined,
        executionTime: 400,
        recordCount: 100,
        truncated: true
      });
    });

    it('should handle test execution errors', async () => {
      const mockResult = {
        success: false,
        error: 'Syntax error at line 1',
        executionTime: 50
      };

      mockExecutor.execute.mockResolvedValue(mockResult);

      const params = {
        script: "new GlideQuery('incident').invalidMethod()"
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        success: false,
        result: undefined,
        warnings: undefined,
        error: 'Syntax error at line 1',
        executionTime: 50,
        recordCount: undefined,
        truncated: undefined
      });
    });
  });

  describe('parameter validation', () => {
    it('should reject missing script parameter', async () => {
      const params: any = {};

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" is required',
          detail: 'The script parameter must be provided'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });

    it('should reject non-string script parameter', async () => {
      const params: any = {
        script: 123
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" must be a string',
          detail: 'Received type: number'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });

    it('should reject empty script parameter', async () => {
      const params = {
        script: '   '
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "script" cannot be empty',
          detail: 'The script must be a non-empty string'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });

    it('should reject non-integer maxResults parameter', async () => {
      const params: any = {
        script: "new GlideQuery('incident').select()",
        maxResults: 50.5
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "maxResults" must be an integer',
          detail: 'Received: 50.5'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });

    it('should reject maxResults below 1', async () => {
      const params = {
        script: "new GlideQuery('incident').select()",
        maxResults: 0
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "maxResults" must be between 1 and 1000',
          detail: 'Received: 0'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });

    it('should reject maxResults above 1000', async () => {
      const params = {
        script: "new GlideQuery('incident').select()",
        maxResults: 1001
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Parameter "maxResults" must be between 1 and 1000',
          detail: 'Received: 1001'
        }
      });

      expect(mockExecutor.execute).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle structured errors from executor', async () => {
      const structuredError = {
        code: 'SECURITY_VIOLATION',
        message: 'Blacklisted pattern detected',
        detail: 'gs.eval() is not allowed'
      };

      mockExecutor.execute.mockRejectedValue(structuredError);

      const params = {
        script: "gs.eval('malicious code')"
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: structuredError
      });
    });

    it('should handle unexpected errors', async () => {
      const unexpectedError = new Error('Network timeout');

      mockExecutor.execute.mockRejectedValue(unexpectedError);

      const params = {
        script: "new GlideQuery('incident').select()"
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while testing GlideQuery script',
          detail: 'Network timeout'
        }
      });
    });

    it('should handle errors without message property', async () => {
      mockExecutor.execute.mockRejectedValue('String error');

      const params = {
        script: "new GlideQuery('incident').select()"
      };

      const result = await testGlideQueryHandler(params, mockExecutor);

      expect(result).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while testing GlideQuery script',
          detail: 'String error'
        }
      });
    });
  });
});
