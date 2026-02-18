/**
 * MCP Server Implementation
 * 
 * Implements the Model Context Protocol server for ServiceNow incident operations.
 * Handles tool registration, request routing, and parameter validation.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';

import { ServerConfig } from '../types/interfaces.js';
import { ToolDefinition, JSONSchema } from '../types/mcp.js';
import { ConfigurationManager } from '../config/ConfigurationManager.js';
import { AuthenticationManager } from '../auth/AuthenticationManager.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { IncidentService } from '../service/IncidentService.js';
import { GlideQueryExecutor } from '../service/GlideQueryExecutor.js';
import { GlideQueryGenerator } from '../service/GlideQueryGenerator.js';
import { UserService } from '../service/UserService.js';
import { GroupService } from '../service/GroupService.js';
import { GroupMemberService } from '../service/GroupMemberService.js';
import { TaskService } from '../service/TaskService.js';
import { StoryService } from '../service/StoryService.js';
import { ScrumTaskService } from '../service/ScrumTaskService.js';
import { ChangeRequestService } from '../service/ChangeRequestService.js';
import { 
  queryIncidentsHandler, 
  getIncidentHandler, 
  listRecentIncidentsHandler,
  executeGlideQueryHandler,
  generateGlideQueryHandler,
  testGlideQueryHandler
} from '../tools/handlers.js';
import {
  queryUsersHandler,
  getUserHandler,
  listRecentUsersHandler,
  queryGroupsHandler,
  getGroupHandler,
  listRecentGroupsHandler,
  queryGroupMembersHandler,
  getGroupMemberHandler,
  listRecentGroupMembersHandler,
  queryTasksHandler,
  getTaskHandler,
  listRecentTasksHandler,
  queryStoriesHandler,
  getStoryHandler,
  listRecentStoriesHandler,
  queryScrumTasksHandler,
  getScrumTaskHandler,
  listRecentScrumTasksHandler,
  queryChangeRequestsHandler,
  getChangeRequestHandler,
  listRecentChangeRequestsHandler
} from '../tools/newHandlers.js';
import {
  queryIncidentsSchema,
  getIncidentSchema,
  listRecentIncidentsSchema,
  executeGlideQuerySchema,
  generateGlideQuerySchema,
  testGlideQuerySchema,
  queryUsersSchema,
  getUserSchema,
  listRecentUsersSchema,
  queryGroupsSchema,
  getGroupSchema,
  listRecentGroupsSchema,
  queryGroupMembersSchema,
  getGroupMemberSchema,
  listRecentGroupMembersSchema,
  queryTasksSchema,
  getTaskSchema,
  listRecentTasksSchema,
  queryStoriesSchema,
  getStorySchema,
  listRecentStoriesSchema,
  queryScrumTasksSchema,
  getScrumTaskSchema,
  listRecentScrumTasksSchema,
  queryChangeRequestsSchema,
  getChangeRequestSchema,
  listRecentChangeRequestsSchema
} from './schemas.js';
import { logger } from '../utils/logger.js';

/**
 * MCPServer class
 * 
 * Main server component that implements the MCP protocol specification.
 * Manages tool registration, request routing, and parameter validation.
 */
export class MCPServer {
  private server: Server;
  private config: ServerConfig;
  private authManager: AuthenticationManager;
  private client: ServiceNowClient;
  private incidentService: IncidentService;
  private glideQueryExecutor: GlideQueryExecutor;
  private glideQueryGenerator: GlideQueryGenerator;
  private userService: UserService;
  private groupService: GroupService;
  private groupMemberService: GroupMemberService;
  private taskService: TaskService;
  private storyService: StoryService;
  private scrumTaskService: ScrumTaskService;
  private changeRequestService: ChangeRequestService;
  private tools: Map<string, ToolDefinition>;

  /**
   * Create a new MCPServer instance
   * 
   * @param config - Server configuration with ServiceNow connection details
   */
  constructor(config: ServerConfig) {
    this.config = config;
    this.tools = new Map();

    // Set logger level from config
    if (config.logLevel) {
      logger.setLevel(config.logLevel);
    }

    logger.info('mcp_server', 'Initializing MCP Server', {
      params: { instanceUrl: config.servicenowUrl }
    });

    // Initialize the MCP SDK server
    this.server = new Server(
      {
        name: 'servicenow-mcp-server',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    // Initialize components
    this.authManager = new AuthenticationManager({
      instanceUrl: config.servicenowUrl,
      username: config.username,
      password: config.password
    });

    this.client = new ServiceNowClient(
      {
        instanceUrl: config.servicenowUrl,
        timeout: 30000,
        maxRetries: 3
      },
      this.authManager
    );

    this.incidentService = new IncidentService(this.client);

    // Initialize GlideQuery services
    this.glideQueryExecutor = new GlideQueryExecutor(this.client);
    this.glideQueryGenerator = new GlideQueryGenerator();

    // Initialize new table services
    this.userService = new UserService(this.client);
    this.groupService = new GroupService(this.client);
    this.groupMemberService = new GroupMemberService(this.client);
    this.taskService = new TaskService(this.client);
    this.storyService = new StoryService(this.client);
    this.scrumTaskService = new ScrumTaskService(this.client);
    this.changeRequestService = new ChangeRequestService(this.client);

    // Set up request handlers
    this.setupHandlers();
  }

  /**
   * Set up MCP protocol request handlers
   */
  private setupHandlers(): void {
    // Handle list_tools requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const toolsList: Tool[] = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object' as const,
          properties: tool.inputSchema.properties as any,
          required: tool.inputSchema.required
        }
      }));

      return { tools: toolsList };
    });

    // Handle call_tool requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const startTime = Date.now();
      const toolName = request.params.name;
      
      logger.info('tool_invocation', `Tool invoked: ${toolName}`, {
        params: { tool: toolName, arguments: request.params.arguments }
      });
      
      const tool = this.tools.get(toolName);

      if (!tool) {
        const duration = Date.now() - startTime;
        logger.error('tool_invocation', `Tool not found: ${toolName}`, {
          error: { code: 'TOOL_NOT_FOUND', message: `Tool "${toolName}" not found` },
          duration
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: {
                code: 'TOOL_NOT_FOUND',
                message: `Tool "${toolName}" not found`,
                detail: `Available tools: ${Array.from(this.tools.keys()).join(', ')}`
              }
            })
          }],
          isError: true
        };
      }

      // Validate parameters against schema
      const validationError = this.validateParameters(
        request.params.arguments || {},
        tool.inputSchema
      );

      if (validationError) {
        const duration = Date.now() - startTime;
        logger.error('tool_invocation', `Parameter validation failed for ${toolName}`, {
          error: { code: 'SCHEMA_VALIDATION_ERROR', message: validationError },
          duration
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: {
                code: 'SCHEMA_VALIDATION_ERROR',
                message: 'Tool parameters failed schema validation',
                detail: validationError
              }
            })
          }],
          isError: true
        };
      }

      // Invoke the tool handler
      try {
        const result = await tool.handler(request.params.arguments || {});
        const duration = Date.now() - startTime;
        
        // Check if result is an error response
        if (result && typeof result === 'object' && 'error' in result) {
          logger.error('tool_invocation', `Tool execution returned error: ${toolName}`, {
            error: result.error,
            duration
          });
          
          return {
            content: [{
              type: 'text',
              text: JSON.stringify(result)
            }],
            isError: true
          };
        }

        logger.info('tool_invocation', `Tool execution successful: ${toolName}`, {
          duration
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result)
          }]
        };
      } catch (error: any) {
        const duration = Date.now() - startTime;
        logger.error('tool_invocation', `Tool execution failed: ${toolName}`, {
          error: { message: error?.message || String(error) },
          duration
        });
        
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: {
                code: 'TOOL_EXECUTION_ERROR',
                message: 'Tool execution failed',
                detail: error?.message || String(error)
              }
            })
          }],
          isError: true
        };
      }
    });
  }

  /**
   * Validate tool parameters against JSON schema
   * 
   * @param params - Parameters to validate
   * @param schema - JSON schema to validate against
   * @returns Error message if validation fails, null if valid
   */
  private validateParameters(params: any, schema: JSONSchema): string | null {
    // Check required fields
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in params)) {
          return `Missing required parameter: ${field}`;
        }
      }
    }

    // Check parameter types and constraints
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in params) {
          const value = params[key];
          const error = this.validateValue(value, propSchema, key);
          if (error) {
            return error;
          }
        }
      }
    }

    return null;
  }

  /**
   * Validate a single value against its schema
   * 
   * @param value - Value to validate
   * @param schema - Schema for the value
   * @param fieldName - Name of the field (for error messages)
   * @returns Error message if validation fails, null if valid
   */
  private validateValue(value: any, schema: JSONSchema, fieldName: string): string | null {
    // Type validation
    if (schema.type) {
      const types = Array.isArray(schema.type) ? schema.type : [schema.type];
      let actualType = Array.isArray(value) ? 'array' : typeof value;
      
      // Handle integer type specially
      if (types.includes('integer')) {
        if (typeof value !== 'number') {
          return `Parameter "${fieldName}" must be of type integer, got ${actualType}`;
        }
        if (!Number.isInteger(value)) {
          return `Parameter "${fieldName}" must be an integer`;
        }
        // For integer type, treat as number for further validation
        actualType = 'number';
      } else if (!types.includes(actualType)) {
        return `Parameter "${fieldName}" must be of type ${types.join(' or ')}, got ${actualType}`;
      }

      // Array validation
      if (actualType === 'array' && schema.items) {
        for (let i = 0; i < value.length; i++) {
          const itemSchema = Array.isArray(schema.items) ? schema.items[i] : schema.items;
          if (itemSchema) {
            const error = this.validateValue(value[i], itemSchema, `${fieldName}[${i}]`);
            if (error) {
              return error;
            }
          }
        }
      }

      // Number/integer validation
      if (actualType === 'number' || types.includes('integer')) {
        if (schema.minimum !== undefined && value < schema.minimum) {
          return `Parameter "${fieldName}" must be >= ${schema.minimum}`;
        }
        if (schema.maximum !== undefined && value > schema.maximum) {
          return `Parameter "${fieldName}" must be <= ${schema.maximum}`;
        }
      }

      // String validation
      if (actualType === 'string') {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
          return `Parameter "${fieldName}" must have length >= ${schema.minLength}`;
        }
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
          return `Parameter "${fieldName}" must have length <= ${schema.maxLength}`;
        }
        if (schema.pattern !== undefined) {
          const regex = new RegExp(schema.pattern);
          if (!regex.test(value)) {
            return `Parameter "${fieldName}" must match pattern ${schema.pattern}`;
          }
        }
      }
    }

    // Enum validation
    if (schema.enum !== undefined) {
      if (!schema.enum.includes(value)) {
        return `Parameter "${fieldName}" must be one of: ${schema.enum.join(', ')}`;
      }
    }

    return null;
  }

  /**
   * Register a tool with the MCP server
   * 
   * @param tool - Tool definition with name, description, schema, and handler
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Initialize server and register all tools
   */
  async start(): Promise<void> {
    logger.info('mcp_server', 'Starting MCP Server');
    
    // Authenticate with ServiceNow
    const authResult = await this.authManager.authenticate();
    if (!authResult.success) {
      logger.error('mcp_server', 'Server startup failed - authentication error', {
        error: { message: authResult.error }
      });
      throw new Error(`Authentication failed: ${authResult.error}`);
    }

    // Register all three tools
    this.registerTool({
      name: 'query_incidents',
      description: 'Query ServiceNow incidents using filter criteria. Supports filtering by state, priority, assigned user, assignment group, and custom query strings. Returns incident summaries with key fields.',
      inputSchema: queryIncidentsSchema,
      handler: async (params: unknown) => {
        return await queryIncidentsHandler(params as any, this.incidentService);
      }
    });

    this.registerTool({
      name: 'get_incident',
      description: 'Retrieve a specific ServiceNow incident by its sys_id or incident number. Returns complete incident details including description, category, timestamps, and resolution notes.',
      inputSchema: getIncidentSchema,
      handler: async (params: unknown) => {
        return await getIncidentHandler(params as any, this.incidentService);
      }
    });

    this.registerTool({
      name: 'list_recent_incidents',
      description: 'List the most recently created or updated ServiceNow incidents. Returns incident summaries ordered by updated timestamp in descending order (most recent first).',
      inputSchema: listRecentIncidentsSchema,
      handler: async (params: unknown) => {
        return await listRecentIncidentsHandler(params as any, this.incidentService);
      }
    });

    // Register GlideQuery tools
    this.registerTool({
      name: 'execute_glidequery',
      description: 'Execute a GlideQuery script on the ServiceNow instance. Supports querying, inserting, updating, and deleting records using the modern GlideQuery API. Returns execution results with data, logs, and performance metrics.',
      inputSchema: executeGlideQuerySchema,
      handler: async (params: unknown) => {
        return await executeGlideQueryHandler(params as any, this.glideQueryExecutor);
      }
    });

    this.registerTool({
      name: 'generate_glidequery',
      description: 'Generate GlideQuery code from a natural language description. Produces syntactically valid GlideQuery code with explanatory comments and best practices. Useful for quickly creating queries without memorizing syntax.',
      inputSchema: generateGlideQuerySchema,
      handler: async (params: unknown) => {
        return generateGlideQueryHandler(params as any, this.glideQueryGenerator);
      }
    });

    this.registerTool({
      name: 'test_glidequery',
      description: 'Test a GlideQuery script in a safe mode with result limiting. Executes the script with a maximum result limit (default 100 records) and provides warnings for write operations. Useful for validating queries before deployment.',
      inputSchema: testGlideQuerySchema,
      handler: async (params: unknown) => {
        return await testGlideQueryHandler(params as any, this.glideQueryExecutor);
      }
    });

    // Register User tools
    this.registerTool({
      name: 'query_users',
      description: 'Query ServiceNow users using filter criteria. Supports filtering by active status, department, role, name, and custom query strings. Returns user summaries with key fields.',
      inputSchema: queryUsersSchema,
      handler: async (params: unknown) => {
        return await queryUsersHandler(params as any, this.userService);
      }
    });

    this.registerTool({
      name: 'get_user',
      description: 'Retrieve a specific ServiceNow user by sys_id or username. Returns complete user details including email, phone, department, and manager information.',
      inputSchema: getUserSchema,
      handler: async (params: unknown) => {
        return await getUserHandler(params as any, this.userService);
      }
    });

    this.registerTool({
      name: 'list_recent_users',
      description: 'List the most recently created or updated ServiceNow users. Returns user summaries ordered by updated timestamp in descending order (most recent first).',
      inputSchema: listRecentUsersSchema,
      handler: async (params: unknown) => {
        return await listRecentUsersHandler(params as any, this.userService);
      }
    });

    // Register Group tools
    this.registerTool({
      name: 'query_groups',
      description: 'Query ServiceNow groups using filter criteria. Supports filtering by active status, type, name, and custom query strings. Returns group summaries with key fields.',
      inputSchema: queryGroupsSchema,
      handler: async (params: unknown) => {
        return await queryGroupsHandler(params as any, this.groupService);
      }
    });

    this.registerTool({
      name: 'get_group',
      description: 'Retrieve a specific ServiceNow group by sys_id or group name. Returns complete group details including description, type, manager, and email information.',
      inputSchema: getGroupSchema,
      handler: async (params: unknown) => {
        return await getGroupHandler(params as any, this.groupService);
      }
    });

    this.registerTool({
      name: 'list_recent_groups',
      description: 'List the most recently created or updated ServiceNow groups. Returns group summaries ordered by updated timestamp in descending order (most recent first).',
      inputSchema: listRecentGroupsSchema,
      handler: async (params: unknown) => {
        return await listRecentGroupsHandler(params as any, this.groupService);
      }
    });

    // Register Group Member tools
    this.registerTool({
      name: 'query_group_members',
      description: 'Query ServiceNow group members using filter criteria. Supports filtering by group, user, and custom query strings. Returns group member summaries with key fields.',
      inputSchema: queryGroupMembersSchema,
      handler: async (params: unknown) => {
        return await queryGroupMembersHandler(params as any, this.groupMemberService);
      }
    });

    this.registerTool({
      name: 'get_group_member',
      description: 'Retrieve a specific ServiceNow group member by sys_id. Returns complete group member details including group and user information.',
      inputSchema: getGroupMemberSchema,
      handler: async (params: unknown) => {
        return await getGroupMemberHandler(params as any, this.groupMemberService);
      }
    });

    this.registerTool({
      name: 'list_recent_group_members',
      description: 'List the most recently created or updated ServiceNow group members. Returns group member summaries ordered by updated timestamp in descending order (most recent first).',
      inputSchema: listRecentGroupMembersSchema,
      handler: async (params: unknown) => {
        return await listRecentGroupMembersHandler(params as any, this.groupMemberService);
      }
    });

    // Register Task tools
    this.registerTool({
      name: 'query_tasks',
      description: 'Query ServiceNow tasks using filter criteria. Supports filtering by state, priority, assigned user, assignment group, and custom query strings. Returns task summaries with key fields.',
      inputSchema: queryTasksSchema,
      handler: async (params: unknown) => {
        return await queryTasksHandler(params as any, this.taskService);
      }
    });

    this.registerTool({
      name: 'get_task',
      description: 'Retrieve a specific ServiceNow task by sys_id or task number. Returns complete task details including description, work notes, due date, and assignment information.',
      inputSchema: getTaskSchema,
      handler: async (params: unknown) => {
        return await getTaskHandler(params as any, this.taskService);
      }
    });

    this.registerTool({
      name: 'list_recent_tasks',
      description: 'List the most recently created or updated ServiceNow tasks. Returns task summaries ordered by updated timestamp in descending order (most recent first).',
      inputSchema: listRecentTasksSchema,
      handler: async (params: unknown) => {
        return await listRecentTasksHandler(params as any, this.taskService);
      }
    });

    // Register Story tools
    this.registerTool({
      name: 'query_stories',
      description: 'Query ServiceNow stories using filter criteria. Supports filtering by state, priority, sprint, assigned user, story points, and custom query strings. Returns story summaries with key fields.',
      inputSchema: queryStoriesSchema,
      handler: async (params: unknown) => {
        return await queryStoriesHandler(params as any, this.storyService);
      }
    });

    this.registerTool({
      name: 'get_story',
      description: 'Retrieve a specific ServiceNow story by sys_id or story number. Returns complete story details including description, sprint, product, and assignment information.',
      inputSchema: getStorySchema,
      handler: async (params: unknown) => {
        return await getStoryHandler(params as any, this.storyService);
      }
    });

    this.registerTool({
      name: 'list_recent_stories',
      description: 'List the most recently created or updated ServiceNow stories. Returns story summaries ordered by updated timestamp in descending order (most recent first).',
      inputSchema: listRecentStoriesSchema,
      handler: async (params: unknown) => {
        return await listRecentStoriesHandler(params as any, this.storyService);
      }
    });

    // Register Scrum Task tools
    this.registerTool({
      name: 'query_scrum_tasks',
      description: 'Query ServiceNow scrum tasks using filter criteria. Supports filtering by state, priority, sprint, assigned user, parent story, and custom query strings. Returns scrum task summaries with key fields.',
      inputSchema: queryScrumTasksSchema,
      handler: async (params: unknown) => {
        return await queryScrumTasksHandler(params as any, this.scrumTaskService);
      }
    });

    this.registerTool({
      name: 'get_scrum_task',
      description: 'Retrieve a specific ServiceNow scrum task by sys_id or scrum task number. Returns complete scrum task details including description, parent story, sprint, and assignment information.',
      inputSchema: getScrumTaskSchema,
      handler: async (params: unknown) => {
        return await getScrumTaskHandler(params as any, this.scrumTaskService);
      }
    });

    this.registerTool({
      name: 'list_recent_scrum_tasks',
      description: 'List the most recently created or updated ServiceNow scrum tasks. Returns scrum task summaries ordered by updated timestamp in descending order (most recent first).',
      inputSchema: listRecentScrumTasksSchema,
      handler: async (params: unknown) => {
        return await listRecentScrumTasksHandler(params as any, this.scrumTaskService);
      }
    });

    // Register Change Request tools
    this.registerTool({
      name: 'query_change_requests',
      description: 'Query ServiceNow change requests using filter criteria. Supports filtering by state, priority, risk, type, assigned user, assignment group, and custom query strings. Returns change request summaries with key fields.',
      inputSchema: queryChangeRequestsSchema,
      handler: async (params: unknown) => {
        return await queryChangeRequestsHandler(params as any, this.changeRequestService);
      }
    });

    this.registerTool({
      name: 'get_change_request',
      description: 'Retrieve a specific ServiceNow change request by sys_id or change request number. Returns complete change request details including description, category, risk assessment, and timeline information.',
      inputSchema: getChangeRequestSchema,
      handler: async (params: unknown) => {
        return await getChangeRequestHandler(params as any, this.changeRequestService);
      }
    });

    this.registerTool({
      name: 'list_recent_change_requests',
      description: 'List the most recently created or updated ServiceNow change requests. Returns change request summaries ordered by updated timestamp in descending order (most recent first).',
      inputSchema: listRecentChangeRequestsSchema,
      handler: async (params: unknown) => {
        return await listRecentChangeRequestsHandler(params as any, this.changeRequestService);
      }
    });

    logger.info('mcp_server', 'Registered tools', {
      result: { tools: Array.from(this.tools.keys()) }
    });

    // Connect the server to stdio transport
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    logger.info('mcp_server', 'MCP Server started successfully');
  }

  /**
   * Shutdown server gracefully
   */
  async stop(): Promise<void> {
    logger.info('mcp_server', 'Stopping MCP Server');
    await this.server.close();
    logger.info('mcp_server', 'MCP Server stopped');
  }
}
