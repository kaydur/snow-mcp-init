/**
 * Group data models for ServiceNow MCP Server
 */

/**
 * Summary view of a group (used in query and list operations)
 */
export interface GroupSummary {
  sys_id: string;
  name: string;
  description: string | null;
  active: boolean;
  type: string | null;
  manager: string | null;
}

/**
 * Detailed view of a group (used in get operations)
 * Includes all standard sys_user_group fields from ServiceNow
 */
export interface GroupDetail extends GroupSummary {
  // Contact information
  email: string | null;
  
  // Organizational information
  cost_center: string | null;
  default_assignee: string | null;
  parent: string | null;
  
  // Group settings
  exclude_manager: boolean;
  include_members: boolean;
  group_capacity_points: number | null;
  
  // Source and roles
  source: string | null;
  roles: string | null;
  
  // Audit fields
  sys_created_on: string;
  sys_created_by: string;
  sys_updated_on: string;
  sys_updated_by: string;
  sys_mod_count: number;
}

/**
 * Filter parameters for querying groups
 */
export interface GroupFilters {
  active?: boolean;
  type?: string;
  name?: string;
  manager?: string;
  parent?: string;
  query?: string;
  limit?: number;
}
