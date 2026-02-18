import { AuthenticationManager } from './AuthenticationManager.js';
import { AuthConfig } from '../types/interfaces.js';

describe('AuthenticationManager', () => {
  const validConfig: AuthConfig = {
    instanceUrl: 'https://dev12345.service-now.com',
    username: 'testuser',
    password: 'testpass'
  };

  describe('authenticate', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const authManager = new AuthenticationManager(validConfig);

      // Mock successful authentication
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await authManager.authenticate();

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(authManager.isAuthenticated()).toBe(true);
      
      // Verify auth headers are set
      const headers = authManager.getAuthHeaders();
      expect(headers['Authorization']).toContain('Basic ');
      expect(headers['Accept']).toBe('application/json');
    });

    it('should fail authentication with invalid credentials (401)', async () => {
      const authManager = new AuthenticationManager(validConfig);

      // Mock 401 response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      const result = await authManager.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid credentials: username or password is incorrect');
      expect(authManager.isAuthenticated()).toBe(false);
      
      // Verify auth headers are empty
      const headers = authManager.getAuthHeaders();
      expect(headers['Authorization']).toBeUndefined();
    });

    it('should fail authentication with forbidden access (403)', async () => {
      const authManager = new AuthenticationManager(validConfig);

      // Mock 403 response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden'
      });

      const result = await authManager.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Access forbidden: user does not have required permissions');
      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should handle other HTTP error statuses', async () => {
      const authManager = new AuthenticationManager(validConfig);

      // Mock 500 response
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      const result = await authManager.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Authentication failed with status 500');
      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should handle network errors', async () => {
      const authManager = new AuthenticationManager(validConfig);

      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network connection failed'));

      const result = await authManager.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication error: Network connection failed');
      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should handle unknown errors', async () => {
      const authManager = new AuthenticationManager(validConfig);

      // Mock unknown error
      global.fetch = jest.fn().mockRejectedValue('Unknown error');

      const result = await authManager.authenticate();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication error: unknown error occurred');
      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should call correct ServiceNow API endpoint', async () => {
      const authManager = new AuthenticationManager(validConfig);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      await authManager.authenticate();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://dev12345.service-now.com/api/now/table/sys_user?sysparm_limit=1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Basic '),
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          })
        })
      );
    });

    it('should encode credentials correctly in base64', async () => {
      const authManager = new AuthenticationManager(validConfig);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      await authManager.authenticate();

      const headers = authManager.getAuthHeaders();
      const authHeader = headers['Authorization'];
      
      // Extract base64 part
      const base64Part = authHeader.replace('Basic ', '');
      const decoded = Buffer.from(base64Part, 'base64').toString('utf-8');
      
      expect(decoded).toBe('testuser:testpass');
    });
  });

  describe('getAuthHeaders', () => {
    it('should return empty object when not authenticated', () => {
      const authManager = new AuthenticationManager(validConfig);

      const headers = authManager.getAuthHeaders();

      expect(headers).toEqual({});
    });

    it('should return auth headers when authenticated', async () => {
      const authManager = new AuthenticationManager(validConfig);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      await authManager.authenticate();
      const headers = authManager.getAuthHeaders();

      expect(headers).toHaveProperty('Authorization');
      expect(headers).toHaveProperty('Accept', 'application/json');
      expect(headers).toHaveProperty('Content-Type', 'application/json');
      expect(headers['Authorization']).toContain('Basic ');
    });
  });

  describe('isAuthenticated', () => {
    it('should return false initially', () => {
      const authManager = new AuthenticationManager(validConfig);

      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should return true after successful authentication', async () => {
      const authManager = new AuthenticationManager(validConfig);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      await authManager.authenticate();

      expect(authManager.isAuthenticated()).toBe(true);
    });

    it('should return false after failed authentication', async () => {
      const authManager = new AuthenticationManager(validConfig);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      });

      await authManager.authenticate();

      expect(authManager.isAuthenticated()).toBe(false);
    });
  });

  describe('handleExpiration', () => {
    it('should clear authentication state', async () => {
      const authManager = new AuthenticationManager(validConfig);

      // First authenticate
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      await authManager.authenticate();
      expect(authManager.isAuthenticated()).toBe(true);

      // Handle expiration
      authManager.handleExpiration();

      expect(authManager.isAuthenticated()).toBe(false);
      expect(authManager.getAuthHeaders()).toEqual({});
    });

    it('should be safe to call when not authenticated', () => {
      const authManager = new AuthenticationManager(validConfig);

      expect(() => authManager.handleExpiration()).not.toThrow();
      expect(authManager.isAuthenticated()).toBe(false);
    });

    it('should allow re-authentication after expiration', async () => {
      const authManager = new AuthenticationManager(validConfig);

      // First authentication
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      await authManager.authenticate();
      expect(authManager.isAuthenticated()).toBe(true);

      // Handle expiration
      authManager.handleExpiration();
      expect(authManager.isAuthenticated()).toBe(false);

      // Re-authenticate
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200
      });

      const result = await authManager.authenticate();
      expect(result.success).toBe(true);
      expect(authManager.isAuthenticated()).toBe(true);
    });
  });
});
