import { useState, useEffect, useCallback } from 'react';

type NetworkStatus = 'online' | 'offline' | 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

interface UseNetworkReturn {
  isOnline: boolean;
  isOffline: boolean;
  status: NetworkStatus;
  effectiveType: NetworkStatus;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

interface NetworkConnection {
  type?: string;
  effectiveType?: NetworkStatus;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (event: string, callback: () => void) => void;
  removeEventListener?: (event: string, callback: () => void) => void;
}

/**
 * 网络状态检测 Hook
 * 用于检测用户的网络状态，支持弱网优化
 */
export function useNetwork(): UseNetworkReturn {
  const [networkState, setNetworkState] = useState({
    isOnline: true,
    status: 'unknown' as NetworkStatus,
    effectiveType: 'unknown' as NetworkStatus,
    downlink: 0,
    rtt: 0,
    saveData: false,
  });

  const updateNetworkState = useCallback(() => {
    const connection = (navigator as Navigator & {
      connection?: NetworkConnection;
      mozConnection?: NetworkConnection;
      webkitConnection?: NetworkConnection;
    }).connection ||
                       (navigator as Navigator & {
                         connection?: NetworkConnection;
                         mozConnection?: NetworkConnection;
                         webkitConnection?: NetworkConnection;
                       }).mozConnection ||
                       (navigator as Navigator & {
                         connection?: NetworkConnection;
                         mozConnection?: NetworkConnection;
                         webkitConnection?: NetworkConnection;
                       }).webkitConnection;

    if (connection) {
      setNetworkState({
        isOnline: navigator.onLine,
        status: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
      });
    } else {
      setNetworkState({
        isOnline: navigator.onLine,
        status: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
      });
    }
  }, []);

  useEffect(() => {
    // Initialize network state synchronously
    const connection = (navigator as Navigator & {
      connection?: NetworkConnection;
      mozConnection?: NetworkConnection;
      webkitConnection?: NetworkConnection;
    }).connection;

    if (connection) {
      setNetworkState({
        isOnline: navigator.onLine,
        status: connection.type || 'unknown',
        effectiveType: connection.effectiveType || 'unknown',
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
        saveData: connection.saveData || false,
      });
    } else {
      setNetworkState({
        isOnline: navigator.onLine,
        status: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
      });
    }

    const handleOnline = () => {
      setNetworkState(prev => ({ ...prev, isOnline: true }));
      updateNetworkState();
    };

    const handleOffline = () => {
      setNetworkState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听网络连接变化
    if (connection?.addEventListener) {
      connection.addEventListener('change', updateNetworkState);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection?.removeEventListener) {
        connection.removeEventListener('change', updateNetworkState);
      }
    };
  }, [updateNetworkState]);

  return {
    ...networkState,
    isOffline: !networkState.isOnline,
  };
}

/**
 * 判断是否为慢速网络
 */
export function isSlowNetwork(effectiveType: NetworkStatus): boolean {
  return ['slow-2g', '2g', '3g'].includes(effectiveType);
}

/**
 * 获取推荐的质量等级
 */
export function getRecommendedQuality(effectiveType: NetworkStatus, saveData: boolean): 'low' | 'medium' | 'high' {
  if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'low';
  }
  if (effectiveType === '3g') {
    return 'medium';
  }
  return 'high';
}