import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

test('renders PromptPilot app without crashing', () => {
  render(<App />);
  // If the app renders without throwing, the test passes
  expect(true).toBe(true);
});
