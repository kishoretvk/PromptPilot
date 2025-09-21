import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Lightbulb as LightbulbIcon,
  AutoFixHigh as AutoFixIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface AISuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  suggested_change: string;
  confidence_score: number;
  category: string;
  impact_level: 'high' | 'medium' | 'low';
}

interface AISuggestionsPanelProps {
  suggestions: AISuggestion[];
  onApplySuggestion?: (suggestion: AISuggestion) => void;
  onFeedback?: (suggestionId: string, feedback: 'positive' | 'negative') => void;
  onRegenerate?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  suggestions,
  onApplySuggestion,
  onFeedback,
  onRegenerate,
  isLoading = false,
  error = null,
}) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  const handleApplySuggestion = (suggestion: AISuggestion) => {
    if (onApplySuggestion) {
      onApplySuggestion(suggestion);
      setAppliedSuggestions(prev => new Set(prev).add(suggestion.id));
    }
  };

  const handleFeedback = (suggestionId: string, feedback: 'positive' | 'negative') => {
    if (onFeedback) {
      onFeedback(suggestionId, feedback);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'success';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'clarity':
        return <LightbulbIcon color="primary" />;
      case 'specificity':
        return <AutoFixIcon color="secondary" />;
      default:
        return <LightbulbIcon color="action" />;
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to generate AI suggestions: {error}
          </Alert>
          {onRegenerate && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={onRegenerate}
              size="small"
            >
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h2">
            AI Suggestions
          </Typography>
          <Box display="flex" gap={1}>
            {onRegenerate && (
              <Button
                variant="outlined"
                startIcon={isLoading ? <CircularProgress size={16} /> : <RefreshIcon />}
                onClick={onRegenerate}
                disabled={isLoading}
                size="small"
              >
                {isLoading ? 'Generating...' : 'Regenerate'}
              </Button>
            )}
          </Box>
        </Box>

        {suggestions.length === 0 && !isLoading && (
          <Typography variant="body2" color="text.secondary">
            No AI suggestions available. Try refining your prompt or click regenerate.
          </Typography>
        )}

        {suggestions.length > 0 && (
          <List>
            {suggestions.map((suggestion) => (
              <ListItem key={suggestion.id} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <Box display="flex" alignItems="center" width="100%" mb={1}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getCategoryIcon(suggestion.category)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle1" component="span">
                          {suggestion.title}
                        </Typography>
                        <Chip
                          label={suggestion.impact_level}
                          color={getImpactColor(suggestion.impact_level) as any}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={`${(suggestion.confidence_score * 100).toFixed(0)}%`}
                          color={getConfidenceColor(suggestion.confidence_score) as any}
                          size="small"
                        />
                      </Box>
                    }
                    secondary={suggestion.description}
                  />
                  <ListItemSecondaryAction>
                    <Box display="flex" gap={0.5}>
                      {onApplySuggestion && !appliedSuggestions.has(suggestion.id) && (
                        <Tooltip title="Apply this suggestion">
                          <IconButton
                            size="small"
                            onClick={() => handleApplySuggestion(suggestion)}
                            color="primary"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {appliedSuggestions.has(suggestion.id) && (
                        <Chip label="Applied" color="success" size="small" />
                      )}
                    </Box>
                  </ListItemSecondaryAction>
                </Box>

                <Accordion
                  expanded={expandedSuggestion === suggestion.id}
                  onChange={() => setExpandedSuggestion(
                    expandedSuggestion === suggestion.id ? null : suggestion.id
                  )}
                  sx={{ width: '100%', boxShadow: 'none', '&:before': { display: 'none' } }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{ minHeight: 36, px: 0 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      View suggested change
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 0 }}>
                    <Box
                      sx={{
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {suggestion.suggested_change}
                    </Box>

                    {onFeedback && (
                      <Box display="flex" gap={1} mt={2}>
                        <Typography variant="body2" color="text.secondary">
                          Was this suggestion helpful?
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<ThumbUpIcon />}
                          onClick={() => handleFeedback(suggestion.id, 'positive')}
                          variant="outlined"
                          color="success"
                        >
                          Yes
                        </Button>
                        <Button
                          size="small"
                          startIcon={<ThumbDownIcon />}
                          onClick={() => handleFeedback(suggestion.id, 'negative')}
                          variant="outlined"
                          color="error"
                        >
                          No
                        </Button>
                      </Box>
                    )}
                  </AccordionDetails>
                </Accordion>
              </ListItem>
            ))}
          </List>
        )}

        {isLoading && (
          <Box display="flex" alignItems="center" justifyContent="center" py={4}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Generating AI suggestions...
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};