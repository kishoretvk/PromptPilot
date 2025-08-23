import React, { useState, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Key,
  IntegrationInstructions,
  Palette,
  Notifications
} from '@mui/icons-material';
import APIKeyManagement from './APIKeyManagement';
import IntegrationsList from './IntegrationsList';
import ThemeSettings from './ThemeSettings';
import NotificationSettings from './NotificationSettings';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

export type SettingsTab = 'api-keys' | 'integrations' | 'theme' | 'notifications';

const SettingsIntegrations: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  }, []);

  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
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
          Settings & Integrations
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Configure your application settings, API keys, and third-party integrations
        </Typography>
      </Box>

      {/* Navigation Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          borderRadius: 2,
          mb: 3,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="settings tabs"
          variant={isMobile ? 'fullWidth' : undefined}
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              textTransform: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
              },
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab
            icon={<Key />}
            label="API Keys"
            iconPosition="start"
            {...a11yProps(0)}
          />
          <Tab
            icon={<IntegrationInstructions />}
            label="Integrations"
            iconPosition="start"
            {...a11yProps(1)}
          />
          <Tab
            icon={<Palette />}
            label="Theme"
            iconPosition="start"
            {...a11yProps(2)}
          />
          <Tab
            icon={<Notifications />}
            label="Notifications"
            iconPosition="start"
            {...a11yProps(3)}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ minHeight: '60vh' }}>
        <TabPanel value={activeTab} index={0}>
          <APIKeyManagement />
        </TabPanel>
        
        <TabPanel value={activeTab} index={1}>
          <IntegrationsList />
        </TabPanel>
        
        <TabPanel value={activeTab} index={2}>
          <ThemeSettings />
        </TabPanel>
        
        <TabPanel value={activeTab} index={3}>
          <NotificationSettings />
        </TabPanel>
      </Box>
    </Box>
  );
};

export default SettingsIntegrations;