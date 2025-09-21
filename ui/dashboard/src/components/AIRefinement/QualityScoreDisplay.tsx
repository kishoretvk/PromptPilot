import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';

interface QualityScore {
  overall_score: number;
  clarity: number;
  specificity: number;
  context_usage: number;
  task_alignment: number;
  safety_score: number;
  issues: string[];
  suggestions: string[];
}

interface QualityScoreDisplayProps {
  score: QualityScore;
  previousScore?: QualityScore;
  showDetails?: boolean;
  compact?: boolean;
}

export const QualityScoreDisplay: React.FC<QualityScoreDisplayProps> = ({
  score,
  previousScore,
  showDetails = true,
  compact = false,
}) => {
  const getScoreColor = (value: number) => {
    if (value >= 0.8) return 'success';
    if (value >= 0.6) return 'warning';
    return 'error';
  };

  const getScoreLabel = (value: number) => {
    if (value >= 0.9) return 'Excellent';
    if (value >= 0.8) return 'Very Good';
    if (value >= 0.7) return 'Good';
    if (value >= 0.6) return 'Fair';
    if (value >= 0.5) return 'Needs Work';
    return 'Poor';
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return null;

    const diff = current - previous;
    if (Math.abs(diff) < 0.05) return null; // No significant change

    return diff > 0 ? (
      <TrendingUpIcon color="success" fontSize="small" />
    ) : (
      <TrendingDownIcon color="error" fontSize="small" />
    );
  };

  const formatScore = (value: number) => `${(value * 100).toFixed(1)}%`;

  const scoreCategories = [
    { key: 'clarity', label: 'Clarity', description: 'How clear and unambiguous the prompt is' },
    { key: 'specificity', label: 'Specificity', description: 'How specific and detailed the requirements are' },
    { key: 'context_usage', label: 'Context Usage', description: 'Effective use of provided context' },
    { key: 'task_alignment', label: 'Task Alignment', description: 'How well the prompt aligns with the intended task' },
    { key: 'safety_score', label: 'Safety', description: 'Safety and appropriateness of the prompt' },
  ];

  if (compact) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <Typography variant="body2">Quality:</Typography>
        <Chip
          label={`${formatScore(score.overall_score)} - ${getScoreLabel(score.overall_score)}`}
          color={getScoreColor(score.overall_score) as any}
          size="small"
        />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h3">
            Quality Assessment
          </Typography>
          {previousScore && (
            <Box display="flex" alignItems="center" gap={1}>
              {getTrendIcon(score.overall_score, previousScore.overall_score)}
              <Typography variant="body2" color="text.secondary">
                vs previous
              </Typography>
            </Box>
          )}
        </Box>

        {/* Overall Score */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body1" fontWeight="medium">
              Overall Score
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" color={`${getScoreColor(score.overall_score)}.main`}>
                {formatScore(score.overall_score)}
              </Typography>
              <Chip
                label={getScoreLabel(score.overall_score)}
                color={getScoreColor(score.overall_score) as any}
                size="small"
              />
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={score.overall_score * 100}
            color={getScoreColor(score.overall_score) as any}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {showDetails && (
          <>
            {/* Detailed Scores */}
            <Typography variant="subtitle1" gutterBottom>
              Detailed Breakdown
            </Typography>
            <Grid container spacing={2} mb={3}>
              {scoreCategories.map((category) => {
                const value = score[category.key as keyof QualityScore] as number;
                const previousValue = previousScore?.[category.key as keyof QualityScore] as number;

                return (
                  <Grid item xs={12} sm={6} key={category.key}>
                    <Box>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Tooltip title={category.description}>
                          <Typography variant="body2" fontWeight="medium">
                            {category.label}
                          </Typography>
                        </Tooltip>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          {getTrendIcon(value, previousValue)}
                          <Typography variant="body2" color={`${getScoreColor(value)}.main`}>
                            {formatScore(value)}
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={value * 100}
                        color={getScoreColor(value) as any}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            {/* Issues and Suggestions */}
            {(score.issues.length > 0 || score.suggestions.length > 0) && (
              <Box>
                {score.issues.length > 0 && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Issues Identified ({score.issues.length})
                    </Typography>
                    {score.issues.slice(0, 3).map((issue, index) => (
                      <Box key={index} display="flex" alignItems="flex-start" gap={1} mb={1}>
                        <ErrorIcon color="error" fontSize="small" sx={{ mt: 0.2 }} />
                        <Typography variant="body2">{issue}</Typography>
                      </Box>
                    ))}
                    {score.issues.length > 3 && (
                      <Typography variant="body2" color="text.secondary">
                        ... and {score.issues.length - 3} more issues
                      </Typography>
                    )}
                  </Box>
                )}

                {score.suggestions.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Improvement Suggestions ({score.suggestions.length})
                    </Typography>
                    {score.suggestions.slice(0, 3).map((suggestion, index) => (
                      <Box key={index} display="flex" alignItems="flex-start" gap={1} mb={1}>
                        <InfoIcon color="primary" fontSize="small" sx={{ mt: 0.2 }} />
                        <Typography variant="body2">{suggestion}</Typography>
                      </Box>
                    ))}
                    {score.suggestions.length > 3 && (
                      <Typography variant="body2" color="text.secondary">
                        ... and {score.suggestions.length - 3} more suggestions
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};