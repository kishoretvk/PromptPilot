import { useQuery } from '@tanstack/react-query';
import { MonitoringData, Alert, SystemHealth } from '../types/Monitoring';

// Mock data for development
const mockAlerts: Alert[] = [
  {
    id: '1',
    title: 'High CPU Usage',
    description: 'CPU usage exceeded 90% for 5 minutes',
    message: 'CPU usage has been consistently above 90% for the past 5 minutes, which may impact system performance.',
    tags: ['performance', 'cpu', 'infrastructure'],
    priority: 'P1',
    status: 'active',
    timestamp: new Date().toISOString(),
    service: 'API Server'
  },
  {
    id: '2',
    title: 'Database Connection Slow',
    description: 'Database response time increased by 50%',
    message: 'Database queries are taking 50% longer than usual, potentially affecting user experience.',
    tags: ['database', 'performance', 'latency'],
    priority: 'P2',
    status: 'acknowledged',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    service: 'Database'
  },
  {
    id: '3',
    title: 'Memory Leak Detected',
    description: 'Memory usage increasing steadily',
    message: 'Memory consumption has increased by 15% in the last hour, indicating a potential memory leak.',
    tags: ['memory', 'performance', 'infrastructure'],
    priority: 'P0',
    status: 'active',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    service: 'API Server'
  }
];

const mockSystemHealth: SystemHealth = {
  status: 'degraded',
  trend: 'down',
  cpu: {
    usage: 78.5,
    trend: 'up'
  },
  memory: {
    utilization: 82.3,
    trend: 'up'
  },
  activeUsers: 156,
  usersTrend: 'up'
};

const mockMonitoringData: MonitoringData = {
  performance: [
    { 
      timestamp: new Date(Date.now() - 3600000).toISOString(), 
      responseTime: 45,
      errorRate: 0.02
    },
    { 
      timestamp: new Date(Date.now() - 1800000).toISOString(), 
      responseTime: 52,
      errorRate: 0.05
    },
    { 
      timestamp: new Date().toISOString(), 
      responseTime: 48,
      errorRate: 0.03
    },
  ],
  resources: [
    {
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      cpu: {
        usage: 65,
        trend: 'stable'
      },
      memory: {
        utilization: 72,
        trend: 'up'
      }
    },
    {
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      cpu: {
        usage: 78,
        trend: 'up'
      },
      memory: {
        utilization: 82,
        trend: 'up'
      }
    },
    {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: 75,
        trend: 'down'
      },
      memory: {
        utilization: 80,
        trend: 'down'
      }
    }
  ]
};

// Hooks
export const useMonitoringData = (timeRange: string) => {
  // In a real implementation, this would fetch actual monitoring data
  // For now, we'll use mock data
  return useQuery<MonitoringData>({
    queryKey: ['monitoringData', timeRange],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockMonitoringData;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useAlerts = () => {
  return useQuery<Alert[]>({
    queryKey: ['alerts'],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockAlerts;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useSystemHealth = () => {
  return useQuery<SystemHealth>({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockSystemHealth;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};