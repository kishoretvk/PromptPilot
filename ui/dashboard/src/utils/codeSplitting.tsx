// Code Splitting Utilities
import React, { Suspense, ComponentType, lazy } from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

// Loading component for suspense fallbacks
const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    minHeight="200px"
    gap={2}
  >
    <CircularProgress size={40} />
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Enhanced lazy loading wrapper with error boundary
export function lazyWithRetry<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): React.LazyExoticComponent<T> {
  return lazy(() => 
    importFunc().catch((error) => {
      console.error('Failed to load component:', error);
      // Retry mechanism
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          importFunc().then(resolve).catch(reject);
        }, 1000);
      });
    })
  );
}

// HOC for wrapping components with suspense
export function withSuspense<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    );
  };
}

// Preload utility for prefetching components
export function preloadComponent(importFunc: () => Promise<any>) {
  // Start loading the component
  const componentPromise = importFunc();
  
  // Return a function that resolves when component is loaded
  return () => componentPromise;
}

// Route-based code splitting components
export const LazyPromptManager = lazyWithRetry(
  () => import('../components/PromptManager/PromptManager'),
  <LoadingSpinner message="Loading Prompt Manager..." />
);

export const LazyPromptHistory = lazyWithRetry(
  () => import('../components/PromptHistory/PromptHistory'),
  <LoadingSpinner message="Loading Prompt History..." />
);

export const LazyPipelineBuilder = lazyWithRetry(
  () => import('../components/PipelineBuilder/PipelineBuilder'),
  <LoadingSpinner message="Loading Pipeline Builder..." />
);

export const LazyAnalyticsDashboard = lazyWithRetry(
  () => import('../components/Analytics/AnalyticsDashboard'),
  <LoadingSpinner message="Loading Analytics..." />
);

export const LazySettingsIntegrations = lazyWithRetry(
  () => import('../components/Settings/SettingsIntegrations'),
  <LoadingSpinner message="Loading Settings..." />
);

// Preloader for critical components
export const preloadCriticalComponents = () => {
  // Preload components that are likely to be used soon
  preloadComponent(() => import('../components/PromptManager/PromptManager'));
  preloadComponent(() => import('../components/Analytics/AnalyticsDashboard'));
};

// Component for handling loading states
export const ComponentLoader: React.FC<{
  isLoading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingMessage?: string;
}> = ({ isLoading, error, children, loadingMessage }) => {
  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="200px"
        gap={2}
      >
        <Typography variant="h6" color="error">
          Failed to load component
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {error.message}
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message={loadingMessage} />;
  }

  return <>{children}</>;
};

// Progressive loading hook for large datasets
export function useProgressiveLoading<T>(
  data: T[],
  pageSize: number = 20
) {
  const [visibleItems, setVisibleItems] = React.useState<T[]>([]);
  const [currentPage, setCurrentPage] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (data.length === 0) {
      setVisibleItems([]);
      setCurrentPage(0);
      return;
    }

    // Load first page immediately
    setVisibleItems(data.slice(0, pageSize));
    setCurrentPage(1);
  }, [data, pageSize]);

  const loadMore = React.useCallback(() => {
    if (isLoading || visibleItems.length >= data.length) return;

    setIsLoading(true);
    
    // Simulate loading delay for UX
    setTimeout(() => {
      const nextPage = currentPage + 1;
      const newItems = data.slice(0, nextPage * pageSize);
      setVisibleItems(newItems);
      setCurrentPage(nextPage);
      setIsLoading(false);
    }, 300);
  }, [data, currentPage, pageSize, isLoading, visibleItems.length]);

  const hasMore = visibleItems.length < data.length;

  return {
    visibleItems,
    loadMore,
    hasMore,
    isLoading,
  };
}