# Playwright Test Suite

Comprehensive end-to-end tests for the reproducible button extension using Playwright.

## Overview

This test suite uses Playwright to test the reproducible button extension with sophisticated DOM assertions, CSS validation, accessibility testing, and visual regression.

**Test Coverage:** 45+ tests across 7 spec files

## Quick Start

### Install Dependencies

```bash
npm install
```

This installs Playwright and all required dependencies.

### Install Playwright Browsers

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit browsers.

### Run Tests

```bash
# Run all tests
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug specific test
npm run test:debug
```

### View Test Report

After running tests:

```bash
npm run test:report
```

This opens an HTML report in your browser.

## Test Structure

```
tests/
├── fixtures/
│   ├── test-config.ts       # Shared constants and defaults
│   ├── test-helpers.ts      # URL parser and assertion utilities
│   └── quarto-renderer.ts   # (Future) Quarto rendering fixture
├── e2e/
│   ├── 01-url-generation.spec.ts       # 8 tests - URL encoding, parameters
│   ├── 02-configuration.spec.ts        # 12 tests - Config precedence
│   ├── 03-notice-styles.spec.ts        # 9 tests - Full/minimal/button-only
│   ├── 04-metadata-extraction.spec.ts  # 10 tests - Tier, flavor, version
│   └── 05-error-handling.spec.ts       # 6 tests - Disabled, invalid
├── accessibility/
│   └── button-a11y.spec.ts            # 5 tests - ARIA, keyboard, contrast
└── visual/
    └── notice-appearance.spec.ts      # 4 tests - Screenshot comparison
```

## How Tests Work

### 1. Global Setup (Before All Tests)

`tests/global-setup.ts` runs first and renders all `.qmd` files from `test-examples/` to `test-outputs/`:

```
test-examples/basic.qmd → test-outputs/basic.html
test-examples/full-metadata.qmd → test-outputs/full-metadata.html
...
```

### 2. Test Execution

Each test:
1. Loads a pre-rendered HTML file using `file://` protocol
2. Queries the DOM for button/notice elements
3. Verifies attributes, styles, and content
4. Validates generated URLs

### 3. No Live Server Required

Tests use `file://` URLs to load HTML directly. This is:
- Fast (no server startup)
- Reliable (no network issues)
- Simple (no port conflicts)

## Test Categories

### E2E Tests (`tests/e2e/`)

Core functionality tests covering all features:
- URL generation and encoding
- Configuration system (3-level precedence)
- Notice style variants
- Metadata extraction
- Error handling and validation

### Accessibility Tests (`tests/accessibility/`)

ARIA, keyboard navigation, and screen reader support:
- Accessible names
- Keyboard focus
- Color contrast
- New tab indicators
- Valid link attributes

### Visual Tests (`tests/visual/`)

Screenshot comparison for visual regression:
- Full notice style
- Minimal notice style
- Button-only style
- Custom metadata rendering

## Writing New Tests

### Basic Test Template

```typescript
import { test, expect } from '@playwright/test';
import path from 'path';

test('your test description', async ({ page }) => {
  // Load rendered HTML
  await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/your-file.html'));

  // Query DOM
  const button = page.locator('.reproducible-notice a');

  // Assert
  await expect(button).toBeVisible();
});
```

### Testing URLs

```typescript
import { OnyxiaUrlParser } from '../fixtures/test-helpers';

test('should have correct URL parameters', async ({ page }) => {
  await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

  const button = page.locator('.reproducible-notice a');
  const href = await button.getAttribute('href');
  const parser = new OnyxiaUrlParser(href!);

  // Verify parameters
  expect(parser.getDecodedParam('tier')).toBe('medium');
  expect(parser.getCatalog()).toBe('handbook');
});
```

### Adding New Test Fixtures

1. Create new `.qmd` file in `test-examples/`
2. Run `npm test` (global setup will render it)
3. Write tests that load the generated HTML

## Updating Visual Baselines

When the button design changes intentionally:

```bash
# Update all screenshot baselines
npx playwright test --update-snapshots

# Update specific test only
npx playwright test visual/notice-appearance --update-snapshots
```

Commit the updated snapshots to version control.

## CI Integration

Tests run automatically in GitHub Actions on:
- Every push to main
- Every pull request

See `.github/workflows/test.yml` for configuration.

## Debugging Failed Tests

### View Test Report

```bash
npm run test:report
```

The HTML report shows:
- Which tests failed
- Screenshots of failures
- DOM snapshots
- Error messages

### Run in UI Mode

```bash
npm run test:ui
```

Interactive mode allows:
- Step through tests
- Inspect DOM at each step
- Re-run failed tests
- Time-travel debugging

### Run in Debug Mode

```bash
npm run test:debug
```

Opens Playwright Inspector with:
- Breakpoints
- Step-by-step execution
- DOM inspection

### Check Generated HTML

If a test fails, inspect the generated HTML:

```bash
cat test-outputs/basic.html | grep "reproducible"
```

## Comparison with Bash Tests

### Bash Tests (test.sh)

**Strengths:**
- Fast execution (15 seconds)
- Simple setup (no dependencies)
- Good for TDD workflow

**Use for:**
- Quick local smoke testing
- Rapid development feedback

### Playwright Tests (npm test)

**Strengths:**
- DOM structure validation
- CSS and styling verification
- Accessibility testing
- Visual regression
- Cross-browser testing

**Use for:**
- Pre-merge validation
- Comprehensive CI checks
- Visual regression testing

### Recommended Workflow

```bash
# During development (quick feedback)
bash test.sh

# Before committing (thorough validation)
npm test

# Before releasing (all browsers + visual)
npm test -- --project=chromium --project=firefox --project=webkit
```

## Troubleshooting

### Error: "Playwright browsers not installed"

```bash
npx playwright install
```

### Error: "Cannot find module '@playwright/test'"

```bash
npm install
```

### Error: "Quarto not found"

Ensure Quarto is installed and in PATH:
```bash
quarto --version
```

### Tests failing after code changes

1. Check if QMD files render correctly:
   ```bash
   quarto render test-examples/basic.qmd
   ```

2. Verify generated HTML:
   ```bash
   cat test-outputs/basic.html | grep reproducible
   ```

3. Re-run global setup:
   ```bash
   rm -rf test-outputs && npm test
   ```

## Performance

- **Global setup:** ~10-20 seconds (renders all QMD files)
- **Test execution:** ~30-40 seconds (45+ tests across 3 browsers)
- **Total:** ~50-60 seconds for full suite

Parallel execution keeps total time manageable despite comprehensive coverage.
