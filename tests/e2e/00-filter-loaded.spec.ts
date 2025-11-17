import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Smoke tests to verify the Lua filter is properly loaded and executing
 *
 * These tests would catch critical issues like:
 * - Missing `return {{Meta = Meta}}` in the Lua filter
 * - Filter not being loaded by Quarto
 * - Filter crashing during execution
 *
 * Context: Prevents regression of v0.1.0 bug where missing return statement
 *          caused filter to never execute, resulting in silent failure.
 */
test.describe('Filter Loaded and Executing', () => {
  test('should render reproducible button when enabled', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    // Critical: If the Lua filter doesn't export properly (missing return statement),
    // no button will be rendered at all
    const button = page.locator('.reproducible-notice a, .reproducible-button');
    await expect(button).toBeVisible();
  });

  test('should inject HTML into document', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    // Verify the filter actually modified the document
    const notice = page.locator('.reproducible-notice, .reproducible-button');
    await expect(notice).toHaveCount(1);

    // Verify it's actually visible on the page
    await expect(notice).toBeAttached();
  });

  test('should not render button when disabled', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/disabled.html'));

    // Should not have any reproducible elements
    const notice = page.locator('.reproducible-notice, .reproducible-button');
    await expect(notice).toHaveCount(0);
  });

  test('should not render button when no metadata present', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/no-metadata.html'));

    // Should not have any reproducible elements
    const notice = page.locator('.reproducible-notice, .reproducible-button');
    await expect(notice).toHaveCount(0);
  });

  test('should generate valid href attribute', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.locator('.reproducible-notice a, .reproducible-button');
    const href = await button.getAttribute('href');

    // If filter isn't executing, href will be null or empty
    expect(href).toBeTruthy();
    expect(href).toMatch(/^https?:\/\//);
  });

  test('should include class name for styling', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    // Check for proper CSS classes
    const button = page.locator('a.reproducible-button, .reproducible-notice a');
    await expect(button).toHaveCount(1);
  });
});

test.describe('Filter Registration (Source Code Validation)', () => {
  /**
   * Regression tests that validate the Lua source code itself
   * Critical for preventing the v0.1.0 bug from recurring
   */

  test('filter must export Meta function (regression test for v0.1.0 bug)', async () => {
    const luaPath = path.resolve(__dirname, '../../_extensions/reproducible/reproducible.lua');
    const luaContent = fs.readFileSync(luaPath, 'utf-8');

    // Critical: Verify export statement exists
    // Valid patterns:
    // - return {{Meta = Meta}}
    // - return { {Meta = Meta} }
    // - return { ['Meta'] = Meta }
    const hasValidExport =
      luaContent.includes('return {{Meta = Meta}}') ||
      luaContent.includes('return { {Meta = Meta} }') ||
      luaContent.includes("return { ['Meta'] = Meta }");

    expect(hasValidExport).toBeTruthy();
  });

  test('reproducible.lua should define Meta function', async () => {
    const luaPath = path.resolve(__dirname, '../../_extensions/reproducible/reproducible.lua');
    const luaContent = fs.readFileSync(luaPath, 'utf-8');

    // Verify Meta function is defined
    expect(luaContent).toContain('function Meta(');
    expect(luaContent).toMatch(/function\s+Meta\s*\(/);
  });

  test('Meta function should call quarto.doc.include_text', async () => {
    const luaPath = path.resolve(__dirname, '../../_extensions/reproducible/reproducible.lua');
    const luaContent = fs.readFileSync(luaPath, 'utf-8');

    // Verify injection logic exists
    expect(luaContent).toContain('quarto.doc.include_text');
    expect(luaContent).toContain('before-body');
  });
});

test.describe('Raw HTML Content Validation', () => {
  /**
   * Tests that validate the actual HTML content without browser parsing
   * Catches issues that might be masked by browser error recovery
   */

  test('filter should have injected content into rendered HTML', async () => {
    const htmlPath = path.resolve(__dirname, '../../test-outputs/basic.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // Critical: Verify HTML contains injected content
    expect(htmlContent).toContain('reproducible-notice');
    expect(htmlContent).toContain('datalab.officialstatistics.org/launcher');
    expect(htmlContent).toContain('Launch Environment');

    // Verify deep-link parameters are present
    expect(htmlContent).toContain('tier=');
    expect(htmlContent).toContain('chapter.name=');
    expect(htmlContent).toContain('autoLaunch=');
  });

  test('disabled state should have no filter artifacts in HTML', async () => {
    const htmlPath = path.resolve(__dirname, '../../test-outputs/disabled.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // Verify filter ran but produced no output
    expect(htmlContent).not.toContain('reproducible-notice');
    expect(htmlContent).not.toContain('datalab.officialstatistics.org');
    expect(htmlContent).not.toContain('Launch Environment');
  });
});
