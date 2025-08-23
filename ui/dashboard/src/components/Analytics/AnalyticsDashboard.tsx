import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  PieChart as PieChartIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as CostIcon,
  Speed as PerformanceIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { format, subDays, subMonths } from 'date-fns';
import { useAnalytics, useUsageMetrics, usePerformanceData, useCostAnalysis } from '../../hooks/useAnalytics';
import { UsageMetrics, PerformanceData, CostData } from '../../types/Analytics';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

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
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`,
  };
}

const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeTab, setActiveTab] = useState(0);
  const [timeRange, setTimeRange] = useState('30d');
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  
  const { data: analyticsData, isLoading: analyticsLoading, refetch: refetchAnalytics } = useAnalytics();
  const { data: usageMetrics, isLoading: usageLoading } = useUsageMetrics(timeRange);
  const { data: performanceData, isLoading: performanceLoading } = usePerformanceData(timeRange);
  const { data: costData, isLoading: costLoading } = useCostAnalysis(timeRange);
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    const endDate = new Date();
    let startDate: Date;
    
    switch (range) {
      case '7d':
        startDate = subDays(endDate, 7);
        break;
      case '30d':
        startDate = subDays(endDate, 30);
        break;
      case '90d':
        startDate = subDays(endDate, 90);
        break;
      case '1y':
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = subDays(endDate, 30);
    }
    
    setDateRange({
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd')
    });
  };
  
  // Usage chart data
  const usageChartData = {
    labels: usageMetrics?.executions_by_day?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Executions',
        data: usageMetrics?.executions_by_day?.map(item => item.count) || [],
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.dark,
        borderWidth: 1,
      },
      {
        label: 'Tokens',
        data: usageMetrics?.tokens_by_day?.map(item => item.count) || [],
        backgroundColor: theme.palette.secondary.main,
        borderColor: theme.palette.secondary.dark,
        borderWidth: 1,
      }
    ]
  };
  
  // Performance chart data
  const performanceChartData = {
    labels: performanceData?.latency_by_day?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Average Latency (ms)',
        data: performanceData?.latency_by_day?.map(item => item.average) || [],
        borderColor: theme.palette.success.main,
        backgroundColor: theme.palette.success.light,
        fill: true,
      },
      {
        label: 'Success Rate (%)',
        data: performanceData?.success_rate_by_day?.map(item => item.rate * 100) || [],
        borderColor: theme.palette.info.main,
        backgroundColor: theme.palette.info.light,
        fill: true,
      }
    ]
  };
  
  // Cost chart data
  const costChartData = {
    labels: costData?.costs_by_day?.map(item => item.date) || [],
    datasets: [
      {
        label: 'Cost ($)',
        data: costData?.costs_by_day?.map(item => item.amount) || [],
        backgroundColor: theme.palette.warning.main,
        borderColor: theme.palette.warning.dark,
        borderWidth: 1,
      }
    ]
  };
  
  // Provider distribution data
  const providerData = {
    labels: usageMetrics?.executions_by_provider?.map(item => item.provider) || [],
    datasets: [
      {
        data: usageMetrics?.executions_by_provider?.map(item => item.count) || [],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.info.main,
        ],
        borderWidth: 0,
      }
    ]
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme.palette.divider,
        }
      }
    }
  };
  
  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: false,
      }
    }
  };
  
  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Analytics Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Monitor usage, performance, and costs of your PromptPilot instance
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => handleTimeRangeChange(e.target.value as string)}
              >
                <MenuItem value="7d">Last 7 Days</MenuItem>
                <MenuItem value="30d">Last 30 Days</MenuItem>
                <MenuItem value="90d">Last 90 Days</MenuItem>
                <MenuItem value="1y">Last Year</MenuItem>
              </Select>
            </FormControl>
            
            <Tooltip title="Refresh Data">
              <IconButton 
                onClick={() => refetchAnalytics()}
                disabled={analyticsLoading}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
            >
              Export
            </Button>
          </Box>
        </Box>
        
        {/* Summary Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" color="primary.main">
                      {usageMetrics?.total_executions?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Executions
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.light', width: 56, height: 56 }}>
                    <TrendingUpIcon sx={{ color: 'primary.main' }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" color="secondary.main">
                      {usageMetrics?.total_tokens?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Tokens Used
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.light', width: 56, height: 56 }}>
                    <AnalyticsIcon sx={{ color: 'secondary.main' }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" color="success.main">
                      {costData?.total_cost ? `$${costData.total_cost.toFixed(2)}` : '$0.00'}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Cost
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.light', width: 56, height: 56 }}>
                    <CostIcon sx={{ color: 'success.main' }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4" color="info.main">
                      {usageMetrics?.success_rate ? `${(usageMetrics.success_rate * 100).toFixed(1)}%` : '0%'}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Success Rate
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'info.light', width: 56, height: 56 }}>
                    <SuccessIcon sx={{ color: 'info.main' }} />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons="auto"
        >
          <Tab icon={<BarChartIcon />} label="Usage" {...a11yProps(0)} />
          <Tab icon={<LineChartIcon />} label="Performance" {...a11yProps(1)} />
          <Tab icon={<PieChartIcon />} label="Costs" {...a11yProps(2)} />
          <Tab icon={<AnalyticsIcon />} label="Providers" {...a11yProps(3)} />
        </Tabs>
      </Paper>
      
      {/* Tab Content */}
      <Box sx={{ minHeight: '60vh' }}>
        {/* Usage Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardHeader
                  title="Executions & Tokens Over Time"
                  subheader={`Showing data for the last ${timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : timeRange === '90d' ? '90 days' : 'year'}`}
                />
                <CardContent sx={{ height: 400 }}>
                  {usageLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Bar data={usageChartData} options={chartOptions} />
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Card>
                <CardHeader
                  title="Top Prompts"
                  subheader="Most frequently executed prompts"
                />
                <CardContent>
                  {analyticsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {analyticsData?.top_prompts?.slice(0, 5).map((prompt, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                            {prompt.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {prompt.executions.toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Performance Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardHeader
                  title="Latency & Success Rate"
                  subheader={`Performance metrics over the last ${timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : timeRange === '90d' ? '90 days' : 'year'}`}
                />
                <CardContent sx={{ height: 400 }}>
                  {performanceLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Line data={performanceChartData} options={chartOptions} />
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Card>
                <CardHeader
                  title="Error Analysis"
                  subheader="Common error types and frequencies"
                />
                <CardContent>
                  {analyticsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {analyticsData?.error_analysis?.slice(0, 5).map((error, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ErrorIcon sx={{ color: 'error.main', fontSize: 'small' }} />
                            <Typography variant="body2" noWrap sx={{ maxWidth: '70%' }}>
                              {error.type}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {error.count.toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Costs Tab */}
        <TabPanel value={activeTab} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardHeader
                  title="Cost Analysis"
                  subheader={`Daily costs over the last ${timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : timeRange === '90d' ? '90 days' : 'year'}`}
                />
                <CardContent sx={{ height: 400 }}>
                  {costLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Bar data={costChartData} options={chartOptions} />
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Card>
                <CardHeader
                  title="Cost Breakdown"
                  subheader="Costs by provider"
                />
                <CardContent sx={{ height: 400 }}>
                  {costLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : costData?.costs_by_provider && costData.costs_by_provider.length > 0 ? (
                    <Pie data={providerData} options={pieChartOptions} />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography color="text.secondary">No cost data available</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        {/* Providers Tab */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={8}>
              <Card>
                <CardHeader
                  title="Provider Distribution"
                  subheader="Executions by AI provider"
                />
                <CardContent sx={{ height: 400 }}>
                  {usageLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <CircularProgress />
                    </Box>
                  ) : usageMetrics?.executions_by_provider && usageMetrics.executions_by_provider.length > 0 ? (
                    <Pie data={providerData} options={pieChartOptions} />
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                      <Typography color="text.secondary">No provider data available</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} lg={4}>
              <Card>
                <CardHeader
                  title="Provider Performance"
                  subheader="Latency and success rates by provider"
                />
                <CardContent>
                  {performanceLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {performanceData?.provider_performance?.map((provider, index) => (
                        <Box key={index}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2" fontWeight="medium">
                              {provider.provider}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {provider.count.toLocaleString()} executions
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">
                              Avg. Latency: {provider.average_latency.toFixed(2)}ms
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Success: {(provider.success_rate * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;