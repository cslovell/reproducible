import { test, expect } from '@playwright/test';
import path from 'path';
import { OnyxiaUrlParser } from '../fixtures/test-helpers';

test.describe('Metadata Extraction', () => {
  test.describe('Tier Configuration', () => {
    test('should extract medium tier correctly', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('tier')).toBe('medium');
    });

    test('should extract heavy tier correctly', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('tier')).toBe('heavy');
    });

    test('should extract gpu tier correctly', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/custom-tier.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('tier')).toBe('gpu');
    });

    test('should display correct tier label for medium', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const metadata = page.locator('.reproducible-notice span');
      await expect(metadata).toContainText('Medium (6 CPU, 24GB RAM)');
    });

    test('should display correct tier label for heavy', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

      const metadata = page.locator('.reproducible-notice span');
      await expect(metadata).toContainText('Heavy (10 CPU, 48GB RAM)');
    });

    test('should display correct tier label for GPU', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/custom-tier.html'));

      const metadata = page.locator('.reproducible-notice span');
      await expect(metadata).toContainText('GPU (8 CPU, 32GB RAM, 1 GPU)');
    });
  });

  test.describe('Image Flavor', () => {
    test('should use default base image flavor', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('imageFlavor')).toBe('base');
    });

    test('should use custom gpu image flavor', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('imageFlavor')).toBe('gpu');
    });
  });

  test.describe('Data Snapshot', () => {
    test('should use default latest snapshot when not specified', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('chapter.version')).toBe('latest');
    });

    test('should use custom data snapshot', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

      const button = page.locator('.reproducible-notice a');
      const href = await button.getAttribute('href');
      const parser = new OnyxiaUrlParser(href!);

      expect(parser.getDecodedParam('chapter.version')).toBe('sha256-abc123def456');
    });
  });

  test.describe('Estimated Runtime', () => {
    test('should display Unknown for unspecified runtime', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

      const metadata = page.locator('.reproducible-notice span');
      await expect(metadata).toContainText('Est. runtime: Unknown');
    });

    test('should display custom runtime estimate', async ({ page }) => {
      await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

      const metadata = page.locator('.reproducible-notice span');
      await expect(metadata).toContainText('Est. runtime: 45 minutes');
    });
  });
});
