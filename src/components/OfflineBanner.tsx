import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { darkColors, spacing } from '@/utils/theme';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

/**
 * Banner component that shows when the app is offline
 * Automatically appears/disappears based on network status
 */
export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const [slideAnim] = React.useState(new Animated.Value(-50));

  React.useEffect(() => {
    if (!isConnected) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isConnected]);

  if (isConnected) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>📡 No Internet Connection</Text>
      <Text style={styles.subtext}>Some features may be unavailable</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: darkColors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl + spacing.sm, // Account for status bar
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtext: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.9,
  },
});

export default OfflineBanner;
