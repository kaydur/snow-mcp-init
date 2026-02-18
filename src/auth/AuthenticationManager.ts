import axios from 'axios';
import { AuthConfig, AuthResult } from '../types/interfaces.js';
import { logger } from '../utils/logger.js';

/**
 * Manages ServiceNow authentication and session lifecycle
 * 
 * Handles credential validation, session management, and authentication header generation
 * using basic authentication (username:password base64 encoded).
 */
export class AuthenticationManager {
  private config: AuthConfig;
  private authenticated: boolean = false;
  private authHeader: string = '';

  constructor(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Validate credentials and establish session with ServiceNow
   * 
   * @returns AuthResult indicating success or failure with error message
   */
  async authenticate(): Promise<AuthResult> {
    const startTime = Date.now();
    
    try {
      logger.info('authenticate', 'Attempting authentication', {
        params: { instanceUrl: this.config.instanceUrl, username: this.config.username }
      });
      
      // Create basic auth header
      const credentials = `${this.config.username}:${this.config.password}`;
      const base64Credentials = Buffer.from(credentials).toString('base64');
      this.authHeader = `Basic ${base64Credentials}`;

      // Test authentication by making a simple API call to ServiceNow
      const testUrl = `${this.config.instanceUrl}/api/now/table/sys_user?sysparm_limit=1`;
      const response = await axios.get(testUrl, {
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 10000,
        validateStatus: () => true, // Don't throw on any status code
        httpsAgent: process.env.REJECT_UNAUTHORIZED === 'false' 
          ? new (await import('https')).Agent({ rejectUnauthorized: false })
          : undefined
      });

      if (response.status === 200) {
        this.authenticated = true;
        const duration = Date.now() - startTime;
        logger.info('authenticate', 'Authentication successful', {
          result: { success: true },
          duration
        });
        return { success: true };
      } else {
        this.authenticated = false;
        this.authHeader = '';
        
        let errorMessage = 'Authentication failed';
        
        if (response.status === 401) {
          errorMessage = 'Invalid credentials: username or password is incorrect';
        } else if (response.status === 403) {
          errorMessage = 'Access forbidden: user does not have required permissions';
        } else {
          const errorText = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
          errorMessage = `Authentication failed with status ${response.status}: ${errorText}`;
        }
        
        const duration = Date.now() - startTime;
        logger.error('authenticate', 'Authentication failed', {
          error: { status: response.status, message: errorMessage },
          duration
        });
        
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      this.authenticated = false;
      this.authHeader = '';
      
      let errorMessage = 'Authentication error: unknown error occurred';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ENOTFOUND') {
          errorMessage = `Cannot reach ServiceNow instance: ${this.config.instanceUrl} - check your URL`;
        } else if (error.code === 'ECONNREFUSED') {
          errorMessage = `Connection refused to ${this.config.instanceUrl}`;
        } else if (error.code === 'ETIMEDOUT') {
          errorMessage = `Connection timeout to ${this.config.instanceUrl}`;
        } else if (error.message) {
          errorMessage = `Authentication error: ${error.message}`;
        }
      } else if (error instanceof Error) {
        errorMessage = `Authentication error: ${error.message}`;
      }
      
      const duration = Date.now() - startTime;
      logger.error('authenticate', 'Authentication error', {
        error: { message: errorMessage },
        duration
      });
      
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get authentication headers for API requests
   * 
   * @returns Object containing Authorization header
   */
  getAuthHeaders(): Record<string, string> {
    if (!this.authenticated || !this.authHeader) {
      return {};
    }
    
    return {
      'Authorization': this.authHeader,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }

  /**
   * Check if session is currently valid
   * 
   * @returns true if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Handle session expiration by clearing authentication state
   * 
   * This should be called when a 401 response is received during an API call,
   * indicating the session has expired.
   */
  handleExpiration(): void {
    logger.warn('handleExpiration', 'Session expired, clearing authentication state');
    this.authenticated = false;
    this.authHeader = '';
  }
}
