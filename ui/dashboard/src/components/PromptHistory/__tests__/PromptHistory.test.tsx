/**
 * Test cases for PromptHistory component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PromptHistory from '../PromptHistory';
import * as PromptService from '../../../services/PromptService';

// Mock the PromptService
jest.mock('../../../services/PromptService');

const mockPromptService = PromptService as jest.Mocked<typeof PromptService>;

// Mock theme
jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({
    palette: {
      primary: { main: '#1976d2', contrastText: '#fff' },
      secondary: { main: '#dc004e' },
      warning: { main: '#ff9800' },
      info: { main: '#2196f3' },
      success: { main: '#4caf50' },
      grey: { 500: '#9e9e9e' },
      divider: '#e0e0e0',
      background: { paper: '#fff', default: '#fafafa' },
      action: { selected: '#f5f5f5', hover: '#f5f5f5' },
      text: { primary: '#000', secondary: '#757575' },
    },
  }),
}));

// Mock useMediaQuery
jest.mock('@mui/material/useMediaQuery', () => () => false);

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ id: 'test-prompt-id' }),
  useNavigate: () => jest.fn(),
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

const mockVersions = [
  {
    id: 'v1',
    prompt_id: 'test-prompt-id',
    version: '1.0.0',
    commit_message: 'Initial version',
    content_snapshot: {},
    created_by: 'user1',
    created_at: '2023-01-01T00:00:00Z',
    is_active: true,
    tags: ['stable'],
  },
  {
    id: 'v2',
    prompt_id: 'test-prompt-id',
    version: '1.1.0',
    commit_message: 'Added new features',
    content_snapshot: {},
    created_by: 'user2',
    created_at: '2023-01-02T00:00:00Z',
    is_active: false,
    tags: ['experimental'],
    parent_version_id: 'v1',
  },
];

describe('PromptHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders prompt history with versions', async () => {
    mockPromptService.promptService.getPromptVersions.mockResolvedValue(mockVersions);
    
    renderWithProviders(<PromptHistory promptId="test-prompt-id" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Prompt History')).toBeInTheDocument();
    });
    
    // Check that versions are displayed
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('v1.1.0')).toBeInTheDocument();
    expect(screen.getByText('Initial version')).toBeInTheDocument();
    expect(screen.getByText('Added new features')).toBeInTheDocument();
  });

  it('allows version selection for comparison', async () => {
    mockPromptService.promptService.getPromptVersions.mockResolvedValue(mockVersions);
    mockPromptService.promptService.compareVersions.mockResolvedValue({
      version_a: mockVersions[0],
      version_b: mockVersions[1],
      differences: [],
    });
    
    renderWithProviders(<PromptHistory promptId="test-prompt-id" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Prompt History')).toBeInTheDocument();
    });
    
    // Select two versions
    const versionCards = screen.getAllByRole('button', { name: '' });
    fireEvent.click(versionCards[0]);
    fireEvent.click(versionCards[1]);
    
    // Click compare button
    const compareButton = screen.getByText('Compare Selected (2/2)');
    fireEvent.click(compareButton);
    
    // Check that comparison is called
    await waitFor(() => {
      expect(mockPromptService.promptService.compareVersions).toHaveBeenCalledWith(
        'test-prompt-id',
        'v1',
        'v2'
      );
    });
  });

  it('allows creating a branch from a version', async () => {
    mockPromptService.promptService.getPromptVersions.mockResolvedValue(mockVersions);
    mockPromptService.promptService.createPromptBranch.mockResolvedValue({
      ...mockVersions[0],
      id: 'branch1',
      version: 'branch-feature-test',
    });
    
    renderWithProviders(<PromptHistory promptId="test-prompt-id" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Prompt History')).toBeInTheDocument();
    });
    
    // Click branch button on first version
    const branchButtons = screen.getAllByTitle('Branch');
    fireEvent.click(branchButtons[0]);
    
    // Fill in branch name and create
    const branchNameInput = screen.getByLabelText('Branch Name');
    fireEvent.change(branchNameInput, { target: { value: 'feature-test' } });
    
    const createBranchButton = screen.getByText('Create Branch');
    fireEvent.click(createBranchButton);
    
    // Check that branch creation is called
    await waitFor(() => {
      expect(mockPromptService.promptService.createPromptBranch).toHaveBeenCalledWith(
        'test-prompt-id',
        {
          branchName: 'feature-test',
          sourceVersionId: 'v1',
        }
      );
    });
  });

  it('allows tagging a version', async () => {
    mockPromptService.promptService.getPromptVersions.mockResolvedValue(mockVersions);
    mockPromptService.promptService.tagPromptVersion.mockResolvedValue({
      ...mockVersions[0],
      tags: ['stable', 'production'],
    });
    
    renderWithProviders(<PromptHistory promptId="test-prompt-id" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Prompt History')).toBeInTheDocument();
    });
    
    // Click tag button on first version
    const tagButtons = screen.getAllByTitle('Tag');
    fireEvent.click(tagButtons[0]);
    
    // Fill in tag name and add
    const tagInput = screen.getByLabelText('Tag');
    fireEvent.change(tagInput, { target: { value: 'production' } });
    
    const addTagButton = screen.getByText('Add Tag');
    fireEvent.click(addTagButton);
    
    // Check that tag creation is called
    await waitFor(() => {
      expect(mockPromptService.promptService.tagPromptVersion).toHaveBeenCalledWith(
        'test-prompt-id',
        'v1',
        'production'
      );
    });
  });

  it('allows restoring a version', async () => {
    mockPromptService.promptService.getPromptVersions.mockResolvedValue(mockVersions);
    mockPromptService.promptService.restorePromptVersion.mockResolvedValue({
      id: 'test-prompt-id',
      name: 'Test Prompt',
    } as any);
    
    renderWithProviders(<PromptHistory promptId="test-prompt-id" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Prompt History')).toBeInTheDocument();
    });
    
    // Click restore button on second version
    const restoreButtons = screen.getAllByTitle('Restore');
    fireEvent.click(restoreButtons[1]);
    
    // Confirm restore
    const restoreButton = screen.getByText('Restore');
    fireEvent.click(restoreButton);
    
    // Check that restore is called
    await waitFor(() => {
      expect(mockPromptService.promptService.restorePromptVersion).toHaveBeenCalledWith(
        'test-prompt-id',
        'v2'
      );
    });
  });

  it('switches between timeline and grid view', async () => {
    mockPromptService.promptService.getPromptVersions.mockResolvedValue(mockVersions);
    
    renderWithProviders(<PromptHistory promptId="test-prompt-id" />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Prompt History')).toBeInTheDocument();
    });
    
    // Switch to grid view
    const viewSelect = screen.getByLabelText('View');
    fireEvent.mouseDown(viewSelect);
    
    const gridViewOption = screen.getByText('Grid');
    fireEvent.click(gridViewOption);
    
    // Check that grid view is displayed
    expect(screen.getByText('Grid')).toBeInTheDocument();
  });
});