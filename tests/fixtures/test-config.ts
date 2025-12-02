/**
 * Shared test configuration constants
 * Used across all Playwright tests for consistency
 */

export const DEFAULT_CONFIG = {
  onyxia: {
    baseUrl: 'https://datalab.officialstatistics.org',
    catalog: 'capacity',
    chart: 'eostat-rstudio',
    autoLaunch: true,
  },
  ui: {
    buttonText: 'Launch Environment',
    noticeTitle: 'Reproducible Environment Available',
    noticeStyle: 'full',
    sessionDuration: '2h',
    showRuntime: true,
  },
  branding: {
    primaryColor: 'rgb(255, 86, 44)',  // Onyxia orange
    textColor: 'rgb(44, 50, 63)',       // Onyxia black
    backgroundColor: 'rgb(250, 250, 250)', // #fafafa
  },
  tierLabels: {
    light: 'Light (2 CPU, 8GB RAM)',
    medium: 'Medium (6 CPU, 24GB RAM)',
    heavy: 'Heavy (10 CPU, 48GB RAM)',
    gpu: 'GPU (8 CPU, 32GB RAM, 1 GPU)',
  },
  defaults: {
    tier: 'medium',
    imageFlavor: 'base',
    dataSnapshot: 'latest',
    storageSize: '20Gi',
    estimatedRuntime: 'Unknown',
  },
};

export const NOTICE_STYLES = ['full', 'minimal', 'button-only'] as const;
export type NoticeStyle = typeof NOTICE_STYLES[number];

export const RESOURCE_TIERS = ['light', 'medium', 'heavy', 'gpu'] as const;
export type ResourceTier = typeof RESOURCE_TIERS[number];
