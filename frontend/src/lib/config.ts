/**
 * Unified Configuration for Frontend
 * Single source of truth for all environment variables
 */

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// OAuth Configuration
export const OAUTH_CONFIG = {
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  },
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID || '',
  },
} as const;

// Site Configuration
export const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';

// Feature Flags
export const FEATURES = {
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.VITE_DEMO_MODE === '1',
  enablePayments: import.meta.env.VITE_ENABLE_PAYMENTS === 'true' || import.meta.env.VITE_ENABLE_PAYMENTS === '1',
  paymentProvider: import.meta.env.VITE_PAYMENT_PROVIDER || 'stripe',
} as const;

// Analytics Configuration
export const ANALYTICS = {
  plausibleDomain: import.meta.env.VITE_PLAUSIBLE_DOMAIN || '',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN || '',
} as const;

// Environment
export const IS_PRODUCTION = import.meta.env.PROD;
export const IS_DEVELOPMENT = import.meta.env.DEV;

// Validation helpers
export const isConfigured = {
  oauth: {
    google: !!OAUTH_CONFIG.google.clientId,
    github: !!OAUTH_CONFIG.github.clientId,
  },
  analytics: {
    plausible: !!ANALYTICS.plausibleDomain,
    sentry: !!ANALYTICS.sentryDsn,
  },
  payments: FEATURES.enablePayments,
} as const;
