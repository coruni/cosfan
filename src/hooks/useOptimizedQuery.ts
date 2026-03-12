import { UseQueryOptions, useQuery, useMutation, UseMutationOptions } from '@tanstack/react-query';
import { useNetwork, isSlowNetwork } from './useNetwork';

type NetworkStatus = 'online' | 'offline' | 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

/**
 * 弱网优化的查询配置
 */
export interface OptimizedQueryOptions<TData, TError> extends Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'> {
  /**
   * 慢速网络下的额外配置
   */
  slowNetworkOptions?: Partial<UseQueryOptions<TData, TError>>;
  /**
   * 是否启用离线缓存
   */
  enableOfflineCache?: boolean;
  /**
   * 离线缓存的过期时间（毫秒）
   */
  offlineCacheTime?: number;
}

/**
 * 增强的 useQuery，支持弱网优化
 */
export function useOptimizedQuery<TData = unknown, TError = unknown>(
  options: OptimizedQueryOptions<TData, TError> & {
    queryKey: readonly (string | number | object | undefined)[];
    queryFn: (context: { signal: AbortSignal }) => Promise<TData>;
  }
) {
  const { effectiveType, isOffline } = useNetwork();

  // 根据网络状况调整查询配置
  const isSlow = isSlowNetwork(effectiveType as NetworkStatus);

  const finalOptions: UseQueryOptions<TData, TError> = {
    ...options,
    // 慢速网络下增加 staleTime，减少请求频率
    staleTime: isSlow ? (options.staleTime || 5 * 60 * 1000) : (options.staleTime || 60 * 1000),
    // 慢速网络下使用慢速网络特定配置
    ...(isSlow ? options.slowNetworkOptions : {}),
    // 离线时从缓存获取
    enabled: isOffline ? false : options.enabled,
    // 慢速网络下增加重试次数
    retry: isSlow ? 3 : (options.retry ?? 3),
    // 慢速网络下增加重试延迟
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  };

  return useQuery(finalOptions);
}

/**
 * 弱网优化的 mutation 配置
 */
export interface OptimizedMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'mutationFn'> {
  /**
   * 是否在网络恢复后自动重试失败的请求
   */
  retryOnReconnect?: boolean;
}

/**
 * 增强的 useMutation，支持弱网优化
 */
export function useOptimizedMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  options: OptimizedMutationOptions<TData, TError, TVariables, TContext> & {
    mutationFn: (variables: TVariables) => Promise<TData>;
  }
) {
  return useMutation({
    ...options,
  });
}

/**
 * 创建支持重试的异步函数包装器
 */
export function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    retryCondition?: (error: Error) => boolean;
  } = {}
): (signal: AbortSignal) => Promise<T> {
  const { maxRetries = 3, retryDelay = 1000, retryCondition } = options;

  return async (signal: AbortSignal): Promise<T> => {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(signal);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 检查是否应该重试
        if (retryCondition && !retryCondition(lastError)) {
          throw lastError;
        }

        // 检查是否已中止
        if (signal.aborted) {
          throw lastError;
        }

        // 如果还有重试次数，等待后重试
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw lastError;
  };
}

/**
 * 请求超时包装器
 */
export function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = 10000
): (signal: AbortSignal) => Promise<T> {
  return async (signal: AbortSignal): Promise<T> => {
    // 创建超时控制器
    const timeoutController = new AbortController();
    const timeoutSignal = timeoutController.signal;

    // 设置超时
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, timeoutMs);

    try {
      // 合并信号
      const combinedSignal = AbortSignal.any([signal, timeoutSignal]);
      return await fn(combinedSignal);
    } finally {
      clearTimeout(timeoutId);
    }
  };
}