import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface TestResults {
  test_id: string;
  is_complete: boolean;
  winner: 'original' | 'refined' | null;
  significant_improvement: boolean;
  improvement_percentage: number;
  confidence_level: number;
  total_samples: number;
  original_wins: number;
  original_win_rate: number;
  original_samples: number;
  original_avg_score?: number;
  original_std_dev?: number;
  original_ci_lower?: number;
  original_ci_upper?: number;
  refined_wins: number;
  refined_win_rate: number;
  refined_samples: number;
  refined_avg_score?: number;
  refined_std_dev?: number;
  refined_ci_lower?: number;
  refined_ci_upper?: number;
  p_value?: number;
  effect_size?: number;
}

interface TestResultsChartProps {
  results: TestResults;
  showComparison?: boolean;
  showConfidence?: boolean;
  height?: number;
}

export const TestResultsChart: React.FC<TestResultsChartProps> = ({
  results,
  showComparison = true,
  showConfidence = true,
  height = 400,
}) => {
  const theme = useTheme();

  // Prepare data for bar chart
  const barData = [
    {
      name: 'Original',
      wins: results.original_wins,
      winRate: results.original_win_rate * 100,
      avgScore: results.original_avg_score || 0,
      samples: results.original_samples,
    },
    {
      name: 'Refined',
      wins: results.refined_wins,
      winRate: results.refined_win_rate * 100,
      avgScore: results.refined_avg_score || 0,
      samples: results.refined_samples,
    },
  ];

  // Prepare data for pie chart
  const pieData = [
    {
      name: 'Original Wins',
      value: results.original_wins,
      color: theme.palette.primary.main,
    },
    {
      name: 'Refined Wins',
      value: results.refined_wins,
      color: theme.palette.secondary.main,
    },
  ];

  // Prepare data for confidence intervals
  const confidenceData = results.original_avg_score && results.refined_avg_score ? [
    {
      name: 'Original',
      score: results.original_avg_score,
      ci_lower: results.original_ci_lower || results.original_avg_score - (results.original_std_dev || 0),
      ci_upper: results.original_ci_upper || results.original_avg_score + (results.original_std_dev || 0),
    },
    {
      name: 'Refined',
      score: results.refined_avg_score,
      ci_lower: results.refined_ci_lower || results.refined_avg_score - (results.refined_std_dev || 0),
      ci_upper: results.refined_ci_upper || results.refined_avg_score + (results.refined_std_dev || 0),
    },
  ] : [];

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1 }}>
          <Typography variant="subtitle2">{label}</Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.name.includes('Rate') ? '%' : entry.name.includes('Score') ? '' : ''}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ width: '100%', height }}>
      <Typography variant="h6" gutterBottom>
        A/B Test Results Visualization
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, height: '100%' }}>
        {/* Win Rate Comparison */}
        {showComparison && (
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom align="center">
                Win Rate Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    label={{ value: 'Wins', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="winRate"
                    fill={theme.palette.primary.main}
                    name="Win Rate (%)"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="wins"
                    fill={theme.palette.secondary.main}
                    name="Total Wins"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Win Distribution Pie Chart */}
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom align="center">
              Win Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Score with Confidence Intervals */}
        {showConfidence && confidenceData.length > 0 && (
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle1" gutterBottom align="center">
                Average Score with Confidence Intervals
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={confidenceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    domain={['dataMin - 0.1', 'dataMax + 0.1']}
                    label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={theme.palette.primary.main}
                    strokeWidth={3}
                    name="Average Score"
                  />
                  <Line
                    type="monotone"
                    dataKey="ci_lower"
                    stroke={theme.palette.grey[400]}
                    strokeDasharray="5 5"
                    name="CI Lower"
                  />
                  <Line
                    type="monotone"
                    dataKey="ci_upper"
                    stroke={theme.palette.grey[400]}
                    strokeDasharray="5 5"
                    name="CI Upper"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Statistical Summary */}
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Statistical Summary
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Paper sx={{ p: 1, minWidth: 120 }}>
              <Typography variant="body2" color="text.secondary">
                Improvement
              </Typography>
              <Typography variant="h6" color={results.significant_improvement ? 'success.main' : 'text.primary'}>
                {formatPercentage(results.improvement_percentage)}
              </Typography>
            </Paper>

            <Paper sx={{ p: 1, minWidth: 120 }}>
              <Typography variant="body2" color="text.secondary">
                Confidence Level
              </Typography>
              <Typography variant="h6" color={
                results.confidence_level >= 0.95 ? 'success.main' :
                results.confidence_level >= 0.80 ? 'warning.main' : 'error.main'
              }>
                {formatPercentage(results.confidence_level)}
              </Typography>
            </Paper>

            {results.p_value && (
              <Paper sx={{ p: 1, minWidth: 120 }}>
                <Typography variant="body2" color="text.secondary">
                  p-value
                </Typography>
                <Typography variant="h6">
                  {results.p_value.toFixed(4)}
                </Typography>
              </Paper>
            )}

            {results.effect_size && (
              <Paper sx={{ p: 1, minWidth: 120 }}>
                <Typography variant="body2" color="text.secondary">
                  Effect Size
                </Typography>
                <Typography variant="h6">
                  {results.effect_size.toFixed(3)}
                </Typography>
              </Paper>
            )}

            <Paper sx={{ p: 1, minWidth: 120 }}>
              <Typography variant="body2" color="text.secondary">
                Total Samples
              </Typography>
              <Typography variant="h6">
                {formatNumber(results.total_samples)}
              </Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};