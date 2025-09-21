import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface UsageStats {
  provider: string;
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  avg_response_time: number;
  success_rate: number;
  error_rate: number;
  daily_stats: Array<{
    date: string;
    requests: number;
    tokens: number;
    cost: number;
    response_time: number;
  }>;
  model_breakdown: Array<{
    model: string;
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

interface UsageDashboardProps {
  timeRange?: '24h' | '7d' | '30d' | '90d';
  onTimeRangeChange?: (range: '24h' | '7d' | '30d' | '90d') => void;
  refreshInterval?: number;
}

export const UsageDashboard: React.FC<UsageDashboardProps> = ({
  timeRange = '7d',
  onTimeRangeChange,
  refreshInterval = 30000, // 30 seconds
}) => {
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Mock data - in real implementation, this would come from an API
  useEffect(() => {
    const fetchUsageStats = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockStats: UsageStats[] = [
          {
            provider: 'OpenAI',
            total_requests: 1247,
            total_tokens: 1250000,
            total_cost: 24.50,
            avg_response_time: 1.2,
            success_rate: 0.987,
            error_rate: 0.013,
            daily_stats: Array.from({ length: 7 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              requests: Math.floor(Math.random() * 200) + 50,
              tokens: Math.floor(Math.random() * 20000) + 5000,
              cost: Math.random() * 5 + 1,
              response_time: Math.random() * 2 + 0.5,
            })),
            model_breakdown: [
              { model: 'gpt-4', requests: 450, tokens: 500000, cost: 15.00 },
              { model: 'gpt-3.5-turbo', requests: 797, tokens: 750000, cost: 9.50 },
            ],
          },
          {
            provider: 'Anthropic',
            total_requests: 892,
            total_tokens: 980000,
            total_cost: 18.75,
            avg_response_time: 1.8,
            success_rate: 0.992,
            error_rate: 0.008,
            daily_stats: Array.from({ length: 7 }, (_, i) => ({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              requests: Math.floor(Math.random() * 150) + 30,
              tokens: Math.floor(Math.random() * 15000) + 3000,
              cost: Math.random() * 4 + 0.5,
              response_time: Math.random() * 3 + 1,
            })),
            model_breakdown: [
              { model: 'claude-3-opus', requests: 234, tokens: 450000, cost: 12.00 },
              { model: 'claude-3-sonnet', requests: 658, tokens: 530000, cost: 6.75 },
            ],
          },
        ];

        setUsageStats(mockStats);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError('Failed to load usage statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchUsageStats();

    // Set up auto-refresh
    const interval = setInterval(fetchUsageStats, refreshInterval);
    return () => clearInterval(interval);
  }, [timeRange, refreshInterval]);

  const handleTimeRangeChange = (
    event: React.MouseEvent<HTMLElement>,
    newRange: '24h' | '7d' | '30d' | '90d' | null,
  ) => {
    if (newRange) {
      onTimeRangeChange?.(newRange);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatPercentage = (num: number) => {
    return `${(num * 100).toFixed(1)}%`;
  };

  // Prepare chart data
  const costData = usageStats.flatMap(stat =>
    stat.daily_stats.map(day => ({
      date: day.date,
      [stat.provider]: day.cost,
    }))
  ).reduce((acc, curr) => {
    const existing = acc.find(item => item.date === curr.date);
    if (existing) {
      Object.assign(existing, curr);
    } else {
      acc.push(curr);
    }
    return acc;
  }, [] as any[]);

  const requestData = usageStats.flatMap(stat =>
    stat.daily_stats.map(day => ({
      date: day.date,
      [stat.provider]: day.requests,
    }))
  ).reduce((acc, curr) => {
    const existing = acc.find(item => item.date === curr.date);
    if (existing) {
      Object.assign(existing, curr);
    } else {
      acc.push(curr);
    }
    return acc;
  }, [] as any[]);

  const providerCostData = usageStats.map(stat => ({
    name: stat.provider,
    value: stat.total_cost,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading && !usageStats.length) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading usage statistics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  const totalCost = usageStats.reduce((sum, stat) => sum + stat.total_cost, 0);
  const totalRequests = usageStats.reduce((sum, stat) => sum + stat.total_requests, 0);
  const totalTokens = usageStats.reduce((sum, stat) => sum + stat.total_tokens, 0);
  const avgSuccessRate = usageStats.reduce((sum, stat) => sum + stat.success_rate, 0) / usageStats.length;

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon />
          AI Usage Dashboard
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={handleTimeRangeChange}
            size="small"
          >
            <ToggleButton value="24h">24H</ToggleButton>
            <ToggleButton value="7d">7D</ToggleButton>
            <ToggleButton value="30d">30D</ToggleButton>
            <ToggleButton value="90d">90D</ToggleButton>
          </ToggleButtonGroup>

          {lastUpdated && (
            <Typography variant="body2" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <MoneyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="primary.main">
              {formatCurrency(totalCost)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Cost
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <SpeedIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="secondary.main">
              {formatNumber(totalRequests)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Requests
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <TrendingUpIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="success.main">
              {formatNumber(totalTokens)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Tokens
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <CheckCircleIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" color="info.main">
              {formatPercentage(avgSuccessRate)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg Success Rate
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Cost Over Time */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={costData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  {usageStats.map((stat, index) => (
                    <Line
                      key={stat.provider}
                      type="monotone"
                      dataKey={stat.provider}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Cost Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cost by Provider
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={providerCostData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {providerCostData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Requests Over Time */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Requests Over Time
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={requestData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {usageStats.map((stat, index) => (
                    <Bar
                      key={stat.provider}
                      dataKey={stat.provider}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Provider Stats */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Provider Details
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Provider</TableCell>
                      <TableCell align="right">Requests</TableCell>
                      <TableCell align="right">Tokens</TableCell>
                      <TableCell align="right">Cost</TableCell>
                      <TableCell align="right">Avg Response Time</TableCell>
                      <TableCell align="right">Success Rate</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usageStats.map((stat) => (
                      <TableRow key={stat.provider}>
                        <TableCell>{stat.provider}</TableCell>
                        <TableCell align="right">{formatNumber(stat.total_requests)}</TableCell>
                        <TableCell align="right">{formatNumber(stat.total_tokens)}</TableCell>
                        <TableCell align="right">{formatCurrency(stat.total_cost)}</TableCell>
                        <TableCell align="right">{stat.avg_response_time.toFixed(2)}s</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={formatPercentage(stat.success_rate)}
                            color={stat.success_rate >= 0.95 ? 'success' : stat.success_rate >= 0.90 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography variant="body2">Healthy</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};