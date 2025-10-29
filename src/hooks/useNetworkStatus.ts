import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { logger } from '@/utils/logger';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
}

/**
 * Hook to monitor network connectivity status
 * Returns current network state and connection status
 */
export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true, // Assume connected initially
    isInternetReachable: null,
    type: null,
  });

  useEffect(() => {
    // Get initial network state
    NetInfo.fetch().then((state) => {
      updateNetworkStatus(state);
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      updateNetworkStatus(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const updateNetworkStatus = (state: NetInfoState) => {
    const newStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: state.type,
    };

    setNetworkStatus(newStatus);

    // Log network state changes
    if (!newStatus.isConnected) {
      logger.warn('Network disconnected');
    } else if (newStatus.isConnected && !networkStatus.isConnected) {
      logger.info('Network reconnected', { type: newStatus.type });
    }
  };

  return networkStatus;
}

export default useNetworkStatus;
