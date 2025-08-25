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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { CostData } from '../../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface CostAnalysisProps {
  data?: CostData;
  isLoading: boolean;
  timeRange: string;
}

const CostAnalysis: React.FC<CostAnalysisProps> = ({
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
          No cost data available for the selected time range.
        </Typography>
      </Box>
    );
  }

  // Generate sample cost data
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

  // Sample cost trends
  const costTrends = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Total Cost',
        data: timeLabels.map(() => Math.random() * 50 + 10),
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Input Tokens Cost',
        data: timeLabels.map(() => Math.random() * 20 + 5),
        borderColor: theme.palette.info.main,
        backgroundColor: alpha(theme.palette.info.main, 0.1),
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Output Tokens Cost',
        data: timeLabels.map(() => Math.random() * 30 + 8),
        borderColor: theme.palette.secondary.main,
        backgroundColor: alpha(theme.palette.secondary.main, 0.1),
        fill: false,
        tension: 0.4,
      },
    ],
  };

  // Provider cost breakdown
  const providerCosts = {
    labels: ['OpenAI', 'Anthropic', 'Google', 'Azure', 'Other'],
    datasets: [
      {
        data: [425.50, 287.20, 156.80, 198.30, 45.60],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.error.main,
        ],
        borderWidth: 0,
      },
    ],
  };

  // Cost by model
  const modelCosts = {
    labels: timeLabels,
    datasets: [
      {
        label: 'GPT-4',
        data: timeLabels.map(() => Math.random() * 30 + 15),
        backgroundColor: alpha(theme.palette.primary.main, 0.7),
      },
      {
        label: 'GPT-3.5-turbo',
        data: timeLabels.map(() => Math.random() * 15 + 5),
        backgroundColor: alpha(theme.palette.info.main, 0.7),
      },
      {
        label: 'Claude',
        data: timeLabels.map(() => Math.random() * 20 + 8),
        backgroundColor: alpha(theme.palette.secondary.main, 0.7),
      },
      {
        label: 'PaLM',
        data: timeLabels.map(() => Math.random() * 12 + 3),
        backgroundColor: alpha(theme.palette.success.main, 0.7),
      },
    ],
  };

  // Top spending prompts
  const topSpendingPrompts = [
    { name: 'Customer Support Bot', cost: 245.67, executions: 1234, avgCost: 0.199 },
    { name: 'Content Generator', cost: 189.23, executions: 856, avgCost: 0.221 },
    { name: 'Code Review Assistant', cost: 156.45, executions: 678, avgCost: 0.231 },
    { name: 'Translation Service', cost: 142.89, executions: 945, avgCost: 0.151 },
    { name: 'Document Summarizer', cost: 98.34, executions: 567, avgCost: 0.173 },
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
        ticks: {
          callback: function(value: any) {
            return '$' + value;
          },
        },
      },
      x: {
        grid: {
          color: alpha(theme.palette.text.secondary, 0.1),
        },
      },
    },
  };

  const stackedBarOptions = {
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
          text: 'Cost ($)',
        },
      },
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 3 }}>
        {/* Cost Overview */}
        <Box sx={{ gridColumn: { xs: '1 / -1', lg: 'span 1' } }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title="Cost Overview" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Spend
                  </Typography>
                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                    ${data.total_cost ? data.total_cost.toFixed(2) : '1,113.40'}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    +12% from last {timeRange}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Average Cost per Request
                  </Typography>
                  <Typography variant="h4" color="secondary.main" fontWeight="bold">
                    ${data.cost_by_prompt && data.cost_by_prompt.length > 0 ? 
                      (data.cost_by_prompt.reduce((sum, p) => sum + (p.cost_per_execution || 0), 0) / data.cost_by_prompt.length).toFixed(3) 
                      : '0.198'}
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    +3% from last {timeRange}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Cost per 1K Tokens
                  </Typography>
                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                    ${data.cost_by_prompt && data.cost_by_prompt.length > 0 ? 
                      (data.total_cost / data.cost_by_prompt.reduce((sum, p) => sum + p.executions, 1) * 1000).toFixed(4) 
                      : '0.0234'}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -2% from last {timeRange}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Projected Monthly
                  </Typography>
                  <Typography variant="h4" color="info.main" fontWeight="bold">
                    ${data.projected_monthly_cost ? data.projected_monthly_cost.toFixed(0) : '3,340'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on current usage
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Cost Trends */}
        <Box sx={{ gridColumn: { xs: '1 / -1', lg: 'span 1' } }}>
          <Card>
            <CardHeader
              title="Cost Trends"
              subheader="Spending patterns over time"
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Line data={costTrends} options={chartOptions} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Provider Breakdown */}
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 1' } }}>
          <Card>
            <CardHeader
              title="Cost by Provider"
              subheader="Spending distribution across providers"
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Doughnut
                  data={providerCosts}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            return `${label}: $${value.toFixed(2)}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Model Costs */}
        <Box sx={{ gridColumn: { xs: '1 / -1', md: 'span 1' } }}>
          <Card>
            <CardHeader
              title="Cost by Model"
              subheader="Spending breakdown by model type"
            />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Bar data={modelCosts} options={stackedBarOptions} />
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Top Spending Prompts */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Card>
            <CardHeader
              title="Top Spending Prompts"
              subheader="Prompts with highest costs"
            />
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Prompt Name</TableCell>
                      <TableCell align="right">Total Cost</TableCell>
                      <TableCell align="right">Executions</TableCell>
                      <TableCell align="right">Avg Cost/Execution</TableCell>
                      <TableCell align="center">Trend</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {topSpendingPrompts.map((prompt, index) => (
                      <TableRow key={prompt.name}>
                        <TableCell component="th" scope="row">
                          <Typography variant="body2" fontWeight="medium">
                            {prompt.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold" color="primary.main">
                            ${prompt.cost.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {prompt.executions.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            ${prompt.avgCost.toFixed(3)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={index < 2 ? "↗ High" : index < 4 ? "→ Stable" : "↘ Low"}
                            size="small"
                            color={index < 2 ? "error" : index < 4 ? "warning" : "success"}
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>

        {/* Cost Optimization Recommendations */}
        <Box sx={{ gridColumn: '1 / -1' }}>
          <Card>
            <CardHeader
              title="Cost Optimization Recommendations"
              subheader="Actionable insights to reduce spending"
            />
            <CardContent>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                <Box>
                  <Paper sx={{ p: 2, border: `1px solid ${alpha(theme.palette.info.main, 0.3)}` }}>
                    <Typography variant="h6" color="info.main" gutterBottom>
                      Model Optimization
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Consider using GPT-3.5-turbo for simple tasks instead of GPT-4. 
                      Potential savings: $156/month
                    </Typography>
                    <Chip label="High Impact" size="small" color="info" />
                  </Paper>
                </Box>

                <Box>
                  <Paper sx={{ p: 2, border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}` }}>
                    <Typography variant="h6" color="warning.main" gutterBottom>
                      Token Efficiency
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Optimize prompt length and reduce unnecessary context. 
                      Potential savings: $89/month
                    </Typography>
                    <Chip label="Medium Impact" size="small" color="warning" />
                  </Paper>
                </Box>

                <Box>
                  <Paper sx={{ p: 2, border: `1px solid ${alpha(theme.palette.success.main, 0.3)}` }}>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      Caching Strategy
                    </Typography>
                    <Typography variant="body2" paragraph>
                      Implement response caching for repeated queries. 
                      Potential savings: $45/month
                    </Typography>
                    <Chip label="Low Impact" size="small" color="success" />
                  </Paper>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default CostAnalysis;