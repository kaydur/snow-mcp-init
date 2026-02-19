/**
 * Page data models for ServiceNow MCP Server
 * Service Portal pages are containers for widgets arranged in rows and columns
 */

/**
 * Summary view of a Page (used in query/list operations)
 */
export interface PageSummary {
  /** System ID (unique identifier) */
  sys_id: string;
  
  /** Page title */
  title: string;
  
  /** URL suffix (used in page URLs) */
  id: string;
  
  /** Whether the page is publicly accessible */
  public: boolean;
  
  /** Portal sys_id this page belongs to (null if not associated) */
  portal: string | null;
  
  /** Array of role sys_ids required for access */
  roles: string[];
  
  /** Timestamp of last update */
  sys_updated_on: string;
}

/**
 * Detailed view of a Page (used in get operations)
 */
export interface PageDetail extends PageSummary {
  /** Description of the page's purpose */
  description: string | null;
  
  /** Timestamp when page was created */
  sys_created_on: string;
}

/**
 * Filter parameters for querying Pages
 */
export interface PageFilters {
  /** Partial match, case-insensitive */
  title?: string;
  
  /** Exact match (URL suffix) */
  id?: string;
  
  /** Filter by public status */
  public?: boolean;
  
  /** Filter by portal sys_id */
  portal?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Max results (1-100, default 25) */
  limit?: number;
}

/**
 * Data for creating a Page
 */
export interface CreatePageData {
  /** Page title */
  title: string;
  
  /** URL suffix (used in page URLs) */
  id: string;
  
  /** Whether the page is publicly accessible (optional) */
  public?: boolean;
  
  /** Portal sys_id this page belongs to (optional) */
  portal?: string;
  
  /** Array of role sys_ids required for access (optional) */
  roles?: string[];
  
  /** Description of the page's purpose (optional) */
  description?: string;
}

/**
 * Data for updating a Page
 */
export interface UpdatePageData {
  /** Page title */
  title?: string;
  
  /** URL suffix (used in page URLs) */
  id?: string;
  
  /** Whether the page is publicly accessible */
  public?: boolean;
  
  /** Portal sys_id this page belongs to */
  portal?: string;
  
  /** Array of role sys_ids required for access */
  roles?: string[];
  
  /** Description of the page's purpose */
  description?: string;
}

/**
 * Widget instance on a page with configuration
 */
export interface WidgetOnPage {
  /** Widget instance sys_id */
  sys_id: string;
  
  /** Widget sys_id */
  widget_sys_id: string;
  
  /** Widget name */
  widget_name: string;
  
  /** Widget id */
  widget_id: string;
  
  /** Position on page (order) */
  order: number;
  
  /** Column width (Bootstrap grid size) */
  size: number;
  
  /** Visual styling color (null if not specified) */
  color: string | null;
  
  /** JSON configuration options (null if not specified) */
  options: any | null;
}
