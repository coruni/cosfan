'use client';

import { ReactNode } from 'react';
import { OfflineIndicator, SlowNetworkIndicator } from '@/components/NetworkStatus';

interface NetworkOptimizedProviderProps {
  children: ReactNode;
}

/**
 * 网络优化提供者
 * 添加离线检测和慢速网络提示
 */
export function NetworkOptimizedProvider({ children }: NetworkOptimizedProviderProps) {
  return (
    <>
      {children}
      <OfflineIndicator />
      <SlowNetworkIndicator />
    </>
  );
}