'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n';
import { ArticleGrid } from '@/components/article/ArticleGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ArticleControllerFindAllResponse, articleControllerSearch } from '@/api';

export function SearchContent() {
  const t = useTranslations('search');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const keyword = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'latest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(keyword);

  const createPageUrl = (pageNum: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNum.toString());
    return `${pathname}?${params.toString()}`;
  };

  const SORT_OPTIONS = [
    { value: 'latest', label: t('sort.latest') },
    { value: 'popular', label: t('sort.popular') },
    { value: 'likes', label: t('sort.likes') },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['search', keyword, sort, page],
    queryFn: async () => {
      if (!keyword) return { data: { data: [], meta: { total: 0 } } };
      const response = await articleControllerSearch({
        query: {
          keyword,
          page,
          limit: 20,
        },
      });
      return response.data || { data: { data: [], meta: { total: 0 } } };
    },
    enabled: !!keyword,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchInput) params.set('q', searchInput);
    if (sort !== 'latest') params.set('sort', sort);
    router.push(`${pathname}?${params.toString()}`);
  };

  const articles: ArticleControllerFindAllResponse['data']['data'] = data?.data?.data as ArticleControllerFindAllResponse['data']['data'] || [];
  const total = data?.data?.meta?.total || 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('placeholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sort} onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('sort', value);
            router.push(`${pathname}?${params.toString()}`);
          }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit">{t('search')}</Button>
        </div>
      </form>

      {keyword && (
        <p className="text-muted-foreground">
          {t('resultInfo', { keyword, total })}
        </p>
      )}

      {!keyword ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>{t('enterKeyword')}</p>
        </div>
      ) : (
        <>
          <ArticleGrid articles={articles} isLoading={isLoading} />

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
        </>
      )}
    </div>
  );
}
