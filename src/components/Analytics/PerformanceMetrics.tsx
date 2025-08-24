import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  LinearProgress,
  Chip,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { PerformanceData } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceMetricsProps {
  data?: PerformanceData;
  isLoading: boolean;
  timeRange: string;
}

const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({
  data,
  isLoading,
  timeRange,
}) => {
  const theme = useTheme();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No performance data available for the selected time range.
        </Typography>
      </Box>
    );
  }

  // Generate sample performance data
  const generateTimeLabels = (range: string) => {
    const now = new Date();
    const labels = [];
    
    switch (range) {
      case 'day':
        for (let i = 23; i >= 0; i--) {
          const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
          labels.push(hour.getHours().toString().padStart(2, '0') + ':00');
        }
        break;
      case 'week':
        for (let i = 6; i >= 0; i--) {
          const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          labels.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
        }
        break;
      case 'month':
        for (let i = 29; i >= 0; i--) {
          const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          labels.push(day.getDate().toString());
        }
        break;
      default:
        for (let i = 11; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(month.toLocaleDateString('en-US', { month: 'short' }));
        }
    }
    
    return labels;
  };

  const timeLabels = generateTimeLabels(timeRange);

  // Sample data generation
  const latencyData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Average Latency',
        data: timeLabels.map(() => Math.random() * 2000 + 500),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        fill: true,
        tension: 0.4,
      },
      {
        label: '95th Percentile',
        data: timeLabels.map(() => Math.random() * 3000 + 1500),
        borderColor: theme.palette.warning.main,
        backgroundColor: alpha(theme.palette.warning.main, 0.1),
        fill: false,
        tension: 0.4,
      },
    ],
  };

  const throughputData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Requests per Minute',
        data: timeLabels.map(() => Math.floor(Math.random() * 50) + 10),
        backgroundColor: alpha(theme.palette.secondary.main, 0.7),
      },
    ],
  };

  const errorRateData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Error Rate (%)',
        data: timeLabels.map(() => Math.random() * 5),
        borderColor: theme.palette.error.main,
        backgroundColor: alpha(theme.palette.error.main, 0.1),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Performance metrics by provider
  const providerPerformance = [
    { name: 'OpenAI', latency: 1245, throughput: 45, errorRate: 1.2, status: 'healthy' },
    { name: 'Anthropic', latency: 987, throughput: 38, errorRate: 0.8, status: 'healthy' },
    { name: 'Google', latency: 1567, throughput: 32, errorRate: 2.1, status: 'warning' },
    { name: 'Azure', latency: 1123, throughput: 41, errorRate: 1.5, status: 'healthy' },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: alpha(theme.palette.text.secondary, 0.1),
        },
      },
      x: {
        grid: {
          color: alpha(theme.palette.text.secondary, 0.1),
        },
      },
    },
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Latency Trends */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardHeader
              title="Response Latency"
              subheader="Average and 95th percentile response times"
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Line data={latencyData} options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    y: {
                      ...chartOptions.scales.y,
                      title: {
                        display: true,
                        text: 'Latency (ms)',
                      },
                    },
                  },
                }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Key Metrics */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Performance Overview" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Latency
                  </Typography>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    {data.provider_performance && data.provider_performance.length > 0 ? 
                      `${(data.provider_performance.reduce((sum, p) => sum + p.avg_response_time, 0) / data.provider_performance.length).toFixed(0)}ms` 
                      : '1,247ms'}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={75}
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    95th Percentile
                  </Typography>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    {data.provider_performance && data.provider_performance.length > 0 ? 
                      `${(data.provider_performance.reduce((sum, p) => sum + p.avg_response_time * 1.5, 0) / data.provider_performance.length).toFixed(0)}ms` 
                      : '2,456ms'}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={60}
                    color="warning"
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Throughput
                  </Typography>
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    {data.provider_performance && data.provider_performance.length > 0 ? 
                      `${(data.provider_performance.reduce((sum, p) => sum + p.total_requests, 0) / 60).toFixed(0)} req/min` 
                      : '42 req/min'}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={85}
                    color="secondary"
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Error Rate
                  </Typography>
                  <Typography variant="h4" color="error.main" fontWeight="bold">
                    {data.provider_performance && data.provider_performance.length > 0 ? 
                      `${((1 - data.provider_performance.reduce((sum, p) => sum + p.success_rate, 0) / data.provider_performance.length) * 100).toFixed(1)}%` 
                      : '1.2%'}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={12}
                    color="error"
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Throughput */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Throughput"
              subheader="Requests processed per minute"
            />
            <CardContent>
              <Box sx={{ height: 250 }}>
                <Bar data={throughputData} options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    y: {
                      ...chartOptions.scales.y,
                      title: {
                        display: true,
                        text: 'Requests/min',
                      },
                    },
                  },
                }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Error Rate */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Error Rate"
              subheader="Failed requests over time"
            />
            <CardContent>
              <Box sx={{ height: 250 }}>
                <Line data={errorRateData} options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    y: {
                      ...chartOptions.scales.y,
                      title: {
                        display: true,
                        text: 'Error Rate (%)',
                      },
                      max: 10,
                    },
                  },
                }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Provider Performance Comparison */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Provider Performance Comparison"
              subheader="Performance metrics across different LLM providers"
            />
            <CardContent>
              <Grid container spacing={2}>
                {providerPerformance.map((provider) => (
                  <Grid item xs={12} sm={6} md={3} key={provider.name}>
                    <Paper
                      sx={{
                        p: 2,
                        border: `1px solid ${alpha(getStatusColor(provider.status), 0.3)}`,
                        backgroundColor: alpha(getStatusColor(provider.status), 0.05),
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight="bold">
                          {provider.name}
                        </Typography>
                        <Chip
                          label={provider.status}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(provider.status),
                            color: 'white',
                            textTransform: 'capitalize',
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Latency:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {provider.latency}ms
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Throughput:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {provider.throughput}/min
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" color="text.secondary">
                            Error Rate:
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {provider.errorRate}%
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Distribution */}
        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Latency Distribution"
              subheader="Response time distribution over the selected period"
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Bar
                  data={{
                    labels: ['0-100ms', '100-500ms', '500ms-1s', '1-2s', '2-5s', '5s+'],
                    datasets: [
                      {
                        label: 'Request Count',
                        data: [45, 234, 567, 345, 123, 23],
                        backgroundColor: [
                          alpha(theme.palette.success.main, 0.8),
                          alpha(theme.palette.info.main, 0.8),
                          alpha(theme.palette.primary.main, 0.8),
                          alpha(theme.palette.warning.main, 0.8),
                          alpha(theme.palette.error.main, 0.8),
                          alpha(theme.palette.grey[600], 0.8),
                        ],
                      },
                    ],
                  }}
                  options={{
                    ...chartOptions,
                    scales: {
                      ...chartOptions.scales,
                      y: {
                        ...chartOptions.scales.y,
                        title: {
                          display: true,
                          text: 'Number of Requests',
                        },
                      },
                      x: {
                        ...chartOptions.scales.x,
                        title: {
                          display: true,
                          text: 'Response Time Range',
                        },
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PerformanceMetrics;