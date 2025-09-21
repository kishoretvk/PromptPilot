import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Cloud as CloudIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface ProviderInfo {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'ollama' | 'custom';
  status: 'available' | 'unavailable' | 'configuring';
  models: string[];
  default_model?: string;
  api_key_configured: boolean;
  usage_stats?: {
    requests_today: number;
    tokens_used_today: number;
    cost_today: number;
  };
  config?: {
    base_url?: string;
    api_version?: string;
    timeout?: number;
    max_retries?: number;
  };
}

interface ProviderSelectorProps {
  selectedProvider?: string;
  onProviderSelect?: (providerId: string) => void;
  onProviderConfig?: (providerId: string, config: any) => void;
  showUsageStats?: boolean;
  allowConfiguration?: boolean;
}

export const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  selectedProvider,
  onProviderSelect,
  onProviderConfig,
  showUsageStats = true,
  allowConfiguration = true,
}) => {
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedConfigProvider, setSelectedConfigProvider] = useState<ProviderInfo | null>(null);
  const [configForm, setConfigForm] = useState({
    api_key: '',
    base_url: '',
    default_model: '',
    timeout: 30,
    max_retries: 3,
  });

  // Mock data - in real implementation, this would come from an API
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockProviders: ProviderInfo[] = [
          {
            id: 'openai',
            name: 'OpenAI',
            type: 'openai',
            status: 'available',
            models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4-turbo'],
            default_model: 'gpt-4',
            api_key_configured: true,
            usage_stats: {
              requests_today: 145,
              tokens_used_today: 125000,
              cost_today: 2.45,
            },
          },
          {
            id: 'anthropic',
            name: 'Anthropic',
            type: 'anthropic',
            status: 'available',
            models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
            default_model: 'claude-3-sonnet',
            api_key_configured: true,
            usage_stats: {
              requests_today: 89,
              tokens_used_today: 98000,
              cost_today: 1.85,
            },
          },
          {
            id: 'google',
            name: 'Google AI',
            type: 'google',
            status: 'configuring',
            models: ['gemini-pro', 'gemini-pro-vision'],
            default_model: 'gemini-pro',
            api_key_configured: false,
          },
          {
            id: 'ollama',
            name: 'Ollama (Local)',
            type: 'ollama',
            status: 'available',
            models: ['llama2:7b', 'codellama:7b', 'mistral:7b'],
            default_model: 'llama2:7b',
            api_key_configured: true,
            config: {
              base_url: 'http://localhost:11434',
            },
          },
        ];

        setProviders(mockProviders);
        setError(null);
      } catch (err) {
        setError('Failed to load providers');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, []);

  const handleProviderSelect = (providerId: string) => {
    onProviderSelect?.(providerId);
  };

  const handleConfigureProvider = (provider: ProviderInfo) => {
    setSelectedConfigProvider(provider);
    setConfigForm({
      api_key: '',
      base_url: provider.config?.base_url || '',
      default_model: provider.default_model || '',
      timeout: provider.config?.timeout || 30,
      max_retries: provider.config?.max_retries || 3,
    });
    setConfigDialogOpen(true);
  };

  const handleSaveConfiguration = () => {
    if (!selectedConfigProvider) return;

    onProviderConfig?.(selectedConfigProvider.id, configForm);
    setConfigDialogOpen(false);
    setSelectedConfigProvider(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircleIcon color="success" />;
      case 'unavailable':
        return <ErrorIcon color="error" />;
      case 'configuring':
        return <WarningIcon color="warning" />;
      default:
        return <ErrorIcon color="disabled" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'unavailable':
        return 'error';
      case 'configuring':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getProviderIcon = (type: string) => {
    // In a real implementation, you'd have specific icons for each provider
    return <CloudIcon />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading providers...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudIcon />
        AI Providers
      </Typography>

      <Grid container spacing={3}>
        {/* Provider List */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Available Providers
              </Typography>

              <List>
                {providers.map((provider) => (
                  <ListItem
                    key={provider.id}
                    sx={{
                      border: 1,
                      borderColor: selectedProvider === provider.id ? 'primary.main' : 'divider',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => handleProviderSelect(provider.id)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {getProviderIcon(provider.type)}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{provider.name}</Typography>
                          <Chip
                            label={provider.status}
                            color={getStatusColor(provider.status)}
                            size="small"
                            icon={getStatusIcon(provider.status)}
                          />
                          {selectedProvider === provider.id && (
                            <Chip label="Selected" color="primary" size="small" variant="outlined" />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Models: {provider.models.join(', ')}
                          </Typography>
                          {provider.default_model && (
                            <Typography variant="body2" color="text.secondary">
                              Default: {provider.default_model}
                            </Typography>
                          )}
                        </Box>
                      }
                    />

                    <ListItemSecondaryAction>
                      {allowConfiguration && (
                        <Tooltip title="Configure">
                          <IconButton
                            edge="end"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfigureProvider(provider);
                            }}
                          >
                            <SettingsIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Statistics */}
        {showUsageStats && (
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Usage Statistics
                </Typography>

                {providers
                  .filter(p => p.usage_stats)
                  .map((provider) => (
                    <Paper key={provider.id} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {provider.name}
                      </Typography>

                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Requests
                          </Typography>
                          <Typography variant="h6">
                            {provider.usage_stats?.requests_today || 0}
                          </Typography>
                        </Grid>

                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Tokens
                          </Typography>
                          <Typography variant="h6">
                            {(provider.usage_stats?.tokens_used_today || 0).toLocaleString()}
                          </Typography>
                        </Grid>

                        <Grid item xs={4}>
                          <Typography variant="body2" color="text.secondary">
                            Cost
                          </Typography>
                          <Typography variant="h6" color="success.main">
                            {formatCurrency(provider.usage_stats?.cost_today || 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}

                {providers.filter(p => p.usage_stats).length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No usage data available
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Configuration Dialog */}
      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Configure {selectedConfigProvider?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {selectedConfigProvider?.type !== 'ollama' && (
              <TextField
                label="API Key"
                type="password"
                value={configForm.api_key}
                onChange={(e) => setConfigForm(prev => ({ ...prev, api_key: e.target.value }))}
                fullWidth
              />
            )}

            <TextField
              label="Base URL"
              value={configForm.base_url}
              onChange={(e) => setConfigForm(prev => ({ ...prev, base_url: e.target.value }))}
              fullWidth
              placeholder="https://api.example.com"
            />

            <FormControl fullWidth>
              <InputLabel>Default Model</InputLabel>
              <Select
                value={configForm.default_model}
                onChange={(e) => setConfigForm(prev => ({ ...prev, default_model: e.target.value }))}
                label="Default Model"
              >
                {selectedConfigProvider?.models.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Timeout (seconds)"
              type="number"
              value={configForm.timeout}
              onChange={(e) => setConfigForm(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
              fullWidth
            />

            <TextField
              label="Max Retries"
              type="number"
              value={configForm.max_retries}
              onChange={(e) => setConfigForm(prev => ({ ...prev, max_retries: parseInt(e.target.value) }))}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveConfiguration} variant="contained">
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};