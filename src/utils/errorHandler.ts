import { Alert } from 'react-native';
import { logger } from './logger';

/**
 * Standard error types for the app
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

interface ErrorConfig {
  type: ErrorType;
  title: string;
  message: string;
  showAlert?: boolean;
  logError?: boolean;
}

/**
 * Standardized error handling utility
 * Provides consistent error messages and logging across the app
 */
export class ErrorHandler {
  /**
   * Handle and display errors consistently
   */
  static handle(error: unknown, config?: Partial<ErrorConfig>): void {
    const errorConfig = this.getErrorConfig(error, config);

    // Log error if enabled (default: true)
    if (errorConfig.logError !== false) {
      logger.error(errorConfig.title, error);
    }

    // Show alert if enabled (default: true)
    if (errorConfig.showAlert !== false) {
      Alert.alert(errorConfig.title, errorConfig.message, [
        { text: 'OK', style: 'cancel' },
      ]);
    }
  }

  /**
   * Handle errors with retry option
   */
  static handleWithRetry(
    error: unknown,
    onRetry: () => void | Promise<void>,
    config?: Partial<ErrorConfig>
  ): void {
    const errorConfig = this.getErrorConfig(error, config);

    if (errorConfig.logError !== false) {
      logger.error(errorConfig.title, error);
    }

    Alert.alert(errorConfig.title, errorConfig.message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Retry',
        onPress: () => {
          const result = onRetry();
          if (result instanceof Promise) {
            result.catch((err) => this.handle(err));
          }
        },
      },
    ]);
  }

  /**
   * Get error configuration based on error type
   */
  private static getErrorConfig(
    error: unknown,
    overrides?: Partial<ErrorConfig>
  ): ErrorConfig {
    let config: ErrorConfig = {
      type: ErrorType.UNKNOWN,
      title: 'Error',
      message: 'An unexpected error occurred. Please try again.',
      showAlert: true,
      logError: true,
    };

    // Determine error type and message
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();

      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        config.type = ErrorType.NETWORK;
        config.title = 'Connection Error';
        config.message =
          'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (
        errorMessage.includes('auth') ||
        errorMessage.includes('session') ||
        errorMessage.includes('token')
      ) {
        config.type = ErrorType.AUTHENTICATION;
        config.title = 'Authentication Error';
        config.message =
          'Your session has expired or is invalid. Please sign in again.';
      } else if (
        errorMessage.includes('not found') ||
        errorMessage.includes('404')
      ) {
        config.type = ErrorType.NOT_FOUND;
        config.title = 'Not Found';
        config.message = 'The requested resource was not found.';
      } else if (
        errorMessage.includes('permission') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('403')
      ) {
        config.type = ErrorType.PERMISSION;
        config.title = 'Permission Denied';
        config.message = "You don't have permission to perform this action.";
      } else {
        config.message = error.message || config.message;
      }
    } else if (typeof error === 'string') {
      config.message = error;
    }

    // Apply overrides
    return { ...config, ...overrides };
  }

  /**
   * Show a success message
   */
  static showSuccess(title: string, message: string): void {
    Alert.alert(title, message, [{ text: 'OK', style: 'default' }]);
  }

  /**
   * Show a confirmation dialog
   */
  static showConfirmation(
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    options?: {
      confirmText?: string;
      cancelText?: string;
      destructive?: boolean;
    }
  ): void {
    Alert.alert(title, message, [
      {
        text: options?.cancelText || 'Cancel',
        style: 'cancel',
      },
      {
        text: options?.confirmText || 'Confirm',
        style: options?.destructive ? 'destructive' : 'default',
        onPress: () => {
          const result = onConfirm();
          if (result instanceof Promise) {
            result.catch((err) => this.handle(err));
          }
        },
      },
    ]);
  }

  /**
   * Wrap an async function with standardized error handling
   */
  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    errorConfig?: Partial<ErrorConfig>
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error, errorConfig);
      return null;
    }
  }
}

// Export convenience methods
export const handleError = ErrorHandler.handle.bind(ErrorHandler);
export const handleErrorWithRetry =
  ErrorHandler.handleWithRetry.bind(ErrorHandler);
export const showSuccess = ErrorHandler.showSuccess.bind(ErrorHandler);
export const showConfirmation = ErrorHandler.showConfirmation.bind(ErrorHandler);
export const withErrorHandling =
  ErrorHandler.withErrorHandling.bind(ErrorHandler);

export default ErrorHandler;
