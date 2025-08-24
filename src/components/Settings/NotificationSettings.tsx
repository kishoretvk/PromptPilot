import React, { useCallback } from 'react';
import {
  Box,
  Grid,
  Typography,
  Card,
  CardContent,
  Button,
  Switch,
  TextField,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Chat as SlackIcon,
  Webhook as WebhookIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '../../hooks/useSettings';

interface NotificationFormData {
  email_notifications: boolean;
  slack_notifications: boolean;
  webhook_url?: string;
  notification_types: {
    pipeline_completion: boolean;
    error_alerts: boolean;
    usage_warnings: boolean;
    system_updates: boolean;
  };
}

const notificationTypeConfig = [
  {
    key: 'pipeline_completion',
    label: 'Pipeline Completion',
    description: 'Get notified when your pipelines finish executing',
    icon: <CheckIcon />,
    severity: 'success' as const,
  },
  {
    key: 'error_alerts',
    label: 'Error Alerts',
    description: 'Receive alerts when errors occur in your prompts or pipelines',
    icon: <ErrorIcon />,
    severity: 'error' as const,
  },
  {
    key: 'usage_warnings',
    label: 'Usage Warnings',
    description: 'Get warned when approaching usage limits',
    icon: <WarningIcon />,
    severity: 'warning' as const,
  },
  {
    key: 'system_updates',
    label: 'System Updates',
    description: 'Stay informed about new features and system maintenance',
    icon: <InfoIcon />,
    severity: 'info' as const,
  },
];

const NotificationSettings: React.FC = () => {
  const { data: notificationSettings, isLoading } = useNotificationSettings();
  const updateMutation = useUpdateNotificationSettings();
  
  const { control, handleSubmit, watch } = useForm<NotificationFormData>({
    defaultValues: {
      email_notifications: notificationSettings?.email_notifications || false,
      slack_notifications: notificationSettings?.slack_notifications || false,
      webhook_url: notificationSettings?.webhook_url || '',
      notification_types: {
        pipeline_completion: notificationSettings?.notification_types?.pipeline_completion || false,
        error_alerts: notificationSettings?.notification_types?.error_alerts || true,
        usage_warnings: notificationSettings?.notification_types?.usage_warnings || true,
        system_updates: notificationSettings?.notification_types?.system_updates || false,
      },
    },
  });

  const watchedValues = watch();

  const handleSave = useCallback((data: NotificationFormData) => {
    updateMutation.mutate(data);
  }, [updateMutation]);

  const handleTestNotification = useCallback((type: 'email' | 'slack' | 'webhook') => {
    // This would typically call an API endpoint to send a test notification
    console.log(`Testing ${type} notification`);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography>Loading notification settings...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Notification Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Configure how and when you want to receive notifications from PromptPilot
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(handleSave)}>
        <Grid container spacing={4}>
          {/* Notification Channels */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon />
                  Notification Channels
                </Typography>
                
                <List>
                  {/* Email Notifications */}
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Notifications"
                      secondary="Receive notifications via email"
                    />
                    <ListItemSecondaryAction>
                      <Controller
                        name="email_notifications"
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
                  
                  <Divider variant="inset" component="li" />
                  
                  {/* Slack Notifications */}
                  <ListItem>
                    <ListItemIcon>
                      <SlackIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary="Slack Notifications"
                      secondary="Send notifications to your Slack workspace"
                    />
                    <ListItemSecondaryAction>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {watchedValues.slack_notifications && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleTestNotification('slack')}
                          >
                            Test
                          </Button>
                        )}
                        <Controller
                          name="slack_notifications"
                          control={control}
                          render={({ field }) => (
                            <Switch
                              {...field}
                              checked={field.value}
                              edge="end"
                            />
                          )}
                        />
                      </Box>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Webhook Configuration */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WebhookIcon />
                  <Typography variant="h6">Webhook Configuration</Typography>
                  {watchedValues.webhook_url && (
                    <Chip label="Configured" size="small" color="success" />
                  )}
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Controller
                      name="webhook_url"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="Webhook URL"
                          fullWidth
                          placeholder="https://your-webhook-endpoint.com"
                          helperText="Enter a webhook URL to receive notifications via HTTP POST requests"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button
                        variant="outlined"
                        onClick={() => handleTestNotification('webhook')}
                        disabled={!watchedValues.webhook_url}
                      >
                        Test Webhook
                      </Button>
                      <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
                        We'll send a test payload to verify the endpoint
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Notification Types */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Types
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Choose which events should trigger notifications
                </Typography>
                
                <List>
                  {notificationTypeConfig.map((config, index) => (
                    <React.Fragment key={config.key}>
                      <ListItem>
                        <ListItemIcon sx={{ color: `${config.severity}.main` }}>
                          {config.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={config.label}
                          secondary={config.description}
                        />
                        <ListItemSecondaryAction>
                          <Controller
                            name={`notification_types.${config.key as keyof NotificationFormData['notification_types']}`}
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
                      {index < notificationTypeConfig.length - 1 && (
                        <Divider variant="inset" component="li" />
                      )}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Notification Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Here's how your notifications will be delivered:
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {/* Active Channels */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Active Channels:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {watchedValues.email_notifications && (
                        <Chip icon={<EmailIcon />} label="Email" size="small" />
                      )}
                      {watchedValues.slack_notifications && (
                        <Chip icon={<SlackIcon />} label="Slack" size="small" />
                      )}
                      {watchedValues.webhook_url && (
                        <Chip icon={<WebhookIcon />} label="Webhook" size="small" />
                      )}
                      {!watchedValues.email_notifications && 
                       !watchedValues.slack_notifications && 
                       !watchedValues.webhook_url && (
                        <Chip label="No channels configured" size="small" color="default" />
                      )}
                    </Box>
                  </Box>
                  
                  {/* Active Notification Types */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Active Notification Types:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {notificationTypeConfig
                        .filter(config => watchedValues.notification_types[config.key as keyof typeof watchedValues.notification_types])
                        .map(config => (
                          <Chip
                            key={config.key}
                            label={config.label}
                            size="small"
                            color={config.severity}
                            icon={config.icon}
                          />
                        ))
                      }
                      {notificationTypeConfig.every(config => 
                        !watchedValues.notification_types[config.key as keyof typeof watchedValues.notification_types]
                      ) && (
                        <Chip label="No notification types selected" size="small" color="default" />
                      )}
                    </Box>
                  </Box>
                </Box>
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
            {updateMutation.isPending ? 'Saving...' : 'Save Notification Settings'}
          </Button>
        </Box>
      </form>

      {/* Status Messages */}
      {updateMutation.isSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Notification settings saved successfully!
        </Alert>
      )}
      
      {updateMutation.error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Failed to save notification settings. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default NotificationSettings;