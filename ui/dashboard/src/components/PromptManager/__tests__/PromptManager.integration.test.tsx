import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { PromptManagerView } from '../PromptManagerView';
import { theme } from '../../../theme';
import * as promptService from '../../../services/PromptService';

// Mock the services
jest.mock('../../../services/PromptService');

// Mock data
const mockPrompts = {
  items: [
    {
      id: '1',
      name: 'Test Prompt',
      description: 'A test prompt',
      content: 'This is a test prompt: {{variable}}',
      tags: ['test'],
      task_type: 'completion',
      status: 'active',
      version: '1.0.0',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      author: 'test-user',
      usage_count: 5,
      success_rate: 95.5,
      avg_response_time: 150
    }
  ],
  total: 1,
  page: 1,
  limit: 10,
  pages: 1
};

const mockPrompt = {
  id: '1',
  name: 'Test Prompt',
  description: 'A test prompt',
  content: 'This is a test prompt: {{variable}}',
  tags: ['test'],
  task_type: 'completion',
  status: 'active',
  version: '1.0.0',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  author: 'test-user',
  usage_count: 5,
  success_rate: 95.5,
  avg_response_time: 150,
  version_info: {
    id: 'v1',
    prompt_id: '1',
    version: '1.0.0',
    content_snapshot: {},
    created_at: '2024-01-01T00:00:00Z',
    created_by: 'test-user',
    is_active: true,
    tags: ['test']
  },
  messages: [],
  input_variables: {},
  model_provider: 'openai',
  model_name: 'gpt-3.5-turbo',
  parameters: {}
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PromptManager Integration', () => {
  const mockPromptService = jest.mocked(promptService);
  const user = userEvent.setup();

  beforeAll(() => {
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/',
        search: '',
        hash: '',
        href: 'http://localhost:3000',
      },
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset any mocked localStorage
    localStorage.clear();
  });

  it('renders prompt list view by default', async () => {
    mockPromptService.getPromptList.mockResolvedValue(mockPrompts);

    render(
      <TestWrapper>
        <PromptManagerView />
      </TestWrapper>
    );

    // Should show prompt list
    expect(await screen.findByText('Test Prompt')).toBeInTheDocument();
    expect(screen.getByText('A test prompt')).toBeInTheDocument();
  });

  it('navigates to prompt editor when create button is clicked', async () => {
    mockPromptService.getPromptList.mockResolvedValue(mockPrompts);

    render(
      <TestWrapper>
        <PromptManagerView />
      </TestWrapper>
    );

    // Click create button
    const createButton = await screen.findByText(/create prompt/i);
    await user.click(createButton);

    // Should show editor view
    expect(await screen.findByText(/create new prompt/i)).toBeInTheDocument();
  });

  it('navigates to prompt editor when prompt is clicked', async () => {
    mockPromptService.getPromptList.mockResolvedValue(mockPrompts);
    mockPromptService.getPrompt.mockImplementation((id) =>
      Promise.resolve({ ...mockPrompt, id })
    );

    render(
      <TestWrapper>
        <PromptManagerView />
      </TestWrapper>
    );

    // Click on a prompt
    const promptCard = await screen.findByText('Test Prompt');
    await user.click(promptCard);

    // Should show editor view
    expect(await screen.findByText(/edit prompt/i)).toBeInTheDocument();
  });

  it('can navigate back to prompt list from editor', async () => {
    mockPromptService.getPromptList.mockResolvedValue(mockPrompts);
    mockPromptService.getPrompt.mockResolvedValue(mockPrompt);

    render(
      <TestWrapper>
        <PromptManagerView />
      </TestWrapper>
    );

    // Navigate to editor
    const promptCard = await screen.findByText('Test Prompt');
    await user.click(promptCard);
    expect(await screen.findByText(/edit prompt/i)).toBeInTheDocument();

    // Click back button
    const backButton = screen.getByLabelText(/back/i);
    await user.click(backButton);

    // Should be back to list view
    expect(await screen.findByText('Test Prompt')).toBeInTheDocument();
  });
});