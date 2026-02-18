/**
 * User data models for ServiceNow MCP Server
 */

/**
 * Summary view of a user (used in query and list operations)
 */
export interface UserSummary {
  sys_id: string;
  user_name: string;
  name: string;
  email: string;
  active: boolean;
  title: string | null;
}

/**
 * Detailed view of a user (used in get operations)
 * Includes all standard sys_user fields from ServiceNow
 */
export interface UserDetail extends UserSummary {
  // Contact information
  phone: string | null;
  mobile_phone: string | null;
  home_phone: string | null;
  business_phone: string | null;
  fax: string | null;
  
  // Organizational information
  department: string | null;
  company: string | null;
  location: string | null;
  building: string | null;
  cost_center: string | null;
  manager: string | null;
  
  // Personal information
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender: string | null;
  
  // System information
  employee_number: string | null;
  user_id: string | null;
  domain: string | null;
  domain_path: string | null;
  
  // Authentication and access
  password_needs_reset: boolean;
  locked_out: boolean;
  failed_login_attempts: number;
  last_login: string | null;
  last_login_time: string | null;
  last_login_device: string | null;
  
  // Preferences and settings
  time_zone: string | null;
  time_format: string | null;
  date_format: string | null;
  default_perspective: string | null;
  calendar_integration: number;
  enable_multifactor_authn: boolean;
  
  // LDAP and external integration
  ldap_server: string | null;
  internal_integration_user: boolean;
  
  // Additional fields
  avatar: string | null;
  photo: string | null;
  city: string | null;
  state: string | null;
  street: string | null;
  country: string | null;
  zip: string | null;
  
  // Roles and access
  roles: string | null;
  
  // Audit fields
  sys_created_on: string;
  sys_created_by: string;
  sys_updated_on: string;
  sys_updated_by: string;
  sys_mod_count: number;
}

/**
 * Filter parameters for querying users
 */
export interface UserFilters {
  active?: boolean;
  department?: string;
  role?: string;
  name?: string;
  company?: string;
  location?: string;
  query?: string;
  limit?: number;
}
