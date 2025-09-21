# PromptPilot Phase 1 Implementation Plan: AI-Powered Refinement, Testing & Model Integration

## Overview
This document provides a detailed implementation plan for Phase 1 (Weeks 1-4) of PromptPilot's enhancement. It focuses on three critical gaps: AI-powered refinement, advanced testing framework, and complete model integration. Each section includes file names, function signatures, and step-by-step instructions for junior developers.

## 1. 🤖 AI-Powered Refinement System

### Objective
Transform manual prompt tuning into an intelligent, AI-driven optimization system that provides automated suggestions, quality scoring, and parameter optimization.

### Architecture Overview
```
UI Components → Refinement API → AI Service → LLM Providers
```

### 1.1 Backend AI Service Implementation

#### New Files to Create:

**`api/services/ai_refinement_service.py`**
```python
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class SuggestionType(Enum):
    PARAMETER_OPTIMIZATION = "parameter_optimization"
    PROMPT_IMPROVEMENT = "prompt_improvement"
    CONTEXT_OPTIMIZATION = "context_optimization"
    TASK_SPECIFIC_ADVICE = "task_specific_advice"

@dataclass
class AISuggestion:
    suggestion_id: str
    type: SuggestionType
    title: str
    description: str
    confidence_score: float
    estimated_impact: Dict[str, float]
    implementation_steps: List[str]
    before_code: str
    after_code: str
    metadata: Dict[str, Any]

@dataclass
class QualityScore:
    overall_score: float
    clarity_score: float
    specificity_score: float
    context_usage_score: float
    task_alignment_score: float
    breakdown: Dict[str, float]

class AIRefinementService:
    """AI-powered prompt refinement and optimization service"""

    def __init__(self, llm_service):
        self.llm_service = llm_service
        self.logger = logging.getLogger(__name__)

    async def analyze_prompt(self, prompt_data: Dict[str, Any]) -> QualityScore:
        """Analyze prompt quality and provide comprehensive scoring"""
        pass

    async def generate_suggestions(self, prompt_data: Dict[str, Any], quality_score: QualityScore) -> List[AISuggestion]:
        """Generate AI-powered improvement suggestions"""
        pass

    async def optimize_parameters(self, prompt_data: Dict[str, Any], target_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Automatically optimize prompt parameters for given metrics"""
        pass

    async def improve_prompt_content(self, prompt_data: Dict[str, Any], suggestion: AISuggestion) -> Dict[str, Any]:
        """Apply AI-generated prompt improvements"""
        pass

    async def benchmark_prompt(self, prompt_data: Dict[str, Any], test_cases: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Benchmark prompt performance across multiple test cases"""
        pass
```

**`api/routers/ai_refinement.py`**
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..services.ai_refinement_service import AIRefinementService
from ..dependencies import get_db, get_ai_refinement_service

router = APIRouter(prefix="/ai-refinement", tags=["ai-refinement"])

@router.post("/analyze")
async def analyze_prompt(
    prompt_data: Dict[str, Any],
    service: AIRefinementService = Depends(get_ai_refinement_service)
):
    """Analyze prompt quality and return comprehensive score"""
    try:
        score = await service.analyze_prompt(prompt_data)
        return {"quality_score": score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggestions")
async def get_suggestions(
    prompt_data: Dict[str, Any],
    service: AIRefinementService = Depends(get_ai_refinement_service)
):
    """Get AI-powered improvement suggestions"""
    try:
        # First analyze the prompt
        quality_score = await service.analyze_prompt(prompt_data)
        # Then generate suggestions
        suggestions = await service.generate_suggestions(prompt_data, quality_score)
        return {"suggestions": suggestions, "quality_score": quality_score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize")
async def optimize_prompt(
    prompt_data: Dict[str, Any],
    target_metrics: Dict[str, Any],
    service: AIRefinementService = Depends(get_ai_refinement_service)
):
    """Optimize prompt parameters automatically"""
    try:
        optimized_params = await service.optimize_parameters(prompt_data, target_metrics)
        return {"optimized_parameters": optimized_params}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/benchmark")
async def benchmark_prompt(
    prompt_data: Dict[str, Any],
    test_cases: List[Dict[str, Any]],
    service: AIRefinementService = Depends(get_ai_refinement_service)
):
    """Benchmark prompt performance"""
    try:
        results = await service.benchmark_prompt(prompt_data, test_cases)
        return {"benchmark_results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### Implementation Steps for AI Service:

1. **Create the service class** with all method stubs
2. **Implement `analyze_prompt` method**:
   - Use LLM to evaluate prompt clarity, specificity, context usage
   - Return structured QualityScore object
3. **Implement `generate_suggestions` method**:
   - Analyze quality score gaps
   - Generate specific improvement suggestions
   - Use meta-prompting for suggestion generation
4. **Implement `optimize_parameters` method**:
   - Run parameter sweep experiments
   - Analyze results against target metrics
   - Return optimal parameter combination
5. **Add service to dependency injection** in `api/dependencies.py`

### 1.2 Frontend AI Refinement Components

#### New Files to Create:

**`ui/dashboard/src/components/AIRefinement/AISuggestionsPanel.tsx`**
```tsx
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, Typography, Box, Chip, Button,
  LinearProgress, Alert, Accordion, AccordionSummary, AccordionDetails,
  IconButton, Tooltip
} from '@mui/material';
import {
  ExpandMore, Lightbulb, CheckCircle, Warning, Error,
  ThumbUp, ThumbDown, AutoFixHigh
} from '@mui/icons-material';
import { useAISuggestions } from '../../hooks/useAIRefinement';
import { AISuggestion, QualityScore } from '../../types';

interface AISuggestionsPanelProps {
  promptData: any;
  onSuggestionApply: (suggestion: AISuggestion) => void;
  onSuggestionFeedback: (suggestionId: string, feedback: 'positive' | 'negative') => void;
}

export const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  promptData,
  onSuggestionApply,
  onSuggestionFeedback,
}) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const { suggestions, qualityScore, loading, error, refetch } = useAISuggestions(promptData);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <AutoFixHigh />
            <Typography>Analyzing prompt with AI...</Typography>
            <LinearProgress sx={{ flex: 1 }} />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to get AI suggestions: {error}
        <Button onClick={refetch} sx={{ ml: 2 }}>Retry</Button>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Lightbulb color="primary" />
            <Typography variant="h6">AI-Powered Suggestions</Typography>
          </Box>
        }
        action={
          <Button onClick={refetch} size="small">
            Refresh
          </Button>
        }
      />
      <CardContent>
        {qualityScore && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Overall Quality Score: {qualityScore.overall_score.toFixed(1)}/10
            </Typography>
            <Box display="flex" gap={1} flexWrap="wrap">
              {Object.entries(qualityScore.breakdown).map(([key, value]) => (
                <Chip
                  key={key}
                  label={`${key}: ${value.toFixed(1)}`}
                  size="small"
                  color={value >= 7 ? 'success' : value >= 5 ? 'warning' : 'error'}
                />
              ))}
            </Box>
          </Box>
        )}

        {suggestions?.map((suggestion) => (
          <Accordion
            key={suggestion.suggestion_id}
            expanded={expandedSuggestion === suggestion.suggestion_id}
            onChange={(_, expanded) =>
              setExpandedSuggestion(expanded ? suggestion.suggestion_id : null)
            }
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" gap={1} width="100%">
                <Typography variant="subtitle1">{suggestion.title}</Typography>
                <Chip
                  label={`${(suggestion.confidence_score * 100).toFixed(0)}% confidence`}
                  size="small"
                  color="primary"
                />
                <Box flex={1} />
                <Box display="flex" gap={1}>
                  <Tooltip title="Apply Suggestion">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSuggestionApply(suggestion);
                      }}
                    >
                      <CheckCircle color="success" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Good Suggestion">
                    <IconButton
                      size="small"
                      onClick={(e) => onSuggestionFeedback(suggestion.suggestion_id, 'positive')}
                    >
                      <ThumbUp />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Not Helpful">
                    <IconButton
                      size="small"
                      onClick={(e) => onSuggestionFeedback(suggestion.suggestion_id, 'negative')}
                    >
                      <ThumbDown />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                {suggestion.description}
              </Typography>

              {suggestion.estimated_impact && (
                <Box mb={2}>
                  <Typography variant="subtitle2">Estimated Impact:</Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {Object.entries(suggestion.estimated_impact).map(([metric, value]) => (
                      <Chip
                        key={metric}
                        label={`${metric}: +${value}%`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {suggestion.implementation_steps.length > 0 && (
                <Box>
                  <Typography variant="subtitle2">Implementation Steps:</Typography>
                  <ol>
                    {suggestion.implementation_steps.map((step, index) => (
                      <li key={index}>
                        <Typography variant="body2">{step}</Typography>
                      </li>
                    ))}
                  </ol>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        ))}

        {(!suggestions || suggestions.length === 0) && (
          <Alert severity="info">
            No suggestions available. Your prompt looks good, or try adding more context and test cases.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
```

**`ui/dashboard/src/hooks/useAIRefinement.ts`**
```typescript
import { useState, useEffect } from 'react';
import { AISuggestion, QualityScore } from '../types';
import { apiService } from '../services/apiService';

export const useAISuggestions = (promptData: any) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[] | null>(null);
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    if (!promptData) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.post('/ai-refinement/suggestions', promptData);
      setSuggestions(response.suggestions);
      setQualityScore(response.quality_score);
    } catch (err: any) {
      setError(err.message || 'Failed to get AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [promptData]);

  return {
    suggestions,
    qualityScore,
    loading,
    error,
    refetch: fetchSuggestions,
  };
};

export const useAIOptimization = () => {
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedParams, setOptimizedParams] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const optimizePrompt = async (promptData: any, targetMetrics: any) => {
    setOptimizing(true);
    setError(null);

    try {
      const response = await apiService.post('/ai-refinement/optimize', {
        prompt_data: promptData,
        target_metrics: targetMetrics,
      });
      setOptimizedParams(response.optimized_parameters);
      return response.optimized_parameters;
    } catch (err: any) {
      setError(err.message || 'Optimization failed');
      throw err;
    } finally {
      setOptimizing(false);
    }
  };

  return {
    optimizePrompt,
    optimizing,
    optimizedParams,
    error,
  };
};
```

#### Integration Steps for AI Components:

1. **Add AI Suggestions Panel** to `PromptEditor.tsx`
2. **Create custom hooks** for AI refinement API calls
3. **Add quality score display** in prompt header
4. **Implement suggestion application logic**
5. **Add feedback collection** for suggestion improvement

## 2. 🧪 Advanced Testing Framework

### Objective
Replace basic manual testing with comprehensive A/B testing, statistical analysis, and automated evaluation.

### 2.1 Backend Testing Service

#### New Files to Create:

**`api/services/testing_service.py`**
```python
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import statistics
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class TestType(Enum):
    MANUAL = "manual"
    AUTOMATED = "automated"
    AB_TEST = "ab_test"
    PERFORMANCE = "performance"
    REGRESSION = "regression"

class EvaluationMetric(Enum):
    ACCURACY = "accuracy"
    RELEVANCE = "relevance"
    COMPLETENESS = "completeness"
    CREATIVITY = "creativity"
    SAFETY = "safety"
    COST_EFFICIENCY = "cost_efficiency"

@dataclass
class TestResult:
    test_id: str
    prompt_id: str
    prompt_version: str
    test_case_id: str
    input_data: Dict[str, Any]
    expected_output: Any
    actual_output: Any
    evaluation_scores: Dict[str, float]
    metadata: Dict[str, Any]
    execution_time: float
    cost: float
    status: str
    timestamp: datetime

@dataclass
class ABTestResult:
    test_id: str
    prompt_a_id: str
    prompt_b_id: str
    test_cases: List[str]
    results_a: List[TestResult]
    results_b: List[TestResult]
    statistical_analysis: Dict[str, Any]
    winner: Optional[str]
    confidence_level: float
    recommendations: List[str]

class TestingService:
    """Advanced testing and evaluation service"""

    def __init__(self, llm_service, db):
        self.llm_service = llm_service
        self.db = db

    async def run_single_test(self, prompt_data: Dict[str, Any], test_case: Dict[str, Any]) -> TestResult:
        """Run a single test case against a prompt"""
        pass

    async def run_test_suite(self, prompt_data: Dict[str, Any], test_cases: List[Dict[str, Any]]) -> List[TestResult]:
        """Run multiple test cases and return comprehensive results"""
        pass

    async def run_ab_test(self, prompt_a: Dict[str, Any], prompt_b: Dict[str, Any], test_cases: List[Dict[str, Any]]) -> ABTestResult:
        """Run A/B test between two prompt versions"""
        pass

    async def evaluate_results(self, results: List[TestResult], evaluation_criteria: List[EvaluationMetric]) -> Dict[str, Any]:
        """Evaluate test results using multiple metrics"""
        pass

    async def generate_test_cases(self, prompt_data: Dict[str, Any], count: int = 10) -> List[Dict[str, Any]]:
        """Automatically generate test cases for a prompt"""
        pass

    async def perform_statistical_analysis(self, results_a: List[TestResult], results_b: List[TestResult]) -> Dict[str, Any]:
        """Perform statistical analysis on test results"""
        pass
```

**`api/routers/testing.py`**
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..services.testing_service import TestingService, TestType, EvaluationMetric
from ..dependencies import get_db, get_testing_service

router = APIRouter(prefix="/testing", tags=["testing"])

@router.post("/run-test")
async def run_single_test(
    prompt_data: Dict[str, Any],
    test_case: Dict[str, Any],
    service: TestingService = Depends(get_testing_service)
):
    """Run a single test case"""
    try:
        result = await service.run_single_test(prompt_data, test_case)
        return {"test_result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/run-suite")
async def run_test_suite(
    prompt_data: Dict[str, Any],
    test_cases: List[Dict[str, Any]],
    evaluation_criteria: List[EvaluationMetric] = None,
    service: TestingService = Depends(get_testing_service)
):
    """Run a complete test suite"""
    try:
        results = await service.run_test_suite(prompt_data, test_cases)
        evaluation = await service.evaluate_results(results, evaluation_criteria or [])
        return {
            "test_results": results,
            "evaluation": evaluation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ab-test")
async def run_ab_test(
    prompt_a: Dict[str, Any],
    prompt_b: Dict[str, Any],
    test_cases: List[Dict[str, Any]],
    service: TestingService = Depends(get_testing_service)
):
    """Run A/B test between two prompts"""
    try:
        result = await service.run_ab_test(prompt_a, prompt_b, test_cases)
        return {"ab_test_result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-cases")
async def generate_test_cases(
    prompt_data: Dict[str, Any],
    count: int = 10,
    service: TestingService = Depends(get_testing_service)
):
    """Generate test cases automatically"""
    try:
        test_cases = await service.generate_test_cases(prompt_data, count)
        return {"test_cases": test_cases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### Implementation Steps for Testing Service:

1. **Create the service class** with all method stubs
2. **Implement `run_single_test`**:
   - Execute prompt with test case input
   - Measure execution time and cost
   - Return structured TestResult
3. **Implement `run_test_suite`**:
   - Run multiple tests in parallel
   - Aggregate results and calculate averages
4. **Implement `run_ab_test`**:
   - Run both prompts against same test cases
   - Perform statistical analysis
   - Determine winner with confidence level
5. **Implement evaluation methods**:
   - Use LLM for qualitative evaluation
   - Calculate quantitative metrics
6. **Add service dependencies**

### 2.2 Frontend Testing Components

#### New Files to Create:

**`ui/dashboard/src/components/Testing/ABTestPanel.tsx`**
```tsx
import React, { useState } from 'react';
import {
  Card, CardContent, CardHeader, Typography, Box, Button,
  Grid, Paper, LinearProgress, Alert, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import {
  Compare, PlayArrow, Assessment, TrendingUp, TrendingDown
} from '@mui/icons-material';
import { useABTest } from '../../hooks/useTesting';
import { ABTestResult } from '../../types';

interface ABTestPanelProps {
  promptA: any;
  promptB: any;
  testCases: any[];
  onTestComplete: (result: ABTestResult) => void;
}

export const ABTestPanel: React.FC<ABTestPanelProps> = ({
  promptA,
  promptB,
  testCases,
  onTestComplete,
}) => {
  const [running, setRunning] = useState(false);
  const { runABTest, result, loading, error } = useABTest();

  const handleRunTest = async () => {
    setRunning(true);
    try {
      const testResult = await runABTest(promptA, promptB, testCases);
      onTestComplete(testResult);
    } catch (err) {
      console.error('AB Test failed:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={
          <Box display="flex" alignItems="center" gap={1}>
            <Compare color="primary" />
            <Typography variant="h6">A/B Testing</Typography>
          </Box>
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <Typography variant="h6">Prompt A</Typography>
              <Typography variant="body2">{promptA.name}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText' }}>
              <Typography variant="h6">Prompt B</Typography>
              <Typography variant="body2">{promptB.name}</Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box mt={3}>
          <Typography variant="subtitle1" gutterBottom>
            Test Cases: {testCases.length}
          </Typography>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleRunTest}
            disabled={running || loading}
            fullWidth
          >
            {running ? 'Running A/B Test...' : 'Run A/B Test'}
          </Button>
        </Box>

        {(running || loading) && (
          <Box mt={2}>
            <LinearProgress />
            <Typography variant="body2" align="center" sx={{ mt: 1 }}>
              Executing test cases...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Test failed: {error}
          </Alert>
        )}

        {result && (
          <Box mt={3}>
            <Typography variant="h6" gutterBottom>
              Results
            </Typography>

            <Box display="flex" gap={2} mb={2}>
              <Chip
                label={`Winner: ${result.winner || 'Tie'}`}
                color={result.winner === 'A' ? 'primary' : result.winner === 'B' ? 'secondary' : 'default'}
                icon={result.winner === 'A' ? <TrendingUp /> : result.winner === 'B' ? <TrendingDown /> : undefined}
              />
              <Chip
                label={`Confidence: ${(result.confidence_level * 100).toFixed(1)}%`}
                color={result.confidence_level > 0.95 ? 'success' : result.confidence_level > 0.8 ? 'warning' : 'error'}
              />
            </Box>

            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Prompt A</TableCell>
                    <TableCell align="right">Prompt B</TableCell>
                    <TableCell align="right">Difference</TableCell>
                    <TableCell align="right">p-value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(result.statistical_analysis).map(([metric, stats]: [string, any]) => (
                    <TableRow key={metric}>
                      <TableCell>{metric}</TableCell>
                      <TableCell align="right">{stats.mean_a?.toFixed(3) || 'N/A'}</TableCell>
                      <TableCell align="right">{stats.mean_b?.toFixed(3) || 'N/A'}</TableCell>
                      <TableCell align="right">
                        {stats.difference !== undefined ? `${stats.difference > 0 ? '+' : ''}${stats.difference.toFixed(3)}` : 'N/A'}
                      </TableCell>
                      <TableCell align="right">
                        {stats.p_value !== undefined ? stats.p_value.toFixed(4) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {result.recommendations.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle2">Recommendations:</Typography>
                <ul>
                  {result.recommendations.map((rec, index) => (
                    <li key={index}>
                      <Typography variant="body2">{rec}</Typography>
                    </li>
                  ))}
                </ul>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
```

**`ui/dashboard/src/hooks/useTesting.ts`**
```typescript
import { useState } from 'react';
import { TestResult, ABTestResult } from '../types';
import { apiService } from '../services/apiService';

export const useABTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ABTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runABTest = async (promptA: any, promptB: any, testCases: any[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.post('/testing/ab-test', {
        prompt_a: promptA,
        prompt_b: promptB,
        test_cases: testCases,
      });

      const testResult = response.ab_test_result;
      setResult(testResult);
      return testResult;
    } catch (err: any) {
      setError(err.message || 'A/B test failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    runABTest,
    result,
    loading,
    error,
  };
};

export const useTestSuite = () => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTestSuite = async (promptData: any, testCases: any[]) => {
    setRunning(true);
    setError(null);

    try {
      const response = await apiService.post('/testing/run-suite', {
        prompt_data: promptData,
        test_cases: testCases,
      });

      setResults(response.test_results);
      setEvaluation(response.evaluation);
      return { results: response.test_results, evaluation: response.evaluation };
    } catch (err: any) {
      setError(err.message || 'Test suite failed');
      throw err;
    } finally {
      setRunning(false);
    }
  };

  return {
    runTestSuite,
    results,
    evaluation,
    running,
    error,
  };
};
```

#### Integration Steps for Testing Components:

1. **Add A/B Test Panel** to `PromptTester.tsx`
2. **Create test suite runner** component
3. **Add statistical analysis** display
4. **Implement test case generation** UI
5. **Add evaluation metrics** visualization

## 3. 🔌 Complete Model Integration

### Objective
Provide comprehensive support for both Ollama and frontier LLM providers with unified API management.

### 3.1 Backend Model Provider Service

#### New Files to Create:

**`api/services/model_provider_service.py`**
```python
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import logging
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)

class ProviderType(Enum):
    OLLAMA = "ollama"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    AZURE_OPENAI = "azure_openai"
    CUSTOM = "custom"

@dataclass
class ModelInfo:
    provider: ProviderType
    model_id: str
    model_name: str
    context_length: int
    pricing: Dict[str, float]
    capabilities: List[str]
    status: str
    last_checked: datetime

@dataclass
class APIKey:
    provider: ProviderType
    key_id: str
    name: str
    masked_key: str
    created_at: datetime
    last_used: datetime
    usage_count: int
    rate_limits: Dict[str, Any]

@dataclass
class ExecutionResult:
    success: bool
    output: str
    metadata: Dict[str, Any]
    cost: float
    tokens_used: int
    execution_time: float
    error_message: Optional[str]

class ModelProviderService:
    """Unified model provider management service"""

    def __init__(self, db):
        self.db = db
        self.providers = {}
        self.api_keys = {}

    async def register_provider(self, provider_type: ProviderType, config: Dict[str, Any]):
        """Register a new model provider"""
        pass

    async def list_available_models(self, provider_type: ProviderType = None) -> List[ModelInfo]:
        """List all available models, optionally filtered by provider"""
        pass

    async def execute_prompt(self, provider_type: ProviderType, model_id: str, prompt_data: Dict[str, Any]) -> ExecutionResult:
        """Execute prompt using specified provider and model"""
        pass

    async def manage_api_key(self, provider_type: ProviderType, action: str, key_data: Dict[str, Any]):
        """Manage API keys for providers"""
        pass

    async def get_usage_stats(self, provider_type: ProviderType = None, time_range: str = "30d") -> Dict[str, Any]:
        """Get usage statistics for providers"""
        pass

    async def validate_connection(self, provider_type: ProviderType) -> Dict[str, Any]:
        """Validate connection and credentials for a provider"""
        pass

    async def get_rate_limits(self, provider_type: ProviderType) -> Dict[str, Any]:
        """Get current rate limits and usage for a provider"""
        pass
```

**`api/services/providers/openai_provider.py`**
```python
import openai
from typing import Dict, Any, Optional
import logging
from ..model_provider_service import ExecutionResult

logger = logging.getLogger(__name__)

class OpenAIProvider:
    """OpenAI API provider implementation"""

    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.models = {
            "gpt-4": {"context_length": 8192, "pricing": {"input": 0.03, "output": 0.06}},
            "gpt-4-turbo": {"context_length": 128000, "pricing": {"input": 0.01, "output": 0.03}},
            "gpt-3.5-turbo": {"context_length": 16385, "pricing": {"input": 0.002, "output": 0.002}},
        }

    async def execute(self, model: str, messages: list, parameters: Dict[str, Any]) -> ExecutionResult:
        """Execute prompt using OpenAI API"""
        try:
            start_time = __import__('time').time()

            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=parameters.get('temperature', 0.7),
                max_tokens=parameters.get('max_tokens', 2048),
                top_p=parameters.get('top_p', 1.0),
                frequency_penalty=parameters.get('frequency_penalty', 0.0),
                presence_penalty=parameters.get('presence_penalty', 0.0),
            )

            execution_time = __import__('time').time() - start_time

            output = response.choices[0].message.content
            tokens_used = response.usage.total_tokens
            cost = self._calculate_cost(model, response.usage.prompt_tokens, response.usage.completion_tokens)

            return ExecutionResult(
                success=True,
                output=output,
                metadata={
                    "model": model,
                    "finish_reason": response.choices[0].finish_reason,
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                },
                cost=cost,
                tokens_used=tokens_used,
                execution_time=execution_time,
                error_message=None
            )

        except Exception as e:
            logger.error(f"OpenAI execution failed: {e}")
            return ExecutionResult(
                success=False,
                output="",
                metadata={},
                cost=0.0,
                tokens_used=0,
                execution_time=0.0,
                error_message=str(e)
            )

    def _calculate_cost(self, model: str, prompt_tokens: int, completion_tokens: int) -> float:
        """Calculate cost based on token usage"""
        if model not in self.models:
            return 0.0

        pricing = self.models[model]["pricing"]
        return (prompt_tokens * pricing["input"] + completion_tokens * pricing["output"]) / 1000
```

**`api/services/providers/anthropic_provider.py`**
```python
import anthropic
from typing import Dict, Any, Optional
import logging
from ..model_provider_service import ExecutionResult

logger = logging.getLogger(__name__)

class AnthropicProvider:
    """Anthropic Claude API provider implementation"""

    def __init__(self, api_key: str):
        self.client = anthropic.Anthropic(api_key=api_key)
        self.models = {
            "claude-3-opus": {"context_length": 200000, "pricing": {"input": 15.0, "output": 75.0}},
            "claude-3-sonnet": {"context_length": 200000, "pricing": {"input": 3.0, "output": 15.0}},
            "claude-3-haiku": {"context_length": 200000, "pricing": {"input": 0.25, "output": 1.25}},
        }

    async def execute(self, model: str, messages: list, parameters: Dict[str, Any]) -> ExecutionResult:
        """Execute prompt using Anthropic API"""
        try:
            start_time = __import__('time').time()

            # Convert messages to Anthropic format
            system_message = ""
            anthropic_messages = []

            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    anthropic_messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })

            response = await self.client.messages.create(
                model=model,
                max_tokens=parameters.get('max_tokens', 2048),
                temperature=parameters.get('temperature', 0.7),
                system=system_message,
                messages=anthropic_messages,
            )

            execution_time = __import__('time').time() - start_time

            output = response.content[0].text
            tokens_used = response.usage.input_tokens + response.usage.output_tokens
            cost = self._calculate_cost(model, response.usage.input_tokens, response.usage.output_tokens)

            return ExecutionResult(
                success=True,
                output=output,
                metadata={
                    "model": model,
                    "stop_reason": response.stop_reason,
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                },
                cost=cost,
                tokens_used=tokens_used,
                execution_time=execution_time,
                error_message=None
            )

        except Exception as e:
            logger.error(f"Anthropic execution failed: {e}")
            return ExecutionResult(
                success=False,
                output="",
                metadata={},
                cost=0.0,
                tokens_used=0,
                execution_time=0.0,
                error_message=str(e)
            )

    def _calculate_cost(self, model: str, input_tokens: int, output_tokens: int) -> float:
        """Calculate cost based on token usage"""
        if model not in self.models:
            return 0.0

        pricing = self.models[model]["pricing"]
        return (input_tokens * pricing["input"] + output_tokens * pricing["output"]) / 1000000  # Per million tokens
```

**`api/routers/providers.py`**
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..services.model_provider_service import ModelProviderService, ProviderType
from ..dependencies import get_db, get_model_provider_service

router = APIRouter(prefix="/providers", tags=["providers"])

@router.get("/models")
async def list_models(
    provider: ProviderType = None,
    service: ModelProviderService = Depends(get_model_provider_service)
):
    """List available models"""
    try:
        models = await service.list_available_models(provider)
        return {"models": models}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute")
async def execute_prompt(
    provider: ProviderType,
    model_id: str,
    prompt_data: Dict[str, Any],
    service: ModelProviderService = Depends(get_model_provider_service)
):
    """Execute prompt using specified provider"""
    try:
        result = await service.execute_prompt(provider, model_id, prompt_data)
        return {"execution_result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api-keys")
async def manage_api_key(
    provider: ProviderType,
    action: str,
    key_data: Dict[str, Any],
    service: ModelProviderService = Depends(get_model_provider_service)
):
    """Manage API keys"""
    try:
        result = await service.manage_api_key(provider, action, key_data)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage")
async def get_usage_stats(
    provider: ProviderType = None,
    time_range: str = "30d",
    service: ModelProviderService = Depends(get_model_provider_service)
):
    """Get usage statistics"""
    try:
        stats = await service.get_usage_stats(provider, time_range)
        return {"usage_stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate")
async def validate_connection(
    provider: ProviderType,
    service: ModelProviderService = Depends(get_model_provider_service)
):
    """Validate provider connection"""
    try:
        result = await service.validate_connection(provider)
        return {"validation_result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

#### Implementation Steps for Model Providers:

1. **Create base provider service** with provider registry
2. **Implement OpenAI provider** with full API integration
3. **Implement Anthropic provider** with Claude models
4. **Add Google/Gemini provider** (similar structure)
5. **Enhance Ollama provider** with better error handling
6. **Create API key management** system
7. **Add usage tracking** and rate limiting
8. **Implement provider validation** and health checks

### 3.2 Frontend Provider Management

#### New Files to Create:

**`ui/dashboard/src/components/Providers/ProviderManager.tsx`**
```tsx
import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, Typography, Box, Button,
  Grid, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, IconButton, Tooltip, Alert
} from '@mui/material';
import {
  Add, Edit, Delete, CheckCircle, Error, Settings,
  Cloud, Api, Key
} from '@mui/icons-material';
import { useProviders } from '../../hooks/useProviders';
import { ProviderType, ModelInfo, APIKey } from '../../types';

interface ProviderManagerProps {
  onProviderConfigured: (provider: ProviderType) => void;
}

export const ProviderManager: React.FC<ProviderManagerProps> = ({
  onProviderConfigured,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<ProviderType | null>(null);
  const [apiKeyForm, setApiKeyForm] = useState({
    name: '',
    key: '',
    provider: ProviderType.OPENAI,
  });

  const {
    providers,
    models,
    apiKeys,
    loading,
    error,
    addApiKey,
    removeApiKey,
    testConnection,
    loadModels,
  } = useProviders();

  const handleAddApiKey = async () => {
    try {
      await addApiKey(apiKeyForm.provider, {
        name: apiKeyForm.name,
        key: apiKeyForm.key,
      });
      setDialogOpen(false);
      setApiKeyForm({ name: '', key: '', provider: ProviderType.OPENAI });
      onProviderConfigured(apiKeyForm.provider);
    } catch (err) {
      console.error('Failed to add API key:', err);
    }
  };

  const handleTestConnection = async (provider: ProviderType) => {
    try {
      const result = await testConnection(provider);
      if (result.success) {
        await loadModels(provider);
      }
    } catch (err) {
      console.error('Connection test failed:', err);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Model Providers</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Add API Key
        </Button>
      </Box>

      <Grid container spacing={3}>
        {Object.values(ProviderType).map((provider) => {
          const hasKey = apiKeys.some(key => key.provider === provider);
          const providerModels = models.filter(model => model.provider === provider);

          return (
            <Grid item xs={12} md={6} lg={4} key={provider}>
              <Card>
                <CardHeader
                  title={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Cloud />
                      <Typography variant="h6">
                        {provider.replace('_', ' ').toUpperCase()}
                      </Typography>
                      {hasKey && <CheckCircle color="success" />}
                    </Box>
                  }
                  action={
                    <Box>
                      <Tooltip title="Test Connection">
                        <IconButton onClick={() => handleTestConnection(provider)}>
                          <Settings />
                        </IconButton>
                      </Tooltip>
                      {hasKey && (
                        <Tooltip title="Configure">
                          <IconButton onClick={() => setEditingProvider(provider)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  }
                />
                <CardContent>
                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Status: {hasKey ? 'Configured' : 'Not Configured'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Models Available: {providerModels.length}
                    </Typography>
                  </Box>

                  {providerModels.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Available Models:
                      </Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {providerModels.slice(0, 3).map((model) => (
                          <Chip
                            key={model.model_id}
                            label={model.model_name}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {providerModels.length > 3 && (
                          <Chip
                            label={`+${providerModels.length - 3} more`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {!hasKey && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      API key required to use this provider
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* API Keys Table */}
      {apiKeys.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardHeader title="API Keys" />
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Masked Key</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.key_id}>
                      <TableCell>{key.name}</TableCell>
                      <TableCell>{key.provider}</TableCell>
                      <TableCell>{key.masked_key}</TableCell>
                      <TableCell>{key.created_at}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => removeApiKey(key.provider, key.key_id)}>
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Add API Key Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add API Key</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Provider</InputLabel>
              <Select
                value={apiKeyForm.provider}
                onChange={(e) => setApiKeyForm(prev => ({ ...prev, provider: e.target.value as ProviderType }))}
              >
                {Object.values(ProviderType).filter(p => p !== ProviderType.OLLAMA).map((provider) => (
                  <MenuItem key={provider} value={provider}>
                    {provider.replace('_', ' ').toUpperCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Key Name"
              value={apiKeyForm.name}
              onChange={(e) => setApiKeyForm(prev => ({ ...prev, name: e.target.value }))}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="API Key"
              type="password"
              value={apiKeyForm.key}
              onChange={(e) => setApiKeyForm(prev => ({ ...prev, key: e.target.value }))}
              helperText="Your API key will be encrypted and stored securely"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddApiKey} variant="contained">
            Add Key
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
```

**`ui/dashboard/src/hooks/useProviders.ts`**
```typescript
import { useState, useEffect } from 'react';
import { ProviderType, ModelInfo, APIKey } from '../types';
import { apiService } from '../services/apiService';

export const useProviders = () => {
  const [providers, setProviders] = useState<ProviderType[]>([]);
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = async (provider?: ProviderType) => {
    try {
      const response = await apiService.get('/providers/models', { provider });
      setModels(response.models);
    } catch (err: any) {
      setError(err.message || 'Failed to load models');
    }
  };

  const addApiKey = async (provider: ProviderType, keyData: any) => {
    try {
      await apiService.post('/providers/api-keys', {
        provider,
        action: 'add',
        key_data: keyData,
      });
      // Reload API keys
      await loadApiKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to add API key');
      throw err;
    }
  };

  const removeApiKey = async (provider: ProviderType, keyId: string) => {
    try {
      await apiService.post('/providers/api-keys', {
        provider,
        action: 'remove',
        key_data: { key_id: keyId },
      });
      // Reload API keys
      await loadApiKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to remove API key');
      throw err;
    }
  };

  const loadApiKeys = async () => {
    // This would load API keys from secure storage
    // Implementation depends on how keys are stored
  };

  const testConnection = async (provider: ProviderType) => {
    try {
      const response = await apiService.post('/providers/validate', { provider });
      return response.validation_result;
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
      throw err;
    }
  };

  useEffect(() => {
    loadModels();
    loadApiKeys();
  }, []);

  return {
    providers,
    models,
    apiKeys,
    loading,
    error,
    addApiKey,
    removeApiKey,
    testConnection,
    loadModels,
  };
};
```

#### Integration Steps for Provider Management:

1. **Add Provider Manager** to settings page
2. **Update PromptEditor** to show available models from all providers
3. **Add provider selection** in prompt creation/editing
4. **Implement API key validation** and error handling
5. **Add usage tracking** and cost display

## Implementation Timeline

### Week 1: AI Refinement Foundation
- [ ] Create `AIRefinementService` class
- [ ] Implement basic prompt analysis
- [ ] Add AI suggestions API endpoints
- [ ] Create `AISuggestionsPanel` component
- [ ] Integrate suggestions into PromptEditor

### Week 2: Advanced Testing Framework
- [ ] Create `TestingService` class
- [ ] Implement A/B testing logic
- [ ] Add statistical analysis functions
- [ ] Create `ABTestPanel` component
- [ ] Add test suite runner UI

### Week 3: Model Provider Integration
- [ ] Create `ModelProviderService` base class
- [ ] Implement OpenAI provider
- [ ] Implement Anthropic provider
- [ ] Create provider management UI
- [ ] Add API key management

### Week 4: Integration & Polish
- [ ] Integrate all services with existing codebase
- [ ] Add comprehensive error handling
- [ ] Implement caching and performance optimizations
- [ ] Add user feedback collection
- [ ] Create documentation and examples

## Dependencies to Add

### Backend Dependencies
```bash
pip install openai anthropic google-generativeai azure-identity scipy statsmodels
```

### Frontend Dependencies
```bash
npm install @mui/x-charts recharts react-hook-form @hookform/resolvers zod
```

## Testing Strategy

### Unit Tests
- Test each service method individually
- Mock external API calls
- Test error handling scenarios

### Integration Tests
- Test full AI refinement pipeline
- Test A/B testing workflow
- Test multi-provider execution

### E2E Tests
- Complete prompt refinement workflow
- Provider switching and execution
- Settings and configuration management

## Success Criteria

### AI Refinement
- ✅ Quality scores generated for all prompts
- ✅ AI suggestions provided with >80% acceptance rate
- ✅ Parameter optimization reduces manual tuning by 60%

### Testing Framework
- ✅ A/B tests complete in <30 seconds
- ✅ Statistical significance detected accurately
- ✅ Test results visualized clearly

### Model Integration
- ✅ All major providers (OpenAI, Anthropic, Google) supported
- ✅ API keys managed securely
- ✅ Usage tracking and cost monitoring implemented
- ✅ Seamless provider switching

This plan provides a comprehensive roadmap for junior developers to implement the three critical gaps in PromptPilot's functionality, transforming it from a basic prompt editor into a sophisticated AI-powered prompt refinement platform.</content>
<parameter name="filePath">phase1_implementation_plan.md