import { test, expect } from '@playwright/test';
import path from 'path';
import { OnyxiaUrlParser } from '../fixtures/test-helpers';

test.describe('Error Handling', () => {
  test.describe('Disabled Feature', () => {
    test('should not render button when disabled', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/disabled.html'));

      const notice = page.locator('.reproducible-notice');
      await expect(notice).toHaveCount(0);

      const button = page.locator('.reproducible-button');
      await expect(button).toHaveCount(0);

      const text = page.getByText('Reproduce this analysis');
      await expect(text).toHaveCount(0);
    });

    test('should render page normally when disabled', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/disabled.html'));

      // Should have normal content
      const heading = page.getByRole('heading', { name: 'Test Content' });
      await expect(heading).toBeVisible();
    });
  });

  test.describe('Missing Metadata', () => {
    test('should not render button when reproducible block missing', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/no-metadata.html'));

      const notice = page.locator('.reproducible-notice');
      await expect(notice).toHaveCount(0);

      const button = page.locator('.reproducible-button');
      await expect(button).toHaveCount(0);
    });
  });

  test.describe('Invalid Values', () => {
    test('should fallback to medium tier for invalid tier', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/invalid-tier.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      // Should fallback to medium
      expect(parser.getDecodedParam('tier')).toBe('medium');
    });

    test('should display medium tier label for invalid tier', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/invalid-tier.html'));

      const metadata = page.locator('.reproducible-notice span');
      await expect(metadata).toContainText('Medium (6 CPU, 24GB RAM)');
    });

    test('should still render button with invalid tier', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/invalid-tier.html'));

      const button = page.locator('.reproducible-notice a');
      await expect(button).toBeVisible();
      await expect(button).toHaveText('Launch Environment');
    });
  });
});
