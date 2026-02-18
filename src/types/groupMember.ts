/**
 * Group Member data models for ServiceNow MCP Server
 */

/**
 * Summary view of a group member (used in query and list operations)
 */
export interface GroupMemberSummary {
  sys_id: string;
  group: string;
  user: string;
}

/**
 * Detailed view of a group member (used in get operations)
 * Includes all standard sys_user_grmember fields from ServiceNow
 */
export interface GroupMemberDetail extends GroupMemberSummary {
  // Scrum-specific fields
  scrum_role: string | null;
  average_points_per_sprint: number | null;
  
  // Audit fields
  sys_created_on: string;
  sys_created_by: string;
  sys_updated_on: string;
  sys_updated_by: string;
  sys_mod_count: number;
}

/**
 * Filter parameters for querying group members
 */
export interface GroupMemberFilters {
  group?: string;
  user?: string;
  scrum_role?: string;
  query?: string;
  limit?: number;
}
