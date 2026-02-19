import { WidgetInstanceService } from './WidgetInstanceService.js';
import { ServiceNowClient } from '../client/ServiceNowClient.js';
import { ServiceNowResponse } from '../types/interfaces.js';

// Mock ServiceNowClient
jest.mock('../client/ServiceNowClient.js');

describe('WidgetInstanceService', () => {
  let service: WidgetInstanceService;
  let mockClient: jest.Mocked<ServiceNowClient>;

  beforeEach(() => {
    // Create mock client
    mockClient = {
      get: jest.fn(),
      getById: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn()
    } as any;

    service = new WidgetInstanceService(mockClient);
  });

  describe('queryWidgetInstances', () => {
    it('should query widget instances with no filters', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: 'instance1',
            widget: 'widget1',
            page: 'page1',
            order: 1,
            color: 'primary',
            size: 12,
            options: '{"title":"Test"}',
            sys_updated_on: '2024-01-01 00:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.queryWidgetInstances();

      expect(mockClient.get).toHaveBeenCalledWith('sp_instance', {
        sysparm_query: undefined,
        sysparm_limit: 25,
        sysparm_display_value: false
      });
      expect(result).toHaveLength(1);
      expect(result[0].sys_id).toBe('instance1');
      expect(result[0].options).toEqual({ title: 'Test' });
    });

    it('should query widget instances with page filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await service.queryWidgetInstances({ page: 'page123' });

      expect(mockClient.get).toHaveBeenCalledWith('sp_instance', {
        sysparm_query: 'page=page123',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query widget instances with widget filter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await service.queryWidgetInstances({ widget: 'widget456' });

      expect(mockClient.get).toHaveBeenCalledWith('sp_instance', {
        sysparm_query: 'widget=widget456',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should query widget instances with multiple filters', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await service.queryWidgetInstances({
        page: 'page123',
        widget: 'widget456',
        query: 'color=primary'
      });

      expect(mockClient.get).toHaveBeenCalledWith('sp_instance', {
        sysparm_query: 'page=page123^widget=widget456^color=primary',
        sysparm_limit: 25,
        sysparm_display_value: false
      });
    });

    it('should apply limit parameter', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await service.queryWidgetInstances({ limit: 50 });

      expect(mockClient.get).toHaveBeenCalledWith('sp_instance', {
        sysparm_query: undefined,
        sysparm_limit: 50,
        sysparm_display_value: false
      });
    });

    it('should cap limit at 100', async () => {
      const mockResponse: ServiceNowResponse = { result: [] };
      mockClient.get.mockResolvedValue(mockResponse);

      await service.queryWidgetInstances({ limit: 200 });

      expect(mockClient.get).toHaveBeenCalledWith('sp_instance', {
        sysparm_query: undefined,
        sysparm_limit: 100,
        sysparm_display_value: false
      });
    });

    it('should handle widget instances with null options', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: 'instance1',
            widget: 'widget1',
            page: 'page1',
            order: 1,
            color: null,
            size: 12,
            options: null,
            sys_updated_on: '2024-01-01 00:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.queryWidgetInstances();

      expect(result[0].options).toBeNull();
      expect(result[0].color).toBeNull();
    });

    it('should handle invalid JSON in options gracefully', async () => {
      const mockResponse: ServiceNowResponse = {
        result: [
          {
            sys_id: 'instance1',
            widget: 'widget1',
            page: 'page1',
            order: 1,
            color: 'primary',
            size: 12,
            options: '{invalid json}',
            sys_updated_on: '2024-01-01 00:00:00'
          }
        ]
      };

      mockClient.get.mockResolvedValue(mockResponse);

      const result = await service.queryWidgetInstances();

      expect(result[0].options).toBeNull();
    });
  });

  describe('getWidgetInstance', () => {
    it('should retrieve widget instance by sys_id', async () => {
      const mockRecord = {
        sys_id: 'instance123',
        widget: 'widget1',
        page: 'page1',
        order: 2,
        color: 'success',
        size: 6,
        options: '{"enabled":true}',
        bootstrap_alt_text: 'Alt text',
        sys_created_on: '2024-01-01 00:00:00',
        sys_updated_on: '2024-01-02 00:00:00'
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await service.getWidgetInstance('instance123');

      expect(mockClient.getById).toHaveBeenCalledWith('sp_instance', 'instance123');
      expect(result).not.toBeNull();
      expect(result!.sys_id).toBe('instance123');
      expect(result!.widget).toBe('widget1');
      expect(result!.page).toBe('page1');
      expect(result!.order).toBe(2);
      expect(result!.color).toBe('success');
      expect(result!.size).toBe(6);
      expect(result!.options).toEqual({ enabled: true });
      expect(result!.bootstrap_alt_text).toBe('Alt text');
      expect(result!.sys_created_on).toBe('2024-01-01 00:00:00');
    });

    it('should return null when widget instance not found', async () => {
      mockClient.getById.mockRejectedValue({
        code: 'NOT_FOUND',
        message: 'Widget instance not found'
      });

      const result = await service.getWidgetInstance('nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error for invalid sys_id parameter', async () => {
      await expect(service.getWidgetInstance('')).rejects.toMatchObject({
        code: 'INVALID_PARAMETER',
        message: 'sys_id parameter is required and must be a string'
      });
    });

    it('should handle widget instance with null optional fields', async () => {
      const mockRecord = {
        sys_id: 'instance123',
        widget: 'widget1',
        page: 'page1',
        order: 1,
        color: null,
        size: 12,
        options: null,
        bootstrap_alt_text: null,
        sys_created_on: '2024-01-01 00:00:00',
        sys_updated_on: '2024-01-02 00:00:00'
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await service.getWidgetInstance('instance123');

      expect(result!.color).toBeNull();
      expect(result!.options).toBeNull();
      expect(result!.bootstrap_alt_text).toBeNull();
    });

    it('should handle invalid JSON in options gracefully', async () => {
      const mockRecord = {
        sys_id: 'instance123',
        widget: 'widget1',
        page: 'page1',
        order: 1,
        color: 'primary',
        size: 12,
        options: '{not valid json',
        bootstrap_alt_text: null,
        sys_created_on: '2024-01-01 00:00:00',
        sys_updated_on: '2024-01-02 00:00:00'
      };

      mockClient.getById.mockResolvedValue(mockRecord);

      const result = await service.getWidgetInstance('instance123');

      expect(result!.options).toBeNull();
    });
  });
});
