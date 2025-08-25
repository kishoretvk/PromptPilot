// src/components/MonitoringDashboard/MonitoringDashboard.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  BarChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/api';

// Types
interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime: number;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  database: string;
  uptime: number;
  dependencies: Record<string, string>;
}

interface MetricDataPoint {
  timestamp: string;
  value: number;
  metric: string;
}

// Mock data for charts
const mockRequestData = [
  { name: 'GET /prompts', requests: 400 },
  { name: 'POST /prompts', requests: 300 },
  { name: 'PUT /prompts', requests: 200 },
  { name: 'DELETE /prompts', requests: 100 },
];

const mockPerformanceData = [
  { time: '00:00', latency: 45, throughput: 120 },
  { time: '04:00', latency: 38, throughput: 150 },
  { time: '08:00', latency: 52, throughput: 95 },
  { time: '12:00', latency: 48, throughput: 110 },
  { time: '16:00', latency: 41, throughput: 140 },
  { time: '20:00', latency: 55, throughput: 85 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const MonitoringDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('24h');
  
  // Fetch health status
  const { data: healthStatus, isLoading: healthLoading, error: healthError } = useQuery<HealthStatus>({
    queryKey: ['health'],
    queryFn: () => apiClient.get('/health').then(res => res.data),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  // Fetch system metrics
  const { data: systemMetrics, isLoading: metricsLoading } = useQuery<SystemMetrics>({
    queryKey: ['systemMetrics'],
    queryFn: async () => {
      // In a real implementation, this would call an actual metrics endpoint
      // For now, we'll extract from health status or use mock data
      if (healthStatus?.dependencies) {
        return {
          cpu_usage: parseFloat(healthStatus.dependencies.cpu_usage || '0'),
          memory_usage: parseFloat(healthStatus.dependencies.memory_usage || '0'),
          disk_usage: parseFloat(healthStatus.dependencies.disk_usage || '0'),
          uptime: healthStatus.uptime || 0,
        };
      }
      return {
        cpu_usage: 45,
        memory_usage: 65,
        disk_usage: 30,
        uptime: 86400,
      };
    },
    refetchInterval: 30000,
  });
  
  // Format uptime
  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };
  
  if (healthLoading || metricsLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }
  
  if (healthError) {
    return (
      <Box p={3}>
        <Alert severity="error">
          Error loading monitoring data: {(healthError as Error).message}
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Monitoring Dashboard
      </Typography>
      
      {/* Health Status */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Typography 
                variant="h4" 
                color={healthStatus?.status === 'healthy' ? 'success.main' : 'error.main'}
              >
                {healthStatus?.status || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last checked: {healthStatus?.timestamp ? new Date(healthStatus.timestamp).toLocaleString() : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Uptime
              </Typography>
              <Typography variant="h4">
                {systemMetrics?.uptime ? formatUptime(systemMetrics.uptime) : 'N/A'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                System running time
              </Typography>
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Version
              </Typography>
              <Typography variant="h4">
                {healthStatus?.version || '1.0.0'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                PromptPilot
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      {/* System Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CPU Usage
              </Typography>
              <CircularProgress 
                variant="determinate" 
                value={systemMetrics?.cpu_usage || 0} 
                size={100}
                thickness={4}
              />
              <Box position="relative" display="flex" justifyContent="center" mt={-7.5}>
                <Typography variant="h6">
                  {systemMetrics?.cpu_usage?.toFixed(1) || 0}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage
              </Typography>
              <CircularProgress 
                variant="determinate" 
                value={systemMetrics?.memory_usage || 0} 
                size={100}
                thickness={4}
                sx={{ color: '#00C49F' }}
              />
              <Box position="relative" display="flex" justifyContent="center" mt={-7.5}>
                <Typography variant="h6">
                  {systemMetrics?.memory_usage?.toFixed(1) || 0}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Disk Usage
              </Typography>
              <CircularProgress 
                variant="determinate" 
                value={systemMetrics?.disk_usage || 0} 
                size={100}
                thickness={4}
                sx={{ color: '#FFBB28' }}
              />
              <Box position="relative" display="flex" justifyContent="center" mt={-7.5}>
                <Typography variant="h6">
                  {systemMetrics?.disk_usage?.toFixed(1) || 0}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      {/* Charts */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3, mb: 3 }}>
        <Box>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Request Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockRequestData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="requests" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
        
        <Box>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#8884d8" 
                  name="Latency (ms)"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="throughput" 
                  stroke="#82ca9d" 
                  name="Throughput (req/s)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>
      
      {/* Dependencies Status */}
      <Box>
        <Box>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Dependencies Status
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Dependency</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {healthStatus?.dependencies && Object.entries(healthStatus.dependencies).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell>{key}</TableCell>
                      <TableCell>
                        <Typography 
                          color={value.toLowerCase().includes('error') || value.toLowerCase().includes('disconnected') ? 'error.main' : 'success.main'}
                        >
                          {value}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default MonitoringDashboard;