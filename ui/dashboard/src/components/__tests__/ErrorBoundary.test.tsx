// ErrorBoundary Component Tests
// Comprehensive tests for error boundary functionality

import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, expectElementToBeVisible, expectElementToHaveText } from '../../utils/testUtils';
import ErrorBoundary from '../../../src/components/ErrorBoundary';

// Mock error component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; errorMessage?: string }> = ({ 
  shouldThrow = true, 
  errorMessage = 'Test error' 
}) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Working component for testing
const WorkingComponent: React.FC = () => {
  return <div data-testid="working-component">Working component</div>;
};

describe('ErrorBoundary', () => {
  // Mock console.error to avoid noise in test output
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when no error occurs', () => {
    it('should render children normally', () => {
      renderWithProviders(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expectElementToBeVisible(screen.getByTestId('working-component'));
    });

    it('should not show error UI', () => {
      renderWithProviders(
        <ErrorBoundary>
          <WorkingComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Application Error')).not.toBeInTheDocument();
      expect(screen.queryByText('Loading Issue')).not.toBeInTheDocument();
    });
  });

  describe('when an error occurs', () => {
    it('should catch and display error', () => {
      renderWithProviders(
        <ErrorBoundary componentName=\"TestComponent\">
          <ThrowError errorMessage=\"Test error message\" />
        </ErrorBoundary>
      );

      expectElementToBeVisible(screen.getByText('Application Error'));
      expectElementToHaveText(
        screen.getByText(/An unexpected error occurred in the application/),
        'An unexpected error occurred in the application.'
      );
    });

    it('should show bug report icon', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('BugReportIcon')).toBeInTheDocument();
    });

    it('should display component name in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderWithProviders(
        <ErrorBoundary componentName=\"TestComponent\">
          <ThrowError />
        </ErrorBoundary>
      );

      // Show details button should be visible in development
      expect(screen.getByText('Show Details')).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle ChunkLoadError as warning', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError errorMessage=\"ChunkLoadError: Loading chunk failed\" />
        </ErrorBoundary>
      );

      expectElementToBeVisible(screen.getByText('Loading Issue'));
      expectElementToHaveText(
        screen.getByRole('alert'),
        'Failed to load application components. This may be due to a network issue or an updated version being deployed.'
      );
    });

    it('should handle network errors appropriately', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError errorMessage=\"Network Error: Failed to fetch\" />
        </ErrorBoundary>
      );

      expectElementToHaveText(
        screen.getByRole('alert'),
        'Unable to connect to the server. Please check your internet connection.'
      );
    });
  });

  describe('error recovery actions', () => {
    it('should show Try Again button with remaining attempts', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByText(/Try Again.*3 left/);
      expectElementToBeVisible(tryAgainButton);
      expect(tryAgainButton).toBeEnabled();
    });

    it('should show Refresh Page button', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const refreshButton = screen.getByText('Refresh Page');
      expectElementToBeVisible(refreshButton);
      expect(refreshButton).toBeEnabled();
    });

    it('should retry when Try Again is clicked', async () => {
      const user = userEvent.setup();
      let shouldThrow = true;
      
      const RetryableComponent: React.FC = () => {
        if (shouldThrow) {
          shouldThrow = false; // Stop throwing after first attempt
          throw new Error('Retryable error');
        }
        return <div data-testid=\"success-component\">Success!</div>;
      };

      renderWithProviders(
        <ErrorBoundary>
          <RetryableComponent />
        </ErrorBoundary>
      );

      // Error should be displayed initially
      expect(screen.getByText('Application Error')).toBeInTheDocument();

      // Click Try Again
      const tryAgainButton = screen.getByText(/Try Again/);
      await user.click(tryAgainButton);

      // Should show success component after retry
      await waitFor(() => {
        expect(screen.getByTestId('success-component')).toBeInTheDocument();
      });
    });

    it('should decrease retry count after each attempt', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Initial state: 3 retries left
      expect(screen.getByText(/Try Again.*3 left/)).toBeInTheDocument();

      // Click Try Again
      await user.click(screen.getByText(/Try Again/));

      // Should show 2 retries left
      expect(screen.getByText(/Try Again.*2 left/)).toBeInTheDocument();
    });

    it('should hide Try Again button after max retries', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Exhaust all retry attempts
      for (let i = 0; i < 3; i++) {
        const tryAgainButton = screen.queryByText(/Try Again/);
        if (tryAgainButton) {
          await user.click(tryAgainButton);
        }
      }

      // Try Again button should not be visible after max retries
      expect(screen.queryByText(/Try Again/)).not.toBeInTheDocument();
      
      // But Refresh Page should still be available
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
    });
  });

  describe('development mode features', () => {
    const originalEnv = process.env.NODE_ENV;

    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should show Show Details button in development', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Show Details')).toBeInTheDocument();
    });

    it('should toggle error details when Show/Hide Details is clicked', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <ErrorBoundary componentName=\"TestComponent\">
          <ThrowError errorMessage=\"Detailed test error\" />
        </ErrorBoundary>
      );

      // Details should not be visible initially
      expect(screen.queryByText('Error Details (Development Mode)')).not.toBeInTheDocument();
      
      // Click Show Details
      await user.click(screen.getByText('Show Details'));
      
      // Details should be visible
      expect(screen.getByText('Error Details (Development Mode)')).toBeInTheDocument();
      expect(screen.getByText('TestComponent')).toBeInTheDocument();
      expect(screen.getByText('Detailed test error')).toBeInTheDocument();
      
      // Button should change to Hide Details
      expect(screen.getByText('Hide Details')).toBeInTheDocument();
      
      // Click Hide Details
      await user.click(screen.getByText('Hide Details'));
      
      // Details should be hidden again
      expect(screen.queryByText('Error Details (Development Mode)')).not.toBeInTheDocument();
    });

    it('should display stack trace in development', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      await user.click(screen.getByText('Show Details'));
      
      expect(screen.getByText('Stack Trace:')).toBeInTheDocument();
    });
  });

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const CustomFallback = () => <div data-testid=\"custom-fallback\">Custom Error UI</div>;
      
      renderWithProviders(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError />
        </ErrorBoundary>
      );

      expectElementToBeVisible(screen.getByTestId('custom-fallback'));
      expect(screen.queryByText('Application Error')).not.toBeInTheDocument();
    });
  });

  describe('onError callback', () => {
    it('should call onError callback when error occurs', () => {
      const onError = jest.fn();
      
      renderWithProviders(
        <ErrorBoundary onError={onError}>
          <ThrowError errorMessage=\"Callback test error\" />
        </ErrorBoundary>
      );

      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Callback test error'
        }),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should handle onError callback errors gracefully', () => {
      const faultyCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      
      renderWithProviders(
        <ErrorBoundary onError={faultyCallback}>
          <ThrowError />
        </ErrorBoundary>
      );

      // Should still show error UI despite callback error
      expect(screen.getByText('Application Error')).toBeInTheDocument();
      expect(faultyCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      const tryAgainButton = screen.getByText(/Try Again/);
      expect(tryAgainButton).toHaveAttribute('type', 'button');
      
      const refreshButton = screen.getByText('Refresh Page');
      expect(refreshButton).toHaveAttribute('type', 'button');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Tab to Try Again button
      await user.tab();
      expect(screen.getByText(/Try Again/)).toHaveFocus();
      
      // Tab to Refresh Page button
      await user.tab();
      expect(screen.getByText('Refresh Page')).toHaveFocus();
    });
  });
});