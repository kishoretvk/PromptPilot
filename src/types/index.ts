export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string | number;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface FilterConfig {
  key: string;
  value: any;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
}

export interface SearchConfig {
  query: string;
  fields: string[];
}

export interface ExportConfig {
  format: 'csv' | 'json' | 'xlsx';
  filename?: string;
  include_headers?: boolean;
  selected_fields?: string[];
}

export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  title?: string;
  xlabel?: string;
  ylabel?: string;
  legend?: boolean;
  responsive?: boolean;
}

// Re-export all types for easier imports
export * from './Prompt';
export * from './Pipeline';
export * from './Analytics';
export * from './Settings';