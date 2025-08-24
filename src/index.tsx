import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, CssBaseline, StyledEngineProvider } from '@mui/material';
// import { ToastContainer } from 'react-toastify';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import { lightPromptPilotTheme } from './theme/theme';
import reportWebVitals from './reportWebVitals';
import ErrorFallback from './components/common/ErrorFallback';
// import 'react-toastify/dist/ReactToastify.css';
import './index.css';

// Configure React Query client with production-ready settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Error handler for React Error Boundary
function handleError(error: Error, errorInfo: { componentStack?: string | null }) {
  console.error('Application Error:', error);
  console.error('Component Stack:', errorInfo.componentStack);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }
}

// Get root element
const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = ReactDOM.createRoot(container);

// App wrapper with all providers
function AppWithProviders() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={lightPromptPilotTheme}>
          <CssBaseline />
          <QueryClientProvider client={queryClient}>
            <App />
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </QueryClientProvider>
          {/* <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          /> */}
        </ThemeProvider>
      </StyledEngineProvider>
    </ErrorBoundary>
  );
}

root.render(
  <React.StrictMode>
    <AppWithProviders />
  </React.StrictMode>
);

// Performance monitoring
reportWebVitals((metric) => {
  // Log performance metrics
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals:', metric);
  }
  
  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics, DataDog, etc.
    // analytics.track('web_vital', metric);
  }
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
