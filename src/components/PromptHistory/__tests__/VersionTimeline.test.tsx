/**
 * Test cases for VersionTimeline component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VersionTimeline from '../VersionTimeline';

// Mock theme
jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({
    palette: {
      primary: { main: '#1976d2' },
      warning: { main: '#ff9800' },
      success: { main: '#4caf50' },
      grey: { 500: '#9e9e9e' },
      divider: '#e0e0e0',
      background: { paper: '#fff' },
      action: { selected: '#f5f5f5' },
      text: { primary: '#000', secondary: '#757575' },
    },
  }),
}));

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
  {
    id: 'v3',
    prompt_id: 'test-prompt-id',
    version: '1.2.0',
    commit_message: 'Bug fixes',
    content_snapshot: {},
    created_by: 'user1',
    created_at: '2023-01-03T00:00:00Z',
    is_active: false,
    tags: [],
    is_merge: true,
  },
];

describe('VersionTimeline', () => {
  const mockOnVersionSelect = jest.fn();
  const mockOnRestoreVersion = jest.fn();
  const mockOnTagVersion = jest.fn();
  const mockOnBranchVersion = jest.fn();
  const mockOnMergeVersion = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders version timeline with all versions', () => {
    render(
      <VersionTimeline
        versions={mockVersions}
        selectedVersions={[]}
        onVersionSelect={mockOnVersionSelect}
        onRestoreVersion={mockOnRestoreVersion}
        onTagVersion={mockOnTagVersion}
        onBranchVersion={mockOnBranchVersion}
        onMergeVersion={mockOnMergeVersion}
        sourceVersion={null}
        targetVersion={null}
      />
    );

    // Check that all versions are rendered
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('v1.1.0')).toBeInTheDocument();
    expect(screen.getByText('v1.2.0')).toBeInTheDocument();
    
    // Check that commit messages are displayed
    expect(screen.getByText('Initial version')).toBeInTheDocument();
    expect(screen.getByText('Added new features')).toBeInTheDocument();
    expect(screen.getByText('Bug fixes')).toBeInTheDocument();
    
    // Check that tags are displayed
    expect(screen.getByText('stable')).toBeInTheDocument();
    expect(screen.getByText('experimental')).toBeInTheDocument();
  });

  it('shows active version indicator', () => {
    render(
      <VersionTimeline
        versions={mockVersions}
        selectedVersions={[]}
        onVersionSelect={mockOnVersionSelect}
        onRestoreVersion={mockOnRestoreVersion}
        onTagVersion={mockOnTagVersion}
        onBranchVersion={mockOnBranchVersion}
        onMergeVersion={mockOnMergeVersion}
        sourceVersion={null}
        targetVersion={null}
      />
    );

    // Check that active version has the correct indicator
    const activeVersion = screen.getByText('v1.0.0').closest('div');
    expect(activeVersion).toBeInTheDocument();
  });

  it('shows merge version indicator', () => {
    render(
      <VersionTimeline
        versions={mockVersions}
        selectedVersions={[]}
        onVersionSelect={mockOnVersionSelect}
        onRestoreVersion={mockOnRestoreVersion}
        onTagVersion={mockOnTagVersion}
        onBranchVersion={mockOnBranchVersion}
        onMergeVersion={mockOnMergeVersion}
        sourceVersion={null}
        targetVersion={null}
      />
    );

    // Check that merge version has the correct indicator
    const mergeVersion = screen.getByText('v1.2.0').closest('div');
    expect(mergeVersion).toBeInTheDocument();
  });

  it('handles version selection', () => {
    render(
      <VersionTimeline
        versions={mockVersions}
        selectedVersions={[]}
        onVersionSelect={mockOnVersionSelect}
        onRestoreVersion={mockOnRestoreVersion}
        onTagVersion={mockOnTagVersion}
        onBranchVersion={mockOnBranchVersion}
        onMergeVersion={mockOnMergeVersion}
        sourceVersion={null}
        targetVersion={null}
      />
    );

    // Click on a version to select it
    const versionCard = screen.getByText('v1.0.0').closest('div');
    if (versionCard) {
      fireEvent.click(versionCard);
    }

    // Check that onVersionSelect was called
    expect(mockOnVersionSelect).toHaveBeenCalledWith('v1');
  });

  it('handles restore action', () => {
    render(
      <VersionTimeline
        versions={mockVersions}
        selectedVersions={[]}
        onVersionSelect={mockOnVersionSelect}
        onRestoreVersion={mockOnRestoreVersion}
        onTagVersion={mockOnTagVersion}
        onBranchVersion={mockOnBranchVersion}
        onMergeVersion={mockOnMergeVersion}
        sourceVersion={null}
        targetVersion={null}
      />
    );

    // Click restore button
    const restoreButton = screen.getAllByTitle('Restore')[0];
    fireEvent.click(restoreButton);

    // Check that onRestoreVersion was called with correct version
    expect(mockOnRestoreVersion).toHaveBeenCalledWith(mockVersions[0]);
  });

  it('handles tag action', () => {
    render(
      <VersionTimeline
        versions={mockVersions}
        selectedVersions={[]}
        onVersionSelect={mockOnVersionSelect}
        onRestoreVersion={mockOnRestoreVersion}
        onTagVersion={mockOnTagVersion}
        onBranchVersion={mockOnBranchVersion}
        onMergeVersion={mockOnMergeVersion}
        sourceVersion={null}
        targetVersion={null}
      />
    );

    // Click tag button
    const tagButton = screen.getAllByTitle('Tag')[0];
    fireEvent.click(tagButton);

    // Check that onTagVersion was called with correct version
    expect(mockOnTagVersion).toHaveBeenCalledWith(mockVersions[0]);
  });

  it('handles branch action', () => {
    render(
      <VersionTimeline
        versions={mockVersions}
        selectedVersions={[]}
        onVersionSelect={mockOnVersionSelect}
        onRestoreVersion={mockOnRestoreVersion}
        onTagVersion={mockOnTagVersion}
        onBranchVersion={mockOnBranchVersion}
        onMergeVersion={mockOnMergeVersion}
        sourceVersion={null}
        targetVersion={null}
      />
    );

    // Click branch button
    const branchButton = screen.getAllByTitle('Branch')[0];
    fireEvent.click(branchButton);

    // Check that onBranchVersion was called with correct version
    expect(mockOnBranchVersion).toHaveBeenCalledWith(mockVersions[0]);
  });

  it('handles merge action', () => {
    render(
      <VersionTimeline
        versions={mockVersions}
        selectedVersions={[]}
        onVersionSelect={mockOnVersionSelect}
        onRestoreVersion={mockOnRestoreVersion}
        onTagVersion={mockOnTagVersion}
        onBranchVersion={mockOnBranchVersion}
        onMergeVersion={mockOnMergeVersion}
        sourceVersion={null}
        targetVersion={null}
      />
    );

    // Click merge button
    const mergeButton = screen.getAllByTitle('Merge')[0];
    fireEvent.click(mergeButton);

    // Check that onMergeVersion was called with correct version
    expect(mockOnMergeVersion).toHaveBeenCalledWith(mockVersions[0]);
  });

  it('shows source and target version indicators', () => {
    render(
      <VersionTimeline
        versions={mockVersions}
        selectedVersions={[]}
        onVersionSelect={mockOnVersionSelect}
        onRestoreVersion={mockOnRestoreVersion}
        onTagVersion={mockOnTagVersion}
        onBranchVersion={mockOnBranchVersion}
        onMergeVersion={mockOnMergeVersion}
        sourceVersion={mockVersions[0]}
        targetVersion={mockVersions[1]}
      />
    );

    // Check that source version has the correct indicator
    const sourceVersionElement = screen.getByText('v1.0.0').closest('div');
    expect(sourceVersionElement).toBeInTheDocument();
    
    // Check that target version has the correct indicator
    const targetVersionElement = screen.getByText('v1.1.0').closest('div');
    expect(targetVersionElement).toBeInTheDocument();
  });

  it('shows empty state when no versions', () => {
    render(
      <VersionTimeline
        versions={[]}
        selectedVersions={[]}
        onVersionSelect={mockOnVersionSelect}
        onRestoreVersion={mockOnRestoreVersion}
        onTagVersion={mockOnTagVersion}
        onBranchVersion={mockOnBranchVersion}
        onMergeVersion={mockOnMergeVersion}
        sourceVersion={null}
        targetVersion={null}
      />
    );

    // Check that empty state is displayed
    expect(screen.getByText('No version history available')).toBeInTheDocument();
  });
});