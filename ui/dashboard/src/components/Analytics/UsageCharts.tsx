import React from 'react';
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
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
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { UsageMetrics } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface UsageChartsProps {
  data?: UsageMetrics;
  isLoading: boolean;
  timeRange: string;
}

const UsageCharts: React.FC<UsageChartsProps> = ({
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
          No usage data available for the selected time range.
        </Typography>
      </Box>
    );
  }

  // Generate sample data for demonstration
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
      case 'year':
        for (let i = 11; i >= 0; i--) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
          labels.push(month.toLocaleDateString('en-US', { month: 'short' }));
        }
        break;
      default:
        labels.push('No data');
    }
    
    return labels;
  };

  const timeLabels = generateTimeLabels(timeRange);
  
  // Generate sample usage data
  const generateUsageData = (length: number) => {
    return Array.from({ length }, () => Math.floor(Math.random() * 100) + 10);
  };

  const executionTrend = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Prompt Executions',
        data: generateUsageData(timeLabels.length),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Successful Executions',
        data: generateUsageData(timeLabels.length).map(val => Math.floor(val * 0.95)),
        borderColor: theme.palette.success.main,
        backgroundColor: alpha(theme.palette.success.main, 0.1),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const tokenUsage = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Input Tokens',
        data: generateUsageData(timeLabels.length).map(val => val * 150),
        backgroundColor: alpha(theme.palette.info.main, 0.7),
      },
      {
        label: 'Output Tokens',
        data: generateUsageData(timeLabels.length).map(val => val * 80),
        backgroundColor: alpha(theme.palette.secondary.main, 0.7),
      },
    ],
  };

  const promptPopularity = {
    labels: [
      'Customer Support',
      'Content Generation',
      'Code Review',
      'Translation',
      'Summarization',
    ],
    datasets: [
      {
        label: 'Usage Count',
        data: [245, 189, 156, 142, 98],
        backgroundColor: [
          alpha(theme.palette.primary.main, 0.8),
          alpha(theme.palette.secondary.main, 0.8),
          alpha(theme.palette.success.main, 0.8),
          alpha(theme.palette.warning.main, 0.8),
          alpha(theme.palette.error.main, 0.8),
        ],
      },
    ],
  };

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

  const barChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      x: {
        ...chartOptions.scales.x,
        stacked: true,
      },
      y: {
        ...chartOptions.scales.y,
        stacked: true,
        title: {
          display: true,
          text: 'Tokens',
        },
      },
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* Execution Trends */}
        <Card>
          <CardHeader
            title="Execution Trends"
            subheader={`Prompt execution patterns over the last ${timeRange}`}
          />
          <CardContent>
            <Box sx={{ height: 300 }}>
              <Line data={executionTrend} options={chartOptions} />
            </Box>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card sx={{ height: '100%' }}>
          <CardHeader title="Usage Summary" />
          <CardContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {data.total_executions?.toLocaleString() || '1,247'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Executions
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" color="secondary.main" fontWeight="bold">
                  {data.total_tokens?.toLocaleString() || '324,891'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tokens Processed
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {data.success_rate ? `${(data.success_rate * 100).toFixed(1)}%` : '98.2%'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </Box>

              <Box>
                <Typography variant="h4" color="warning.main" fontWeight="bold">
                  {data.average_response_time ? `${data.average_response_time.toFixed(2)}s` : '1.24s'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Response Time
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3, mt: 3 }}>
        {/* Token Usage */}
        <Card>
          <CardHeader
            title="Token Usage"
            subheader="Input and output token consumption"
          />
          <CardContent>
            <Box sx={{ height: 300 }}>
              <Bar data={tokenUsage} options={barChartOptions} />
            </Box>
          </CardContent>
        </Card>

        {/* Popular Prompts */}
        <Card>
          <CardHeader
            title="Popular Prompts"
            subheader="Most frequently used prompts"
          />
          <CardContent>
            <Box sx={{ height: 300 }}>
              <Bar
                data={promptPopularity}
                options={{
                  ...chartOptions,
                  indexAxis: 'y' as const,
                  scales: {
                    x: {
                      beginAtZero: true,
                      grid: {
                        color: alpha(theme.palette.text.secondary, 0.1),
                      },
                    },
                    y: {
                      grid: {
                        display: false,
                      },
                    },
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 3 }}>
        {/* Hourly Distribution */}
        <Card>
          <CardHeader
            title="Usage Distribution"
            subheader="Peak usage hours and patterns"
          />
          <CardContent>
            <Box sx={{ height: 250 }}>
              <Line
                data={{
                  labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
                  datasets: [
                    {
                      label: 'Executions per Hour',
                      data: Array.from({ length: 24 }, () => Math.floor(Math.random() * 50) + 5),
                      borderColor: theme.palette.primary.main,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      fill: true,
                      tension: 0.4,
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
                        text: 'Executions',
                      },
                    },
                    x: {
                      ...chartOptions.scales.x,
                      title: {
                        display: true,
                        text: 'Hour of Day',
                      },
                    },
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default UsageCharts;