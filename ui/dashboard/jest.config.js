// Jest Configuration for PromptPilot Frontend Tests
// Supports unit tests, integration tests, and component testing

const path = require('path');

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts'
  ],
  
  // Module name mapping for absolute imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
  },
  
  // File extensions to consider
  moduleFileExtensions: [
    'js',
    'jsx',
    'ts',
    'tsx',
    'json'
  ],
  
  // Transform files
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
    '^.+\\.css$': 'jest-transform-css',
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': 'jest-transform-file'
  },
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(axios|@tanstack/react-query|@mui)/)'
  ],
  
  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js|jsx)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js|jsx)',
    '<rootDir>/tests/**/*.(test|spec).(ts|tsx|js|jsx)'
  ],
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/public/'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
    '!src/setupTests.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    // Specific thresholds for critical files
    './src/components/': {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    },
    './src/services/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/hooks/': {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    },
    './src/utils/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Module directories
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src'
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Test timeout
  testTimeout: 10000,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/setup/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/setup/globalTeardown.ts',
  
  // Custom matchers and utilities
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts',
    '<rootDir>/tests/setup/testSetup.ts'
  ],
  
  // Mock static assets
  moduleNameMapping: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  
  // Verbose output for detailed test results
  verbose: true,
  
  // Detect open handles (for async operations)
  detectOpenHandles: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Max workers for parallel test execution
  maxWorkers: '50%',
  
  // Cache directory
  cacheDirectory: '<rootDir>/node_modules/.cache/jest',
  
  // Watch plugins for interactive mode
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Test results processor for custom reporting
  testResultsProcessor: '<rootDir>/tests/setup/testResultsProcessor.js',
  
  // Custom test sequencer for optimal test order
  testSequencer: '<rootDir>/tests/setup/testSequencer.js'
};