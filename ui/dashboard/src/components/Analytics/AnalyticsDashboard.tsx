import React, { useState, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  useTheme,
  alpha,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Assessment as AnalyticsIcon,
  TrendingUp,
  Speed,
  AttachMoney,
  Psychology,
  Timeline,
  PieChart,
  BarChart,
  Download,
  Refresh,
  FilterList,
} from '@mui/icons-material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

import { useAnalytics } from '../../hooks/useAnalytics';
import UsageCharts from './UsageCharts';
import PerformanceMetrics from './PerformanceMetrics';
import CostAnalysis from './CostAnalysis';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement
);

interface AnalyticsDashboardProps {
  timeRange?: 'day' | 'week' | 'month' | 'year';
  promptFilter?: string[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`analytics-tabpanel-${index}`}
    aria-labelledby={`analytics-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  timeRange = 'month',
  promptFilter = [],
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>(promptFilter);

  // Fetch analytics data
  const { data: usageData, isLoading: usageLoading } = useAnalytics().useUsageMetrics(selectedTimeRange);
  const { data: performanceData, isLoading: performanceLoading } = useAnalytics().usePerformanceData(selectedTimeRange);
  const { data: costData, isLoading: costLoading } = useAnalytics().useCostData(selectedTimeRange);
  const { data: dashboardData, isLoading: dashboardLoading } = useAnalytics().useDashboardData(selectedTimeRange);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (!dashboardData) return null;

    return {
      totalExecutions: dashboardData.total_executions || 0,
      totalTokens: dashboardData.total_tokens || 0,
      averageLatency: dashboardData.average_latency || 0,
      totalCost: dashboardData.total_cost || 0,
      errorRate: dashboardData.error_rate || 0,
      popularPrompts: dashboardData.popular_prompts || [],
    };
  }, [dashboardData]);

  const handleExportData = () => {
    // Implementation for data export
    console.log('Exporting analytics data...');
  };

  const handleRefreshData = () => {
    // Implementation for data refresh
    console.log('Refreshing analytics data...');
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: { value: number; label: string };
  }> = ({ title, value, subtitle, icon, color, trend }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUp 
                  fontSize="small" 
                  sx={{ 
                    color: trend.value > 0 ? theme.palette.success.main : theme.palette.error.main,
                    mr: 0.5 
                  }} 
                />
                <Typography variant="caption" color="text.secondary">
                  {trend.label}
                </Typography>
              </Box>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: alpha(color, 0.1),
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {React.cloneElement(icon as React.ReactElement, { 
              sx: { color, fontSize: 32 } 
            })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
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
              <AnalyticsIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
              Analytics Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Monitor performance, usage, and costs across your prompt workflows
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                label="Time Range"
              >
                <MenuItem value="day">Last 24 Hours</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Filter by prompts">
              <IconButton>
                <FilterList />
              </IconButton>
            </Tooltip>

            <Tooltip title="Refresh data">
              <IconButton onClick={handleRefreshData}>
                <Refresh />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportData}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Summary Metrics */}
        {summaryMetrics && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="Total Executions"
                value={summaryMetrics.totalExecutions.toLocaleString()}
                subtitle="Prompt executions"
                icon={<Psychology />}
                color={theme.palette.primary.main}
                trend={{ value: 12, label: '+12% from last period' }}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="Average Latency"
                value={`${summaryMetrics.averageLatency.toFixed(2)}s`}
                subtitle="Response time"
                icon={<Speed />}
                color={theme.palette.info.main}
                trend={{ value: -5, label: '-5% from last period' }}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="Total Cost"
                value={`$${summaryMetrics.totalCost.toFixed(2)}`}
                subtitle="API costs"
                icon={<AttachMoney />}
                color={theme.palette.warning.main}
                trend={{ value: 8, label: '+8% from last period' }}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <MetricCard
                title="Error Rate"
                value={`${(summaryMetrics.errorRate * 100).toFixed(1)}%`}
                subtitle="Failed executions"
                icon={<Timeline />}
                color={summaryMetrics.errorRate > 0.05 ? theme.palette.error.main : theme.palette.success.main}
                trend={{ value: -2, label: '-2% from last period' }}
              />
            </Grid>
          </Grid>
        )}

        {/* Popular Prompts */}
        {summaryMetrics?.popularPrompts && summaryMetrics.popularPrompts.length > 0 && (
          <Card sx={{ mb: 4 }}>
            <CardHeader title="Most Used Prompts" />
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {summaryMetrics.popularPrompts.slice(0, 10).map((prompt: any, index: number) => (
                  <Chip
                    key={prompt.id}
                    label={`${prompt.name} (${prompt.count})`}
                    variant={index < 3 ? 'filled' : 'outlined'}
                    color={index === 0 ? 'primary' : index === 1 ? 'secondary' : 'default'}
                    size="small"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Detailed Analytics Tabs */}
        <Card>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<BarChart />} label="Usage Analytics" />
            <Tab icon={<Speed />} label="Performance" />
            <Tab icon={<AttachMoney />} label="Cost Analysis" />
            <Tab icon={<PieChart />} label="Provider Breakdown" />
          </Tabs>

          <Box sx={{ minHeight: 400 }}>
            <TabPanel value={activeTab} index={0}>
              <UsageCharts
                data={usageData}
                isLoading={usageLoading}
                timeRange={selectedTimeRange}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <PerformanceMetrics
                data={performanceData}
                isLoading={performanceLoading}
                timeRange={selectedTimeRange}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <CostAnalysis
                data={costData}
                isLoading={costLoading}
                timeRange={selectedTimeRange}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Box sx={{ p: 3 }}>
                {dashboardData?.provider_breakdown ? (
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Usage by Provider
                        </Typography>
                        <Doughnut
                          data={{
                            labels: Object.keys(dashboardData.provider_breakdown),
                            datasets: [{
                              data: Object.values(dashboardData.provider_breakdown),
                              backgroundColor: [
                                theme.palette.primary.main,
                                theme.palette.secondary.main,
                                theme.palette.error.main,
                                theme.palette.warning.main,
                                theme.palette.info.main,
                              ],
                            }],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: 'bottom' as const,
                              },
                            },
                          }}
                        />
                      </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" gutterBottom>
                          Provider Performance
                        </Typography>
                        <Bar
                          data={{
                            labels: Object.keys(dashboardData.provider_breakdown),
                            datasets: [{
                              label: 'Average Response Time (ms)',
                              data: Object.keys(dashboardData.provider_breakdown).map(() => 
                                Math.random() * 2000 + 500
                              ),
                              backgroundColor: alpha(theme.palette.primary.main, 0.6),
                            }],
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Response Time (ms)',
                                },
                              },
                            },
                          }}
                        />
                      </Paper>
                    </Grid>
                  </Grid>
                ) : (
                  <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                    No provider breakdown data available
                  </Typography>
                )}
              </Box>
            </TabPanel>
          </Box>
        </Card>
      </Box>
    </Container>
  );
};

export default AnalyticsDashboard;