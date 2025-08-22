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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Menu,
  MenuList,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as TestIcon,
  Visibility as ViewIcon,
  VisibilityOff as HideIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import {
  useAPIKeys,
  useCreateAPIKey,
  useUpdateAPIKey,
  useDeleteAPIKey,
  useTestAPIKey,
  useLLMProviders,
} from '../../hooks/useSettings';
import { APIKey, CreateAPIKeyRequest, UpdateAPIKeyRequest } from '../../types/Settings';

interface APIKeyFormData {
  name: string;
  provider: string;
  key: string;
  usage_limit?: number;
}

interface APIKeyDialogProps {
  open: boolean;
  onClose: () => void;
  apiKey?: APIKey;
  onSave: (data: APIKeyFormData) => void;
  isLoading: boolean;
}

const APIKeyDialog: React.FC<APIKeyDialogProps> = ({
  open,
  onClose,
  apiKey,
  onSave,
  isLoading,
}) => {
  const { data: providers = [] } = useLLMProviders();
  const [showKey, setShowKey] = useState(false);
  
  const { control, handleSubmit, reset, formState: { errors } } = useForm<APIKeyFormData>({
    defaultValues: {
      name: apiKey?.name || '',
      provider: apiKey?.provider || '',
      key: apiKey?.key || '',
      usage_limit: apiKey?.usage_limit || undefined,
    },
  });

  const handleSave = useCallback((data: APIKeyFormData) => {
    onSave(data);
    reset();
  }, [onSave, reset]);

  const handleClose = useCallback(() => {
    reset();
    setShowKey(false);
    onClose();
  }, [reset, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {apiKey ? 'Edit API Key' : 'Add New API Key'}
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
                    label="Key Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="provider"
                control={control}
                rules={{ required: 'Provider is required' }}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.provider}>
                    <InputLabel>Provider</InputLabel>
                    <Select {...field} label="Provider">
                      {providers.map((provider) => (
                        <MenuItem key={provider.id} value={provider.id}>
                          {provider.display_name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="key"
                control={control}
                rules={{ required: 'API Key is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="API Key"
                    fullWidth
                    type={showKey ? 'text' : 'password'}
                    error={!!errors.key}
                    helperText={errors.key?.message}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowKey(!showKey)}
                          edge="end"
                        >
                          {showKey ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      ),
                    }}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                name="usage_limit"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Usage Limit (optional)"
                    type="number"
                    fullWidth
                    helperText="Maximum number of requests per month"
                  />
                )}
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
            {apiKey ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

const APIKeyManagement: React.FC = () => {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | undefined>();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  
  const { data: apiKeys = [], isLoading } = useAPIKeys();
  const createMutation = useCreateAPIKey();
  const updateMutation = useUpdateAPIKey();
  const deleteMutation = useDeleteAPIKey();
  const testMutation = useTestAPIKey();

  const handleCreateKey = useCallback(() => {
    setSelectedKey(undefined);
    setDialogOpen(true);
  }, []);

  const handleEditKey = useCallback((apiKey: APIKey) => {
    setSelectedKey(apiKey);
    setDialogOpen(true);
    setAnchorEl(null);
  }, []);

  const handleDeleteKey = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      deleteMutation.mutate(id);
    }
    setAnchorEl(null);
  }, [deleteMutation]);

  const handleTestKey = useCallback((id: string) => {
    testMutation.mutate(id, {
      onSuccess: (result) => {
        setTestResults(prev => ({ ...prev, [id]: result }));
      },
    });
    setAnchorEl(null);
  }, [testMutation]);

  const handleSaveKey = useCallback((data: APIKeyFormData) => {
    if (selectedKey) {
      updateMutation.mutate(
        { id: selectedKey.id, data },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setSelectedKey(undefined);
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
  }, [selectedKey, updateMutation, createMutation]);

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>, apiKey: APIKey) => {
    setAnchorEl(event.currentTarget);
    setSelectedKey(apiKey);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedKey(undefined);
  }, []);

  const getStatusColor = (apiKey: APIKey) => {
    if (!apiKey.is_active) return 'default';
    const testResult = testResults[apiKey.id];
    if (!testResult) return 'default';
    
    switch (testResult.status) {
      case 'valid': return 'success';
      case 'expired': return 'warning';
      case 'invalid': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (apiKey: APIKey) => {
    if (!apiKey.is_active) return null;
    const testResult = testResults[apiKey.id];
    if (!testResult) return null;
    
    switch (testResult.status) {
      case 'valid': return <CheckIcon fontSize="small" />;
      case 'expired': return <WarningIcon fontSize="small" />;
      case 'invalid': return <ErrorIcon fontSize="small" />;
      default: return null;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" gutterBottom>
            API Key Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your API keys for various LLM providers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateKey}
          sx={{ borderRadius: 2 }}
        >
          Add API Key
        </Button>
      </Box>

      {/* API Keys Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>Name</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell>Last Used</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : apiKeys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary">
                    No API keys configured. Add your first API key to get started.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{apiKey.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={apiKey.provider}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={apiKey.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={getStatusColor(apiKey)}
                      icon={getStatusIcon(apiKey)}
                    />
                  </TableCell>
                  <TableCell>
                    {apiKey.usage_limit ? (
                      <Typography variant="body2">
                        {apiKey.current_usage || 0} / {apiKey.usage_limit}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Unlimited
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {apiKey.last_used ? new Date(apiKey.last_used).toLocaleDateString() : 'Never'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(apiKey.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuClick(e, apiKey)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuList>
          <MenuItem onClick={() => selectedKey && handleTestKey(selectedKey.id)}>
            <ListItemIcon>
              <TestIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Test Connection</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedKey && handleEditKey(selectedKey)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem 
            onClick={() => selectedKey && handleDeleteKey(selectedKey.id)}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Create/Edit Dialog */}
      <APIKeyDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        apiKey={selectedKey}
        onSave={handleSaveKey}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Test Results */}
      {Object.keys(testResults).length > 0 && (
        <Box sx={{ mt: 3 }}>
          {Object.entries(testResults).map(([keyId, result]) => {
            const apiKey = apiKeys.find(k => k.id === keyId);
            if (!apiKey) return null;
            
            return (
              <Alert
                key={keyId}
                severity={result.status === 'valid' ? 'success' : result.status === 'expired' ? 'warning' : 'error'}
                sx={{ mb: 1 }}
                onClose={() => setTestResults(prev => {
                  const newResults = { ...prev };
                  delete newResults[keyId];
                  return newResults;
                })}
              >
                <strong>{apiKey.name}</strong>: {result.message}
              </Alert>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default APIKeyManagement;