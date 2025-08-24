/**
 * Test cases for enhanced VersionComparison component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VersionComparison from '../VersionComparison';

// Mock theme
jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({
    palette: {
      primary: { main: '#1976d2', contrastText: '#fff' },
      secondary: { main: '#dc004e', contrastText: '#fff' },
      warning: { main: '#ff9800', light: '#fff3e0' },
      success: { main: '#4caf50', light: '#e8f5e8' },
      error: { main: '#f44336', light: '#ffebee' },
      grey: { 100: '#f5f5f5', 400: '#bdbdbd', 500: '#9e9e9e' },
      divider: '#e0e0e0',
      background: { paper: '#fff', default: '#fafafa' },
      action: { hover: '#f5f5f5', selected: '#e3f2fd' },
      mode: 'light',
    },
  }),
}));

const mockVersionA = {
  id: 'v1',
  version: '1.0.0',
  created_at: '2023-01-01T00:00:00Z',
  content: {
    name: 'Test Prompt',
    description: 'A test prompt',
    messages: [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' },
    ],
    parameters: {
      temperature: 0.7,
      max_tokens: 100,
    },
    input_variables: {
      name: { type: 'string', description: 'User name' },
    },
    created_by: 'user1',
  },
  tags: ['stable'],
};

const mockVersionB = {
  id: 'v2',
  version: '1.1.0',
  created_at: '2023-01-02T00:00:00Z',
  content: {
    name: 'Test Prompt Updated',
    description: 'An updated test prompt',
    messages: [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am fine, thank you!' },
    ],
    parameters: {
      temperature: 0.8,
      max_tokens: 150,
      top_p: 0.9,
    },
    input_variables: {
      name: { type: 'string', description: 'User name' },
      age: { type: 'number', description: 'User age' },
    },
    created_by: 'user2',
  },
  tags: ['stable', 'updated'],
};

const mockDifferences = [
  {
    field: 'name',
    version1: 'Test Prompt',
    version2: 'Test Prompt Updated',
    type: 'modified',
    diff: null,
  },
  {
    field: 'description',
    version1: 'A test prompt',
    version2: 'An updated test prompt',
    type: 'modified',
    diff: null,
  },
  {
    field: 'messages',
    version1: [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello' },
    ],
    version2: [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Hello, how are you?' },
      { role: 'assistant', content: 'I am fine, thank you!' },
    ],
    type: 'modified',
    diff: [
      {
        index: 'user-1',
        version1: { role: 'user', content: 'Hello' },
        version2: { role: 'user', content: 'Hello, how are you?' },
        type: 'modified',
      },
      {
        index: 'assistant-2',
        version1: null,
        version2: { role: 'assistant', content: 'I am fine, thank you!' },
        type: 'added',
      },
    ],
  },
  {
    field: 'parameters',
    version1: {
      temperature: 0.7,
      max_tokens: 100,
    },
    version2: {
      temperature: 0.8,
      max_tokens: 150,
      top_p: 0.9,
    },
    type: 'modified',
    diff: [
      {
        key: 'temperature',
        version1: 0.7,
        version2: 0.8,
        type: 'modified',
      },
      {
        key: 'max_tokens',
        version1: 100,
        version2: 150,
        type: 'modified',
      },
      {
        key: 'top_p',
        version1: null,
        version2: 0.9,
        type: 'added',
      },
    ],
  },
  {
    field: 'input_variables',
    version1: {
      name: { type: 'string', description: 'User name' },
    },
    version2: {
      name: { type: 'string', description: 'User name' },
      age: { type: 'number', description: 'User age' },
    },
    type: 'modified',
    diff: [
      {
        key: 'age',
        version1: null,
        version2: { type: 'number', description: 'User age' },
        type: 'added',
      },
    ],
  },
];

const mockSummary = {
  total_changes: 5,
  added_fields: 0,
  removed_fields: 0,
  modified_fields: 5,
  field_statistics: {
    messages: { added: 0, modified: 1, removed: 0 },
    parameters: { added: 1, modified: 2, removed: 0 },
    input_variables: { added: 1, modified: 0, removed: 0 },
    other_fields: { added: 0, modified: 2, removed: 0 },
  },
};

describe('VersionComparison', () => {
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders version comparison with header information', () => {
    render(
      <VersionComparison
        versionA={mockVersionA}
        versionB={mockVersionB}
        differences={mockDifferences}
        onBack={mockOnBack}
      />
    );

    // Check header
    expect(screen.getByText('Version Comparison')).toBeInTheDocument();
    expect(screen.getByText('Comparing v1.0.0 with v1.1.0')).toBeInTheDocument();

    // Check version info cards
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Version 1.1.0')).toBeInTheDocument();
    
    // Check creators
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('user2')).toBeInTheDocument();
  });

  it('shows change summary with statistics', () => {
    render(
      <VersionComparison
        versionA={mockVersionA}
        versionB={mockVersionB}
        differences={mockDifferences}
        onBack={mockOnBack}
      />
    );

    // Check summary chips
    expect(screen.getByText('5 Modified')).toBeInTheDocument();
    expect(screen.getByText('0 Added')).toBeInTheDocument();
    expect(screen.getByText('0 Removed')).toBeInTheDocument();

    // Check field statistics accordion
    const statsAccordion = screen.getByText('Field Statistics');
    fireEvent.click(statsAccordion);

    // Check statistics table
    expect(screen.getByText('Messages')).toBeInTheDocument();
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('Input Variables')).toBeInTheDocument();
    expect(screen.getByText('Other Fields')).toBeInTheDocument();
  });

  it('shows field-level differences with proper categorization', () => {
    render(
      <VersionComparison
        versionA={mockVersionA}
        versionB={mockVersionB}
        differences={mockDifferences}
        onBack={mockOnBack}
      />
    );

    // Check changed fields display
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
    expect(screen.getByText('messages')).toBeInTheDocument();
    expect(screen.getByText('parameters')).toBeInTheDocument();
    expect(screen.getByText('input_variables')).toBeInTheDocument();

    // Check filter functionality
    const filterSelect = screen.getByLabelText('Filter');
    fireEvent.change(filterSelect, { target: { value: 'modified' } });

    // All our test differences are modified, so they should still be visible
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('description')).toBeInTheDocument();
  });

  it('expands field details when clicked', () => {
    render(
      <VersionComparison
        versionA={mockVersionA}
        versionB={mockVersionB}
        differences={mockDifferences}
        onBack={mockOnBack}
      />
    );

    // Find and click on a field chip to expand it
    const messagesChip = screen.getByText('messages');
    fireEvent.click(messagesChip);

    // Check that the messages diff details are shown
    expect(screen.getByText('Message Changes:')).toBeInTheDocument();
    expect(screen.getByText('user-1')).toBeInTheDocument();
    expect(screen.getByText('assistant-2')).toBeInTheDocument();

    // Click again to collapse
    fireEvent.click(messagesChip);
  });

  it('shows parameter differences in a table format', () => {
    render(
      <VersionComparison
        versionA={mockVersionA}
        versionB={mockVersionB}
        differences={mockDifferences}
        onBack={mockOnBack}
      />
    );

    // Expand parameters field
    const paramsChip = screen.getByText('parameters');
    fireEvent.click(paramsChip);

    // Check parameter diff table
    expect(screen.getByText('Parameter Changes:')).toBeInTheDocument();
    expect(screen.getByText('temperature')).toBeInTheDocument();
    expect(screen.getByText('max_tokens')).toBeInTheDocument();
    expect(screen.getByText('top_p')).toBeInTheDocument();
  });

  it('shows input variable differences in a table format', () => {
    render(
      <VersionComparison
        versionA={mockVersionA}
        versionB={mockVersionB}
        differences={mockDifferences}
        onBack={mockOnBack}
      />
    );

    // Expand input variables field
    const varsChip = screen.getByText('input_variables');
    fireEvent.click(varsChip);

    // Check input variable diff table
    expect(screen.getByText('Input Variable Changes:')).toBeInTheDocument();
    expect(screen.getByText('age')).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(
      <VersionComparison
        versionA={mockVersionA}
        versionB={mockVersionB}
        differences={mockDifferences}
        onBack={mockOnBack}
      />
    );

    const backButton = screen.getByRole('button');
    fireEvent.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('shows full content comparison with diff viewer', () => {
    render(
      <VersionComparison
        versionA={mockVersionA}
        versionB={mockVersionB}
        differences={mockDifferences}
        onBack={mockOnBack}
      />
    );

    // Check that the full diff viewer is present
    expect(screen.getByText('Full Content Comparison')).toBeInTheDocument();
  });
});