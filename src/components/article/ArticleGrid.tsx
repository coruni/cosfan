'use client';

import { 
  ArticleControllerFindAllResponse,
  ArticleControllerFindOneResponse,
  ArticleControllerGetLikedArticlesResponse,
  ArticleControllerGetFavoritedArticlesResponse,
  ArticleControllerFindByAuthorResponse,
} from '@/api';
import { ArticleCard } from './ArticleCard';
import { Skeleton } from '@/components/ui/skeleton';

type ArticleItem = NonNullable<ArticleControllerFindAllResponse['data']['data']>[number];

interface ArticleGridProps {
  articles: ArticleItem[];
  isLoading?: boolean;
  priority?: boolean;
}

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

export function ArticleGrid({ articles, isLoading = false, priority = false }: ArticleGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">暂无内容</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {articles.map((article, index) => (
        <ArticleCard
          key={article.id}
          article={article as unknown as ArticleControllerFindOneResponse['data']}
          priority={priority && index < 5}
        />
      ))}
    </div>
  );
}

