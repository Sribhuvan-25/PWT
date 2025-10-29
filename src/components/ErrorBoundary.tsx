import React, { Component, ReactNode } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';
import { logger } from '@/utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    logger.error('React Error Boundary caught error', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Error is automatically sent to crash reporting via logger.error()
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.emoji}>😕</Text>
            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry for the inconvenience. The app encountered an unexpected error.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <Button
              mode="contained"
              onPress={this.handleReset}
              style={styles.button}
              buttonColor={darkColors.accent}
            >
              Try Again
            </Button>

            <Text style={styles.helpText}>
              If this problem persists, please contact support
            </Text>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: darkColors.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: darkColors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  button: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  helpText: {
    fontSize: 14,
    color: darkColors.textMuted,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  errorDetails: {
    width: '100%',
    backgroundColor: darkColors.surface,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: darkColors.negative,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: darkColors.negative,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
  },
  errorStack: {
    fontSize: 10,
    color: darkColors.textMuted,
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;
