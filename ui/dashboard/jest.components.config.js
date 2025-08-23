// Jest Configuration for Component Tests
module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js'
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(axios|@tanstack/react-query|@mui|react-router-dom)/)'
  ],
  testMatch: [
    '<rootDir>/src/components/common/__tests__/**/*.(ts|tsx|js|jsx)'
  ],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/'],
  clearMocks: true,
  restoreMocks: true,
  testTimeout: 10000
};