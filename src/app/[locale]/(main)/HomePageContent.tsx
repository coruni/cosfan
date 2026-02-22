'use client';

import { useQuery } from '@tanstack/react-query';
import { articleControllerFindAll } from '@/api/sdk.gen';
import { ArticleCard } from '@/components/article/ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { useSearchParams, usePathname } from 'next/navigation';
import type { ArticleControllerFindOneResponse } from '@/api';

function ArticleCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <Skeleton className="aspect-[3/4]" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

export function HomePageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const { data, isLoading } = useQuery({
    queryKey: ['articles', 'home', currentPage],
    queryFn: async () => {
      const response = await articleControllerFindAll({
        query: {
          page: currentPage,
          limit: 20,
        },
      });
      return response.data || { data: { data: [], meta: { total: 0, page: 1, limit: 20 } } };
    },
  });

  const articles = data?.data?.data || [];
  const meta = data?.data?.meta as { total: number; page: number; limit: number } | undefined;
  const total = meta?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    return `${pathname}?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showPages = 5;
    
    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('ellipsis');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('ellipsis');
      }
      
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <main className="space-y-6">
      <h1 className="sr-only">PicArt - 专业的Cosplay图集展示平台</h1>
      
      <section aria-labelledby="latest-articles">
        <div className="flex items-center justify-between mb-4">
          <h2 id="latest-articles" className="text-xl font-bold">最新图集</h2>
          {total > 0 && (
            <span className="text-sm text-muted-foreground">
              共 {total} 套图集
            </span>
          )}
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <ArticleCardSkeleton key={i} />
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg">暂无内容</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {articles.map((article, index) => (
                <ArticleCard
                  key={article.id}
                  article={article as ArticleControllerFindOneResponse['data']}
                  priority={index < 10}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-4 mt-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href={currentPage > 1 ? createPageUrl(currentPage - 1) : '#'}
                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    
                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === 'ellipsis' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href={createPageUrl(page)}
                            isActive={page === currentPage}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href={currentPage < totalPages ? createPageUrl(currentPage + 1) : '#'}
                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
                
                <p className="text-sm text-muted-foreground">
                  第 {currentPage} / {totalPages} 页
                </p>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
