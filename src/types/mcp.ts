/**
 * MCP protocol interfaces and types
 * 
 * These types define the structure for MCP tool definitions and protocol messages.
 * The @modelcontextprotocol/sdk provides the base protocol implementation,
 * but we define our own tool-specific interfaces here.
 */

/**
 * JSON Schema definition for tool parameters
 * Based on JSON Schema Draft 7 specification
 */
export interface JSONSchema {
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema | JSONSchema[];
  required?: string[];
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  description?: string;
  default?: unknown;
  [key: string]: unknown;
}

/**
 * Tool definition for MCP server
 * Defines a tool that can be invoked by AI assistants
 */
export interface ToolDefinition {
  /** Unique name of the tool */
  name: string;
  
  /** Human-readable description of what the tool does */
  description: string;
  
  /** JSON Schema defining the tool's input parameters */
  inputSchema: JSONSchema;
  
  /** Handler function that executes the tool logic */
  handler: (params: unknown) => Promise<unknown>;
}

/**
 * MCP Request type
 * Re-exported from @modelcontextprotocol/sdk for convenience
 */
export type { Request as MCPRequest } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP Response type  
 * Re-exported from @modelcontextprotocol/sdk for convenience
 */
export type { Result as MCPResponse } from '@modelcontextprotocol/sdk/types.js';
