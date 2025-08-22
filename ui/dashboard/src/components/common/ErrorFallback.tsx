import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import { FallbackProps } from 'react-error-boundary';

interface ErrorFallbackProps extends FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <Container maxWidth=\"md\" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
        <ErrorOutline color=\"error\" sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant=\"h4\" component=\"h1\" color=\"error\" gutterBottom>
          Something went wrong
        </Typography>
        <Typography variant=\"body1\" color=\"text.secondary\" sx={{ mb: 3 }}>
          The application encountered an unexpected error. Please try again.
        </Typography>
        <Button
          variant=\"contained\"
          startIcon={<Refresh />}
          onClick={resetErrorBoundary}
          size=\"large\"
        >
          Try Again
        </Button>
        {process.env.NODE_ENV === 'development' && (
          <Box sx={{ mt: 3, textAlign: 'left' }}>
            <Typography variant=\"body2\" component=\"pre\" sx={{ 
              backgroundColor: '#f5f5f5', 
              p: 2, 
              borderRadius: 1,
              fontSize: '0.8rem',
              overflow: 'auto'
            }}>
              {error.message}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ErrorFallback;"