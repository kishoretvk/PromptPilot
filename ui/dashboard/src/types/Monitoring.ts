// Types for monitoring functionality
export interface Alert {
  id: string;
  title: string;
  description: string;
  message: string;
  tags: string[];
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'active' | 'resolved' | 'acknowledged';
  timestamp: string;
  service: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  trend: 'up' | 'down' | 'stable';
  cpu: {
    usage: number;
    trend: 'up' | 'down' | 'stable';
  };
  memory: {
    utilization: number;
    trend: 'up' | 'down' | 'stable';
  };
  activeUsers: number;
  usersTrend: 'up' | 'down' | 'stable';
}

export interface MonitoringDataPoint {
  timestamp: string;
  value: number;
  metric: string;
}

// Performance data point with response time and error rate
export interface PerformanceDataPoint {
  timestamp: string;
  responseTime: number;
  errorRate: number;
}

// Resource data point with CPU and memory usage
export interface ResourceDataPoint {
  timestamp: string;
  cpu: {
    usage: number;
    trend: 'up' | 'down' | 'stable';
  };
  memory: {
    utilization: number;
    trend: 'up' | 'down' | 'stable';
  };
}

// Complete monitoring data structure
export interface MonitoringData {
  performance: PerformanceDataPoint[];
  resources: ResourceDataPoint[];
}