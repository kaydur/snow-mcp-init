/**
 * Widget Instance data models for ServiceNow MCP Server
 * Widget instances represent specific placements of widgets on pages with configuration
 */

/**
 * Summary view of a Widget Instance (used in query/list operations)
 */
export interface WidgetInstanceSummary {
  /** System ID (unique identifier) */
  sys_id: string;
  
  /** Widget sys_id */
  widget: string;
  
  /** Page sys_id */
  page: string;
  
  /** Position on page (order) */
  order: number;
  
  /** Visual styling color (null if not specified) */
  color: string | null;
  
  /** Column width (Bootstrap grid size) */
  size: number;
  
  /** JSON configuration options (null if not specified) */
  options: any | null;
  
  /** Timestamp of last update */
  sys_updated_on: string;
}

/**
 * Detailed view of a Widget Instance (used in get operations)
 */
export interface WidgetInstanceDetail extends WidgetInstanceSummary {
  /** Bootstrap alternative text for accessibility (null if not specified) */
  bootstrap_alt_text: string | null;
  
  /** Timestamp when widget instance was created */
  sys_created_on: string;
}

/**
 * Filter parameters for querying Widget Instances
 */
export interface WidgetInstanceFilters {
  /** Filter by page sys_id */
  page?: string;
  
  /** Filter by widget sys_id */
  widget?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Max results (1-100, default 25) */
  limit?: number;
}
