/**
 * Sentry configuration for crash reporting and error monitoring
 *
 * To enable Sentry:
 * 1. Create a Sentry account at https://sentry.io
 * 2. Create a new React Native project
 * 3. Copy the DSN from project settings
 * 4. Add it to .env as EXPO_PUBLIC_SENTRY_DSN
 */

import * as Sentry from 'sentry-expo';
import Constants from 'expo-constants';

const SENTRY_DSN = Constants.expoConfig?.extra?.sentryDsn || process.env.EXPO_PUBLIC_SENTRY_DSN;

/**
 * Initialize Sentry for crash reporting
 * Only initializes if DSN is provided
 */
export function initSentry() {
  // Only initialize Sentry if DSN is provided
  if (!SENTRY_DSN) {
    console.log('[Sentry] DSN not configured - crash reporting disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: SENTRY_DSN,
      enableInExpoDevelopment: false, // Disable in development
      debug: __DEV__, // Enable debug mode in development

      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: __DEV__ ? 0 : 1.0,

      // Environment info
      environment: __DEV__ ? 'development' : 'production',

      // Release tracking
      release: Constants.expoConfig?.version,
      dist: Constants.expoConfig?.version,

      // Enable native crash reporting
      enableNative: true,
      enableNativeNagger: false,

      // Attach stack traces to all messages
      attachStacktrace: true,

      // Automatically capture breadcrumbs
      integrations: [
        new Sentry.Native.ReactNativeTracing({
          // Routing instrumentation will be added when needed
        }),
      ],
    });

    console.log('[Sentry] Initialized successfully');
  } catch (error) {
    console.error('[Sentry] Initialization failed:', error);
  }
}

/**
 * Check if Sentry is configured and ready
 */
export function isSentryConfigured(): boolean {
  return !!SENTRY_DSN;
}

// Export Sentry for direct use
export { Sentry };
