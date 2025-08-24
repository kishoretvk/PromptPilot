// API Service Tests
// Comprehensive tests for the enhanced API client functionality

import { apiClient } from '../api';
import { toast } from 'react-toastify';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  })),
}));

// Mock toast
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock error handler
jest.mock('../../utils/errorHandling', () => ({
  errorHandler: {
    handleAPIError: jest.fn(),
    logError: jest.fn(),
    createError: jest.fn((message, code, details) => ({
      message,
      code,
      details,
      timestamp: new Date().toISOString(),
    })),
  },
}));

describe('ApiClient', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Get the mocked axios instance
    const axios = require('axios');
    mockAxiosInstance = axios.create();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  describe('initialization', () => {
    it('should create axios instance with correct configuration', () => {
      const axios = require('axios');
      
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8000',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should setup request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('request interceptor', () => {
    let requestInterceptor: any;

    beforeEach(() => {
      // Get the request interceptor function
      const calls = mockAxiosInstance.interceptors.request.use.mock.calls;
      requestInterceptor = calls[0][0]; // First argument of first call
    });

    it('should add auth token when available', () => {
      localStorage.setItem('auth_token', 'test-token');
      
      const config = { headers: {} };
      const result = requestInterceptor(config);
      
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('should add tracking headers', () => {
      const config = { headers: {} };
      const result = requestInterceptor(config);
      
      expect(result.headers['X-Request-ID']).toBeDefined();
      expect(result.headers['X-Client-Version']).toBe('1.0.0');
      expect(result.headers['X-Client-Platform']).toBe('web');
    });

    it('should not add auth token when not available', () => {
      const config = { headers: {} };
      const result = requestInterceptor(config);
      
      expect(result.headers.Authorization).toBeUndefined();
    });
  });

  describe('response interceptor', () => {
    let responseInterceptor: any;
    let errorInterceptor: any;

    beforeEach(() => {
      // Get the response interceptor functions
      const calls = mockAxiosInstance.interceptors.response.use.mock.calls;
      responseInterceptor = calls[0][0]; // Success handler
      errorInterceptor = calls[0][1]; // Error handler
    });

    it('should handle successful responses', () => {
      const response = {
        status: 200,
        data: { message: 'success' },
        config: { headers: { 'X-Request-ID': 'test-id' } },
      };

      const result = responseInterceptor(response);
      expect(result).toBe(response);
    });

    it('should handle 401 authentication errors', async () => {
      const error = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
        },
        config: { headers: { 'X-Request-ID': 'test-id' } },
      };

      localStorage.setItem('auth_token', 'expired-token');
      localStorage.setItem('user_data', JSON.stringify({ id: 1 }));

      await errorInterceptor(error);

      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(sessionStorage.length).toBe(0);
      expect(toast.error).toHaveBeenCalledWith(
        'Your session has expired. Please log in again.',
        { toastId: 'auth-expired' }
      );
    });

    it('should handle 429 rate limiting errors', async () => {
      const error = {
        response: {
          status: 429,
          data: { message: 'Too many requests' },
          headers: { 'retry-after': '60' },
        },
        config: { headers: { 'X-Request-ID': 'test-id' } },
      };

      await errorInterceptor(error);

      expect(toast.warning).toHaveBeenCalledWith(
        'Too many requests. Please wait 60 seconds before trying again.',
        { toastId: 'rate-limit', autoClose: 8000 }
      );
    });

    it('should handle server errors (5xx)', async () => {
      const error = {
        response: {
          status: 500,
          data: { message: 'Internal server error' },
        },
        config: { headers: { 'X-Request-ID': 'test-id' } },
      };

      await errorInterceptor(error);

      expect(toast.error).toHaveBeenCalledWith(
        'Server error occurred. Our team has been notified.',
        { toastId: 'server-error' }
      );
    });

    it('should handle network errors', async () => {
      const error = {
        code: 'NETWORK_ERROR',
        message: 'Network Error',
        config: { headers: { 'X-Request-ID': 'test-id' } },
      };

      await errorInterceptor(error);

      expect(toast.error).toHaveBeenCalledWith(
        'Unable to connect to server. Please check your internet connection.',
        { toastId: 'network-error' }
      );
    });

    it('should handle timeout errors', async () => {
      const error = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
        config: { headers: { 'X-Request-ID': 'test-id' } },
      };

      await errorInterceptor(error);

      expect(toast.error).toHaveBeenCalledWith(
        'Request timed out. Please try again.',
        { toastId: 'timeout-error' }
      );
    });
  });

  describe('API methods', () => {
    const mockResponse = {
      data: {
        data: { id: 1, name: 'Test' },
        success: true,
        message: 'Success',
      },
    };

    beforeEach(() => {
      mockAxiosInstance.get.mockResolvedValue(mockResponse);
      mockAxiosInstance.post.mockResolvedValue(mockResponse);
      mockAxiosInstance.put.mockResolvedValue(mockResponse);
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);
    });

    describe('get method', () => {
      it('should make GET request successfully', async () => {
        const result = await apiClient.get('/test', { param: 'value' });

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', { params: { param: 'value' } });
        expect(result).toEqual(mockResponse.data);
      });

      it('should retry on network error', async () => {
        const networkError = {
          code: 'NETWORK_ERROR',
          message: 'Network Error',
        };

        mockAxiosInstance.get
          .mockRejectedValueOnce(networkError)
          .mockRejectedValueOnce(networkError)
          .mockResolvedValueOnce(mockResponse);

        const result = await apiClient.get('/test', {}, { retries: 2 });

        expect(mockAxiosInstance.get).toHaveBeenCalledTimes(3);
        expect(result).toEqual(mockResponse.data);
      });

      it('should not retry on client error (4xx)', async () => {
        const clientError = {
          response: { status: 400 },
          message: 'Bad Request',
        };

        mockAxiosInstance.get.mockRejectedValueOnce(clientError);

        await expect(apiClient.get('/test', {}, { retries: 2 })).rejects.toThrow();
        expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      });
    });

    describe('post method', () => {
      it('should make POST request successfully', async () => {
        const data = { name: 'Test' };
        const result = await apiClient.post('/test', data);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', data);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('put method', () => {
      it('should make PUT request successfully', async () => {
        const data = { name: 'Updated Test' };
        const result = await apiClient.put('/test/1', data);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test/1', data);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('patch method', () => {
      it('should make PATCH request successfully', async () => {
        const data = { name: 'Patched Test' };
        const result = await apiClient.patch('/test/1', data);

        expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test/1', data);
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('delete method', () => {
      it('should make DELETE request successfully', async () => {
        const result = await apiClient.delete('/test/1');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test/1');
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('upload method', () => {
    it('should handle file upload with progress tracking', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', mockFile);
      
      const onProgress = jest.fn();
      const mockResponse = {
        data: {
          data: { id: 1, filename: 'test.txt' },
          success: true,
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiClient.upload('/upload', formData, onProgress);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: expect.any(Function),
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should call progress callback during upload', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', mockFile);
      
      const onProgress = jest.fn();
      let progressCallback: any;

      mockAxiosInstance.post.mockImplementation((url, data, config) => {
        progressCallback = config.onUploadProgress;
        return Promise.resolve({
          data: {
            data: { id: 1, filename: 'test.txt' },
            success: true,
          },
        });
      });

      await apiClient.upload('/upload', formData, onProgress);

      // Simulate progress event
      progressCallback({ loaded: 50, total: 100 });

      expect(onProgress).toHaveBeenCalledWith(50);
    });
  });

  describe('connection monitoring', () => {
    it('should detect online status change', () => {
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });

      // Trigger offline event
      window.dispatchEvent(new Event('offline'));

      expect(toast.warning).toHaveBeenCalledWith(
        'You are currently offline. Some features may not be available.',
        { toastId: 'offline-warning', autoClose: false }
      );
    });

    it('should attempt reconnection when coming back online', () => {
      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: true,
      });

      // Mock health check
      mockAxiosInstance.get.mockResolvedValue({ data: { status: 'healthy' } });

      // Trigger online event
      window.dispatchEvent(new Event('online'));

      expect(toast.dismiss).toHaveBeenCalledWith('connection-lost');
    });
  });

  describe('health check', () => {
    it('should return true for successful health check', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { status: 'healthy' } });

      const result = await apiClient.healthCheck();

      expect(result).toBe(true);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health', { timeout: 5000 });
    });

    it('should return false for failed health check', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Health check failed'));

      const result = await apiClient.healthCheck();

      expect(result).toBe(false);
    });
  });

  describe('connection status', () => {
    it('should track connection status', () => {
      expect(apiClient.getConnectionStatus()).toBe(true);
    });

    it('should update connection status on error', async () => {
      const networkError = {
        code: 'NETWORK_ERROR',
        message: 'Network Error',
        config: { headers: { 'X-Request-ID': 'test-id' } },
      };

      // Get the error interceptor
      const calls = mockAxiosInstance.interceptors.response.use.mock.calls;
      const errorInterceptor = calls[0][1];

      await errorInterceptor(networkError);

      // Connection status should be updated to false
      expect(apiClient.getConnectionStatus()).toBe(false);
    });
  });

  describe('client instance access', () => {
    it('should provide access to underlying axios instance', () => {
      const client = apiClient.getClient();
      expect(client).toBe(mockAxiosInstance);
    });
  });

  describe('error context handling', () => {
    it('should pass error context to error handler', async () => {
      const { errorHandler } = require('../../utils/errorHandling');
      const error = new Error('Test error');
      
      mockAxiosInstance.get.mockRejectedValue(error);

      try {
        await apiClient.get('/test', {}, { 
          context: { 
            component: 'TestComponent', 
            action: 'test_action' 
          } 
        });
      } catch (e) {
        // Expected to throw
      }

      expect(errorHandler.handleAPIError).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          component: 'TestComponent',
          action: 'test_action',
        })
      );
    });
  });
});