'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, usePathname } from 'next/navigation';
import { articleControllerFindOne, articleControllerLike, articleControllerFavoriteArticle } from '@/api/sdk.gen';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Heart, MessageCircle, Bookmark, Share2, Lock, Crown, Download, ExternalLink, Copy, Key } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { ImageGallery } from '@/components/article/ImageGallery';
import { toast } from 'sonner';
import { Link } from '@/i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Article {
  id: number;
  title: string;
  summary?: string;
  images: string[];
  imageCount?: number;
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
  isLiked?: boolean;
  isFavorited?: boolean;
  downloads?: Array<{
    id?: number;
    type?: string;
    url?: string;
    password?: string;
    extractionCode?: string;
  }>;
  downloadCount?: number;
}

interface ArticleContentProps {
  initialData?: Article;
}

export function ArticleContent({ initialData }: ArticleContentProps) {
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();

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

  const likeMutation = useMutation({
    mutationFn: async () => {
      await articleControllerLike({
        path: { id },
        body: undefined
      });
    },
    onSuccess: () => {
      const newIsLiked = !isLiked;
      toast.success(newIsLiked ? '点赞成功' : '取消点赞');
      queryClient.setQueryData(['article', id], (old: Article | undefined) => {
        if (!old) return old;
        return { ...old, isLiked: newIsLiked, likes: newIsLiked ? old.likes + 1 : Math.max(0, old.likes - 1) };
      });
    },
    onError: () => {
      toast.error('操作失败');
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      await articleControllerFavoriteArticle({
        path: { id },
      });
    },
    onSuccess: () => {
      const newIsFavorited = !isFavorited;
      toast.success(newIsFavorited ? '收藏成功' : '取消收藏');
      queryClient.setQueryData(['article', id], (old: Article | undefined) => {
        if (!old) return old;
        return { ...old, isFavorited: newIsFavorited };
      });
    },
    onError: () => {
      toast.error('操作失败');
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    likeMutation.mutate();
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    favoriteMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('链接已复制到剪贴板');
    }
  };

  const getDownloadTypeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      baidu: '百度网盘',
      quark: '夸克网盘',
      aliyun: '阿里云盘',
      onedrive: 'OneDrive',
      google: 'Google Drive',
      dropbox: 'Dropbox',
      lanzou: '蓝奏云',
      mega: 'Mega',
      direct: '直链下载',
      other: '其他',
    };
    return labels[type || ''] || '未知';
  };

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

  // 不再使用 isLocked 一刀切的逻辑
  // 后端会根据权限返回相应数量的图片
  // 前端只需要显示后端返回的图片，并根据 imageCount 判断是否还有更多内容
  
  const isLiked = article.isLiked ?? false;
  const isFavorited = article.isFavorited ?? false;
  
  // 判断是否能看到全部图片：imageCount 和 images.length 相等
  const canViewAllImages = article.imageCount === article.images.length;
  const remainingImages = article.imageCount && article.images.length 
    ? article.imageCount - article.images.length 
    : 0;
  
  // 判断是否有图片可以显示
  const hasImages = article.images && article.images.length > 0;

  return (
    <article className="space-y-6" itemScope itemType="https://schema.org/Article">
      <header className="space-y-4">
        <h1 className="text-2xl font-bold" itemProp="headline">{article.title}</h1>
        
        <div className="flex items-center gap-4">
          <Link href={`/profile/${article.author.id}`} className="flex items-center gap-2" itemProp="author" itemScope itemType="https://schema.org/Person">
            <Image
              src={article.author.avatar || '/default-avatar.png'}
              alt={`${article.author.nickname}的头像`}
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="font-medium" itemProp="name">{article.author.nickname}</span>
          </Link>
          <Link href={`/cosers/${article.category?.id}`}>
            <Badge variant="secondary">{article.category?.name || '未分类'}</Badge>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Button variant="ghost" size="sm" className="text-muted-foreground cursor-default" aria-label={`浏览量 ${article.views}`}>
            <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
            {article.views}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className={isLiked ? 'text-red-500 border-red-500 hover:bg-red-50' : ''}
            aria-label={isLiked ? '取消点赞' : '点赞'}
            aria-pressed={isLiked}
          >
            <Heart className={`h-4 w-4 mr-1 ${isLiked ? 'fill-current' : ''}`} aria-hidden="true" />
            {article.likes}
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground cursor-default" aria-label={`评论数 ${article.commentCount}`}>
            <MessageCircle className="h-4 w-4 mr-1" aria-hidden="true" />
            {article.commentCount}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleFavorite}
            disabled={favoriteMutation.isPending}
            className={isFavorited ? 'text-amber-500 border-amber-500 hover:bg-amber-50' : ''}
            aria-label={isFavorited ? '取消收藏' : '收藏'}
            aria-pressed={isFavorited}
          >
            <Bookmark className={`h-4 w-4 mr-1 ${isFavorited ? 'fill-current' : ''}`} aria-hidden="true" />
            {isFavorited ? '已收藏' : '收藏'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare} aria-label="分享文章">
            <Share2 className="h-4 w-4 mr-1" aria-hidden="true" />
            分享
          </Button>
          {article.downloads && article.downloads.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  下载 ({article.downloads.length})
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    下载资源
                  </DialogTitle>
                  <DialogDescription>
                    共 {article.downloads.length} 个下载资源
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-2">
                  {article.downloads.map((download, index) => (
                    <div 
                      key={download.id || index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-card"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Download className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">
                              {getDownloadTypeLabel(download.type)}
                            </span>
                          </div>
                          <p className="text-sm truncate text-muted-foreground mt-0.5">
                            {download.url}
                          </p>
                          {(download.password || download.extractionCode) && (
                            <div className="flex items-center gap-3 mt-1.5">
                              {download.password && (
                                <div className="flex items-center gap-1 text-xs">
                                  <Key className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">密码:</span>
                                  <code className="px-1 py-0.5 bg-muted rounded font-mono text-xs">
                                    {download.password}
                                  </code>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(download.password || '');
                                      toast.success('密码已复制');
                                    }}
                                    className="text-primary hover:underline"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                              {download.extractionCode && (
                                <div className="flex items-center gap-1 text-xs">
                                  <span className="text-muted-foreground">提取码:</span>
                                  <code className="px-1 py-0.5 bg-muted rounded font-mono text-xs">
                                    {download.extractionCode}
                                  </code>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(download.extractionCode || '');
                                      toast.success('提取码已复制');
                                    }}
                                    className="text-primary hover:underline"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (download.url) {
                            window.open(download.url, '_blank');
                          }
                        }}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {article.summary && (
          <p className="text-muted-foreground" itemProp="description">{article.summary}</p>
        )}
      </header>

      {hasImages ? (
        <>
          <figure itemProp="image">
            <ImageGallery images={article.images} />
            {article.summary && (
              <figcaption className="sr-only">{article.summary}</figcaption>
            )}
          </figure>
          
          {!canViewAllImages && remainingImages > 0 && (
            <div className="flex flex-col items-center justify-center py-10 space-y-4 border-t">
              <Lock className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">还有 {remainingImages} 张图片未解锁</p>
              {article.requirePayment && article.viewPrice && (
                <p className="text-muted-foreground">
                  支付 {article.viewPrice} 元查看完整内容
                </p>
              )}
              {article.requireMembership && (
                <div className="flex items-center gap-2 text-primary">
                  <Crown className="h-5 w-5" />
                  <span>VIP会员可查看全部</span>
                </div>
              )}
              {article.requireLogin && !isAuthenticated && (
                <p className="text-muted-foreground">
                  登录后可查看更多内容
                </p>
              )}
              {!isAuthenticated ? (
                <Link href={`/login?redirect=${encodeURIComponent(pathname)}`}>
                  <Button>登录查看更多</Button>
                </Link>
              ) : article.requireMembership && !user?.membershipStatus ? (
                <Link href="/vip">
                  <Button>
                    <Crown className="h-4 w-4 mr-2" />
                    开通VIP
                  </Button>
                </Link>
              ) : article.requirePayment ? (
                <Button>
                  支付 {article.viewPrice} 元解锁
                </Button>
              ) : null}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Lock className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
          <p className="text-lg font-medium">暂无图片内容</p>
        </div>
      )}
    </article>
  );
}
