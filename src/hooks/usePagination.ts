'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter, usePathname } from '@/i18n/routing';

interface UsePaginationOptions {
  defaultPage?: number;
  defaultLimit?: number;
  paramName?: string;
}

interface UsePaginationReturn {
  page: number;
  limit: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  resetPage: () => void;
}

/**
 * 保持分页状态的 hook，通过 URL 参数记住当前页码
 * 适用于后台管理页面，在编辑页面返回后保持之前的页码
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { defaultPage = 1, defaultLimit = 10, paramName = 'page' } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // 从 URL 获取页码
  const getPageFromUrl = useCallback(() => {
    const pageParam = searchParams.get(paramName);
    const parsed = pageParam ? parseInt(pageParam, 10) : defaultPage;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultPage;
  }, [searchParams, paramName, defaultPage]);

  const [page, setPageState] = useState(getPageFromUrl);
  const [limit] = useState(defaultLimit);

  // URL 参数变化时同步状态
  useEffect(() => {
    const urlPage = getPageFromUrl();
    if (urlPage !== page) {
      setPageState(urlPage);
    }
  }, [getPageFromUrl, page]);

  const setPage = useCallback((newPage: number) => {
    setPageState(newPage);

    // 更新 URL 参数
    const params = new URLSearchParams(searchParams.toString());
    if (newPage === defaultPage) {
      params.delete(paramName);
    } else {
      params.set(paramName, String(newPage));
    }

    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [defaultPage, paramName, pathname, router, searchParams]);

  const setLimit = useCallback((newLimit: number) => {
    // 如果需要支持 limit 参数，可以在这里实现
    console.warn('setLimit not implemented for URL persistence');
  }, []);

  const resetPage = useCallback(() => {
    setPage(defaultPage);
  }, [defaultPage, setPage]);

  return { page, limit, setPage, setLimit, resetPage };
}