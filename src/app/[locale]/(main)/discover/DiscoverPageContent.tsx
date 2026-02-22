'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useSearchParams, usePathname } from 'next/navigation';
import { articleControllerFindAll, categoryControllerFindAll } from '@/api/sdk.gen';
import { ArticleCard } from '@/components/article/ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { Link } from '@/i18n';
import { User } from 'lucide-react';
import type { ArticleControllerFindOneResponse, CategoryControllerFindAllResponse } from '@/api';

type Category = NonNullable<CategoryControllerFindAllResponse['data']['data']>[number];

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

function CategoryCardSkeleton() {
  return (
    <div className="aspect-[3/4] rounded-lg overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

export function DiscoverPageContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryControllerFindAll();
      return response.data;
    },
  });

  const { data: articlesData, isLoading: isArticlesLoading } = useQuery({
    queryKey: ['articles', 'discover', currentPage],
    queryFn: async () => {
      const response = await articleControllerFindAll({
        query: {
          page: currentPage,
          type:'popular',
          limit: 12,
        },
      });
      return response.data || { data: { data: [], meta: { total: 0, page: 1, limit: 12 } } };
    },
  });

  const categories = Array.isArray(categoriesData?.data) ? categoriesData.data : (categoriesData?.data?.data || []);
  const articles = articlesData?.data?.data || [];
  const meta = articlesData?.data?.meta as { total: number; page: number; limit: number } | undefined;
  const total = meta?.total || 0;
  const totalPages = Math.ceil(total / 12);

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
      <h1 className="text-2xl font-bold">发现</h1>

      <section aria-labelledby="popular-cosers">
        <h2 id="popular-cosers" className="text-xl font-semibold mb-4">热门Coser</h2>
        {isCategoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CategoryCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.map((category: Category, index: number) => (
              <Link key={category.id} href={`/cosers/${category.id}`}>
                <div className="aspect-[3/4] bg-muted relative overflow-hidden rounded-lg group cursor-pointer">
                  {category.cover || category.avatar ? (
                    <Image
                      src={category.cover || category.avatar || ''}
                      alt={`${category.name} - Cosplay作品集`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 16vw, 12vw"
                      loading={index < 6 ? 'eager' : 'lazy'}
                      priority={index < 6}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <User className="h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <h3 className="font-medium text-sm text-white truncate">{category.name}</h3>
                    {category.articleCount !== undefined && (
                      <p className="text-xs text-white/80 mt-0.5">{category.articleCount} 套</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="popular-articles">
        <div className="flex items-center justify-between mb-4">
          <h2 id="popular-articles" className="text-xl font-semibold">热门推荐</h2>
          {total > 0 && (
            <span className="text-sm text-muted-foreground">
              共 {total} 套图集
            </span>
          )}
        </div>

        {isArticlesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
                  priority={index < 4}
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
