'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { articleControllerGetUserBrowseHistory, articleControllerGetLikedArticles, articleControllerGetFavoritedArticles, userControllerUpdate } from '@/api/sdk.gen';
import type { ArticleControllerFindAllResponse, UserControllerGetProfileResponse } from '@/api/types.gen';
import { ArticleGrid } from '@/components/article/ArticleGrid';
import Link from 'next/link';
import { Crown, Wallet, Eye, Heart, Bookmark, Edit, Clock, Sparkles, Loader2, Camera } from 'lucide-react';
import { useState, useRef } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

function formatVipExpireAt(expireAt: string | undefined): string {
  if (!expireAt) return '';
  const date = new Date(expireAt);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  
  if (days <= 0) return '已过期';
  if (days === 1) return '明天到期';
  if (days <= 7) return `${days}天后到期`;
  if (days <= 30) return `${days}天后到期`;
  
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) + ' 到期';
}

function getVipStatus(user: UserControllerGetProfileResponse['data']) {
  const isVip = user?.isMember || user?.membershipStatus === 'active';
  const expireAt = user?.membershipEndDate;
  
  if (!expireAt) {
    return { isVip, isExpired: false, daysLeft: 0, expireAt: '' };
  }
  
  const date = new Date(expireAt);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
  const isExpired = daysLeft <= 0;
  
  return { isVip: isVip && !isExpired, isExpired, daysLeft, expireAt };
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | 'ellipsis')[] = [];
  const showPages = 5;
  
  if (totalPages <= showPages + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    if (totalPages > 1) pages.push(totalPages);
  }
  
  return pages;
}

export default function ProfileContent() {
  const { user, isAuthenticated, isLoading: isAuthLoading, refreshUser } = useAuth();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({ nickname: '', bio: '', avatar: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const currentTab = searchParams.get('tab') || 'history';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const createTabUrl = (tab: string, page: number = 1) => {
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (page > 1) params.set('page', page.toString());
    return `${pathname}?${params.toString()}`;
  };

  const { data: browseHistory } = useQuery({
    queryKey: ['browse-history', currentPage],
    queryFn: async () => {
      const response = await articleControllerGetUserBrowseHistory({ query: { page: currentPage, limit: 20 } });
      return response.data?.data || { data: [], meta: { total: 0 } };
    },
    enabled: isAuthenticated && currentTab === 'history',
  });

  const { data: likedArticles } = useQuery({
    queryKey: ['liked-articles', currentPage],
    queryFn: async () => {
      const response = await articleControllerGetLikedArticles({ query: { page: currentPage, limit: 20 } });
      return response.data?.data || { data: [], meta: { total: 0 } };
    },
    enabled: isAuthenticated && currentTab === 'likes',
  });

  const { data: favoritedArticles } = useQuery({
    queryKey: ['favorited-articles', currentPage],
    queryFn: async () => {
      const response = await articleControllerGetFavoritedArticles({ query: { page: currentPage, limit: 20 } });
      return response.data?.data || { data: [], meta: { total: 0 } };
    },
    enabled: isAuthenticated && currentTab === 'favorites',
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { nickname?: string; bio?: string; avatar?: string }) => {
      const response = await userControllerUpdate({
        path: { id: String(user?.id!) },
        body: data,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('资料更新成功');
      setShowEditDialog(false);
      refreshUser();
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新失败');
    },
  });

  const handleEditClick = () => {
    const userData = user as any;
    setEditForm({
      nickname: userData?.nickname || '',
      bio: userData?.bio || '',
      avatar: userData?.avatar || '',
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(editForm);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.url) {
        setEditForm(prev => ({ ...prev, avatar: data.url }));
      }
    } catch (error) {
      toast.error('头像上传失败');
    }
  };

  const handleTabChange = (tab: string) => {
    router.push(createTabUrl(tab, 1));
  };

  if (isAuthLoading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>请先登录</CardTitle>
            <CardDescription>登录后查看个人中心</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button>去登录</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userData = user as UserControllerGetProfileResponse['data'];
  const vipStatus = getVipStatus(userData);

  const renderPagination = (total: number) => {
    const totalPages = Math.ceil(total / 20);
    if (totalPages <= 1) return null;

    return (
      <div className="flex flex-col items-center gap-4 mt-6">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href={createTabUrl(currentTab, currentPage - 1)}
                className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {getPageNumbers(currentPage, totalPages).map((page, index) => (
              <PaginationItem key={index}>
                {page === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink href={createTabUrl(currentTab, page)} isActive={page === currentPage}>
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                href={createTabUrl(currentTab, currentPage + 1)}
                className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <p className="text-sm text-muted-foreground">第 {currentPage} / {totalPages} 页</p>
      </div>
    );
  };

  return (
    <div className="container py-6">
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userData?.avatar} alt={userData?.nickname || userData?.username} />
              <AvatarFallback className="text-2xl">
                {userData?.nickname?.[0] || userData?.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">{userData?.nickname || userData?.username}</h1>
                {vipStatus.isVip && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                    <Crown className="h-3 w-3 mr-1" />
                    VIP
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mb-2">@{userData?.username}</p>
              {userData?.description && <p className="text-sm text-muted-foreground mb-2">{userData.description}</p>}
              {userData?.email && <p className="text-sm text-muted-foreground">{userData.email}</p>}
            </div>

            <div className="flex gap-2">
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  设置
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleEditClick}>
                <Edit className="h-4 w-4 mr-2" />
                编辑资料
              </Button>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{userData?.articleCount || 0}</p>
              <p className="text-sm text-muted-foreground">发布</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{userData?.followerCount || 0}</p>
              <p className="text-sm text-muted-foreground">粉丝</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{userData?.followingCount || 0}</p>
              <p className="text-sm text-muted-foreground">关注</p>
            </div>
            <div className="text-center">
              <Link href="/wallet">
                <p className="text-2xl font-bold hover:text-primary cursor-pointer">
                  <Wallet className="h-5 w-5 inline mr-1" />
                  钱包
                </p>
              </Link>
              <p className="text-sm text-muted-foreground">余额</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VIP Status Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {vipStatus.isVip ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold">VIP会员</h3>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                      {userData?.membershipLevelName || '标准会员'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {vipStatus.daysLeft > 30 
                        ? `有效期至 ${new Date(vipStatus.expireAt).toLocaleDateString('zh-CN')}` 
                        : formatVipExpireAt(vipStatus.expireAt)}
                    </span>
                  </div>
                </div>
              </div>
              <Link href="/vip">
                <Button variant="outline" className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950">
                  <Sparkles className="h-4 w-4 mr-2" />
                  续费会员
                </Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                  <Crown className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">开通VIP会员</h3>
                  <p className="text-sm text-muted-foreground">解锁高清原图下载、无广告体验等专属权益</p>
                </div>
              </div>
              <Link href="/vip">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0">
                  <Crown className="h-4 w-4 mr-2" />
                  立即开通
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="history" className="gap-2"><Eye className="h-4 w-4" />浏览历史</TabsTrigger>
          <TabsTrigger value="likes" className="gap-2"><Heart className="h-4 w-4" />我的点赞</TabsTrigger>
          <TabsTrigger value="favorites" className="gap-2"><Bookmark className="h-4 w-4" />我的收藏</TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <Card>
            <CardHeader><CardTitle>浏览历史</CardTitle><CardDescription>最近浏览的图集</CardDescription></CardHeader>
            <CardContent>
              <ArticleGrid articles={browseHistory?.data?.map((item: any) => item.article) || []} />
              {renderPagination(browseHistory?.meta?.total || 0)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="likes">
          <Card>
            <CardHeader><CardTitle>我的点赞</CardTitle><CardDescription>点赞过的图集</CardDescription></CardHeader>
            <CardContent>
              <ArticleGrid articles={(likedArticles?.data as ArticleControllerFindAllResponse['data']['data']) || []} />
              {renderPagination(likedArticles?.meta?.total || 0)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="favorites">
          <Card>
            <CardHeader><CardTitle>我的收藏</CardTitle><CardDescription>收藏的图集</CardDescription></CardHeader>
            <CardContent>
              <ArticleGrid articles={(favoritedArticles?.data as ArticleControllerFindAllResponse['data']['data']) || []} />
              {renderPagination(favoritedArticles?.meta?.total || 0)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>编辑资料</DialogTitle>
            <DialogDescription>修改您的个人信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 cursor-pointer" onClick={handleAvatarClick}>
                  <AvatarImage src={editForm.avatar} />
                  <AvatarFallback>{editForm.nickname?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center cursor-pointer" onClick={handleAvatarClick}>
                  <Camera className="h-3 w-3 text-white" />
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              <Button variant="ghost" size="sm" onClick={handleAvatarClick}>更换头像</Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input id="nickname" value={editForm.nickname} onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))} placeholder="输入昵称" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">个人介绍</Label>
              <Textarea id="bio" value={editForm.bio} onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))} placeholder="介绍一下自己..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>取消</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
