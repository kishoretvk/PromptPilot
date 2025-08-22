import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Tabs,
  Tab,
  Paper,
  Alert,
  Breadcrumbs,
  Link,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Key as KeyIcon,
  IntegrationInstructions as IntegrationIcon,
  Palette as ThemeIcon,
  Notifications as NotificationIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useSettings } from '../../hooks/useSettings';
import APIKeyManagement from './APIKeyManagement';
import IntegrationsList from './IntegrationsList';
import ThemeSettings from './ThemeSettings';
import NotificationSettings from './NotificationSettings';
import SecuritySettings from './SecuritySettings';

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

export type SettingsTab = 'api-keys' | 'integrations' | 'theme' | 'notifications' | 'security';

interface SettingsIntegrationsProps {
  activeTab?: SettingsTab;
  onTabChange?: (tab: SettingsTab) => void;
}

const SettingsIntegrations: React.FC<SettingsIntegrationsProps> = ({
  activeTab = 'api-keys',
  onTabChange,
}) => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState<SettingsTab>(activeTab);
  
  const { data: settings, isLoading, error } = useSettings();
  
  // Get tab index from tab name
  const getTabIndex = (tab: SettingsTab): number => {
    const tabs: SettingsTab[] = ['api-keys', 'integrations', 'theme', 'notifications', 'security'];
    return tabs.indexOf(tab);
  };
  
  // Get tab name from index
  const getTabFromIndex = (index: number): SettingsTab => {
    const tabs: SettingsTab[] = ['api-keys', 'integrations', 'theme', 'notifications', 'security'];
    return tabs[index] || 'api-keys';
  };
  
  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    const newTab = getTabFromIndex(newValue);
    setCurrentTab(newTab);
    if (onTabChange) {
      onTabChange(newTab);
    }
  }, [onTabChange]);

  if (isLoading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="h6">Loading settings...</Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="error">
            Failed to load settings. Please try again later.
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
            <Link color="inherit" href="/">
              Dashboard
            </Link>
            <Typography color="text.primary">Settings & Integrations</Typography>
          </Breadcrumbs>
          
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
            value={getTabIndex(currentTab)}
            onChange={handleTabChange}
            aria-label="settings tabs"
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontSize: '0.95rem',
                fontWeight: 500,
                '&.Mui-selected': {
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                },
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab
              icon={<KeyIcon />}
              label="API Keys"
              iconPosition="start"
              {...a11yProps(0)}
            />
            <Tab
              icon={<IntegrationIcon />}
              label="Integrations"
              iconPosition="start"
              {...a11yProps(1)}
            />
            <Tab
              icon={<ThemeIcon />}
              label="Theme"
              iconPosition="start"
              {...a11yProps(2)}
            />
            <Tab
              icon={<NotificationIcon />}
              label="Notifications"
              iconPosition="start"
              {...a11yProps(3)}
            />
            <Tab
              icon={<SecurityIcon />}
              label="Security"
              iconPosition="start"
              {...a11yProps(4)}
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Box sx={{ minHeight: '60vh' }}>
          <TabPanel value={getTabIndex(currentTab)} index={0}>
            <APIKeyManagement />
          </TabPanel>
          
          <TabPanel value={getTabIndex(currentTab)} index={1}>
            <IntegrationsList />
          </TabPanel>
          
          <TabPanel value={getTabIndex(currentTab)} index={2}>
            <ThemeSettings />
          </TabPanel>
          
          <TabPanel value={getTabIndex(currentTab)} index={3}>
            <NotificationSettings />
          </TabPanel>
          
          <TabPanel value={getTabIndex(currentTab)} index={4}>
            <SecuritySettings />
          </TabPanel>
        </Box>
      </Box>
    </Container>
  );
};

export default SettingsIntegrations;