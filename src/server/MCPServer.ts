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
import { ScriptIncludeService } from '../service/ScriptIncludeService.js';
import { WidgetService } from '../service/WidgetService.js';
import { PageService } from '../service/PageService.js';
import { PortalService } from '../service/PortalService.js';
import { WidgetInstanceService } from '../service/WidgetInstanceService.js';
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
  createScriptIncludeHandler,
  getScriptIncludeHandler,
  updateScriptIncludeHandler,
  deleteScriptIncludeHandler,
  queryScriptIncludesHandler,
  listRecentScriptIncludesHandler,
  validateScriptIncludeHandler,
  testScriptIncludeHandler
} from '../tools/scriptIncludeHandlers.js';
import {
  createWidgetHandler,
  getWidgetHandler,
  updateWidgetHandler,
  cloneWidgetHandler,
  queryWidgetsHandler,
  listRecentWidgetsHandler,
  validateWidgetHandler,
  getWidgetDependenciesHandler,
  getPagesUsingWidgetHandler
} from '../tools/widgetHandlers.js';
import {
  createPageHandler,
  getPageHandler,
  updatePageHandler,
  queryPagesHandler,
  listRecentPagesHandler,
  getWidgetsByPageHandler
} from '../tools/pageHandlers.js';
import {
  queryPortalsHandler,
  getPortalHandler,
  listPortalsHandler,
  queryWidgetInstancesHandler,
  getWidgetInstanceHandler
} from '../tools/portalHandlers.js';
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
import {
  createScriptIncludeSchema,
  getScriptIncludeSchema,
  updateScriptIncludeSchema,
  deleteScriptIncludeSchema,
  queryScriptIncludesSchema,
  listRecentScriptIncludesSchema,
  validateScriptIncludeSchema,
  testScriptIncludeSchema,
  queryWidgetsSchema,
  getWidgetSchema,
  listRecentWidgetsSchema,
  createWidgetSchema,
  updateWidgetSchema,
  cloneWidgetSchema,
  validateWidgetSchema,
  getWidgetDependenciesSchema,
  getPagesUsingWidgetSchema,
  queryPagesSchema,
  getPageSchema,
  listRecentPagesSchema,
  createPageSchema,
  updatePageSchema,
  getWidgetsByPageSchema,
  queryPortalsSchema,
  getPortalSchema,
  listPortalsSchema,
  queryWidgetInstancesSchema,
  getWidgetInstanceSchema
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
  private scriptIncludeService: ScriptIncludeService;
  private widgetService: WidgetService;
  private pageService: PageService;
  private portalService: PortalService;
  private widgetInstanceService: WidgetInstanceService;
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
    this.scriptIncludeService = new ScriptIncludeService(this.client);
    this.widgetService = new WidgetService(this.client);
    this.pageService = new PageService(this.client);
    this.portalService = new PortalService(this.client);
    this.widgetInstanceService = new WidgetInstanceService(this.client);

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

    // Register Script Include tools
    this.registerTool({
      name: 'create_script_include',
      description: 'Create a new Script Include in ServiceNow. Validates JavaScript code for security issues and pattern compliance. Returns the sys_id of the created Script Include.',
      inputSchema: createScriptIncludeSchema,
      handler: async (params: unknown) => {
        return await createScriptIncludeHandler(params as any, this.scriptIncludeService);
      }
    });

    this.registerTool({
      name: 'get_script_include',
      description: 'Retrieve a specific Script Include by sys_id or api_name. Returns complete Script Include details including the JavaScript code.',
      inputSchema: getScriptIncludeSchema,
      handler: async (params: unknown) => {
        return await getScriptIncludeHandler(params as any, this.scriptIncludeService);
      }
    });

    this.registerTool({
      name: 'update_script_include',
      description: 'Update an existing Script Include. Validates JavaScript code for security issues if script is being updated. Returns the sys_id of the updated Script Include.',
      inputSchema: updateScriptIncludeSchema,
      handler: async (params: unknown) => {
        return await updateScriptIncludeHandler(params as any, this.scriptIncludeService);
      }
    });

    this.registerTool({
      name: 'delete_script_include',
      description: 'Delete a Script Include by sys_id. Returns success confirmation.',
      inputSchema: deleteScriptIncludeSchema,
      handler: async (params: unknown) => {
        return await deleteScriptIncludeHandler(params as any, this.scriptIncludeService);
      }
    });

    this.registerTool({
      name: 'query_script_includes',
      description: 'Query Script Includes using filter criteria. Supports filtering by name, api_name, active status, access level, client_callable flag, and custom query strings. Returns Script Include summaries.',
      inputSchema: queryScriptIncludesSchema,
      handler: async (params: unknown) => {
        return await queryScriptIncludesHandler(params as any, this.scriptIncludeService);
      }
    });

    this.registerTool({
      name: 'list_recent_script_includes',
      description: 'List the most recently created or updated Script Includes. Returns Script Include summaries ordered by updated timestamp in descending order (most recent first).',
      inputSchema: listRecentScriptIncludesSchema,
      handler: async (params: unknown) => {
        return await listRecentScriptIncludesHandler(params as any, this.scriptIncludeService);
      }
    });

    this.registerTool({
      name: 'validate_script_include',
      description: 'Validate JavaScript code for a Script Include. Checks for security violations, syntax errors, and discouraged patterns. Returns validation results with warnings and errors.',
      inputSchema: validateScriptIncludeSchema,
      handler: async (params: unknown) => {
        return await validateScriptIncludeHandler(params as any, this.scriptIncludeService);
      }
    });

    this.registerTool({
      name: 'test_script_include',
      description: 'Test a Script Include method. Validates that the Script Include and method exist. Note: Actual execution requires ServiceNow scripting API and is not yet implemented.',
      inputSchema: testScriptIncludeSchema,
      handler: async (params: unknown) => {
        return await testScriptIncludeHandler(params as any, this.scriptIncludeService);
      }
    });

    // Register Widget tools
    this.registerTool({
      name: 'query_widgets',
      description: 'Query Service Portal widgets using filter criteria. Supports filtering by name, id, public status, category, data_table, and custom query strings. Returns widget summaries with key fields.',
      inputSchema: queryWidgetsSchema,
      handler: async (params: unknown) => {
        return await queryWidgetsHandler(params as any, this.widgetService);
      }
    });

    this.registerTool({
      name: 'get_widget',
      description: 'Retrieve a specific Service Portal widget by sys_id or widget id. Returns complete widget details including all scripts, templates, and configuration.',
      inputSchema: getWidgetSchema,
      handler: async (params: unknown) => {
        return await getWidgetHandler(params as any, this.widgetService);
      }
    });

    this.registerTool({
      name: 'list_recent_widgets',
      description: 'List the most recently created or updated Service Portal widgets. Returns widget summaries ordered by updated timestamp in descending order (most recent first).',
      inputSchema: listRecentWidgetsSchema,
      handler: async (params: unknown) => {
        return await listRecentWidgetsHandler(params as any, this.widgetService);
      }
    });

    this.registerTool({
      name: 'create_widget',
      description: 'Create a new Service Portal widget with HTML template, CSS/SCSS, client script, server script, and configuration. Validates all code for security issues before creation.',
      inputSchema: createWidgetSchema,
      handler: async (params: unknown) => {
        return await createWidgetHandler(params as any, this.widgetService);
      }
    });

    this.registerTool({
      name: 'update_widget',
      description: 'Update an existing Service Portal widget. Validates all code for security issues if scripts are being updated. Returns the sys_id of the updated widget.',
      inputSchema: updateWidgetSchema,
      handler: async (params: unknown) => {
        return await updateWidgetHandler(params as any, this.widgetService);
      }
    });

    this.registerTool({
      name: 'clone_widget',
      description: 'Clone an existing Service Portal widget as a starting point for customization. Copies all properties from the source widget with a new id and name.',
      inputSchema: cloneWidgetSchema,
      handler: async (params: unknown) => {
        return await cloneWidgetHandler(params as any, this.widgetService);
      }
    });

    this.registerTool({
      name: 'validate_widget',
      description: 'Validate Service Portal widget code before saving. Checks HTML, CSS/SCSS, JavaScript for syntax errors and security issues. Returns validation results with warnings and errors.',
      inputSchema: validateWidgetSchema,
      handler: async (params: unknown) => {
        return await validateWidgetHandler(params as any, this.widgetService);
      }
    });

    this.registerTool({
      name: 'get_widget_dependencies',
      description: 'Retrieve dependencies for a Service Portal widget. Returns list of external JavaScript or CSS resources required by the widget.',
      inputSchema: getWidgetDependenciesSchema,
      handler: async (params: unknown) => {
        return await getWidgetDependenciesHandler(params as any, this.widgetService);
      }
    });

    this.registerTool({
      name: 'get_pages_using_widget',
      description: 'Find all Service Portal pages that use a specific widget. Returns list of pages with the widget to understand widget usage and impact of changes.',
      inputSchema: getPagesUsingWidgetSchema,
      handler: async (params: unknown) => {
        return await getPagesUsingWidgetHandler(params as any, this.widgetService);
      }
    });

    // Register Page tools
    this.registerTool({
      name: 'query_pages',
      description: 'Query Service Portal pages using filter criteria. Supports filtering by title, id, public status, portal, and custom query strings. Returns page summaries with key fields.',
      inputSchema: queryPagesSchema,
      handler: async (params: unknown) => {
        return await queryPagesHandler(params as any, this.pageService);
      }
    });

    this.registerTool({
      name: 'get_page',
      description: 'Retrieve a specific Service Portal page by sys_id or page id. Returns complete page details including layout and widget instances.',
      inputSchema: getPageSchema,
      handler: async (params: unknown) => {
        return await getPageHandler(params as any, this.pageService);
      }
    });

    this.registerTool({
      name: 'list_recent_pages',
      description: 'List the most recently created or updated Service Portal pages. Returns page summaries ordered by updated timestamp in descending order (most recent first).',
      inputSchema: listRecentPagesSchema,
      handler: async (params: unknown) => {
        return await listRecentPagesHandler(params as any, this.pageService);
      }
    });

    this.registerTool({
      name: 'create_page',
      description: 'Create a new Service Portal page. Validates portal and role references before creation. Returns the sys_id of the created page.',
      inputSchema: createPageSchema,
      handler: async (params: unknown) => {
        return await createPageHandler(params as any, this.pageService);
      }
    });

    this.registerTool({
      name: 'update_page',
      description: 'Update an existing Service Portal page. Validates portal and role references if being updated. Returns the sys_id of the updated page.',
      inputSchema: updatePageSchema,
      handler: async (params: unknown) => {
        return await updatePageHandler(params as any, this.pageService);
      }
    });

    this.registerTool({
      name: 'get_widgets_by_page',
      description: 'Retrieve all widgets used on a specific Service Portal page. Returns widget information including configuration and placement.',
      inputSchema: getWidgetsByPageSchema,
      handler: async (params: unknown) => {
        return await getWidgetsByPageHandler(params as any, this.pageService);
      }
    });

    // Register Portal tools
    this.registerTool({
      name: 'query_portals',
      description: 'Query Service Portals using filter criteria. Supports filtering by title, url_suffix, and custom query strings. Returns portal summaries with key fields.',
      inputSchema: queryPortalsSchema,
      handler: async (params: unknown) => {
        return await queryPortalsHandler(params as any, this.portalService);
      }
    });

    this.registerTool({
      name: 'get_portal',
      description: 'Retrieve a specific Service Portal by sys_id or url_suffix. Returns complete portal details including theme and configuration.',
      inputSchema: getPortalSchema,
      handler: async (params: unknown) => {
        return await getPortalHandler(params as any, this.portalService);
      }
    });

    this.registerTool({
      name: 'list_portals',
      description: 'List all Service Portals ordered by title. Returns portal summaries with key fields.',
      inputSchema: listPortalsSchema,
      handler: async (params: unknown) => {
        return await listPortalsHandler(params as any, this.portalService);
      }
    });

    // Register Widget Instance tools
    this.registerTool({
      name: 'query_widget_instances',
      description: 'Query Service Portal widget instances using filter criteria. Supports filtering by page, widget, and custom query strings. Returns widget instance summaries with key fields.',
      inputSchema: queryWidgetInstancesSchema,
      handler: async (params: unknown) => {
        return await queryWidgetInstancesHandler(params as any, this.widgetInstanceService);
      }
    });

    this.registerTool({
      name: 'get_widget_instance',
      description: 'Retrieve a specific Service Portal widget instance by sys_id. Returns complete widget instance details including configuration and placement.',
      inputSchema: getWidgetInstanceSchema,
      handler: async (params: unknown) => {
        return await getWidgetInstanceHandler(params as any, this.widgetInstanceService);
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
