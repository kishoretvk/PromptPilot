import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import {
  History,
  Compare,
  Restore,
  Schedule,
  Code,
  ArrowBack,
  Merge,
  Label,
  ForkRight,
  FilterList,
  Search,
} from '@mui/icons-material';
import { usePromptVersions, usePromptComparison, useRestorePromptVersion, useCreatePromptBranch, useMergePromptVersions, useTagPromptVersion } from '../../hooks/usePrompts';
import { Prompt, PromptVersion } from '../../types';
import VersionComparison from './VersionComparison';
import VersionTimeline from './VersionTimeline';

interface PromptHistoryProps {
  promptId?: string;
  prompt?: Prompt;
  onBack?: () => void;
  onEditVersion?: (prompt: Prompt) => void;
}

const PromptHistory: React.FC<PromptHistoryProps> = ({
  promptId,
  prompt,
  onBack,
  onEditVersion,
}) => {
  const theme = useTheme();
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [versionToRestore, setVersionToRestore] = useState<PromptVersion | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [versionToTag, setVersionToTag] = useState<PromptVersion | null>(null);
  const [newTag, setNewTag] = useState('');
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [versionToBranch, setVersionToBranch] = useState<PromptVersion | null>(null);
  const [branchName, setBranchName] = useState('');
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [sourceVersion, setSourceVersion] = useState<PromptVersion | null>(null);
  const [targetVersion, setTargetVersion] = useState<PromptVersion | null>(null);
  const [mergeMessage, setMergeMessage] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');

  // Use either provided promptId or prompt.id
  const currentPromptId = promptId || prompt?.id;

  const { data: versions, isLoading: versionsLoading, error: versionsError } = usePromptVersions(
    currentPromptId || '', true, 100 // Include branches, limit to 100 versions
  );
  const { data: comparisonData, isLoading: comparisonLoading } = usePromptComparison(
    currentPromptId || '',
    selectedVersions[0],
    selectedVersions[1],
    { enabled: selectedVersions.length === 2 && !!currentPromptId }
  );
  const restoreVersionMutation = useRestorePromptVersion();
  const createBranchMutation = useCreatePromptBranch();
  const mergeVersionsMutation = useMergePromptVersions();
  const tagVersionMutation = useTagPromptVersion();

  // Filter versions based on search term and tag filter
  const filteredVersions = useMemo(() => {
    if (!versions) return [];
    
    return versions.filter(version => {
      // Search filter
      const matchesSearch = !searchTerm || 
        version.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.commit_message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        version.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Tag filter
      const matchesTag = filterTag === 'all' || 
        (filterTag === 'untagged' && version.tags.length === 0) ||
        version.tags.includes(filterTag);
      
      return matchesSearch && matchesTag;
    });
  }, [versions, searchTerm, filterTag]);

  // Get unique tags for filter dropdown
  const uniqueTags = useMemo(() => {
    if (!versions) return [];
    
    const tags = new Set<string>();
    versions.forEach(version => {
      version.tags.forEach(tag => tags.add(tag));
    });
    
    return Array.from(tags);
  }, [versions]);

  const handleVersionSelect = useCallback((versionId: string) => {
    setSelectedVersions(prev => {
      if (prev.includes(versionId)) {
        return prev.filter(id => id !== versionId);
      }
      if (prev.length >= 2) {
        return [prev[1], versionId];
      }
      return [...prev, versionId];
    });
  }, []);

  const handleCompareVersions = useCallback(() => {
    if (selectedVersions.length === 2) {
      setShowComparison(true);
    }
  }, [selectedVersions]);

  const handleRestoreVersion = useCallback((version: PromptVersion) => {
    setVersionToRestore(version);
    setRestoreDialogOpen(true);
  }, []);

  const handleTagVersion = useCallback((version: PromptVersion) => {
    setVersionToTag(version);
    setTagDialogOpen(true);
  }, []);

  const handleBranchVersion = useCallback((version: PromptVersion) => {
    setVersionToBranch(version);
    setBranchDialogOpen(true);
  }, []);

  const handleMergeVersion = useCallback((version: PromptVersion) => {
    if (!sourceVersion) {
      setSourceVersion(version);
    } else if (!targetVersion) {
      setTargetVersion(version);
      setMergeDialogOpen(true);
    }
  }, [sourceVersion, targetVersion]);

  const confirmRestore = useCallback(async () => {
    if (!versionToRestore || !currentPromptId) return;

    try {
      await restoreVersionMutation.mutateAsync({
        promptId: currentPromptId,
        versionId: versionToRestore.id,
      });
      setRestoreDialogOpen(false);
      setVersionToRestore(null);
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  }, [versionToRestore, currentPromptId, restoreVersionMutation]);

  const addTagToVersion = useCallback(async () => {
    if (!versionToTag || !currentPromptId || !newTag) return;

    try {
      await tagVersionMutation.mutateAsync({
        promptId: currentPromptId,
        versionId: versionToTag.id,
        tag: newTag,
      });
      setTagDialogOpen(false);
      setVersionToTag(null);
      setNewTag('');
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  }, [versionToTag, currentPromptId, newTag, tagVersionMutation]);

  const createBranch = useCallback(async () => {
    if (!versionToBranch || !currentPromptId || !branchName) return;

    try {
      await createBranchMutation.mutateAsync({
        promptId: currentPromptId,
        branchData: {
          branchName: branchName,
          sourceVersionId: versionToBranch.id,
        },
      });
      setBranchDialogOpen(false);
      setVersionToBranch(null);
      setBranchName('');
    } catch (error) {
      console.error('Failed to create branch:', error);
    }
  }, [versionToBranch, currentPromptId, branchName, createBranchMutation]);

  const mergeVersions = useCallback(async () => {
    if (!sourceVersion || !targetVersion || !currentPromptId) return;

    try {
      await mergeVersionsMutation.mutateAsync({
        promptId: currentPromptId,
        sourceVersionId: sourceVersion.id,
        targetVersionId: targetVersion.id,
        mergeData: {
          mergeMessage: mergeMessage,
        },
      });
      setMergeDialogOpen(false);
      setSourceVersion(null);
      setTargetVersion(null);
      setMergeMessage('');
    } catch (error) {
      console.error('Failed to merge versions:', error);
    }
  }, [sourceVersion, targetVersion, currentPromptId, mergeMessage, mergeVersionsMutation]);

  const clearSelection = useCallback(() => {
    setSelectedVersions([]);
    setSourceVersion(null);
    setTargetVersion(null);
  }, []);

  if (versionsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (versionsError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load version history: {versionsError.message}
        </Alert>
      </Box>
    );
  }

  if (showComparison && comparisonData) {
    return (
      <VersionComparison
        versionA={comparisonData.version_a}
        versionB={comparisonData.version_b}
        differences={comparisonData.differences}
        onBack={() => setShowComparison(false)}
      />
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        {onBack && (
          <IconButton onClick={onBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
        )}
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            <History sx={{ mr: 1, verticalAlign: 'middle' }} />
            Prompt Version History
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Track and manage all versions of your prompt
          </Typography>
        </Box>
      </Box>

      {/* Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          {/* Search */}
          <TextField
            size="small"
            placeholder="Search versions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, fontSize: 20 }} />,
            }}
            sx={{ minWidth: 200 }}
          />
          
          {/* Tag Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Filter by Tag</InputLabel>
            <Select
              value={filterTag}
              label="Filter by Tag"
              onChange={(e) => setFilterTag(e.target.value as string)}
            >
              <MenuItem value="all">All Versions</MenuItem>
              <MenuItem value="untagged">Untagged</MenuItem>
              <Divider />
              {uniqueTags.map(tag => (
                <MenuItem key={tag} value={tag}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Label sx={{ fontSize: 16 }} />
                    {tag}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* View Mode Toggle */}
          <Tabs
            value={viewMode}
            onChange={(_, newValue) => setViewMode(newValue as 'timeline' | 'grid')}
            sx={{ minHeight: 40 }}
          >
            <Tab label="Timeline" value="timeline" sx={{ minHeight: 40 }} />
            <Tab label="Grid" value="grid" sx={{ minHeight: 40 }} />
          </Tabs>
          
          {/* Action Buttons */}
          <Box sx={{ flexGrow: 1 }} />
          
          {selectedVersions.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<Compare />}
                onClick={handleCompareVersions}
                disabled={selectedVersions.length !== 2}
              >
                Compare ({selectedVersions.length})
              </Button>
              <Button
                variant="outlined"
                onClick={clearSelection}
              >
                Clear
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Version Stats */}
      {versions && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Typography variant="h6" color="text.secondary">
                Total Versions
              </Typography>
              <Typography variant="h4">
                {versions.length}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="text.secondary">
                Active Version
              </Typography>
              <Typography variant="h4">
                {versions.find(v => v.is_active)?.version || 'None'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h6" color="text.secondary">
                Tags
              </Typography>
              <Typography variant="h4">
                {uniqueTags.length}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Version Timeline/Grid */}
      {filteredVersions && (
        <VersionTimeline
          versions={filteredVersions}
          selectedVersions={selectedVersions}
          onVersionSelect={handleVersionSelect}
          onRestoreVersion={handleRestoreVersion}
          onTagVersion={handleTagVersion}
          onBranchVersion={handleBranchVersion}
          onMergeVersion={handleMergeVersion}
          sourceVersion={sourceVersion}
          targetVersion={targetVersion}
        />
      )}

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>Restore Version</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore version {versionToRestore?.version}? 
            This will create a backup of the current version and replace it with this one.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmRestore} variant="contained" color="primary">
            Restore
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)}>
        <DialogTitle>Add Tag to Version</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tag Name"
            fullWidth
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>Cancel</Button>
          <Button onClick={addTagToVersion} variant="contained" color="primary">
            Add Tag
          </Button>
        </DialogActions>
      </Dialog>

      {/* Branch Dialog */}
      <Dialog open={branchDialogOpen} onClose={() => setBranchDialogOpen(false)}>
        <DialogTitle>Create Branch</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Branch Name"
            fullWidth
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBranchDialogOpen(false)}>Cancel</Button>
          <Button onClick={createBranch} variant="contained" color="primary">
            Create Branch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onClose={() => setMergeDialogOpen(false)}>
        <DialogTitle>Merge Versions</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Merging {sourceVersion?.version} into {targetVersion?.version}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Merge Message (Optional)"
            fullWidth
            multiline
            rows={3}
            value={mergeMessage}
            onChange={(e) => setMergeMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialogOpen(false)}>Cancel</Button>
          <Button onClick={mergeVersions} variant="contained" color="primary">
            Merge
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PromptHistory;