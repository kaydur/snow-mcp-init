/**
 * Incident data models for ServiceNow MCP Server
 */

/**
 * Incident state enum with numeric values matching ServiceNow
 */
export enum IncidentState {
  New = 1,
  InProgress = 2,
  OnHold = 3,
  Resolved = 6,
  Closed = 7,
  Canceled = 8
}

/**
 * Incident priority enum with numeric values matching ServiceNow
 */
export enum IncidentPriority {
  Critical = 1,
  High = 2,
  Moderate = 3,
  Low = 4,
  Planning = 5
}

/**
 * Mapping of state numeric values to human-readable labels
 */
export const STATE_LABELS: Record<number, string> = {
  1: 'New',
  2: 'In Progress',
  3: 'On Hold',
  6: 'Resolved',
  7: 'Closed',
  8: 'Canceled'
};

/**
 * Mapping of priority numeric values to human-readable labels
 */
export const PRIORITY_LABELS: Record<number, string> = {
  1: 'Critical',
  2: 'High',
  3: 'Moderate',
  4: 'Low',
  5: 'Planning'
};

/**
 * Summary view of an incident (used in query and list operations)
 */
export interface IncidentSummary {
  /** System ID (unique identifier) */
  sys_id: string;
  
  /** Incident number (e.g., INC0010001) */
  number: string;
  
  /** Short description of the incident */
  short_description: string;
  
  /** Current state of the incident */
  state: string;
  
  /** Priority level (1-5) */
  priority: number;
  
  /** User assigned to the incident (null if unassigned) */
  assigned_to: string | null;
  
  /** Timestamp of last update */
  updated_at: string;
}

/**
 * Detailed view of an incident (used in get operations)
 */
export interface IncidentDetail extends IncidentSummary {
  /** Full description of the incident */
  description: string;
  
  /** Category of the incident (null if not categorized) */
  category: string | null;
  
  /** User who opened the incident */
  opened_by: string;
  
  /** Timestamp when incident was opened */
  opened_at: string;
  
  /** Resolution notes (null if not resolved) */
  resolution_notes: string | null;
}

/**
 * Filter parameters for querying incidents
 */
export interface IncidentFilters {
  /** Filter by incident states */
  state?: string[];
  
  /** Filter by priority levels (1-5) */
  priority?: number[];
  
  /** Filter by assigned user (name or sys_id) */
  assigned_to?: string;
  
  /** Filter by assignment group (name or sys_id) */
  assignment_group?: string;
  
  /** Custom ServiceNow encoded query string */
  query?: string;
  
  /** Maximum number of results to return */
  limit?: number;
}
