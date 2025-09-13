import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Button,
  useTheme
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

const AnalyticsDashboard: React.FC = () => {
  const theme = useTheme();

  return (
    <Box sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analytics Dashboard
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
          Advanced analytics and monitoring features are coming soon
        </Typography>
      </Box>

      {/* Coming Soon Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, maxWidth: 1200, mx: 'auto' }}>
        <Card sx={{ textAlign: 'center', p: 2 }}>
          <CardHeader
            avatar={
              <AnalyticsIcon
                sx={{
                  fontSize: 48,
                  color: theme.palette.primary.main,
                  mx: 'auto'
                }}
              />
            }
            title="Usage Analytics"
            subheader="Track prompt executions, token usage, and performance metrics"
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Monitor your AI usage patterns, identify bottlenecks, and optimize costs.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ textAlign: 'center', p: 2 }}>
          <CardHeader
            avatar={
              <TimelineIcon
                sx={{
                  fontSize: 48,
                  color: theme.palette.secondary.main,
                  mx: 'auto'
                }}
              />
            }
            title="Performance Monitoring"
            subheader="Real-time performance metrics and error tracking"
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Monitor response times, success rates, and system health in real-time.
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ textAlign: 'center', p: 2 }}>
          <CardHeader
            avatar={
              <AssessmentIcon
                sx={{
                  fontSize: 48,
                  color: theme.palette.success.main,
                  mx: 'auto'
                }}
              />
            }
            title="Cost Analysis"
            subheader="Detailed cost breakdown and optimization insights"
          />
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Analyze costs by provider, model, and time period with actionable insights.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center', mt: 6 }}>
        <Typography variant="h6" gutterBottom>
          Want to help prioritize these features?
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Analytics functionality is planned for a future release. Focus on pipeline and prompt management for now.
        </Typography>
        <Button
          variant="outlined"
          size="large"
          onClick={() => window.open('https://github.com/kishoretvk/PromptPilot/issues', '_blank')}
        >
          Request Analytics Features
        </Button>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;
