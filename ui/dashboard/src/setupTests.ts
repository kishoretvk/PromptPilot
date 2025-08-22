// Test Setup Configuration
// Sets up testing environment with mocks, utilities, and custom matchers

import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock fetch API
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(cb: any) {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.location
delete (window as any).location;
window.location = {
  ...window.location,
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  hostname: 'localhost',
  port: '3000',
  protocol: 'http:',
} as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string): string | null => {
      return store[key] || null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length(): number {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string): string | null => {
      return store[key] || null;
    },
    setItem: (key: string, value: string): void => {
      store[key] = value.toString();
    },
    removeItem: (key: string): void => {
      delete store[key];
    },
    clear: (): void => {
      store = {};
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
    get length(): number {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Mock console methods to reduce noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Warning: componentWillReceiveProps') ||
       args[0].includes('Warning: componentWillMount'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock React Router
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'test',
  }),
  useParams: () => ({}),
}));

// Mock React Query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

// Mock toast notifications
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
    dismiss: jest.fn(),
  },
  ToastContainer: () => null,
}));

// Mock Chart.js
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  BarElement: jest.fn(),
  ArcElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

// Mock react-chartjs-2
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => <div data-testid="line-chart" />,
  Bar: ({ data, options }: any) => <div data-testid="bar-chart" />,
  Pie: ({ data, options }: any) => <div data-testid="pie-chart" />,
  Doughnut: ({ data, options }: any) => <div data-testid="doughnut-chart" />,
}));

// Mock ReactFlow
jest.mock('reactflow', () => ({
  ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
  Background: () => <div data-testid="react-flow-background" />,
  Controls: () => <div data-testid="react-flow-controls" />,
  MiniMap: () => <div data-testid="react-flow-minimap" />,
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  addEdge: jest.fn(),
  MarkerType: {
    ArrowClosed: 'arrowclosed',
  },
}));

// Test utilities
export const createMockQueryClient = () => ({
  getQueryData: jest.fn(),
  setQueryData: jest.fn(),
  invalidateQueries: jest.fn(),
  removeQueries: jest.fn(),
  refetchQueries: jest.fn(),
  clear: jest.fn(),
});

export const createMockRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
});

// Custom jest matchers
expect.extend({
  toBeInTheDocument: (received: any) => {
    const pass = received !== null && received !== undefined;
    return {
      message: () => `expected element ${pass ? 'not ' : ''}to be in the document`,
      pass,
    };
  },
});

// Global test timeout
jest.setTimeout(10000);

// Suppress specific warnings
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('React Router Future Flag Warning') ||
     args[0].includes('Warning: Each child in a list should have a unique'))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});