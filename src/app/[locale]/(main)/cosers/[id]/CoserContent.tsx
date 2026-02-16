'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
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
  const page = parseInt(searchParams.get('page') || '1', 10);

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
                  href={page > 1 ? `/cosers/${id}?page=${page - 1}` : '#'} 
                  className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink 
                      href={`/cosers/${id}?page=${pageNum}`}
                      isActive={pageNum === page}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext 
                  href={page < totalPages ? `/cosers/${id}?page=${page + 1}` : '#'}
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
