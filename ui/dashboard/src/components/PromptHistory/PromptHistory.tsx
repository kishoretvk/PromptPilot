import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Tooltip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  History,
  Compare,
  Restore,
  Download,
  Visibility,
  Edit,
  CallSplit,
  Person,
  Schedule,
  Code,
  ArrowBack,
} from '@mui/icons-material';
import { usePromptVersions, usePromptComparison, useRestorePromptVersion } from '../../hooks/usePrompts';
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

  // Use either provided promptId or prompt.id
  const currentPromptId = promptId || prompt?.id;

  const { data: versions, isLoading: versionsLoading, error: versionsError } = usePromptVersions(
    currentPromptId || ''
  );
  const { data: comparisonData, isLoading: comparisonLoading } = usePromptComparison(
    currentPromptId || '',
    selectedVersions[0],
    selectedVersions[1],
    { enabled: selectedVersions.length === 2 && !!currentPromptId }
  );
  const restoreVersionMutation = useRestorePromptVersion();

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

  const confirmRestore = useCallback(async () => {
    if (!versionToRestore || !currentPromptId) return;

    try {
      await restoreVersionMutation.mutateAsync({
        promptId: currentPromptId,
        version: versionToRestore.version,
      });
      setRestoreDialogOpen(false);
      setVersionToRestore(null);
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  }, [versionToRestore, currentPromptId, restoreVersionMutation]);

  const handleExportHistory = useCallback(() => {
    if (!versions) return;

    const exportData = {
      prompt_id: currentPromptId,
      versions: versions,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-history-${currentPromptId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [versions, currentPromptId]);

  const sortedVersions = useMemo(() => {
    if (!versions) return [];
    return [...versions].sort((a, b) => 
      new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime()
    );
  }, [versions]);

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: theme.palette.warning.main,
      STAGING: theme.palette.info.main,
      PUBLISHED: theme.palette.success.main,
      ARCHIVED: theme.palette.grey[500],
      DEPRECATED: theme.palette.error.main,
    };
    return colors[status as keyof typeof colors] || theme.palette.grey[500];
  };

  if (!currentPromptId) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          No prompt selected. Please select a prompt to view its history.
        </Alert>
      </Container>
    );
  }

  if (versionsError) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 3 }}>
          Error loading prompt history: {versionsError.message}
        </Alert>
      </Container>
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
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {onBack && (
              <IconButton onClick={onBack} sx={{ mr: 2 }}>
                <ArrowBack />
              </IconButton>
            )}
            <Box>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                <History sx={{ mr: 2, verticalAlign: 'middle' }} />
                Prompt History
              </Typography>
              {prompt && (
                <Typography variant="subtitle1" color="text.secondary">
                  {prompt.name} - Version History & Changes
                </Typography>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Compare />}
              onClick={handleCompareVersions}
              disabled={selectedVersions.length !== 2}
            >
              Compare ({selectedVersions.length}/2)
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportHistory}
              disabled={!versions?.length}
            >
              Export History
            </Button>
          </Box>
        </Box>

        {/* Selection Info */}
        {selectedVersions.length > 0 && (
          <Alert 
            severity="info" 
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setSelectedVersions([])}
              >
                Clear
              </Button>
            }
          >
            {selectedVersions.length === 1 
              ? '1 version selected for comparison'
              : `${selectedVersions.length} versions selected for comparison`
            }
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Version Timeline */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: 'fit-content' }}>
              <CardHeader
                title="Version Timeline"
                avatar={<CallSplit color="primary" />}
                action={
                  <Chip
                    label={`${sortedVersions.length} versions`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                }
              />
              <CardContent>
                {versionsLoading ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">Loading version history...</Typography>
                  </Box>
                ) : (
                  <VersionTimeline
                    versions={sortedVersions}
                    selectedVersions={selectedVersions}
                    onVersionSelect={handleVersionSelect}
                    onRestoreVersion={handleRestoreVersion}
                    onEditVersion={onEditVersion}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Version Details */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: 'fit-content' }}>
              <CardHeader
                title="Version Details"
                avatar={<Visibility color="primary" />}
              />
              <CardContent>
                {selectedVersions.length === 0 ? (
                  <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                    Select a version to view details
                  </Typography>
                ) : (
                  <Box>
                    {selectedVersions.map((versionId, index) => {
                      const version = sortedVersions.find(v => v.version === versionId);
                      if (!version) return null;

                      return (
                        <Paper
                          key={versionId}
                          elevation={1}
                          sx={{
                            p: 2,
                            mb: index < selectedVersions.length - 1 ? 2 : 0,
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" component="div">
                              v{version.version}
                            </Typography>
                            <Chip
                              label={version.status || 'DRAFT'}
                              size="small"
                              sx={{
                                backgroundColor: getStatusColor(version.status || 'DRAFT'),
                                color: theme.palette.common.white,
                              }}
                            />
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Person fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {version.author || version.created_by}
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Schedule fontSize="small" sx={{ mr: 1 }} />
                            <Typography variant="body2" color="text.secondary">
                              {new Date(version.updated_at || version.created_at).toLocaleString()}
                            </Typography>
                          </Box>

                          {version.commit_ref && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Code fontSize="small" sx={{ mr: 1 }} />
                              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                {version.commit_ref.substring(0, 8)}
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Tooltip title="Restore this version">
                              <IconButton
                                size="small"
                                onClick={() => handleRestoreVersion(version)}
                                color="primary"
                              >
                                <Restore fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {onEditVersion && (
                              <Tooltip title="Edit this version">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    // Convert version to prompt for editing
                                    const promptForEdit: Prompt = {
                                      ...prompt!,
                                      version_info: version,
                                    };
                                    onEditVersion(promptForEdit);
                                  }}
                                  color="primary"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Restore Version</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore to version {versionToRestore?.version}?
            This will create a new version based on the selected version.
          </Typography>
          {versionToRestore && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Author:</strong> {versionToRestore.author || versionToRestore.created_by}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Created:</strong> {new Date(versionToRestore.created_at).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Status:</strong> {versionToRestore.status || 'DRAFT'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={confirmRestore}
            variant="contained"
            disabled={restoreVersionMutation.isPending}
          >
            {restoreVersionMutation.isPending ? 'Restoring...' : 'Restore'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PromptHistory;