import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  History as HistoryIcon,
  Compare as CompareIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ArrowBack as BackIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Code as CodeIcon,
  Notes as NotesIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { usePromptVersions, usePromptVersion, useRestorePromptVersion } from '../../hooks/usePrompts';
import { PromptVersion } from '../../types/Prompt';
import { DiffViewer } from '../common/DiffViewer';

interface VersionComparison {
  version1: PromptVersion | null;
  version2: PromptVersion | null;
}

const PromptHistory: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [comparison, setComparison] = useState<VersionComparison>({ version1: null, version2: null });
  const [openComparison, setOpenComparison] = useState(false);
  const [openRestoreDialog, setOpenRestoreDialog] = useState(false);
  const [restoreReason, setRestoreReason] = useState('');
  const [filter, setFilter] = useState({ user: '', dateRange: '' });
  
  const { data: versions, isLoading, error } = usePromptVersions(id || '');
  const { data: versionDetails } = usePromptVersion(id || '', selectedVersion?.version || 0);
  const restoreMutation = useRestorePromptVersion(id || '');
  
  useEffect(() => {
    if (versions && versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0]);
    }
  }, [versions, selectedVersion]);
  
  const handleViewVersion = (version: PromptVersion) => {
    setSelectedVersion(version);
  };
  
  const handleCompareVersions = (version: PromptVersion) => {
    if (!comparison.version1) {
      setComparison({ ...comparison, version1: version });
    } else if (!comparison.version2) {
      setComparison({ ...comparison, version2: version });
      setOpenComparison(true);
    } else {
      // Reset and start new comparison
      setComparison({ version1: version, version2: null });
    }
  };
  
  const handleCloseComparison = () => {
    setOpenComparison(false);
    setComparison({ version1: null, version2: null });
  };
  
  const handleRestoreVersion = (version: PromptVersion) => {
    setSelectedVersion(version);
    setOpenRestoreDialog(true);
  };
  
  const confirmRestore = () => {
    if (selectedVersion) {
      restoreMutation.mutate(
        { version: selectedVersion.version, reason: restoreReason },
        {
          onSuccess: () => {
            setOpenRestoreDialog(false);
            setRestoreReason('');
            // Refresh the versions list
          }
        }
      );
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'default';
      default: return 'default';
    }
  };
  
  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading prompt history...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="error">Error loading prompt history: {error.message}</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mb: 1 }}
          >
            Back to Prompt
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Prompt History
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            View and compare versions of this prompt
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<CompareIcon />}
            disabled={!comparison.version1 || !comparison.version2}
            onClick={() => setOpenComparison(true)}
          >
            Compare Selected
          </Button>
        </Box>
      </Box>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: 3 }}>
        {/* Version List */}
        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <HistoryIcon /> Version History
            </Typography>
          </Box>
          
          {/* Filters */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>User</InputLabel>
                <Select
                  value={filter.user}
                  label="User"
                  onChange={(e) => setFilter({ ...filter, user: e.target.value as string })}
                >
                  <MenuItem value="">All Users</MenuItem>
                  <MenuItem value="current">Current User</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filter.dateRange}
                  label="Date Range"
                  onChange={(e) => setFilter({ ...filter, dateRange: e.target.value as string })}
                >
                  <MenuItem value="">All Time</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 90 Days</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          
          {/* Version List */}
          <List sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
            {versions?.map((version) => (
              <React.Fragment key={version.version}>
                <ListItem
                  divider
                  selected={selectedVersion?.version === version.version}
                  sx={{
                    cursor: 'pointer',
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                    },
                    '&:hover': {
                      bgcolor: 'action.hover',
                    }
                  }}
                  onClick={() => handleViewVersion(version)}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">
                          Version {version.version}
                        </Typography>
                        <Chip 
                          label={version.status} 
                          size="small" 
                          color={getStatusColor(version.status)}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <CalendarIcon fontSize="small" />
                        <Typography variant="caption">
                          {format(new Date(version.created_at), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="Compare Version">
                      <IconButton 
                        edge="end" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompareVersions(version);
                        }}
                      >
                        <CompareIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Restore Version">
                      <IconButton 
                        edge="end" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestoreVersion(version);
                        }}
                      >
                        <RestoreIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
        
        {/* Version Details */}
        {selectedVersion ? (
          <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <CodeIcon />
                </Avatar>
              }
              title={
                <Typography variant="h6">
                  Version {selectedVersion.version} Details
                </Typography>
              }
              subheader={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PersonIcon fontSize="small" />
                    <Typography variant="caption">
                      {selectedVersion.created_by}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarIcon fontSize="small" />
                    <Typography variant="caption">
                      {format(new Date(selectedVersion.created_at), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </Box>
                </Box>
              }
              action={
                <Button
                  variant="contained"
                  startIcon={<RestoreIcon />}
                  onClick={() => handleRestoreVersion(selectedVersion)}
                  sx={{ mr: 2 }}
                >
                  Restore This Version
                </Button>
              }
            />
            
            <Divider />
            
            <CardContent>
              {/* Version Info */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <NotesIcon /> Notes
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedVersion.notes || 'No notes provided for this version.'}
                </Typography>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              {/* Prompt Content */}
              <Box>
                <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CodeIcon /> Prompt Content
                </Typography>
                <Paper 
                  elevation={0} 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    overflow: 'auto',
                    maxHeight: 300
                  }}
                >
                  {selectedVersion.content}
                </Paper>
              </Box>
              
              {/* Metadata */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Metadata
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Model:</strong> {selectedVersion.model}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Temperature:</strong> {selectedVersion.temperature}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Max Tokens:</strong> {selectedVersion.max_tokens}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2">
                      <strong>Top P:</strong> {selectedVersion.top_p}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Paper>
        ) : (
          <Paper elevation={0} sx={{ borderRadius: 2, p: 4, textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Select a version to view details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose a version from the list to see its content and metadata
            </Typography>
          </Paper>
        )}
      </Box>
      
      {/* Comparison Dialog */}
      <Dialog 
        open={openComparison} 
        onClose={handleCloseComparison}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Comparing Versions {comparison.version1?.version} and {comparison.version2?.version}
        </DialogTitle>
        <DialogContent>
          {comparison.version1 && comparison.version2 && (
            <DiffViewer 
              oldContent={comparison.version1.content}
              newContent={comparison.version2.content}
              oldTitle={`Version ${comparison.version1.version}`}
              newTitle={`Version ${comparison.version2.version}`}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseComparison}>Close</Button>
        </DialogActions>
      </Dialog>
      
      {/* Restore Dialog */}
      <Dialog 
        open={openRestoreDialog} 
        onClose={() => setOpenRestoreDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Restore Version {selectedVersion?.version}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to restore this version? This will create a new version based on this content.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for restoration (optional)"
            value={restoreReason}
            onChange={(e) => setRestoreReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRestoreDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={confirmRestore}
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? 'Restoring...' : 'Restore Version'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PromptHistory;