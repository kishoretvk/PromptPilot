// Enhanced Error Handling Utilities for React Frontend
// Provides comprehensive error handling, logging, and user feedback

import { toast } from 'react-toastify';

export interface AppError extends Error {
  code?: string;
  status?: number;
  details?: any;
  timestamp?: string;
  requestId?: string;
  context?: ErrorContext;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorLog {
  error: AppError;
  level: 'error' | 'warning' | 'info';
  timestamp: string;
  context: ErrorContext;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLogs: ErrorLog[] = [];
  private maxLogSize = 1000;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.logError(
        this.createError('Unhandled Promise Rejection', 'UNHANDLED_REJECTION', event.reason),
        'error',
        { component: 'Global', action: 'unhandledrejection' }
      );
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      console.error('JavaScript error:', event.error);
      this.logError(
        this.createError(event.message, 'JAVASCRIPT_ERROR', {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }),
        'error',
        { component: 'Global', action: 'javascript_error' }
      );
    });
  }

  public createError(
    message: string,
    code?: string,
    details?: any,
    status?: number
  ): AppError {
    const error = new Error(message) as AppError;
    error.code = code;
    error.status = status;
    error.details = details;
    error.timestamp = new Date().toISOString();
    return error;
  }

  public logError(error: AppError, level: 'error' | 'warning' | 'info' = 'error', context: ErrorContext = {}): void {
    const errorLog: ErrorLog = {
      error,
      level,
      timestamp: new Date().toISOString(),
      context: {
        ...context,
        userId: this.getCurrentUserId(),
        sessionId: this.getSessionId()
      },
      stackTrace: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Suppress logging/reporting for expected 404 Not Found cases to avoid noise.
    // Keep a development-only debug line so developers can still see the occurrence.
    if (error.status === 404 || error.code === 'NOT_FOUND') {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Suppressed Application Error (404):', {
          message: error.message,
          code: error.code,
          status: error.status,
          context: errorLog.context,
          timestamp: errorLog.timestamp
        });
      }
      return;
    }

    // Add to local log
    this.errorLogs.unshift(errorLog);
    if (this.errorLogs.length > this.maxLogSize) {
      this.errorLogs = this.errorLogs.slice(0, this.maxLogSize);
    }

    // Console logging with proper formatting
    const logMethod = level === 'error' ? console.error : level === 'warning' ? console.warn : console.info;
    logMethod('Application Error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      context: errorLog.context,
      timestamp: errorLog.timestamp
    });

    // Send to backend logging service (if available)
    this.sendErrorToBackend(errorLog);

    // Show user-friendly notification based on error type
    this.showUserNotification(error, level);
  }

  private async sendErrorToBackend(errorLog: ErrorLog): Promise<void> {
    try {
      // Only send important errors to backend to avoid spam
      if (errorLog.level === 'error' || errorLog.error.status && errorLog.error.status >= 500) {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
        await fetch(`${apiUrl}/api/logs/frontend-error`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            level: errorLog.level,
            message: errorLog.error.message,
            code: errorLog.error.code,
            status: errorLog.error.status,
            details: errorLog.error.details,
            context: errorLog.context,
            stackTrace: errorLog.stackTrace,
            userAgent: errorLog.userAgent,
            url: errorLog.url,
            timestamp: errorLog.timestamp
          })
        });
      }
    } catch (e) {
      // Silently fail - don't create infinite loop
      console.warn('Failed to send error to backend:', e);
    }
  }

  private showUserNotification(error: AppError, level: 'error' | 'warning' | 'info'): void {
    const message = this.getUserFriendlyMessage(error);
    
    switch (level) {
      case 'error':
        toast.error(message, {
          position: 'top-right',
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
        break;
      case 'warning':
        toast.warning(message, {
          position: 'top-right',
          autoClose: 5000,
        });
        break;
      case 'info':
        toast.info(message, {
          position: 'top-right',
          autoClose: 3000,
        });
        break;
    }
  }

  private getUserFriendlyMessage(error: AppError): string {
    // Map technical errors to user-friendly messages
    const errorMessages: Record<string, string> = {
      'NETWORK_ERROR': 'Unable to connect to server. Please check your internet connection.',
      'VALIDATION_ERROR': 'Please check your input and try again.',
      'AUTHENTICATION_ERROR': 'Your session has expired. Please log in again.',
      'AUTHORIZATION_ERROR': 'You do not have permission to perform this action.',
      'NOT_FOUND': 'The requested resource was not found.',
      'RATE_LIMITED': 'Too many requests. Please wait a moment and try again.',
      'SERVER_ERROR': 'A server error occurred. Our team has been notified.',
      'TIMEOUT_ERROR': 'The request timed out. Please try again.',
    };

    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }

    // HTTP status code based messages
    if (error.status) {
      switch (Math.floor(error.status / 100)) {
        case 4:
          return 'There was a problem with your request. Please check your input and try again.';
        case 5:
          return 'A server error occurred. Please try again in a few moments.';
      }
    }

    // Fallback to original message if it's user-friendly
    if (error.message && error.message.length < 100 && !error.message.includes('Error:')) {
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  private getCurrentUserId(): string | undefined {
    // Get from localStorage, context, or wherever user info is stored
    return localStorage.getItem('userId') || undefined;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  public getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  public clearErrorLogs(): void {
    this.errorLogs = [];
  }

  public handleAPIError(error: any, context: ErrorContext = {}): AppError {
    let appError: AppError;

    if (error.response) {
      // Axios error with response
      const { status, data } = error.response;
      appError = this.createError(
        data?.message || data?.detail || 'API request failed',
        this.getErrorCodeFromStatus(status),
        data,
        status
      );
      appError.requestId = data?.request_id;
    } else if (error.request) {
      // Network error
      appError = this.createError(
        'Network error occurred',
        'NETWORK_ERROR',
        { originalError: error.message }
      );
    } else {
      // Other error
      appError = this.createError(
        error.message || 'Unknown error occurred',
        'UNKNOWN_ERROR',
        { originalError: error }
      );
    }

    // Suppress noisy 404 "Not Found" errors from being treated as application errors.
    // Let callers handle 404s when appropriate. In development keep a debug log.
    if (appError.status === 404) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Suppressed API 404 error (not reported):', {
          message: appError.message,
          code: appError.code,
          status: appError.status,
          context
        });
      }
      return appError;
    }

    this.logError(appError, 'error', context);
    return appError;
  }

  private getErrorCodeFromStatus(status: number): string {
    switch (status) {
      case 400: return 'VALIDATION_ERROR';
      case 401: return 'AUTHENTICATION_ERROR';
      case 403: return 'AUTHORIZATION_ERROR';
      case 404: return 'NOT_FOUND';
      case 408: return 'TIMEOUT_ERROR';
      case 409: return 'CONFLICT_ERROR';
      case 422: return 'VALIDATION_ERROR';
      case 429: return 'RATE_LIMITED';
      case 500: return 'SERVER_ERROR';
      case 502: return 'BAD_GATEWAY';
      case 503: return 'SERVICE_UNAVAILABLE';
      case 504: return 'GATEWAY_TIMEOUT';
      default: return status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
    }
  }
}

// Utility functions for components
export const errorHandler = ErrorHandler.getInstance();

export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context: ErrorContext = {}
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle promises
      if (result && typeof result.catch === 'function') {
        return result.catch((error: any) => {
          // Suppress reporting for 404 responses — let callers decide how to handle Not Found
          if (error?.response?.status === 404) {
            if (process.env.NODE_ENV === 'development') {
              console.debug('withErrorHandling suppressed 404:', { url: error.config?.url, status: 404, context });
            }
            throw error;
          }

          errorHandler.handleAPIError(error, context);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      errorHandler.logError(
        errorHandler.createError(
          error instanceof Error ? error.message : 'Unknown error',
          'FUNCTION_ERROR',
          { functionName: fn.name, args }
        ),
        'error',
        context
      );
      throw error;
    }
  }) as T;
};

export const reportError = (
  message: string,
  code?: string,
  context?: ErrorContext,
  details?: any
): void => {
  const error = errorHandler.createError(message, code, details);
  errorHandler.logError(error, 'error', context);
};

export const reportWarning = (
  message: string,
  context?: ErrorContext,
  details?: any
): void => {
  const error = errorHandler.createError(message, 'WARNING', details);
  errorHandler.logError(error, 'warning', context);
};

export const reportInfo = (
  message: string,
  context?: ErrorContext,
  details?: any
): void => {
  const error = errorHandler.createError(message, 'INFO', details);
  errorHandler.logError(error, 'info', context);
};

// React Error Boundary helper
export class ErrorBoundary extends Error {
  public component: string;
  public componentStack: string;

  constructor(message: string, component: string, componentStack: string) {
    super(message);
    this.name = 'ErrorBoundary';
    this.component = component;
    this.componentStack = componentStack;
  }
}

export const logError = (error: Error, context?: Record<string, any>) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Application Error:', error);
    if (context) {
      console.error('Error Context:', context);
    }
  }

  errorHandler.logError(
    errorHandler.createError(
      error instanceof Error ? error.message : 'Unknown error',
      'USER_ACTION',
      context
    ),
    'error',
    context
  );
};

export const logErrorBoundaryError = (
  error: Error,
  errorInfo: { componentStack: string },
  component: string
): void => {
  const boundaryError = new ErrorBoundary(
    error.message,
    component,
    errorInfo.componentStack
  );

  errorHandler.logError(
    errorHandler.createError(
      `React Error Boundary: ${error.message}`,
      'REACT_ERROR_BOUNDARY',
      {
        component,
        componentStack: errorInfo.componentStack,
        originalError: error.message,
        stack: error.stack
      }
    ),
    'error',
    { component, action: 'error_boundary' }
  );
};

export default errorHandler;
