import { PageService } from './PageService.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { PageFilters } from '../types/page.js';
import { ServiceNowResponse, ServiceNowRecord } from '../types/interfaces.js';

// Mock ServiceNowClient
jest.mock('../client/ServiceNowClient.js');

describe('PageService', () => {
  let pageService: PageService;
  let mockClient: jest.Mocked<ServiceNowClient>;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      get: jest.fn(),
      getById: jest.fn(),
      post: jest.fn(),
      put: jest.fn()
    } as any;

    pageService = new PageService(mockClient);
  });

  describe('constructor', () => {
    it('should accept ServiceNowClient', () => {
      expect(pageService).toBeInstanceOf(PageService);
    });
  });

  describe('createPage', () => {
    it('should create a page with required fields', async () => {
      const mockResponse = {
        sys_id: '12345678901234567890123456789012'
      };

      mockClient.get.mockResolvedValue({ result: [] }); // No existing page
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await pageService.createPage({
        title: 'Test Page',
        id: 'test-page'
      });

      expect(mockClient.post).toHaveBeenCalledWith('sp_page', {
        title: 'Test Page',
        id: 'test-page',
        public: false
      });
      expect(result).toBe('12345678901234567890123456789012');
    });

    it('should create a page with all optional fields', async () => {
      const mockResponse = {
        sys_id: '12345678901234567890123456789012'
      };

      mockClient.get.mockResolvedValueOnce({ result: [] }); // No existing page
      mockClient.getById.mockResolvedValue({ sys_id: 'portal123' }); // Portal exists
      mockClient.get.mockResolvedValueOnce({ result: [{ sys_id: 'role1' }, { sys_id: 'role2' }] }); // Roles exist
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await pageService.createPage({
        title: 'Test Page',
        id: 'test-page',
        public: true,
        portal: 'portal123',
        roles: ['role1', 'role2'],
        description: 'Test description'
      });

      expect(mockClient.post).toHaveBeenCalledWith('sp_page', {
        title: 'Test Page',
        id: 'test-page',
        public: true,
        portal: 'portal123',
        roles: 'role1,role2',
        description: 'Test description'
      });
      expect(result).toBe('12345678901234567890123456789012');
    });

    it('should throw error if title is missing', async () => {
      await expect(
        pageService.createPage({
          title: '',
          id: 'test-page'
        })
      ).rejects.toEqual({
        code: 'INVALID_PARAMETER',
        message: 'Title field is required',
        detail: 'The title field must be provided and non-empty'
      });
    });

    it('should throw error if id is missing', async () => {
      await expect(
        pageService.createPage({
          title: 'Test Page',
          id: ''
        })
      ).rejects.toEqual({
        code: 'INVALID_PARAMETER',
        message: 'ID field is required',
        detail: 'The id field must be provided and non-empty'
      });
    });

    it('should throw error if page with same id already exists', async () => {
      mockClient.get.mockResolvedValue({
        result: [{
          sys_id: 'existing123',
          title: 'Existing Page',
          id: 'test-page',
          public: false,
          portal: null,
          roles: '',
          sys_updated_on: '2024-01-01 10:00:00'
        }]
      });

      await expect(
        pageService.createPage({
          title: 'Test Page',
          id: 'test-page'
        })
      ).rejects.toEqual({
        code: 'DUPLICATE_ERROR',
        message: 'Page with this ID already exists',
        detail: "A page with id 'test-page' already exists"
      });
    });

    it('should throw error if portal does not exist', async () => {
      mockClient.get.mockResolvedValue({ result: [] }); // No existing page
      mockClient.getById.mockRejectedValue({ code: 'NOT_FOUND' }); // Portal not found

      await expect(
        pageService.createPage({
          title: 'Test Page',
          id: 'test-page',
          portal: 'invalid-portal'
        })
      ).rejects.toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Portal not found',
        detail: 'No portal found with sys_id: invalid-portal'
      });
    });

    it('should throw error if roles do not exist', async () => {
      mockClient.get.mockResolvedValueOnce({ result: [] }); // No existing page
      mockClient.get.mockResolvedValueOnce({ result: [] }); // No roles found

      await expect(
        pageService.createPage({
          title: 'Test Page',
          id: 'test-page',
          roles: ['role1', 'role2']
        })
      ).rejects.toEqual({
        code: 'VALIDATION_ERROR',
        message: 'One or more roles not found',
        detail: 'All role sys_ids must exist in the sys_user_role table'
      });
    });
  });

  describe('getPage', () => {
    it('should retrieve page by sys_id', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '12345678901234567890123456789012',
        title: 'Test Page',
        id: 'test-page',
        public: true,
        portal: 'portal123',
        roles: 'role1,role2',
        description: 'Test description',
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00'
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await pageService.getPage('12345678901234567890123456789012');

      expect(mockClient.getById).toHaveBeenCalledWith('sp_page', '12345678901234567890123456789012');
      expect(result).toEqual({
        sys_id: '12345678901234567890123456789012',
        title: 'Test Page',
        id: 'test-page',
        public: true,
        portal: 'portal123',
        roles: ['role1', 'role2'],
        description: 'Test description',
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00'
      });
    });

    it('should retrieve page by id', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [{
          sys_id: '123',
          title: 'Test Page',
          id: 'test-page',
          public: false,
          portal: null,
          roles: '',
          description: null,
          sys_created_on: '2024-01-01 09:00:00',
          sys_updated_on: '2024-01-01 10:00:00'
        }]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await pageService.getPage('test-page');

      expect(mockClient.get).toHaveBeenCalledWith('sp_page', {
        sysparm_query: 'id=test-page',
        sysparm_limit: 1,
        sysparm_display_value: false
      });
      expect(result).toBeDefined();
      expect(result?.id).toBe('test-page');
    });

    it('should return null for non-existent page id', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      const result = await pageService.getPage('non-existent');

      expect(result).toBeNull();
    });

    it('should return null for non-existent sys_id', async () => {
      mockClient.getById.mockRejectedValue({
        code: 'NOT_FOUND',
        message: 'Record not found'
      });

      const result = await pageService.getPage('12345678901234567890123456789012');

      expect(result).toBeNull();
    });

    it('should handle pages with no roles', async () => {
      const mockRecord: ServiceNowRecord = {
        sys_id: '123',
        title: 'Test Page',
        id: 'test-page',
        public: false,
        portal: null,
        roles: '',
        description: null,
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00'
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await pageService.getPage('12345678901234567890123456789012');

      expect(result?.roles).toEqual([]);
    });
  });

  describe('updatePage', () => {
    it('should update page fields', async () => {
      mockClient.put.mockResolvedValue({ sys_id: '12345678901234567890123456789012' } as any);

      const result = await pageService.updatePage('12345678901234567890123456789012', {
        title: 'Updated Title',
        public: true
      });

      expect(mockClient.put).toHaveBeenCalledWith('sp_page', '12345678901234567890123456789012', {
        title: 'Updated Title',
        public: true
      });
      expect(result).toBe('12345678901234567890123456789012');
    });

    it('should throw error if sys_id is missing', async () => {
      await expect(
        pageService.updatePage('', { title: 'Updated' })
      ).rejects.toEqual({
        code: 'INVALID_PARAMETER',
        message: 'sys_id parameter is required and must be a string',
        detail: 'Provide a valid sys_id to update'
      });
    });

    it('should throw error if no update fields provided', async () => {
      await expect(
        pageService.updatePage('12345678901234567890123456789012', {})
      ).rejects.toEqual({
        code: 'INVALID_PARAMETER',
        message: 'No update fields provided',
        detail: 'At least one field must be provided for update'
      });
    });

    it('should throw error if page not found', async () => {
      mockClient.put.mockRejectedValue({ code: 'NOT_FOUND' });

      await expect(
        pageService.updatePage('12345678901234567890123456789012', { title: 'Updated' })
      ).rejects.toEqual({
        code: 'NOT_FOUND',
        message: 'Page not found',
        detail: 'No page found with sys_id: 12345678901234567890123456789012'
      });
    });

    it('should validate portal exists when updating', async () => {
      mockClient.getById.mockRejectedValue({ code: 'NOT_FOUND' });

      await expect(
        pageService.updatePage('12345678901234567890123456789012', {
          portal: 'invalid-portal'
        })
      ).rejects.toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Portal not found',
        detail: 'No portal found with sys_id: invalid-portal'
      });
    });
  });

  describe('queryPages', () => {
    it('should query pages with no filters', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [{
          sys_id: '123',
          title: 'Test Page',
          id: 'test-page',
          public: false,
          portal: null,
          roles: '',
          sys_updated_on: '2024-01-01 10:00:00'
        }]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await pageService.queryPages();

      expect(mockClient.get).toHaveBeenCalledWith('sp_page', {
        sysparm_query: undefined,
        sysparm_limit: 25,
        sysparm_display_value: false
      });
      expect(results).toHaveLength(1);
    });

    it('should query pages with title filter', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await pageService.queryPages({ title: 'Test' });

      expect(mockClient.get).toHaveBeenCalledWith('sp_page', {
        sysparm_query: 'titleLIKETest',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query pages with id filter', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await pageService.queryPages({ id: 'test-page' });

      expect(mockClient.get).toHaveBeenCalledWith('sp_page', {
        sysparm_query: 'id=test-page',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query pages with public filter', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await pageService.queryPages({ public: true });

      expect(mockClient.get).toHaveBeenCalledWith('sp_page', {
        sysparm_query: 'public=true',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query pages with portal filter', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await pageService.queryPages({ portal: 'portal123' });

      expect(mockClient.get).toHaveBeenCalledWith('sp_page', {
        sysparm_query: 'portal=portal123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should enforce maximum limit of 100', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await pageService.queryPages({ limit: 200 });

      expect(mockClient.get).toHaveBeenCalledWith('sp_page', {
        sysparm_query: undefined,
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });
  });

  describe('listRecentPages', () => {
    it('should list recent pages with default limit', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [{
          sys_id: '123',
          title: 'Recent Page',
          id: 'recent-page',
          public: false,
          portal: null,
          roles: '',
          sys_updated_on: '2024-01-01 10:00:00'
        }]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const results = await pageService.listRecentPages();

      expect(mockClient.get).toHaveBeenCalledWith('sp_page', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
      expect(results).toHaveLength(1);
    });

    it('should enforce maximum limit of 100', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await pageService.listRecentPages(200);

      expect(mockClient.get).toHaveBeenCalledWith('sp_page', {
        sysparm_query: 'ORDERBYDESCsys_updated_on',
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });
  });

  describe('getWidgetsByPage', () => {
    it('should retrieve widgets on a page', async () => {
      const mockPageRecord: ServiceNowRecord = {
        sys_id: 'page123',
        title: 'Test Page',
        id: 'test-page',
        public: false,
        portal: null,
        roles: '',
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00'
      };

      const mockInstanceResponse: ServiceNowResponse = {
        result: [{
          sys_id: 'instance123',
          widget: 'widget123',
          page: 'page123',
          order: 1,
          size: 12,
          color: 'primary',
          options: '{"title":"Test"}'
        }]
      };

      const mockWidgetRecord: ServiceNowRecord = {
        sys_id: 'widget123',
        name: 'Test Widget',
        id: 'test-widget'
      };

      mockClient.get.mockResolvedValueOnce({
        result: [mockPageRecord]
      });
      mockClient.get.mockResolvedValueOnce(mockInstanceResponse);
      mockClient.getById.mockResolvedValueOnce(mockWidgetRecord);

      const results = await pageService.getWidgetsByPage('page123');

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        sys_id: 'instance123',
        widget_sys_id: 'widget123',
        widget_name: 'Test Widget',
        widget_id: 'test-widget',
        order: 1,
        size: 12,
        color: 'primary',
        options: { title: 'Test' }
      });
    });

    it('should throw error if page not found', async () => {
      mockClient.get.mockResolvedValue({ result: [] });

      await expect(
        pageService.getWidgetsByPage('invalid-page')
      ).rejects.toEqual({
        code: 'NOT_FOUND',
        message: 'Page not found',
        detail: 'No page found with sys_id: invalid-page'
      });
    });

    it('should return empty array if page has no widgets', async () => {
      const mockPageRecord: ServiceNowRecord = {
        sys_id: 'page123',
        title: 'Test Page',
        id: 'test-page',
        public: false,
        portal: null,
        roles: '',
        sys_created_on: '2024-01-01 09:00:00',
        sys_updated_on: '2024-01-01 10:00:00'
      };

      mockClient.get.mockResolvedValueOnce({
        result: [mockPageRecord]
      });
      mockClient.get.mockResolvedValueOnce({ result: [] });

      const results = await pageService.getWidgetsByPage('page123');

      expect(results).toEqual([]);
    });
  });
});
