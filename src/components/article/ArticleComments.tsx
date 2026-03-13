'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { MessageCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { commentControllerFindAll, commentControllerGetCommentCount } from '@/api/sdk.gen';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

interface Comment {
  id: number;
  content: string;
  images: string[];
  likes: number;
  replyCount: number;
  status: string;
  author: {
    id: number;
    username: string;
    nickname: string;
    avatar: string;
  };
  parent: unknown;
  rootId: number;
  createdAt: string;
  replies: CommentReply[];
}

interface CommentReply {
  id?: number;
  content?: string;
  likes?: number;
  author?: {
    id: number;
    nickname: string;
    avatar: string;
  };
  parentId?: number;
  parent?: {
    id: number;
    author?: {
      nickname: string;
    };
  };
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

export function ArticleComments({ articleId }: { articleId: string }) {
  const t = useTranslations('component.articleComments');
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const { data: countData } = useQuery({
    queryKey: ['commentCount', articleId],
    queryFn: async () => {
      const response = await commentControllerGetCommentCount({
        path: { id: articleId },
      });
      // response.data 是 { code, message, data } 结构
      const result = response.data as { code: number; message: string; data: number } | undefined;
      return result?.data ?? 0;
    },
  });

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', articleId],
    queryFn: async () => {
      const response = await commentControllerFindAll({
        path: { id: articleId },
        query: { page: 1, limit: 50 },
      });
      return response.data?.data?.data as Comment[] | undefined;
    },
    enabled: isOpen, // 仅在打开时加载
  });

  const commentCount = countData ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          size="icon"
          className="fixed bottom-4 right-4 z-40 rounded-full h-11 w-11 shadow-lg hover:shadow-xl transition-shadow"
          aria-label="查看评论"
        >
          <MessageCircle className="h-5 w-5" />
          {commentCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-medium rounded-full h-5 min-w-5 flex items-center justify-center px-1">
              {commentCount > 99 ? '99+' : commentCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {t('title')} ({commentCount})
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments && comments.length > 0 ? (
          <div className="flex-1 overflow-y-auto space-y-4 p-2">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground py-10">
            {t('empty')}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface CommentItemProps {
  comment: Comment;
  isAuthenticated: boolean;
}

function CommentItem({ comment, isAuthenticated }: CommentItemProps) {
  const t = useTranslations('component.articleComments');
  const { author, content, likes, createdAt, replies } = comment;

  return (
    <div className="flex gap-3">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={author.avatar} />
        <AvatarFallback>{author.nickname?.[0] || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{author.nickname}</span>
          <span className="text-xs text-muted-foreground">{formatTimeAgo(createdAt)}</span>
        </div>
        <p className="text-sm mt-1 wrap-break-word">{content}</p>

        <div className="flex items-center gap-4 mt-2">
          <button className="flex items-center gap-1 text-muted-foreground hover:text-red-500 text-xs">
            <Heart className="h-3.5 w-3.5" />
            <span>{likes}</span>
          </button>
          <button className="text-muted-foreground hover:text-primary text-xs">
            {t('reply')}
          </button>
        </div>

        {/* 显示二级回复 */}
        {replies && replies.length > 0 && (
          <div className="mt-3 space-y-3 border-l-2 border-muted pl-3">
            {replies.map((reply, index) => {
              // 超过两条的简化显示
              if (index >= 2) {
                const replyAuthor = reply.author?.nickname || t('user');
                const parentAuthor = reply.parent?.author?.nickname || t('user');
                return (
                  <div key={reply.id || index} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{replyAuthor}</span>
                    {t('repliedTo')}{' '}
                    <span className="font-medium text-foreground">{parentAuthor}</span>
                  </div>
                );
              }

              return (
                <ReplyItem key={reply.id || index} reply={reply} t={t} />
              );
            })}

            {/* 如果超过两条，显示查看更多 */}
            {replies.length > 2 && (
              <button className="text-xs text-primary hover:underline">
                {t('viewMore', { count: replies.length - 2 })}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ReplyItemProps {
  reply: CommentReply;
  t: (key: string, values?: Record<string, string | number>) => string;
}

function ReplyItem({ reply, t }: ReplyItemProps) {
  const { author, content, likes } = reply;
  const parentAuthor = reply.parent?.author?.nickname || t('user');

  if (!author || !content) return null;

  return (
    <div className="flex gap-2">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={author.avatar} />
        <AvatarFallback>{author.nickname?.[0] || '?'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{author.nickname}</span>
          <span className="text-xs text-muted-foreground">{t('repliedTo')} {parentAuthor}</span>
        </div>
        <p className="text-sm mt-0.5 wrap-break-word">{content}</p>
        <div className="flex items-center gap-3 mt-1">
          <button className="flex items-center gap-1 text-muted-foreground hover:text-red-500 text-xs">
            <Heart className="h-3 w-3" />
            <span>{likes || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}