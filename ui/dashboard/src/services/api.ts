import axios, { AxiosError, AxiosRequestConfig, AxiosResponse, AxiosInstance } from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse } from '../types';
import { errorHandler } from '../utils/errorHandling';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_TIMEOUT = 30000;

class ApiClient {
  private client: AxiosInstance;
  private isOnline: boolean = navigator.onLine;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.setupConnectionMonitoring();
  }

  private setupInterceptors(): void {
    // Enhanced request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request tracking headers
        const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        config.headers['X-Request-ID'] = requestId;
        config.headers['X-Client-Version'] = process.env.REACT_APP_VERSION || '1.0.0';
        config.headers['X-Client-Platform'] = 'web';

        // Log outgoing requests in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 API Request [${requestId}]:`, {
            method: config.method?.toUpperCase(),
            url: config.url,
            data: config.data
          });
        }

        return config;
      },
      (error) => {
        errorHandler.logError(
          errorHandler.createError(
            'Request configuration failed',
            'REQUEST_CONFIG_ERROR',
            error
          ),
          'error',
          { component: 'ApiClient', action: 'request_interceptor' }
        );
        return Promise.reject(error);
      }
    );

    // Enhanced response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log successful responses in development
        if (process.env.NODE_ENV === 'development') {
          const requestId = response.config.headers['X-Request-ID'];
          console.log(`✅ API Response [${requestId}]:`, {
            status: response.status,
            url: response.config.url,
            data: response.data
          });
        }

        // Reset connection status on successful response
        if (!this.isOnline) {
          this.isOnline = true;
          this.reconnectAttempts = 0;
          toast.success('Connection restored!', {
            toastId: 'connection-restored',
            autoClose: 3000
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        const requestId = error.config?.headers?.['X-Request-ID'] as string;
        
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ API Error [${requestId}]:`, {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message,
            data: error.response?.data
          });
        }

        // Handle the error with enhanced error handling
        await this.handleApiError(error);
        
        return Promise.reject(error);
      }
    );
  }

  private async handleApiError(error: AxiosError): Promise<void> {
    const status = error.response?.status;
    const data = error.response?.data as any;
    
    // Handle authentication errors
    if (status === 401) {
      localStorage.removeItem('auth_token');
      sessionStorage.clear();
      
      toast.error('Your session has expired. Please log in again.', {
        toastId: 'auth-expired'
      });
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      return;
    }
    
    // Handle rate limiting
    if (status === 429) {
      const retryAfter = error.response?.headers['retry-after'];
      const message = retryAfter 
        ? `Too many requests. Please wait ${retryAfter} seconds before trying again.`
        : 'Too many requests. Please wait a moment before trying again.';
      
      toast.warning(message, {
        toastId: 'rate-limit',
        autoClose: 8000
      });
      return;
    }
    
    // Handle server errors
    if (status && status >= 500) {
      toast.error('Server error occurred. Our team has been notified.', {
        toastId: 'server-error'
      });
      return;
    }
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      this.isOnline = false;
      toast.error('Unable to connect to server. Please check your internet connection.', {
        toastId: 'network-error'
      });
      this.attemptReconnection();
      return;
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. Please try again.', {
        toastId: 'timeout-error'
      });
      return;
    }
    
    // Log error for monitoring
    errorHandler.handleAPIError(error, {
      component: 'ApiClient',
      action: 'api_request'
    });
  }

  private setupConnectionMonitoring(): void {
    window.addEventListener('online', () => {
      toast.dismiss('connection-lost');
      this.checkConnection();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast.warning('You are currently offline. Some features may not be available.', {
        toastId: 'offline-warning',
        autoClose: false
      });
    });
  }

  private async checkConnection(): Promise<void> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      
      if (!this.isOnline) {
        this.isOnline = true;
        this.reconnectAttempts = 0;
        toast.success('Connection restored!', {
          toastId: 'connection-restored',
          autoClose: 3000
        });
      }
    } catch (error) {
      if (this.isOnline) {
        this.isOnline = false;
        toast.error('Connection lost. Attempting to reconnect...', {
          toastId: 'connection-lost',
          autoClose: false
        });
      }
      
      this.attemptReconnection();
    }
  }

  private attemptReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.checkConnection();
      }, 5000 * this.reconnectAttempts); // Exponential backoff
    } else {
      toast.error('Unable to reconnect to server. Please refresh the page.', {
        toastId: 'reconnect-failed',
        autoClose: false
      });
    }
  }

  // Generic API call function
  private async apiCall<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await axios({
        method,
        url: `${API_BASE_URL}${url}`,
        data,
        ...config,
      });
      return response.data;
    } catch (error) {
      errorHandler.handleAPIError(error as AxiosError, {
        component: 'ApiClient',
        action: 'api_call'
      });
      throw error;
    }
  }

  // Enhanced API methods with retry capability
  public async get<T>(url: string, params?: any, options?: { retries?: number; context?: { component?: string; action?: string } }): Promise<ApiResponse<T>> {
    const { retries = 0, context } = options || {};
    
    try {
      const response = await this.client.get<ApiResponse<T>>(url, { params });
      return response.data;
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error as AxiosError)) {
        await this.delay(1000 * (4 - retries)); // Exponential backoff
        return this.get<T>(url, params, { retries: retries - 1, context });
      }
      
      errorHandler.handleAPIError(error as AxiosError, context || {
        component: 'ApiClient',
        action: 'get_request'
      });
      throw error;
    }
  }

  public async post<T>(url: string, data?: any, options?: { retries?: number; context?: { component?: string; action?: string } }): Promise<ApiResponse<T>> {
    const { retries = 0, context } = options || {};
    
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error as AxiosError)) {
        await this.delay(1000 * (4 - retries));
        return this.post<T>(url, data, { retries: retries - 1, context });
      }
      
      errorHandler.handleAPIError(error as AxiosError, context || {
        component: 'ApiClient',
        action: 'post_request'
      });
      throw error;
    }
  }

  public async put<T>(url: string, data?: any, options?: { retries?: number; context?: { component?: string; action?: string } }): Promise<ApiResponse<T>> {
    const { retries = 0, context } = options || {};
    
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error as AxiosError)) {
        await this.delay(1000 * (4 - retries));
        return this.put<T>(url, data, { retries: retries - 1, context });
      }
      
      errorHandler.handleAPIError(error as AxiosError, context || {
        component: 'ApiClient',
        action: 'put_request'
      });
      throw error;
    }
  }

  public async delete<T>(url: string, options?: { retries?: number; context?: { component?: string; action?: string } }): Promise<ApiResponse<T>> {
    const { retries = 0, context } = options || {};
    
    try {
      const response = await this.client.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error as AxiosError)) {
        await this.delay(1000 * (4 - retries));
        return this.delete<T>(url, { retries: retries - 1, context });
      }
      
      errorHandler.handleAPIError(error as AxiosError, context || {
        component: 'ApiClient',
        action: 'delete_request'
      });
      throw error;
    }
  }

  public async patch<T>(url: string, data?: any, options?: { retries?: number; context?: { component?: string; action?: string } }): Promise<ApiResponse<T>> {
    const { retries = 0, context } = options || {};
    
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      if (retries > 0 && this.shouldRetry(error as AxiosError)) {
        await this.delay(1000 * (4 - retries));
        return this.patch<T>(url, data, { retries: retries - 1, context });
      }
      
      errorHandler.handleAPIError(error as AxiosError, context || {
        component: 'ApiClient',
        action: 'patch_request'
      });
      throw error;
    }
  }

  // Enhanced upload method with progress tracking
  public async upload<T>(
    url: string, 
    formData: FormData, 
    onProgress?: (progress: number) => void,
    options?: { context?: { component?: string; action?: string } }
  ): Promise<ApiResponse<T>> {
    const { context } = options || {};
    
    try {
      const response = await this.client.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });
      return response.data;
    } catch (error) {
      errorHandler.handleAPIError(error as AxiosError, context || {
        component: 'ApiClient',
        action: 'upload_request'
      });
      throw error;
    }
  }

  // Enhanced download method with better error handling
  public async download(
    url: string, 
    filename?: string,
    options?: { context?: { component?: string; action?: string } }
  ): Promise<Blob> {
    const { context } = options || {};
    
    try {
      const response = await this.client.get(url, {
        responseType: 'blob',
      });

      // Create download link
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      return blob;
    } catch (error) {
      errorHandler.handleAPIError(error as AxiosError, context || {
        component: 'ApiClient',
        action: 'download_request'
      });
      throw error;
    }
  }

  // Utility methods
  private shouldRetry(error: AxiosError): boolean {
    // Only retry on network errors, timeouts, or 5xx server errors
    return (
      !error.response || // Network error
      error.code === 'ECONNABORTED' || // Timeout
      (error.response.status >= 500 && error.response.status < 600) // Server error
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health check method
  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get connection status
  public getConnectionStatus(): boolean {
    return this.isOnline;
  }

  // Get client instance for advanced usage
  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();
export default apiClient;