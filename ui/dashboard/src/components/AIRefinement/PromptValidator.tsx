import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useValidation } from '../../hooks/useValidation';

interface ValidationIssue {
  type: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

interface ValidationResult {
  is_valid: boolean;
  overall_score: number;
  issues: ValidationIssue[];
  passed_checks: string[];
  failed_checks: string[];
  recommendations: string[];
  processing_time: number;
}

interface PromptValidatorProps {
  promptContent: string;
  onValidationComplete?: (result: ValidationResult) => void;
  autoValidate?: boolean;
  promptType?: string;
}

export const PromptValidator: React.FC<PromptValidatorProps> = ({
  promptContent,
  onValidationComplete,
  autoValidate = true,
  promptType = 'general',
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidatedContent, setLastValidatedContent] = useState('');

  const { validatePrompt, isLoading, error } = useValidation();

  // Auto-validate when prompt content changes
  useEffect(() => {
    if (autoValidate && promptContent && promptContent !== lastValidatedContent) {
      handleValidate();
    }
  }, [promptContent, autoValidate, lastValidatedContent]);

  const handleValidate = async () => {
    if (!promptContent.trim()) return;

    setIsValidating(true);
    try {
      const result = await validatePrompt({
        content: promptContent,
        prompt_type: promptType,
      });

      setValidationResult(result);
      setLastValidatedContent(promptContent);

      if (onValidationComplete) {
        onValidationComplete(result);
      }
    } catch (err) {
      console.error('Validation failed:', err);
    } finally {
      setIsValidating(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'info':
        return <CheckCircleIcon color="info" />;
      default:
        return <CheckCircleIcon color="success" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'success';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" component="h2">
            Prompt Validation
          </Typography>
          <Button
            variant="outlined"
            startIcon={isValidating ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleValidate}
            disabled={isValidating || !promptContent.trim()}
            size="small"
          >
            {isValidating ? 'Validating...' : 'Validate'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Validation failed: {error}
          </Alert>
        )}

        {validationResult && (
          <>
            {/* Overall Score */}
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Typography variant="body1">
                Overall Score:
              </Typography>
              <Chip
                label={`${(validationResult.overall_score * 100).toFixed(1)}% - ${getScoreLabel(validationResult.overall_score)}`}
                color={getScoreColor(validationResult.overall_score) as any}
                variant="filled"
              />
              <Typography variant="body2" color="text.secondary">
                Validated in {(validationResult.processing_time * 1000).toFixed(0)}ms
              </Typography>
            </Box>

            {/* Validation Status */}
            <Alert
              severity={validationResult.is_valid ? 'success' : 'warning'}
              sx={{ mb: 2 }}
            >
              {validationResult.is_valid
                ? '✅ Prompt passed all validation checks!'
                : '⚠️ Prompt has issues that should be addressed.'
              }
            </Alert>

            {/* Issues and Recommendations */}
            {validationResult.issues.length > 0 && (
              <Accordion defaultExpanded sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    Issues Found ({validationResult.issues.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {validationResult.issues.map((issue, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          {getSeverityIcon(issue.severity)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {issue.type}: {issue.message}
                              </Typography>
                              {issue.suggestion && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  💡 {issue.suggestion}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Passed Checks */}
            {validationResult.passed_checks.length > 0 && (
              <Accordion sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    Passed Checks ({validationResult.passed_checks.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {validationResult.passed_checks.map((check, index) => (
                      <Chip
                        key={index}
                        label={check.replace(/_/g, ' ')}
                        color="success"
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Recommendations */}
            {validationResult.recommendations.length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">
                    Recommendations ({validationResult.recommendations.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {validationResult.recommendations.map((recommendation, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircleIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={recommendation} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </>
        )}

        {!validationResult && !isValidating && promptContent && (
          <Typography variant="body2" color="text.secondary">
            Click "Validate" to check your prompt for quality, clarity, and best practices.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};