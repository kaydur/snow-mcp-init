import { PortalService } from './PortalService.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { ServiceNowResponse, ServiceNowRecord } from '../types/interfaces.js';

// Mock ServiceNowClient
jest.mock('../client/ServiceNowClient.js');

describe('PortalService', () => {
  let portalService: PortalService;
  let mockClient: jest.Mocked<ServiceNowClient>;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      get: jest.fn(),
      getById: jest.fn(),
      post: jest.fn(),
      put: jest.fn()
    } as any;

    portalService = new PortalService(mockClient);
  });

  describe('constructor', () => {
    it('should accept ServiceNowClient', () => {
      expect(portalService).toBeInstanceOf(PortalService);
    });
  });

  describe('queryPortals', () => {
    it('should query portals with no filters', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [{
          sys_id: '123',
          title: 'Test Portal',
          url_suffix: 'test',
          homepage: 'page123',
          theme: 'theme123',
          sys_updated_on: '2024-01-01 10:00:00'
        }]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await portalService.queryPortals();

      expect(mockClient.get).toHaveBeenCalledWith('sp_portal', {
        sysparm_query: undefined,
        sysparm_limit: 25,
        sysparm_display_value: false
      });
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        sys_id: '123',
        title: 'Test Portal',
        url_suffix: 'test',
        homepage: 'page123',
        theme: 'theme123',
        sys_updated_on: '2024-01-01 10:00:00'
      });
    });

    it('should query portals with title filter', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await portalService.queryPortals({ title: 'Test' });

      expect(mockClient.get).toHaveBeenCalledWith('sp_portal', {
        sysparm_query: 'titleLIKETest',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query portals with url_suffix filter', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await portalService.queryPortals({ url_suffix: 'test' });

      expect(mockClient.get).toHaveBeenCalledWith('sp_portal', {
        sysparm_query: 'url_suffix=test',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query portals with custom query', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await portalService.queryPortals({ query: 'active=true' });

      expect(mockClient.get).toHaveBeenCalledWith('sp_portal', {
        sysparm_query: 'active=true',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should combine multiple filters with AND operator', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await portalService.queryPortals({
        title: 'Test',
        url_suffix: 'test',
        query: 'active=true'
      });

      expect(mockClient.get).toHaveBeenCalledWith('sp_portal', {
        sysparm_query: 'titleLIKETest^url_suffix=test^active=true',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should enforce maximum limit of 100', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await portalService.queryPortals({ limit: 200 });

      expect(mockClient.get).toHaveBeenCalledWith('sp_portal', {
        sysparm_query: undefined,
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });

    it('should use default limit of 25', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await portalService.queryPortals({});

      expect(mockClient.get).toHaveBeenCalledWith('sp_portal', {
        sysparm_query: undefined,
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should handle portals with null homepage and theme', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [{
          sys_id: '123',
          title: 'Test Portal',
          url_suffix: 'test',
          homepage: null,
          theme: null,
          sys_updated_on: '2024-01-01 10:00:00'
        }]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await portalService.queryPortals();

      expect(results[0].homepage).toBeNull();
      expect(results[0].theme).toBeNull();
    });
  });

  describe('getPortal', () => {
    it('should retrieve portal by sys_id', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '12345678901234567890123456789012',
        title: 'Test Portal',
        url_suffix: 'test',
        homepage: 'page123',
        theme: 'theme123',
        logo: 'logo123',
        quick_start_config: '{"enabled":true}',
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00'
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await portalService.getPortal('12345678901234567890123456789012');

      expect(mockClient.getById).toHaveBeenCalledWith('sp_portal', '12345678901234567890123456789012');
      expect(result).toEqual({
        sys_id: '12345678901234567890123456789012',
        title: 'Test Portal',
        url_suffix: 'test',
        homepage: 'page123',
        theme: 'theme123',
        logo: 'logo123',
        quick_start_config: '{"enabled":true}',
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00'
      });
    });

    it('should retrieve portal by url_suffix', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [{
          sys_id: '123',
          title: 'Test Portal',
          url_suffix: 'test',
          homepage: 'page123',
          theme: 'theme123',
          logo: null,
          quick_start_config: null,
          sys_created_on: '2024-01-01 09:00:00',
          sys_updated_on: '2024-01-01 10:00:00'
        }]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await portalService.getPortal('test');

      expect(mockClient.get).toHaveBeenCalledWith('sp_portal', {
        sysparm_query: 'url_suffix=test',
        sysparm_limit: 1,
        sysparm_display_value: false
      });
      expect(result).toBeDefined();
      expect(result?.url_suffix).toBe('test');
    });

    it('should return null for non-existent portal url_suffix', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      const result = await portalService.getPortal('non-existent');

      expect(result).toBeNull();
    });

    it('should return null for non-existent sys_id', async () => {
      mockClient.getById.mockRejectedValue({
        code: 'NOT_FOUND',
        message: 'Record not found'
      });

      const result = await portalService.getPortal('12345678901234567890123456789012');

      expect(result).toBeNull();
    });

    it('should handle portals with null optional fields', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '123',
        title: 'Test Portal',
        url_suffix: 'test',
        homepage: null,
        theme: null,
        logo: null,
        quick_start_config: null,
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00'
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await portalService.getPortal('12345678901234567890123456789012');

      expect(result?.homepage).toBeNull();
      expect(result?.theme).toBeNull();
      expect(result?.logo).toBeNull();
      expect(result?.quick_start_config).toBeNull();
    });
  });

  describe('listPortals', () => {
    it('should list portals with default limit', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [{
          sys_id: '123',
          title: 'Portal A',
          url_suffix: 'portal-a',
          homepage: 'page123',
          theme: 'theme123',
          sys_updated_on: '2024-01-01 10:00:00'
        }, {
          sys_id: '456',
          title: 'Portal B',
          url_suffix: 'portal-b',
          homepage: null,
          theme: null,
          sys_updated_on: '2024-01-01 11:00:00'
        }]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await portalService.listPortals();

      expect(mockClient.get).toHaveBeenCalledWith('sp_portal', {
        sysparm_query: 'ORDERBYtitle',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
      expect(results).toHaveLength(2);
    });

    it('should list portals with custom limit', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await portalService.listPortals(50);

      expect(mockClient.get).toHaveBeenCalledWith('sp_portal', {
        sysparm_query: 'ORDERBYtitle',
        sysparm_limit: 50,
        sysparm_display_value: false
      });
    });

    it('should enforce maximum limit of 100', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await portalService.listPortals(200);

      expect(mockClient.get).toHaveBeenCalledWith('sp_portal', {
        sysparm_query: 'ORDERBYtitle',
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });

    it('should return empty array when no portals exist', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      const results = await portalService.listPortals();

      expect(results).toEqual([]);
    });
  });

  describe('error handling', () => {
    it('should propagate errors from ServiceNowClient', async () => {
      const error = new Error('API Error');
      mockClient.get.mockRejectedValue(error);

      await expect(portalService.queryPortals()).rejects.toThrow('API Error');
    });

    it('should handle getById errors other than NOT_FOUND', async () => {
      const error = { code: 'INTERNAL_ERROR', message: 'Server error' };
      mockClient.getById.mockRejectedValue(error);

      await expect(portalService.getPortal('12345678901234567890123456789012')).rejects.toEqual(error);
    });
  });
});
