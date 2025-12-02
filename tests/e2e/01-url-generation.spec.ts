import { test, expect } from '@playwright/test';
import path from 'path';
import { OnyxiaUrlParser, assertOnyxiaUrl } from '../fixtures/test-helpers';
import { DEFAULT_CONFIG } from '../fixtures/test-config';

test.describe('URL Generation', () => {
  test('should generate valid Onyxia launcher URL', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.locator('.reproducible-notice a');
    const href = await button.getAttribute('href');

    expect(href).toBeTruthy();
    expect(href).toContain(DEFAULT_CONFIG.onyxia.baseUrl);
    expect(href).toContain('/launcher/');
    expect(href).toContain(DEFAULT_CONFIG.onyxia.catalog);
    expect(href).toContain(DEFAULT_CONFIG.onyxia.chart);

    // Raw string assertions to verify URL format independent of parser
    expect(href).toContain('tier=«medium»');
    expect(href).toContain('autoLaunch=true');
  });

  test('should encode string parameters with guillemet delimiters', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.locator('.reproducible-notice a');
    const href = await button.getAttribute('href');
    const parser = new OnyxiaUrlParser(href!);

    // String values should be wrapped in «»
    expect(parser.getParam('tier')).toBe('«medium»');
    expect(parser.getParam('chapter.name')).toBe('«basic»');
    expect(parser.getParam('imageFlavor')).toBe('«base»');

    // Verify they're marked as string-encoded
    expect(parser.isStringEncoded('tier')).toBe(true);
    expect(parser.isStringEncoded('chapter.name')).toBe(true);
  });

  test('should pass boolean parameters as-is', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.locator('.reproducible-notice a');
    const href = await button.getAttribute('href');
    const parser = new OnyxiaUrlParser(href!);

    // Booleans should be plain strings, not wrapped
    expect(parser.getParam('autoLaunch')).toBe('true');
    expect(parser.isStringEncoded('autoLaunch')).toBe(false);
  });

  test('should normalize version dots to hyphens', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/special-chars.html'));

    const button = page.locator('.reproducible-notice a, .reproducible-button');
    const href = await button.getAttribute('href');

    // v1.2.3 should become v1-2-3
    expect(href).toContain('chapter.version=«v1-2-3');
  });

  test('should URL-encode special characters', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/special-chars.html'));

    const button = page.locator('.reproducible-notice a, .reproducible-button');
    const href = await button.getAttribute('href');

    // Plus sign in version should be encoded as %2B
    expect(href).toContain('%2B');
  });

  test('should extract chapter name from filename', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.locator('.reproducible-notice a');
    const href = await button.getAttribute('href');
    const parser = new OnyxiaUrlParser(href!);

    expect(parser.getDecodedParam('chapter.name')).toBe('basic');
  });

  test('should include all required parameters', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/full-metadata.html'));

    const button = page.locator('.reproducible-notice a');
    const href = await button.getAttribute('href');
    const parser = new OnyxiaUrlParser(href!);

    const requiredParams = [
      'autoLaunch',
      'name',
      'tier',
      'imageFlavor',
      'chapter.name',
      'chapter.version',
      'chapter.storageSize',
    ];

    const allParams = parser.getAllParams();

    for (const param of requiredParams) {
      expect(allParams).toContain(param);
    }
  });

  test('should open link in new tab', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.locator('.reproducible-notice a');
    await expect(button).toHaveAttribute('target', '_blank');
  });

  test('should format name parameter correctly (no guillemets, eostat prefix)', async ({ page }) => {
    await page.goto('file://' + path.resolve(__dirname, '../../test-outputs/basic.html'));

    const button = page.locator('.reproducible-notice a');
    const href = await button.getAttribute('href');
    const parser = new OnyxiaUrlParser(href!);

    // name should NOT be wrapped in «» and should use eostat- prefix
    expect(parser.isStringEncoded('name')).toBe(false);
    expect(parser.getParam('name')).toBe('eostat-basic');
  });
});
