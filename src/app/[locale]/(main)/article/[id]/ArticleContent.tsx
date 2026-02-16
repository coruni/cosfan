'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { articleControllerFindOne } from '@/api/sdk.gen';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Heart, MessageCircle, Bookmark, Share2, Lock, Crown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ImageGallery } from '@/components/article/ImageGallery';

interface Article {
  id: number;
  title: string;
  summary?: string;
  images: string[];
  views: number;
  likes: number;
  favoriteCount: number;
  commentCount: number;
  cover: string;
  author: {
    id: number;
    nickname: string;
    avatar: string;
  };
  category?: {
    id: number;
    name: string;
  };
  requireLogin: boolean;
  requirePayment: boolean;
  requireMembership: boolean;
  viewPrice?: string;
  createdAt: string;
}

interface ArticleContentProps {
  initialData?: Article;
}

export function ArticleContent({ initialData }: ArticleContentProps) {
  const params = useParams();
  const id = params.id as string;
  const { isAuthenticated, user } = useAuth();

  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      const response = await articleControllerFindOne({
        path: { id },
      });
      return response.data?.data as Article | undefined;
    },
    initialData,
  });

  if (isLoading && !initialData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">文章不存在或已被删除</p>
        <Link href="/">
          <Button className="mt-4">返回首页</Button>
        </Link>
      </div>
    );
  }

  const isLocked = 
    (article.requireLogin && !isAuthenticated) ||
    (article.requireMembership && !user?.membershipStatus);

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold">{article.title}</h1>
        
        <div className="flex items-center gap-4">
          <Link href={`/profile/${article.author.id}`} className="flex items-center gap-2">
            <Image
              src={article.author.avatar || '/default-avatar.png'}
              alt={article.author.nickname}
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="font-medium">{article.author.nickname}</span>
          </Link>
          <Link href={`/cosers/${article.category?.id}`}>
            <Badge variant="secondary">{article.category?.name || '未分类'}</Badge>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button variant="outline" size="sm" className="text-muted-foreground">
            <Eye className="h-4 w-4 mr-1" />
            {article.views}
          </Button>
          <Button variant="outline" size="sm">
            <Heart className="h-4 w-4 mr-1" />
            {article.likes}
          </Button>
          <Button variant="outline" size="sm" className="text-muted-foreground">
            <MessageCircle className="h-4 w-4 mr-1" />
            {article.commentCount}
          </Button>
          <Button variant="outline" size="sm">
            <Bookmark className="h-4 w-4 mr-1" />
            收藏
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            分享
          </Button>
        </div>

        {article.summary && (
          <p className="text-muted-foreground">{article.summary}</p>
        )}
      </header>

      {isLocked ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Lock className="h-16 w-16 text-muted-foreground" />
          <p className="text-lg font-medium">该内容需要权限查看</p>
          {article.requireMembership && (
            <div className="flex items-center gap-2 text-primary">
              <Crown className="h-5 w-5" />
              <span>需要VIP会员</span>
            </div>
          )}
          {!isAuthenticated && (
            <Link href="/login">
              <Button>登录查看</Button>
            </Link>
          )}
          {isAuthenticated && article.requireMembership && (
            <Link href="/vip">
              <Button>开通VIP</Button>
            </Link>
          )}
        </div>
      ) : (
        <ImageGallery images={article.images} />
      )}
    </div>
  );
}
