import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * Visual regression tests using screenshot comparison
 * Run with: npx playwright test --update-snapshots to update baselines
 */

test.describe('Visual Appearance', () => {
  test('full notice style renders correctly', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const notice = page.locator('.reproducible-notice.full');
    await expect(notice).toBeVisible();

    // Screenshot comparison
    await expect(notice).toHaveScreenshot('full-notice.png');
  });

  test('minimal notice style renders correctly', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/minimal-style.html'));

    const notice = page.locator('.reproducible-notice.minimal');
    await expect(notice).toBeVisible();

    await expect(notice).toHaveScreenshot('minimal-notice.png');
  });

  test('button-only style renders correctly', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/button-only-style.html'));

    const button = page.locator('.reproducible-button');
    await expect(button).toBeVisible();

    await expect(button).toHaveScreenshot('button-only.png');
  });

  test('full metadata notice renders correctly', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

    const notice = page.locator('.reproducible-notice');
    await expect(notice).toBeVisible();

    await expect(notice).toHaveScreenshot('full-metadata-notice.png');
  });
});
