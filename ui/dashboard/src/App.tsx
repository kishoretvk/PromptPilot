import React, { Suspense, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Container,
  useTheme,
  useMediaQuery,
  Breadcrumbs,
  Link as MuiLink,
  CssBaseline,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  History,
  AccountTree,
  Analytics,
  Settings,
  IntegrationInstructions,
  Home,
  ChevronLeft,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { ErrorBoundary } from 'react-error-boundary';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClientProvider, QueryClient, useQuery } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
// import { toast } from 'react-toastify';
import ErrorFallback from './components/common/ErrorFallback';

// Lazy load components for better performance
const PromptManager = React.lazy(() => import('./components/PromptManager/PromptManager'));
const PromptHistory = React.lazy(() => import('./components/PromptHistory/PromptHistory'));
const PipelineBuilder = React.lazy(() => import('./components/PipelineBuilder/PipelineBuilder'));
const AnalyticsDashboard = React.lazy(() => import('./components/Analytics/AnalyticsDashboard'));
const SettingsIntegrations = React.lazy(() => import('./components/Settings/SettingsIntegrations'));
const MonitoringDashboard = React.lazy(() => import('./components/MonitoringDashboard'));

// Navigation configuration
interface NavigationItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  component: React.ComponentType;
}

const navigationItems: NavigationItem[] = [
  {
    path: '/',
    label: 'Prompt Management',
    icon: <Dashboard />,
    component: PromptManager,
  },
  {
    path: '/history',
    label: 'Prompt History',
    icon: <History />,
    component: PromptHistory,
  },
  {
    path: '/pipeline',
    label: 'Pipeline Builder',
    icon: <AccountTree />,
    component: PipelineBuilder,
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: <Analytics />,
    component: AnalyticsDashboard,
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: <Settings />,
    component: SettingsIntegrations,
  },
  {
    path: '/integrations',
    label: 'Integrations',
    icon: <IntegrationInstructions />,
    component: SettingsIntegrations,
  },
];

const drawerWidth = 280;

// Loading component
function LoadingFallback() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="400px"
      flexDirection="column"
      gap={2}
    >
      <CircularProgress size={48} />
      <Typography variant="body1" color="text.secondary">
        Loading...
      </Typography>
    </Box>
  );
}

// Breadcrumb component
function AppBreadcrumbs() {
  const location = useLocation();
  const currentItem = navigationItems.find(item => item.path === location.pathname);
  
  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      <MuiLink
        underline="hover"
        color="inherit"
        href="/"
        sx={{ display: 'flex', alignItems: 'center' }}
      >
        <Home sx={{ mr: 0.5 }} fontSize="inherit" />
        Home
      </MuiLink>
      {currentItem && (
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          {currentItem.icon && React.cloneElement(currentItem.icon as React.ReactElement<any>, { sx: { mr: 0.5 } as any, fontSize: 'inherit' })}
          {currentItem.label}
        </Typography>
      )}
    </Breadcrumbs>
  );
}

// Sidebar navigation component
function NavigationDrawer({ open, onClose, onNavigate }: { open: boolean; onClose: () => void; onNavigate: (path: string) => void }) {
  const location = useLocation();
  const theme = useTheme();
  
  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={open}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
          PromptPilot
        </Typography>
        <IconButton onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => onNavigate(item.path)}
                sx={{
                  '&.Mui-selected': {
                    backgroundColor: theme.palette.primary.light + '20',
                    '&:hover': {
                      backgroundColor: theme.palette.primary.light + '30',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? theme.palette.primary.main : 'inherit',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  sx={{
                    color: isActive ? theme.palette.primary.main : 'inherit',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}

// Main app layout component
function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const handleDrawerToggle = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);
  
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [navigate, isMobile]);
  
  React.useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
    } else {
      setDrawerOpen(true);
    }
  }, [isMobile]);
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: theme.shadows[1],
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            PromptPilot Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      
      <NavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={handleNavigate}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: drawerOpen ? 0 : `-${drawerWidth}px`,
          ...(isMobile && {
            marginLeft: 0,
          }),
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ mt: 3, mb: 3 }}>
          <AppBreadcrumbs />
          <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={(error, errorInfo) => {
              console.error('Route Error:', error, errorInfo);
              // toast.error('An error occurred while loading this page');
            }}
          >
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {navigationItems.map((item) => (
                  <Route
                    key={item.path}
                    path={item.path}
                    element={<item.component />}
                  />
                ))}
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Container>
      </Box>
    </Box>
  );
}

// Theme setup
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3498db',
    },
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <Router>
          <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" open={open}>
              <Toolbar>
                <IconButton
                  color="inherit"
                  aria-label="open drawer"
                  onClick={toggleDrawer}
                  edge="start"
                  sx={{ mr: 2, ...(open && { display: 'none' }) }}
                >
                  <MenuIcon />
                </IconButton>
                <Typography variant="h6" noWrap component="div">
                  PromptPilot Dashboard
                </Typography>
              </Toolbar>
            </AppBar>
            <Drawer variant="permanent" open={open}>
              <Toolbar
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  px: [1],
                }}
              >
                <IconButton onClick={toggleDrawer}>
                  <ChevronLeft />
                </IconButton>
              </Toolbar>
              <Divider />
              <List>
                <ListItem key="dashboard" disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    component={Link}
                    to="/"
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      <Dashboard />
                    </ListItemIcon>
                    <ListItemText primary="Dashboard" sx={{ opacity: open ? 1 : 0 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem key="history" disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    component={Link}
                    to="/history"
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      <History />
                    </ListItemIcon>
                    <ListItemText primary="History" sx={{ opacity: open ? 1 : 0 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem key="pipeline" disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    component={Link}
                    to="/pipeline"
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      <AccountTree />
                    </ListItemIcon>
                    <ListItemText primary="Pipeline" sx={{ opacity: open ? 1 : 0 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem key="analytics" disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    component={Link}
                    to="/analytics"
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      <Analytics />
                    </ListItemIcon>
                    <ListItemText primary="Analytics" sx={{ opacity: open ? 1 : 0 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem key="monitoring" disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    component={Link}
                    to="/monitoring"
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      <SpeedIcon />
                    </ListItemIcon>
                    <ListItemText primary="Monitoring" sx={{ opacity: open ? 1 : 0 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem key="settings" disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    component={Link}
                    to="/settings"
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      <Settings />
                    </ListItemIcon>
                    <ListItemText primary="Settings" sx={{ opacity: open ? 1 : 0 }} />
                  </ListItemButton>
                </ListItem>
                <ListItem key="integrations" disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    component={Link}
                    to="/integrations"
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                      }}
                    >
                      <IntegrationInstructions />
                    </ListItemIcon>
                    <ListItemText primary="Integrations" sx={{ opacity: open ? 1 : 0 }} />
                  </ListItemButton>
                </ListItem>
              </List>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
              <DrawerHeader />
              <Routes>
                <Route path="/" element={<PromptManager />} />
                <Route path="/history" element={<PromptHistory />} />
                <Route path="/pipeline" element={<PipelineBuilder />} />
                <Route path="/analytics" element={<AnalyticsDashboard />} />
                <Route path="/monitoring" element={<MonitoringDashboard />} />
                <Route path="/settings" element={<SettingsIntegrations />} />
                <Route path="/integrations" element={<SettingsIntegrations />} />
              </Routes>
            </Box>
          </Box>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
