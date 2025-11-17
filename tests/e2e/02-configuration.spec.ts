import { test, expect } from '@playwright/test';
import path from 'path';
import { OnyxiaUrlParser } from '../fixtures/test-helpers';
import { DEFAULT_CONFIG } from '../fixtures/test-config';

test.describe('Configuration System', () => {
  test.describe('Extension Defaults', () => {
    test('should use default tier when not specified', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('tier')).toBe(DEFAULT_CONFIG.defaults.tier);
    });

    test('should use default button text', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const button = page.locator('.reproducible-notice a');
      await expect(button).toHaveText(DEFAULT_CONFIG.ui.buttonText);
    });

    test('should use default notice title for full style', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const title = page.locator('.reproducible-notice strong');
      await expect(title).toHaveText(DEFAULT_CONFIG.ui.noticeTitle);
    });

    test('should use default storage size when not specified', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('chapter.storageSize')).toBe(DEFAULT_CONFIG.defaults.storageSize);
    });
  });

  test.describe('Document-Level Overrides', () => {
    test('should override button text at document level', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/custom-button-text.html'));

      const button = page.locator('.reproducible-notice a, .reproducible-button');
      await expect(button).toHaveText('Start Analysis');
      await expect(button).not.toHaveText(DEFAULT_CONFIG.ui.buttonText);
    });

    test('should override tier at document level', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/custom-tier.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('tier')).toBe('gpu');
    });

    test('should override image-flavor at document level', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('imageFlavor')).toBe('gpu');
    });

    test('should override storage-size at document level', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('chapter.storageSize')).toBe('50Gi');
    });

    test('should override data-snapshot at document level', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('chapter.version')).toBe('sha256-abc123def456');
    });

    test('should override notice-style at document level', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/minimal-style.html'));

      const notice = page.locator('.reproducible-notice.minimal');
      await expect(notice).toBeVisible();

      const fullNotice = page.locator('.reproducible-notice.full');
      await expect(fullNotice).toHaveCount(0);
    });
  });

  test.describe('Custom Values', () => {
    test('should display custom estimated runtime', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

      const metadata = page.locator('.reproducible-notice span');
      await expect(metadata).toContainText('Est. runtime: 45 minutes');
    });

    test('should display custom tier label in metadata', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/custom-tier.html'));

      const metadata = page.locator('.reproducible-notice span');
      await expect(metadata).toContainText('GPU (8 CPU, 32GB RAM, 1 GPU)');
    });

    test('should display heavy tier label when specified', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

      const metadata = page.locator('.reproducible-notice span');
      await expect(metadata).toContainText('Heavy (10 CPU, 48GB RAM)');
    });
  });

  test.describe('Session Information', () => {
    test('should display session expiration time', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const metadata = page.locator('.reproducible-notice span');
      await expect(metadata).toContainText('Auto-expires: 2h');
    });

    test('should display estimated runtime when available', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/custom-tier.html'));

      const metadata = page.locator('.reproducible-notice span');
      await expect(metadata).toContainText('Est. runtime: 2 hours');
    });
  });
});
