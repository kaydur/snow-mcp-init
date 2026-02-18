/**
 * Unit tests for MCPServer
 */

import { ServerConfig } from '../types/interfaces.js';
import { AuthenticationManager } from '../auth/AuthenticationManager.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { IncidentService } from '../service/IncidentService.js';

// Mock MCP SDK before importing MCPServer
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined)
  }))
}));

jest.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: jest.fn()
}));

jest.mock('@modelcontextprotocol/sdk/types.js', () => ({
  CallToolRequestSchema: 'CallToolRequestSchema',
  ListToolsRequestSchema: 'ListToolsRequestSchema'
}));

// Mock all dependencies
jest.mock('../auth/AuthenticationManager.js');
jest.mock('../client/ServiceNowClient.js');
jest.mock('../service/IncidentService.js');
jest.mock('../service/GlideQueryExecutor.js');
jest.mock('../service/GlideQueryGenerator.js');
jest.mock('../service/ScriptSecurityValidator.js');

// Import MCPServer after mocks are set up
import { MCPServer } from './MCPServer.js';

describe('MCPServer', () => {
  let config: ServerConfig;
  let mockAuthManager: jest.Mocked<AuthenticationManager>;
  let mockClient: jest.Mocked<ServiceNowClient>;
  let mockIncidentService: jest.Mocked<IncidentService>;

  beforeEach(() => {
    // Create test configuration
    config = {
      servicenowUrl: 'https://dev12345.service-now.com',
      username: 'testuser',
      password: 'testpass',
      logLevel: 'info'
    };

    // Reset all mocks
    jest.clearAllMocks();

    // Mock AuthenticationManager
    mockAuthManager = {
      authenticate: jest.fn().mockResolvedValue({ success: true }),
      getAuthHeaders: jest.fn().mockReturnValue({ Authorization: 'Basic dGVzdDp0ZXN0' }),
      isAuthenticated: jest.fn().mockReturnValue(true),
      handleExpiration: jest.fn()
    } as any;

    (AuthenticationManager as jest.MockedClass<typeof AuthenticationManager>).mockImplementation(() => mockAuthManager);

    // Mock ServiceNowClient
    mockClient = {} as any;
    (ServiceNowClient as jest.MockedClass<typeof ServiceNowClient>).mockImplementation(() => mockClient);

    // Mock IncidentService
    mockIncidentService = {
      queryIncidents: jest.fn().mockResolvedValue([]),
      getIncident: jest.fn().mockResolvedValue(null),
      listRecentIncidents: jest.fn().mockResolvedValue([])
    } as any;

    (IncidentService as jest.MockedClass<typeof IncidentService>).mockImplementation(() => mockIncidentService);
  });

  describe('constructor', () => {
    it('should initialize with provided configuration', () => {
      const server = new MCPServer(config);

      expect(server).toBeInstanceOf(MCPServer);
      expect(AuthenticationManager).toHaveBeenCalledWith({
        instanceUrl: config.servicenowUrl,
        username: config.username,
        password: config.password
      });
      expect(ServiceNowClient).toHaveBeenCalledWith(
        {
          instanceUrl: config.servicenowUrl,
          timeout: 30000,
          maxRetries: 3
        },
        mockAuthManager
      );
      expect(IncidentService).toHaveBeenCalledWith(mockClient);
    });
  });

  describe('registerTool', () => {
    it('should register a tool with name, description, schema, and handler', () => {
      const server = new MCPServer(config);
      const mockHandler = jest.fn().mockResolvedValue({ result: 'success' });

      server.registerTool({
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            param1: { type: 'string' }
          }
        },
        handler: mockHandler
      });

      // Tool registration is internal, we'll verify it works through start() and tool invocation
      expect(server).toBeInstanceOf(MCPServer);
    });
  });

  describe('parameter validation', () => {
    let server: MCPServer;

    beforeEach(() => {
      server = new MCPServer(config);
    });

    it('should validate required parameters', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          identifier: { type: 'string' }
        },
        required: ['identifier']
      };

      // Access private method through any cast for testing
      const error = (server as any).validateParameters({}, schema);

      expect(error).toBe('Missing required parameter: identifier');
    });

    it('should validate parameter types', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          limit: { type: 'integer' }
        }
      };

      const error = (server as any).validateParameters({ limit: 'not a number' }, schema);

      expect(error).toContain('must be of type');
    });

    it('should validate integer constraints', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          limit: { 
            type: 'integer',
            minimum: 1,
            maximum: 100
          }
        }
      };

      const errorMin = (server as any).validateParameters({ limit: 0 }, schema);
      expect(errorMin).toContain('must be >= 1');

      const errorMax = (server as any).validateParameters({ limit: 101 }, schema);
      expect(errorMax).toContain('must be <= 100');

      const errorNotInt = (server as any).validateParameters({ limit: 25.5 }, schema);
      expect(errorNotInt).toContain('must be an integer');
    });

    it('should validate array items', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          priority: {
            type: 'array',
            items: {
              type: 'integer',
              minimum: 1,
              maximum: 5
            }
          }
        }
      };

      const error = (server as any).validateParameters({ priority: [1, 2, 6] }, schema);

      expect(error).toContain('must be <= 5');
    });

    it('should validate string constraints', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          name: {
            type: 'string',
            minLength: 3,
            maxLength: 10,
            pattern: '^[a-z]+$'
          }
        }
      };

      const errorMinLength = (server as any).validateParameters({ name: 'ab' }, schema);
      expect(errorMinLength).toContain('must have length >= 3');

      const errorMaxLength = (server as any).validateParameters({ name: 'abcdefghijk' }, schema);
      expect(errorMaxLength).toContain('must have length <= 10');

      const errorPattern = (server as any).validateParameters({ name: 'ABC123' }, schema);
      expect(errorPattern).toContain('must match pattern');
    });

    it('should validate enum values', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'pending']
          }
        }
      };

      const error = (server as any).validateParameters({ status: 'invalid' }, schema);

      expect(error).toContain('must be one of');
    });

    it('should return null for valid parameters', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          identifier: { type: 'string' },
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        },
        required: ['identifier']
      };

      const error = (server as any).validateParameters(
        { identifier: 'INC0010001', limit: 25 },
        schema
      );

      expect(error).toBeNull();
    });

    it('should allow optional parameters to be omitted', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          identifier: { type: 'string' },
          limit: { type: 'integer' }
        },
        required: ['identifier']
      };

      const error = (server as any).validateParameters(
        { identifier: 'INC0010001' },
        schema
      );

      expect(error).toBeNull();
    });
  });

  describe('start', () => {
    it('should authenticate and register all tools', async () => {
      const server = new MCPServer(config);

      await server.start();

      expect(mockAuthManager.authenticate).toHaveBeenCalled();
    });

    it('should throw error if authentication fails', async () => {
      mockAuthManager.authenticate.mockResolvedValue({
        success: false,
        error: 'Invalid credentials'
      });

      const server = new MCPServer(config);

      await expect(server.start()).rejects.toThrow('Authentication failed: Invalid credentials');
    });
  });

  describe('GlideQuery tool registration', () => {
    it('should register execute_glidequery tool', async () => {
      const server = new MCPServer(config);
      await server.start();

      // Access private tools map to verify registration
      const tools = (server as any).tools as Map<string, any>;
      
      expect(tools.has('execute_glidequery')).toBe(true);
      
      const tool = tools.get('execute_glidequery');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('execute_glidequery');
      expect(tool.description).toContain('Execute a GlideQuery script');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.properties).toHaveProperty('script');
      expect(tool.inputSchema.properties).toHaveProperty('timeout');
      expect(tool.inputSchema.required).toContain('script');
      expect(tool.handler).toBeInstanceOf(Function);
    });

    it('should register generate_glidequery tool', async () => {
      const server = new MCPServer(config);
      await server.start();

      const tools = (server as any).tools as Map<string, any>;
      
      expect(tools.has('generate_glidequery')).toBe(true);
      
      const tool = tools.get('generate_glidequery');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('generate_glidequery');
      expect(tool.description).toContain('Generate GlideQuery code');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.properties).toHaveProperty('description');
      expect(tool.inputSchema.properties).toHaveProperty('table');
      expect(tool.inputSchema.properties).toHaveProperty('includeComments');
      expect(tool.inputSchema.required).toContain('description');
      expect(tool.handler).toBeInstanceOf(Function);
    });

    it('should register test_glidequery tool', async () => {
      const server = new MCPServer(config);
      await server.start();

      const tools = (server as any).tools as Map<string, any>;
      
      expect(tools.has('test_glidequery')).toBe(true);
      
      const tool = tools.get('test_glidequery');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('test_glidequery');
      expect(tool.description).toContain('Test a GlideQuery script');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.properties).toHaveProperty('script');
      expect(tool.inputSchema.properties).toHaveProperty('maxResults');
      expect(tool.inputSchema.required).toContain('script');
      expect(tool.handler).toBeInstanceOf(Function);
    });

    it('should register all six tools (3 incident + 3 glidequery)', async () => {
      const server = new MCPServer(config);
      await server.start();

      const tools = (server as any).tools as Map<string, any>;
      
      expect(tools.size).toBe(6);
      expect(tools.has('query_incidents')).toBe(true);
      expect(tools.has('get_incident')).toBe(true);
      expect(tools.has('list_recent_incidents')).toBe(true);
      expect(tools.has('execute_glidequery')).toBe(true);
      expect(tools.has('generate_glidequery')).toBe(true);
      expect(tools.has('test_glidequery')).toBe(true);
    });

    it('should have valid schemas for execute_glidequery tool', async () => {
      const server = new MCPServer(config);
      await server.start();

      const tools = (server as any).tools as Map<string, any>;
      const tool = tools.get('execute_glidequery');
      
      expect(tool.inputSchema.properties.script.type).toBe('string');
      expect(tool.inputSchema.properties.script.description).toBeDefined();
      expect(tool.inputSchema.properties.timeout.type).toBe('integer');
      expect(tool.inputSchema.properties.timeout.minimum).toBe(1000);
      expect(tool.inputSchema.properties.timeout.maximum).toBe(60000);
      expect(tool.inputSchema.properties.timeout.default).toBe(30000);
    });

    it('should have valid schemas for generate_glidequery tool', async () => {
      const server = new MCPServer(config);
      await server.start();

      const tools = (server as any).tools as Map<string, any>;
      const tool = tools.get('generate_glidequery');
      
      expect(tool.inputSchema.properties.description.type).toBe('string');
      expect(tool.inputSchema.properties.description.description).toBeDefined();
      expect(tool.inputSchema.properties.table.type).toBe('string');
      expect(tool.inputSchema.properties.includeComments.type).toBe('boolean');
      expect(tool.inputSchema.properties.includeComments.default).toBe(true);
    });

    it('should have valid schemas for test_glidequery tool', async () => {
      const server = new MCPServer(config);
      await server.start();

      const tools = (server as any).tools as Map<string, any>;
      const tool = tools.get('test_glidequery');
      
      expect(tool.inputSchema.properties.script.type).toBe('string');
      expect(tool.inputSchema.properties.script.description).toBeDefined();
      expect(tool.inputSchema.properties.maxResults.type).toBe('integer');
      expect(tool.inputSchema.properties.maxResults.minimum).toBe(1);
      expect(tool.inputSchema.properties.maxResults.maximum).toBe(1000);
      expect(tool.inputSchema.properties.maxResults.default).toBe(100);
    });
  });
});
