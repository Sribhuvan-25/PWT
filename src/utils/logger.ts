/**
 * Logging utility for production-safe logging
 *
 * Usage:
 * - logger.log() - General information (dev only)
 * - logger.info() - Important information (dev only)
 * - logger.warn() - Warnings (always logged, sent to crash reporting)
 * - logger.error() - Errors (always logged, sent to crash reporting)
 * - logger.debug() - Debug information (dev only)
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
}

class Logger {
  private isDev = __DEV__;

  /**
   * General logging - only in development
   */
  log(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.log(`[LOG] ${message}`, ...args);
    }
  }

  /**
   * Info logging - only in development
   */
  info(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  /**
   * Warning logging - always logged and sent to crash reporting
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);

    // TODO: Send to crash reporting service
    // if (!this.isDev) {
    //   Sentry.captureMessage(message, {
    //     level: 'warning',
    //     extra: args.length > 0 ? { data: args } : undefined,
    //   });
    // }
  }

  /**
   * Error logging - always logged and sent to crash reporting
   */
  error(message: string, error?: Error | any, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, error, ...args);

    // TODO: Send to crash reporting service
    // if (!this.isDev) {
    //   if (error instanceof Error) {
    //     Sentry.captureException(error, {
    //       extra: { message, ...args },
    //     });
    //   } else {
    //     Sentry.captureMessage(message, {
    //       level: 'error',
    //       extra: { error, ...args },
    //     });
    //   }
    // }
  }

  /**
   * Debug logging - only in development
   */
  debug(message: string, ...args: any[]): void {
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  /**
   * Group related logs together - dev only
   */
  group(label: string, callback: () => void): void {
    if (this.isDev) {
      console.group(label);
      callback();
      console.groupEnd();
    }
  }

  /**
   * Log a table - dev only
   */
  table(data: any): void {
    if (this.isDev) {
      console.table(data);
    }
  }

  /**
   * Time a function execution - dev only
   */
  time(label: string): void {
    if (this.isDev) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDev) {
      console.timeEnd(label);
    }
  }

  /**
   * Add breadcrumb for crash reporting context
   */
  breadcrumb(message: string, data?: Record<string, any>): void {
    if (this.isDev) {
      console.log(`[BREADCRUMB] ${message}`, data);
    }

    // TODO: Send to crash reporting service
    // if (!this.isDev) {
    //   Sentry.addBreadcrumb({
    //     message,
    //     data,
    //     level: 'info',
    //   });
    // }
  }

  /**
   * Set user context for crash reporting
   */
  setUser(userId: string | null, email?: string): void {
    if (this.isDev) {
      console.log(`[USER] Set user context: ${userId}`, email);
    }

    // TODO: Send to crash reporting service
    // if (!this.isDev) {
    //   if (userId) {
    //     Sentry.setUser({ id: userId, email });
    //   } else {
    //     Sentry.setUser(null);
    //   }
    // }
  }

  /**
   * Clear user context
   */
  clearUser(): void {
    if (this.isDev) {
      console.log('[USER] Cleared user context');
    }

    // TODO: Send to crash reporting service
    // if (!this.isDev) {
    //   Sentry.setUser(null);
    // }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;
