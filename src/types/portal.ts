/**
 * Portal data models for ServiceNow MCP Server
 * Service Portals are top-level containers defining theme, homepage, and URL prefix
 */

/**
 * Summary view of a Portal (used in query/list operations)
 */
export interface PortalSummary {
  /** System ID (unique identifier) */
  sys_id: string;
  
  /** Portal title */
  title: string;
  
  /** URL prefix for the portal */
  url_suffix: string;
  
  /** Homepage page sys_id (null if not set) */
  homepage: string | null;
  
  /** Theme sys_id (null if not set) */
  theme: string | null;
  
  /** Timestamp of last update */
  sys_updated_on: string;
}

/**
 * Detailed view of a Portal (used in get operations)
 */
export interface PortalDetail extends PortalSummary {
  /** Logo attachment reference (null if not set) */
  logo: string | null;
  
  /** Quick start configuration JSON (null if not set) */
  quick_start_config: string | null;
  
  /** Timestamp when portal was created */
  sys_created_on: string;
}

/**
 * Filter parameters for querying Portals
 */
export interface PortalFilters {
  /** Partial match, case-insensitive */
  title?: string;
  
  /** Exact match (URL prefix) */
  url_suffix?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Max results (1-100, default 25) */
  limit?: number;
}
