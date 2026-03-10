'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Query 提供商
 * 配置了针对弱网环境的优化
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 数据缓存时间：1分钟（普通网络）/ 5分钟（慢速网络）
            staleTime: 60 * 1000,
            // 缓存数据保留时间：10分钟
            gcTime: 10 * 60 * 1000,
            // 窗口重新获得焦点时不重新获取（节省流量）
            refetchOnWindowFocus: false,
            // 重新尝试次数：慢速网络增加重试
            retry: 3,
            // 重试延迟：指数退避
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // 错误时保留之前的缓存数据
            placeholderData: (previousData) => previousData,
          },
          mutations: {
            // Mutation 重试次数
            retry: 2,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
