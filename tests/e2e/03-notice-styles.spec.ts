import { test, expect } from '@playwright/test';
import path from 'path';
import { DEFAULT_CONFIG } from '../fixtures/test-config';

test.describe('Notice Styles', () => {
  test.describe('Full Style (default)', () => {
    test('should display title, button, and metadata', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const notice = page.locator('.reproducible-notice.full');
      await expect(notice).toBeVisible();

      const title = notice.locator('strong');
      await expect(title).toHaveText(DEFAULT_CONFIG.ui.noticeTitle);

      const button = notice.locator('a');
      await expect(button).toBeVisible();

      const metadata = notice.locator('span');
      await expect(metadata).toContainText('Medium (6 CPU, 24GB RAM)');
      await expect(metadata).toContainText('Auto-expires: 2h');
    });

    test('should apply correct CSS class', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const notice = page.locator('.reproducible-notice.full');
      // Use separate checks to be order-agnostic
      await expect(notice).toHaveClass(/reproducible-notice/);
      await expect(notice).toHaveClass(/full/);
    });

    test('should apply branding colors to button', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const button = page.locator('.reproducible-notice a');

      // Onyxia orange background
      await expect(button).toHaveCSS('background-color', DEFAULT_CONFIG.branding.primaryColor);

      // White text
      await expect(button).toHaveCSS('color', 'rgb(255, 255, 255)');
    });
  });

  test.describe('Minimal Style', () => {
    test('should display button and metadata without title', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/minimal-style.html'));

      const notice = page.locator('.reproducible-notice.minimal');
      await expect(notice).toBeVisible();

      // No title
      const title = notice.locator('strong');
      await expect(title).toHaveCount(0);

      // Button present
      const button = notice.locator('a');
      await expect(button).toBeVisible();

      // Metadata present
      const metadata = notice.locator('span');
      await expect(metadata).toBeVisible();
      await expect(metadata).toContainText('Medium (6 CPU, 24GB RAM)');
    });

    test('should use minimal CSS class', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/minimal-style.html'));

      const notice = page.locator('.reproducible-notice.minimal');
      await expect(notice).toHaveClass(/minimal/);
    });

    test('should not have title in DOM', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/minimal-style.html'));

      // Specifically check within the notice div for the title
      const notice = page.locator('.reproducible-notice.minimal');
      const title = notice.locator('strong').filter({ hasText: DEFAULT_CONFIG.ui.noticeTitle });
      await expect(title).toHaveCount(0);
    });
  });

  test.describe('Button-only Style', () => {
    test('should display only the button', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/button-only-style.html'));

      const button = page.locator('.reproducible-button');
      await expect(button).toBeVisible();

      // No notice wrapper
      const notice = page.locator('.reproducible-notice');
      await expect(notice).toHaveCount(0);

      // No metadata
      const metadata = page.getByText('Medium (6 CPU, 24GB RAM)');
      await expect(metadata).toHaveCount(0);
    });

    test('should not have wrapper div', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/button-only-style.html'));

      const button = page.locator('.reproducible-button');
      await expect(button).toBeVisible();

      // Verify it's a standalone link, not inside .reproducible-notice
      const noticeParent = page.locator('.reproducible-notice .reproducible-button');
      await expect(noticeParent).toHaveCount(0);
    });

    test('should use button-only CSS class', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/button-only-style.html'));

      const button = page.locator('.reproducible-button');
      await expect(button).toHaveClass('reproducible-button');
    });
  });
});
