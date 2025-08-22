import React, { useState, useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
  PlayArrow as TestIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Storage as StorageIcon,
  Analytics as AnalyticsIcon,
  Notifications as NotificationIcon,
  CloudOutlined as CloudIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import {
  useIntegrations,
  useCreateIntegration,
  useUpdateIntegration,
  useDeleteIntegration,
  useTestIntegration,
  useSyncIntegration,
  useLLMProviders,
  useStorageBackends,
} from '../../hooks/useSettings';
import { Integration, CreateIntegrationRequest, UpdateIntegrationRequest } from '../../types/Settings';

interface IntegrationFormData {
  name: string;
  type: 'llm_provider' | 'storage' | 'analytics' | 'notification';
  provider: string;
  configuration: Record<string, any>;
}

interface IntegrationDialogProps {
  open: boolean;
  onClose: () => void;
  integration?: Integration;
  onSave: (data: IntegrationFormData) => void;
  isLoading: boolean;
}

const IntegrationDialog: React.FC<IntegrationDialogProps> = ({
  open,
  onClose,
  integration,
  onSave,
  isLoading,
}) => {
  const { data: llmProviders = [] } = useLLMProviders();
  const { data: storageBackends = [] } = useStorageBackends();
  
  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm<IntegrationFormData>({
    defaultValues: {
      name: integration?.name || '',
      type: integration?.type || 'llm_provider',
      provider: integration?.provider || '',
      configuration: integration?.configuration || {},
    },
  });

  const watchedType = watch('type');

  const getProviderOptions = () => {
    switch (watchedType) {
      case 'llm_provider':
        return llmProviders.map(p => ({ id: p.id, name: p.display_name }));
      case 'storage':
        return storageBackends.map(s => ({ id: s.id, name: s.name }));
      case 'analytics':
        return [
          { id: 'google_analytics', name: 'Google Analytics' },
          { id: 'mixpanel', name: 'Mixpanel' },
          { id: 'amplitude', name: 'Amplitude' },
        ];
      case 'notification':
        return [
          { id: 'slack', name: 'Slack' },
          { id: 'discord', name: 'Discord' },
          { id: 'email', name: 'Email' },
          { id: 'webhook', name: 'Webhook' },
        ];
      default:
        return [];
    }
  };

  const handleSave = useCallback((data: IntegrationFormData) => {
    onSave(data);
    reset();
  }, [onSave, reset]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {integration ? 'Edit Integration' : 'Add New Integration'}
      </DialogTitle>
      <form onSubmit={handleSubmit(handleSave)}>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Controller
                name="name"
                control={control}
                rules={{ required: 'Name is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Integration Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="type"
                control={control}
                rules={{ required: 'Type is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.type}>
                    <InputLabel>Integration Type</InputLabel>
                    <Select {...field} label="Integration Type">
                      <MenuItem value="llm_provider">LLM Provider</MenuItem>
                      <MenuItem value="storage">Storage</MenuItem>
                      <MenuItem value="analytics">Analytics</MenuItem>
                      <MenuItem value="notification">Notification</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="provider"
                control={control}
                rules={{ required: 'Provider is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.provider}>
                    <InputLabel>Provider</InputLabel>
                    <Select {...field} label="Provider">
                      {getProviderOptions().map((provider) => (
                        <MenuItem key={provider.id} value={provider.id}>
                          {provider.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Configuration
              </Typography>
              <TextField
                multiline
                rows={4}
                fullWidth
                placeholder="Enter JSON configuration"
                helperText="Configuration settings in JSON format"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {integration ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const IntegrationsList: React.FC = () => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | undefined>();
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  
  const { data: integrations = [], isLoading } = useIntegrations();
  const createMutation = useCreateIntegration();
  const updateMutation = useUpdateIntegration();
  const deleteMutation = useDeleteIntegration();
  const testMutation = useTestIntegration();
  const syncMutation = useSyncIntegration();

  const handleCreateIntegration = useCallback(() => {
    setSelectedIntegration(undefined);
    setDialogOpen(true);
  }, []);

  const handleEditIntegration = useCallback((integration: Integration) => {
    setSelectedIntegration(integration);
    setDialogOpen(true);
  }, []);

  const handleDeleteIntegration = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this integration?')) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleTestIntegration = useCallback((id: string) => {
    testMutation.mutate(id, {
      onSuccess: (result) => {
        setTestResults(prev => ({ ...prev, [id]: result }));
      },
    });
  }, [testMutation]);

  const handleSyncIntegration = useCallback((id: string) => {
    syncMutation.mutate(id);
  }, [syncMutation]);

  const handleSaveIntegration = useCallback((data: IntegrationFormData) => {
    if (selectedIntegration) {
      updateMutation.mutate(
        { id: selectedIntegration.id, data },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setSelectedIntegration(undefined);
          },
        }
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setDialogOpen(false);
        },
      });
    }
  }, [selectedIntegration, updateMutation, createMutation]);

  const handleToggleActive = useCallback((integration: Integration) => {
    updateMutation.mutate({
      id: integration.id,
      data: { is_active: !integration.is_active },
    });
  }, [updateMutation]);

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'llm_provider': return <CloudIcon />;
      case 'storage': return <StorageIcon />;
      case 'analytics': return <AnalyticsIcon />;
      case 'notification': return <NotificationIcon />;
      default: return <CloudIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'error': return 'error';
      case 'disconnected': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckIcon fontSize="small" />;
      case 'error': return <ErrorIcon fontSize="small" />;
      case 'disconnected': return <WarningIcon fontSize="small" />;
      default: return null;
    }
  };

  const groupedIntegrations = integrations.reduce((acc, integration) => {
    const type = integration.type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(integration);
    return acc;
  }, {} as Record<string, Integration[]>);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Integrations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Connect PromptPilot with external services and platforms
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateIntegration}
          sx={{ borderRadius: 2 }}
        >
          Add Integration
        </Button>
      </Box>

      {/* Integrations by Type */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : Object.keys(groupedIntegrations).length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 4 }}>
          <CardContent>
            <Typography color="text.secondary" gutterBottom>
              No integrations configured yet
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleCreateIntegration}
            >
              Add Your First Integration
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedIntegrations).map(([type, typeIntegrations]) => (
          <Accordion key={type} defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {getIntegrationIcon(type)}
                <Typography variant="h6">
                  {type.replace('_', ' ').toUpperCase()} ({typeIntegrations.length})
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {typeIntegrations.map((integration) => (
                  <Grid item xs={12} sm={6} md={4} key={integration.id}>
                    <Card sx={{ height: '100%' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          {getIntegrationIcon(integration.type)}
                          <Typography variant="h6" noWrap>
                            {integration.name}
                          </Typography>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={integration.is_active}
                                onChange={() => handleToggleActive(integration)}
                                size="small"
                              />
                            }
                            label=""
                            sx={{ ml: 'auto' }}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Provider: {integration.provider}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <Chip
                            label={integration.status}
                            size="small"
                            color={getStatusColor(integration.status)}
                            icon={getStatusIcon(integration.status) || undefined}
                          />
                        </Box>
                        
                        {integration.last_sync && (
                          <Typography variant="caption" color="text.secondary">
                            Last sync: {new Date(integration.last_sync).toLocaleString()}
                          </Typography>
                        )}
                      </CardContent>
                      
                      <CardActions sx={{ justifyContent: 'space-between' }}>
                        <Box>
                          <Tooltip title="Test Connection">
                            <IconButton
                              size="small"
                              onClick={() => handleTestIntegration(integration.id)}
                              disabled={testMutation.isPending}
                            >
                              <TestIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Sync">
                            <IconButton
                              size="small"
                              onClick={() => handleSyncIntegration(integration.id)}
                              disabled={syncMutation.isPending}
                            >
                              <SyncIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        
                        <Box>
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => handleEditIntegration(integration)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteIntegration(integration.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))
      )}

      {/* Create/Edit Dialog */}
      <IntegrationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        integration={selectedIntegration}
        onSave={handleSaveIntegration}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <Box sx={{ mt: 3 }}>
          {Object.entries(testResults).map(([integrationId, result]) => {
            const integration = integrations.find(i => i.id === integrationId);
            if (!integration) return null;
            
            return (
              <Alert
                key={integrationId}
                severity={result.status === 'connected' ? 'success' : 'error'}
                sx={{ mb: 1 }}
                onClose={() => setTestResults(prev => {
                  const newResults = { ...prev };
                  delete newResults[integrationId];
                  return newResults;
                })}
              >
                <strong>{integration.name}</strong>: {result.message}
              </Alert>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default IntegrationsList;