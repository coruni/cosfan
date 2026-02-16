'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Download } from 'lucide-react';
import { ArticleControllerFindAllResponse, ArticleControllerFindOneResponse } from '@/api';

type ArticleItem = NonNullable<ArticleControllerFindOneResponse['data']>;

interface ArticleCardProps {
  article: ArticleItem;
  priority?: boolean;
}

export function ArticleCard({ article, priority = false }: ArticleCardProps) {
  const coverImage = article.cover  || article.images?.[0];
  const coser = article.category;
  const imageCount = article.imageCount || 0;

  return (
    <Link href={`/article/${article.id}`}>
      <Card className="group overflow-hidden h-full hover:shadow-lg transition-all duration-300 border border-border py-0! gap-2">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={article.title || 'Article cover'}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No Image
            </div>
          )}
          
          {(article.requireMembership) && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-amber-500 text-white">
                VIP
              </Badge>
            </div>
          )}
          
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {imageCount}P
          </div>
        </div>
        
        <CardContent className="p-3">
          <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {article.title}
          </h3>
          {/* {article.title || article.category?.name ? (
            <p className="text-xs text-muted-foreground mb-2">
              {article.title || article.category?.name}
            </p>
          ) : null} */}
        </CardContent>
        
        <CardFooter className="p-3 pt-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {coser && (
              <>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={coser.avatar} alt={coser.name} />
                  <AvatarFallback className="text-xs">
                    {coser.name?.[0] || 'C'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-muted-foreground">
                  {coser.name || 'Unknown'}
                </span>
              </>
            )}
          </div>
          <button className="text-muted-foreground hover:text-primary transition-colors">
            <Download className="h-4 w-4" />
          </button>
        </CardFooter>
      </Card>
    </Link>
  );
}
