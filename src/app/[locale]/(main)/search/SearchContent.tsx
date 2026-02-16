'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArticleGrid } from '@/components/article/ArticleGrid';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { ArticleControllerFindAllResponse, articleControllerSearch } from '@/api';

const SORT_OPTIONS = [
  { value: 'latest', label: '最新发布' },
  { value: 'popular', label: '最多浏览' },
  { value: 'likes', label: '最多点赞' },
];

export function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get('q') || '';
  const sort = searchParams.get('sort') || 'latest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput] = useState(keyword);

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
    router.push(`/search?${params.toString()}`);
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
              placeholder="搜索图集..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sort} onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set('sort', value);
            router.push(`/search?${params.toString()}`);
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
          <Button type="submit">搜索</Button>
        </div>
      </form>

      {keyword && (
        <p className="text-muted-foreground">
          搜索 &quot;{keyword}&quot; 找到 {total} 个结果
        </p>
      )}

      {!keyword ? (
        <div className="text-center py-20 text-muted-foreground">
          <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p>输入关键词开始搜索</p>
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
                      href={`/search?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) }).toString()}`}
                      className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <PaginationItem key={pageNum}>
                        <PaginationLink 
                          href={`/search?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(pageNum) }).toString()}`}
                          isActive={pageNum === page}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      href={`/search?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) }).toString()}`}
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
