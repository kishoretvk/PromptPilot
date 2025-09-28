import React from 'react';
import { Box, Typography, Button, Alert, Modal, Fab } from '@mui/material';
import { promptService } from '../../services/PromptService';
import { useQuery } from '@tanstack/react-query';

interface AIRefinementPanelProps {
  promptData: any;
  onRefinementComplete?: (refinedPrompt: any) => void;
  onQualityUpdate?: (qualityScore: any) => void;
}

const AIRefinementPanel: React.FC<AIRefinementPanelProps> = ({ promptData, onRefinementComplete, onQualityUpdate }) => {
  const { data: results, isLoading } = useQuery({
    queryKey: ['optimization', promptData.id],
    queryFn: () => promptService.getOptimizationResults(promptData.id),
  });

  const handleRunABTest = async () => {
    if (!promptData) return;
    try {
      const result = await promptService.runABTest(promptData.id, promptData.test_cases || []);
      setABResults(result);
    } catch (err) {
      console.error(err);
    }
  };

  const [abResults, setABResults] = React.useState<any>(null);

  return (
    <Box>
      <Typography variant="h6">AI Refinement Panel</Typography>
      <Button onClick={handleRunABTest} disabled={isLoading}>
        Run AB Test
      </Button>
      {abResults && <Typography>Success Rate: {(abResults.success_rate * 100).toFixed(1)}%</Typography>}
    </Box>
  );
};

export default AIRefinementPanel;
