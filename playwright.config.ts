import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for reproducible button extension tests
 *
 * Tests load pre-rendered HTML files from test-outputs/
 * See tests/global-setup.ts for Quarto rendering
 */
export default defineConfig({
  testDir: './tests',

  // Run tests in parallel for speed
  fullyParallel: true,

  // Fail CI if you accidentally leave test.only
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Parallel workers
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ...(process.env.CI ? [['junit', { outputFile: 'test-results/junit.xml' }]] : []),
  ],

  // Shared test configuration
  use: {
    // Base URL for file:// protocol tests
    baseURL: 'file://' + path.resolve(__dirname, 'test-outputs'),

    // Capture trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure (for debugging)
    video: 'retain-on-failure',
  },

  // Test against multiple browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Global setup - render all Quarto test files before running tests
  globalSetup: require.resolve('./tests/global-setup.ts'),

  // Output directories
  outputDir: 'test-results/',
});
