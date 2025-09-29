import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Card, List, ListItem, ListItemText, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { promptService } from '../services/PromptService';
import { useWebSocket } from '../hooks/useWebSocket';

const RefineView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentProgress, setCurrentProgress] = React.useState<string>('disconnected');

  const { data: prompt, isLoading: loading, error } = useQuery({
    queryKey: ['prompt', id],
    queryFn: () => promptService.getPrompt(id!),
  });

  const wsOptions = {
    url: `ws://localhost:8000/ws/progress/${id}`,
    onMessage: (message: any) => {
      if (message.type === 'progress_update') {
        setCurrentProgress(message.data?.status || message.type);
      }
    },
    onConnect: () => console.log('Connected to refinement progress'),
  onError: (error: any) => console.error('WebSocket error:', error),
  };
  const { isConnected, status } = useWebSocket(wsOptions);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">Error loading prompt: {error.message}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Refining Prompt: {prompt?.name}
      </Typography>
      
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Current Status: {status || 'disconnected'}
        </Typography>
        <Typography variant="body1">
          WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}
        </Typography>
      </Card>

      {currentProgress === 'analyzing' && (
        <Alert severity="info">
          Analyzing prompt description...
        </Alert>
      )}

      {currentProgress === 'refining' && (
        <Alert severity="info">
          Generating refinement suggestions...
        </Alert>
      )}

      {currentProgress === 'complete' && (
        <Alert severity="success">
          Refinement complete! Check your prompts for updated version.
        </Alert>
      )}

      <Card sx={{ mt: 3, p: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Original Prompt: {prompt?.description}
        </Typography>
        <List>
          {prompt?.messages?.map((msg, index) => (
            <ListItem key={index}>
              <ListItemText
                primary={`${msg.role.toUpperCase()}: Priority ${msg.priority}`}
                secondary={msg.content}
              />
            </ListItem>
          ))}
        </List>
      </Card>
    </Box>
  );
};

export default RefineView;
