import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Accessibility', () => {
  test('button should have accessible name', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.getByRole('link', { name: /Launch Environment/i });
    await expect(button).toBeVisible();
  });

  test('button should be keyboard accessible', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.locator('.reproducible-notice a');

    // Focus the button with keyboard
    await button.focus();
    await expect(button).toBeFocused();
  });

  test('button should have sufficient color contrast', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.locator('.reproducible-notice a');

    // Get computed styles
    const bgColor = await button.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    const textColor = await button.evaluate((el) =>
      window.getComputedStyle(el).color
    );

    // White on Onyxia orange
    expect(bgColor).toBe('rgb(255, 86, 44)');
    expect(textColor).toBe('rgb(255, 255, 255)');
  });

  test('link should indicate it opens in new tab', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.locator('.reproducible-notice a');
    await expect(button).toHaveAttribute('target', '_blank');
  });

  test('button should have valid href attribute', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.locator('.reproducible-notice a');
    const href = await button.getAttribute('href');

    // Should be a valid URL
    expect(href).toBeTruthy();
    expect(() => new URL(href!)).not.toThrow();

    // Should start with https://
    expect(href).toMatch(/^https:\/\//);
  });
});
