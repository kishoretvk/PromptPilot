import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    trashAssetsBeforeRuns: false,
    open: true,
    env: {
      REACT_APP_API_URL: 'http://localhost:8000/api',
    },
    retries: {
      runMode: 2,
      openMode: 0,
    },
  },
});
