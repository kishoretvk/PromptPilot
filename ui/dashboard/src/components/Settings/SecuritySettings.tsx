import React, { useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Slider,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Key as KeyIcon,
  Speed as RateLimitIcon,
  Domain as DomainIcon,
  Shield as CorsIcon,
  Timer as TimerIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  VpnKey as VpnKeyIcon,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import {
  useSecuritySettings,
  useUpdateSecuritySettings,
} from '../../hooks/useSettings';
import { SecuritySettings as SecuritySettingsType } from '../../types/Settings';

interface SecurityFormData {
  require_api_key: boolean;
  api_key_expiry_days: number;
  max_requests_per_minute: number;
  allowed_domains: string[];
  cors_enabled: boolean;
}

const SecuritySettings: React.FC = () => {
  const theme = useTheme();
  
  const { data: securitySettings, isLoading } = useSecuritySettings();
  const updateMutation = useUpdateSecuritySettings();
  
  const { control, handleSubmit, watch } = useForm<SecurityFormData>({
    defaultValues: {
      require_api_key: securitySettings?.require_api_key || false,
      api_key_expiry_days: securitySettings?.api_key_expiry_days || 365,
      max_requests_per_minute: securitySettings?.max_requests_per_minute || 100,
      allowed_domains: securitySettings?.allowed_domains || [],
      cors_enabled: securitySettings?.cors_enabled || true,
    },
  });

  const { fields: domainFields, append: appendDomain, remove: removeDomain } = useFieldArray({
    control,
    name: 'allowed_domains',
  });

  const watchedValues = watch();

  const handleSave = useCallback((data: SecurityFormData) => {
    updateMutation.mutate(data);
  }, [updateMutation]);

  const handleAddDomain = useCallback(() => {
    appendDomain('');
  }, [appendDomain]);

  const handleRemoveDomain = useCallback((index: number) => {
    removeDomain(index);
  }, [removeDomain]);

  const getRateLimitColor = (value: number) => {
    if (value <= 50) return 'success';
    if (value <= 200) return 'warning';
    return 'error';
  };

  const getExpiryColor = (days: number) => {
    if (days >= 365) return 'success';
    if (days >= 90) return 'warning';
    return 'error';
  };

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading security settings...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Security Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure security policies and access controls for your PromptPilot instance
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(handleSave)}>
        <Grid container spacing={4}>
          {/* API Key Security */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VpnKeyIcon />
                  API Key Security
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <KeyIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Require API Key"
                      secondary="Enforce API key authentication for all requests"
                    />
                    <ListItemSecondaryAction>
                      <Controller
                        name="require_api_key"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            {...field}
                            checked={field.value}
                            edge="end"
                          />
                        )}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ px: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimerIcon fontSize="small" />
                    API Key Expiry
                  </Typography>
                  <Controller
                    name="api_key_expiry_days"
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <Slider
                          {...field}
                          min={7}
                          max={365}
                          step={7}
                          marks={[
                            { value: 7, label: '7d' },
                            { value: 30, label: '30d' },
                            { value: 90, label: '90d' },
                            { value: 180, label: '180d' },
                            { value: 365, label: '365d' },
                          ]}
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => `${value} days`}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                          <Chip
                            label={`${field.value} days`}
                            size="small"
                            color={getExpiryColor(field.value)}
                          />
                        </Box>
                      </Box>
                    )}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    API keys will automatically expire after this period
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Rate Limiting */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <RateLimitIcon />
                  Rate Limiting
                </Typography>
                
                <Box sx={{ px: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Maximum Requests per Minute
                  </Typography>
                  <Controller
                    name="max_requests_per_minute"
                    control={control}
                    render={({ field }) => (
                      <Box>
                        <Slider
                          {...field}
                          min={10}
                          max={1000}
                          step={10}
                          marks={[
                            { value: 10, label: '10' },
                            { value: 100, label: '100' },
                            { value: 500, label: '500' },
                            { value: 1000, label: '1000' },
                          ]}
                          valueLabelDisplay="auto"
                          valueLabelFormat={(value) => `${value} req/min`}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                          <Chip
                            label={`${field.value} requests/minute`}
                            size="small"
                            color={getRateLimitColor(field.value)}
                          />
                        </Box>
                      </Box>
                    )}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Limit the number of API requests per minute to prevent abuse
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* CORS Configuration */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CorsIcon />
                  CORS Configuration
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <CorsIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Enable CORS"
                      secondary="Allow cross-origin requests from web browsers"
                    />
                    <ListItemSecondaryAction>
                      <Controller
                        name="cors_enabled"
                        control={control}
                        render={({ field }) => (
                          <Switch
                            {...field}
                            checked={field.value}
                            edge="end"
                          />
                        )}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Allowed Domains */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DomainIcon />
                    Allowed Domains
                  </Typography>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddDomain}
                    size="small"
                  >
                    Add Domain
                  </Button>
                </Box>
                
                {domainFields.length === 0 ? (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                    No domain restrictions. All domains are allowed.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {domainFields.map((field, index) => (
                      <Grid item xs={12} sm={6} md={4} key={field.id}>
                        <Controller
                          name={`allowed_domains.${index}`}
                          control={control}
                          render={({ field: domainField }) => (
                            <FormControl fullWidth variant="outlined">
                              <InputLabel>Domain</InputLabel>
                              <OutlinedInput
                                {...domainField}
                                label="Domain"
                                placeholder="example.com"
                                endAdornment={
                                  <InputAdornment position="end">
                                    <IconButton
                                      onClick={() => handleRemoveDomain(index)}
                                      edge="end"
                                      color="error"
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </InputAdornment>
                                }
                              />
                            </FormControl>
                          )}
                        />
                      </Grid>
                    ))}
                  </Grid>
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Restrict API access to specific domains. Leave empty to allow all domains.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Security Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SecurityIcon />
                  Security Summary
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color={watchedValues.require_api_key ? 'success.main' : 'warning.main'}>
                        {watchedValues.require_api_key ? '🔒' : '🔓'}
                      </Typography>
                      <Typography variant="subtitle2">
                        API Key {watchedValues.require_api_key ? 'Required' : 'Optional'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary">
                        {watchedValues.max_requests_per_minute}
                      </Typography>
                      <Typography variant="subtitle2">
                        Max Requests/Min
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="secondary">
                        {watchedValues.api_key_expiry_days}d
                      </Typography>
                      <Typography variant="subtitle2">
                        Key Expiry
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color={watchedValues.cors_enabled ? 'success.main' : 'error.main'}>
                        {watchedValues.cors_enabled ? '✅' : '❌'}
                      </Typography>
                      <Typography variant="subtitle2">
                        CORS {watchedValues.cors_enabled ? 'Enabled' : 'Disabled'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            type="submit"
            variant="contained"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Security Settings'}
          </Button>
        </Box>
      </form>

      {/* Status Messages */}
      {updateMutation.isSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Security settings saved successfully!
        </Alert>
      )}
      
      {updateMutation.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to save security settings. Please try again.
        </Alert>
      )}

      {/* Security Recommendations */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom color="warning.main">
            Security Recommendations
          </Typography>
          <List dense>
            {!watchedValues.require_api_key && (
              <ListItem>
                <ListItemText
                  primary="Enable API Key Authentication"
                  secondary="Requiring API keys adds an essential layer of security"
                />
              </ListItem>
            )}
            {watchedValues.api_key_expiry_days > 180 && (
              <ListItem>
                <ListItemText
                  primary="Consider Shorter API Key Expiry"
                  secondary="Keys that expire more frequently reduce security risks"
                />
              </ListItem>
            )}
            {watchedValues.max_requests_per_minute > 500 && (
              <ListItem>
                <ListItemText
                  primary="High Rate Limit"
                  secondary="Consider lowering the rate limit to prevent abuse"
                />
              </ListItem>
            )}
            {domainFields.length === 0 && (
              <ListItem>
                <ListItemText
                  primary="No Domain Restrictions"
                  secondary="Consider adding allowed domains for better security"
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SecuritySettings;