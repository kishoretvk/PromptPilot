import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Card, CardContent, Alert, Collapse } from '@mui/material';
import { Refresh, BugReport, ExpandMore, ExpandLess } from '@mui/icons-material';
import { logErrorBoundaryError } from '../utils/errorHandling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
    retryCount: 0
  };

  constructor(props: Props) {
    super(props);
    this.handleRetry = this.handleRetry.bind(this);
    this.toggleDetails = this.toggleDetails.bind(this);
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error using enhanced error handling system
    logErrorBoundaryError(
      error, 
      { componentStack: errorInfo.componentStack || '' }, 
      this.props.componentName || 'Unknown'
    );

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // Call optional onError prop
    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch (e) {
        console.error('Error in onError callback:', e);
      }
    }
  }

  private handleRetry(): void {
    if (this.state.retryCount < this.maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        showDetails: false,
        retryCount: this.state.retryCount + 1
      });
    }
  }

  private toggleDetails(): void {
    this.setState({ showDetails: !this.state.showDetails });
  }

  private getErrorSeverity(): 'error' | 'warning' {
    if (!this.state.error) return 'error';
    
    // Classify error severity based on error type or message
    const message = this.state.error.message.toLowerCase();
    if (message.includes('chunkloaderror') || message.includes('loading')) {
      return 'warning'; // Network/loading issues are less severe
    }
    return 'error';
  }

  private getErrorTitle(): string {
    const severity = this.getErrorSeverity();
    return severity === 'warning' ? 'Loading Issue' : 'Application Error';
  }

  private getErrorMessage(): string {
    if (!this.state.error) return 'An unknown error occurred';
    
    const message = this.state.error.message;
    
    // Provide user-friendly messages for common error types
    if (message.includes('ChunkLoadError')) {
      return 'Failed to load application components. This may be due to a network issue or an updated version being deployed.';
    }
    
    if (message.includes('Loading chunk')) {
      return 'Failed to load part of the application. Please try refreshing the page.';
    }
    
    if (message.includes('Network Error')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    
    // For development, show actual error. In production, show generic message
    const isDevelopment = process.env.NODE_ENV === 'development';
    return isDevelopment ? message : 'An unexpected error occurred in the application.';
  }

  private getRecoveryActions(): ReactNode {
    const canRetry = this.state.retryCount < this.maxRetries;
    const severity = this.getErrorSeverity();
    
    return (
      <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {canRetry && (
          <Button
            variant="contained"
            color={severity === 'warning' ? 'warning' : 'primary'}
            startIcon={<Refresh />}
            onClick={this.handleRetry}
            size="small"
          >
            Try Again ({this.maxRetries - this.state.retryCount} left)
          </Button>
        )}
        
        <Button
          variant="outlined"
          color="primary"
          onClick={() => window.location.reload()}
          size="small"
        >
          Refresh Page
        </Button>
        
        {process.env.NODE_ENV === 'development' && (
          <Button
            variant="text"
            color="secondary"
            startIcon={this.state.showDetails ? <ExpandLess /> : <ExpandMore />}
            onClick={this.toggleDetails}
            size="small"
          >
            {this.state.showDetails ? 'Hide' : 'Show'} Details
          </Button>
        )}
      </Box>
    );
  }

  private renderErrorDetails(): ReactNode {
    if (!this.state.showDetails || !this.state.error) return null;
    
    return (
      <Collapse in={this.state.showDetails}>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="error" gutterBottom>
            Error Details (Development Mode)
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Component:</strong> {this.props.componentName || 'Unknown'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Error:</strong> {this.state.error.message}
          </Typography>
          
          {this.state.error.stack && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Stack Trace:</strong>
              </Typography>
              <Box
                component="pre"
                sx={{
                  fontSize: '0.75rem',
                  backgroundColor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 200
                }}
              >
                {this.state.error.stack}
              </Box>
            </Box>
          )}
          
          {this.state.errorInfo?.componentStack && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Component Stack:</strong>
              </Typography>
              <Box
                component="pre"
                sx={{
                  fontSize: '0.75rem',
                  backgroundColor: 'grey.100',
                  p: 1,
                  borderRadius: 1,
                  overflow: 'auto',
                  maxHeight: 150
                }}
              >
                {this.state.errorInfo.componentStack}
              </Box>
            </Box>
          )}
        </Box>
      </Collapse>
    );
  }

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const severity = this.getErrorSeverity();
      const title = this.getErrorTitle();
      const message = this.getErrorMessage();

      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
            p: 2
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <BugReport 
                  sx={{ 
                    fontSize: 48, 
                    color: severity === 'warning' ? 'warning.main' : 'error.main',
                    mb: 1 
                  }} 
                />
                <Typography variant="h5" color="text.primary" gutterBottom>
                  {title}
                </Typography>
              </Box>

              <Alert severity={severity} sx={{ mb: 2 }}>
                {message}
              </Alert>

              <Typography variant="body2" color="text.secondary" paragraph>
                {severity === 'warning' 
                  ? 'This is usually a temporary issue that can be resolved by refreshing the page.'
                  : 'We apologize for the inconvenience. The error has been logged and our team will investigate.'
                }
              </Typography>

              {this.getRecoveryActions()}
              {this.renderErrorDetails()}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;