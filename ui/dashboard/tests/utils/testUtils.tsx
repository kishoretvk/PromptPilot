// Comprehensive Test Utilities
// Provides reusable testing utilities, mocks, and helpers

import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { ToastContainer } from 'react-toastify';
import { theme } from '../../src/theme/theme';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

// Mock data generators
export const mockPrompt = {
  id: 'test-prompt-1',
  name: 'Test Prompt',
  description: 'A test prompt for unit testing',
  task_type: 'text_generation',
  tags: ['test', 'mock'],
  messages: [
    { role: 'system', content: 'You are a helpful assistant', priority: 1 },
    { role: 'user', content: 'Generate text about {topic}', priority: 2 }
  ],
  input_variables: {
    topic: { type: 'string', required: true, description: 'The topic to write about' }
  },
  model_name: 'gpt-3.5-turbo',
  parameters: { temperature: 0.7, max_tokens: 500 },
  status: 'published',
  version: '1.0.0',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  creator_id: 'test-user-1'
};

export const mockPipeline = {
  id: 'test-pipeline-1',
  name: 'Test Pipeline',
  description: 'A test pipeline for unit testing',
  status: 'draft',
  steps: [
    {
      id: 'step-1',
      name: 'Initial Prompt',
      step_type: 'prompt',
      prompt_id: mockPrompt.id,
      configuration: {},
      position: { x: 100, y: 100 }
    }
  ],
  connections: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  creator_id: 'test-user-1'
};

export const mockUser = {
  id: 'test-user-1',
  username: 'testuser',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z'
};

export const mockApiKey = {
  id: 'test-key-1',
  name: 'Test API Key',
  key_prefix: 'sk-test',
  permissions: ['read', 'write'],
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  expires_at: '2025-01-01T00:00:00Z',
  last_used: null,
  usage_count: 0
};

export const mockSettings = {
  theme: {
    mode: 'light',
    primary_color: '#1976d2'
  },
  notifications: {
    email_notifications: true,
    push_notifications: false
  },
  security: {
    require_api_key: false,
    rate_limit_per_minute: 100
  },
  integrations: []
};

export const mockAnalytics = {
  usage: {
    total_requests: 1250,
    successful_requests: 1180,
    failed_requests: 70,
    total_tokens: 50000,
    success_rate: 94.4,
    average_response_time: 1.2
  },
  performance: {
    avg_response_time: 1.2,
    p95_response_time: 2.8,
    p99_response_time: 5.1,
    error_rate: 5.6,
    throughput: 45.2
  },
  costs: {
    total_cost: 25.67,
    cost_per_request: 0.021,
    cost_breakdown: {
      'gpt-3.5-turbo': 15.43,
      'gpt-4': 10.24
    }
  }
};

// Test wrapper components
interface TestProvidersProps {
  children: ReactNode;
  queryClient?: QueryClient;
  initialRoute?: string;
}

export const TestProviders: React.FC<TestProvidersProps> = ({
  children,
  queryClient,
  initialRoute = '/'
}) => {
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <ToastContainer />
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialRoute?: string;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } => {
  const { queryClient, initialRoute, ...renderOptions } = options;
  
  const testQueryClient = queryClient || new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper: React.FC<{ children: ReactNode }> = ({ children }) => (
    <TestProviders queryClient={testQueryClient} initialRoute={initialRoute}>
      {children}
    </TestProviders>
  );

  const result = render(ui, { wrapper: Wrapper, ...renderOptions });
  
  return {
    ...result,
    queryClient: testQueryClient,
  };
};

// Mock API responses
export const createMockApiResponse = <T,>(data: T, success = true) => ({
  data,
  success,
  message: success ? 'Operation successful' : 'Operation failed',
  timestamp: new Date().toISOString(),
});

export const createMockPaginatedResponse = <T,>(
  items: T[],
  page = 1,
  limit = 20,
  total?: number
) => ({
  items,
  total: total || items.length,
  page,
  limit,
  pages: Math.ceil((total || items.length) / limit),
});

// Mock hooks
export const mockUseQuery = (data: any, options: any = {}) => ({
  data,
  isLoading: false,
  isPending: false,
  isError: false,
  error: null,
  isSuccess: true,
  status: 'success',
  refetch: jest.fn(),
  ...options,
});

export const mockUseMutation = (options: any = {}) => ({
  mutate: jest.fn(),
  mutateAsync: jest.fn(),
  isLoading: false,
  isPending: false,
  isError: false,
  error: null,
  isSuccess: false,
  status: 'idle',
  reset: jest.fn(),
  ...options,
});

// Event simulation utilities
export const createMockEvent = (type: string, properties: any = {}) => ({
  type,
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: {
    value: '',
    name: '',
    checked: false,
    ...properties.target,
  },
  currentTarget: {
    value: '',
    name: '',
    checked: false,
    ...properties.currentTarget,
  },
  ...properties,
});

export const createMockFile = (
  name = 'test.txt',
  content = 'test content',
  type = 'text/plain'
) => {
  const file = new File([content], name, { type });
  return file;
};

// Form testing utilities
export const fillForm = async (
  getByLabelText: any,
  formData: Record<string, string>
) => {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();

  for (const [label, value] of Object.entries(formData)) {
    const input = getByLabelText(label);
    await user.clear(input);
    await user.type(input, value);
  }
};

export const submitForm = async (getByRole: any, buttonText = 'Submit') => {
  const { userEvent } = await import('@testing-library/user-event');
  const user = userEvent.setup();
  
  const submitButton = getByRole('button', { name: buttonText });
  await user.click(submitButton);
};

// Async utilities
export const waitForLoadingToFinish = async (getByTestId: any) => {
  const { waitForElementToBeRemoved } = await import('@testing-library/react');
  
  try {
    await waitForElementToBeRemoved(() => getByTestId('loading'), {
      timeout: 3000
    });
  } catch (error) {
    // Loading indicator might not be present
  }
};

export const waitForData = async (queryClient: QueryClient, queryKey: string[]) => {
  const { waitFor } = await import('@testing-library/react');
  
  await waitFor(() => {
    const data = queryClient.getQueryData(queryKey);
    expect(data).toBeDefined();
  });
};

// Component testing utilities
export const expectElementToBeVisible = (element: HTMLElement) => {
  expect(element).toBeInTheDocument();
  expect(element).toBeVisible();
};

export const expectElementToHaveText = (element: HTMLElement, text: string) => {
  expect(element).toBeInTheDocument();
  expect(element).toHaveTextContent(text);
};

export const expectButtonToBeEnabled = (button: HTMLElement) => {
  expect(button).toBeInTheDocument();
  expect(button).toBeEnabled();
};

export const expectButtonToBeDisabled = (button: HTMLElement) => {
  expect(button).toBeInTheDocument();
  expect(button).toBeDisabled();
};

// Mock server utilities
export const createMockServer = () => {
  const { setupServer } = require('msw/node');
  const { rest } = require('msw');
  
  return setupServer(
    // Default handlers
    rest.get('/api/prompts', (req: any, res: any, ctx: any) => {
      return res(ctx.json(createMockPaginatedResponse([mockPrompt])));
    }),
    
    rest.get('/api/prompts/:id', (req: any, res: any, ctx: any) => {
      return res(ctx.json(createMockApiResponse(mockPrompt)));
    }),
    
    rest.get('/api/pipelines', (req: any, res: any, ctx: any) => {
      return res(ctx.json(createMockPaginatedResponse([mockPipeline])));
    }),
    
    rest.get('/api/analytics/usage', (req: any, res: any, ctx: any) => {
      return res(ctx.json(createMockApiResponse(mockAnalytics.usage)));
    }),
    
    rest.get('/api/settings', (req: any, res: any, ctx: any) => {
      return res(ctx.json(createMockApiResponse(mockSettings)));
    }),
  );
};

// Performance testing utilities
export const measureRenderTime = async (renderFn: () => void) => {
  const startTime = performance.now();
  renderFn();
  const endTime = performance.now();
  return endTime - startTime;
};

export const expectFastRender = async (renderFn: () => void, maxTime = 100) => {
  const renderTime = await measureRenderTime(renderFn);
  expect(renderTime).toBeLessThan(maxTime);
};

// Accessibility testing utilities
export const expectNoAccessibilityViolations = async (container: HTMLElement) => {
  const { axe, toHaveNoViolations } = await import('jest-axe');
  expect.extend(toHaveNoViolations);
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Export commonly used testing library functions for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';