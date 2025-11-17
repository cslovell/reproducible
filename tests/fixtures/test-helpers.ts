/**
 * Test helper utilities for reproducible button extension tests
 */

import { expect } from '@playwright/test';

/**
 * Parse and validate Onyxia deep-link URLs
 */
export class OnyxiaUrlParser {
  private url: URL;

  constructor(href: string) {
    this.url = new URL(href);
  }

  /**
   * Get base URL (protocol + host)
   */
  getBaseUrl(): string {
    return `${this.url.protocol}//${this.url.host}`;
  }

  /**
   * Get launcher path (e.g., "/launcher/handbook/chapter-session")
   */
  getLauncherPath(): string {
    return this.url.pathname;
  }

  /**
   * Get catalog name from path
   */
  getCatalog(): string | null {
    const match = this.url.pathname.match(/\/launcher\/([^/]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Get chart name from path
   */
  getChart(): string | null {
    const match = this.url.pathname.match(/\/launcher\/[^/]+\/([^/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get raw parameter value (includes «» for strings)
   */
  getParam(key: string): string | null {
    return this.url.searchParams.get(key);
  }

  /**
   * Get parameter value with Onyxia delimiters removed
   */
  getDecodedParam(key: string): string | null {
    const value = this.getParam(key);
    if (!value) return null;

    // Remove «» delimiters if present
    return value.replace(/^«|»$/g, '');
  }

  /**
   * Check if parameter has string encoding (wrapped in «»)
   */
  isStringEncoded(key: string): boolean {
    const value = this.getParam(key);
    return value !== null && value.startsWith('«') && value.endsWith('»');
  }

  /**
   * Verify parameter equals expected value
   */
  verifyParam(key: string, expected: string): void {
    const actual = this.getDecodedParam(key);
    expect(actual).toBe(expected);
  }

  /**
   * Verify parameter exists
   */
  hasParam(key: string): boolean {
    return this.url.searchParams.has(key);
  }

  /**
   * Get all parameter keys
   */
  getAllParams(): string[] {
    return Array.from(this.url.searchParams.keys());
  }
}

/**
 * Expected URL parameters interface
 */
export interface OnyxiaUrlParams {
  autoLaunch?: boolean;
  name?: string;
  tier?: string;
  imageFlavor?: string;
  chapterName?: string;
  chapterVersion?: string;
  chapterStorageSize?: string;
}

/**
 * Assert URL contains expected parameters
 */
export function assertOnyxiaUrl(
  href: string,
  expected: Partial<OnyxiaUrlParams>
): void {
  const parser = new OnyxiaUrlParser(href);

  if (expected.autoLaunch !== undefined) {
    expect(parser.getParam('autoLaunch')).toBe(String(expected.autoLaunch));
  }

  if (expected.tier !== undefined) {
    parser.verifyParam('tier', expected.tier);
    expect(parser.isStringEncoded('tier')).toBe(true);
  }

  if (expected.imageFlavor !== undefined) {
    parser.verifyParam('imageFlavor', expected.imageFlavor);
  }

  if (expected.chapterName !== undefined) {
    parser.verifyParam('chapter.name', expected.chapterName);
  }

  if (expected.chapterVersion !== undefined) {
    parser.verifyParam('chapter.version', expected.chapterVersion);
  }

  if (expected.chapterStorageSize !== undefined) {
    parser.verifyParam('chapter.storageSize', expected.chapterStorageSize);
  }
}
