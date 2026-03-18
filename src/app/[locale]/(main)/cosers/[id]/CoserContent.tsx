'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { usePathname } from '@/i18n';
import { categoryControllerFindOne, articleControllerFindAll } from '@/api/sdk.gen';
import { ArticleGrid } from '@/components/article/ArticleGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import type { ArticleControllerFindAllResponse } from '@/api/types.gen';

interface CoserContentProps {
  id: string;
}

export function CoserContent({ id }: CoserContentProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const createPageUrl = (pageNum: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNum.toString());
    return `${pathname}?${params.toString()}`;
  };

  const { data: coser, isLoading: isCoserLoading } = useQuery({
    queryKey: ['coser', id],
    queryFn: async () => {
      const response = await categoryControllerFindOne({
        path: { id },
      });
      return response.data?.data || {};
    },
  });

  const { data: articlesData, isLoading: isArticlesLoading } = useQuery({
    queryKey: ['articles', 'coser', id, page],
    queryFn: async () => {
      const response = await articleControllerFindAll({
        query: {
          categoryId: parseInt(id, 10),
          page,
          limit: 20,
        },
      });
      return response.data || { data: { data: [], meta: { total: 0 } } };
    },
  });

  const articles: ArticleControllerFindAllResponse['data']['data'] = articlesData?.data?.data || [];
  const total = articlesData?.data?.meta?.total || 0;
  const totalPages = Math.ceil(total / 20);

  if (isCoserLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const coserData = coser as { id: number; name: string; description?: string } | undefined;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{coserData?.name || 'Coser'}</h1>
        {coserData?.description && (
          <p className="text-muted-foreground mt-2">{coserData.description}</p>
        )}
      </header>

      <ArticleGrid articles={articles} isLoading={isArticlesLoading} />

      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={page > 1 ? createPageUrl(page - 1) : '#'}
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                // 减少显示页码数量，避免移动端溢出
                const offset = Math.max(0, Math.min(page - 2, totalPages - 3));
                const pageNum = offset + i + 1;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href={createPageUrl(pageNum)}
                      isActive={pageNum === page}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href={page < totalPages ? createPageUrl(page + 1) : '#'}
                  className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
