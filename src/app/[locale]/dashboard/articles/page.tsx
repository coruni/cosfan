'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  articleControllerFindAll,
  articleControllerRemove,
} from '@/api/sdk.gen';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, 
  ExternalLink, Eye, Plus, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n';
import { Table as UITable, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArticleControllerFindAllResponse } from '@/api';

type Article = NonNullable<ArticleControllerFindAllResponse['data']['data']>[number];

export default function ArticlesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['admin-articles', page, limit, search, statusFilter],
    queryFn: async () => {
      const response = await articleControllerFindAll({
        query: {
          page,
          limit,
          title: search || undefined,
        },
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await articleControllerRemove({ path: { id: String(id) } });
      return response.data;
    },
    onSuccess: () => {
      toast.success('文章删除成功');
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || '删除失败');
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const openDeleteDialog = (article: Article) => {
    setSelectedArticle(article);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedArticle) return;
    deleteMutation.mutate(selectedArticle.id);
  };

  const articles = articlesData?.data?.data || [];
  const total = articlesData?.data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="default">已发布</Badge>;
      case 'DRAFT':
        return <Badge variant="secondary">草稿</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">文章管理</h1>
          <p className="text-muted-foreground text-sm md:text-base">管理平台所有文章</p>
        </div>
        <Link href="/dashboard/articles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            创建文章
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Input
                placeholder="搜索文章标题..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full sm:max-w-sm"
              />
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter || undefined} onValueChange={(v) => { setStatusFilter(v || ''); setPage(1); }}>
              <SelectTrigger className="w-[100px] sm:w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                <SelectItem value="PUBLISHED">已发布</SelectItem>
                <SelectItem value="DRAFT">草稿</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                <UITable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>文章</TableHead>
                      <TableHead className="hidden sm:table-cell">作者</TableHead>
                      <TableHead>分类</TableHead>
                      <TableHead className="hidden md:table-cell">标签</TableHead>
                      <TableHead className="hidden lg:table-cell">浏览</TableHead>
                      <TableHead className="hidden md:table-cell">权限</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {articles.map((article: Article) => (
                      <TableRow key={article.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {article.cover ? (
                              <img
                                src={article.cover}
                                alt={article.title}
                                className="w-12 h-12 object-cover rounded flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate">{article.title}</p>
                              {article.summary && (
                                <p className="text-xs text-muted-foreground truncate hidden sm:block">{article.summary}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm">{article.author?.nickname || article.author?.username}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{article.category?.name || '-'}</Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {article.tags?.slice(0, 2).map((tag) => (
                              <Badge key={tag.id} variant="secondary" className="text-xs">
                                {tag.name}
                              </Badge>
                            ))}
                            {(article.tags?.length || 0) > 2 && (
                              <Badge variant="secondary" className="text-xs">+{article.tags!.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Eye className="h-3 w-3" />
                            {article?.views || 0}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col gap-1">
                            {article.requireLogin && <Badge variant="outline" className="text-xs w-fit">登录</Badge>}
                            {article.requirePayment && <Badge variant="outline" className="text-xs w-fit">付费</Badge>}
                            {article.requireMembership && <Badge variant="outline" className="text-xs w-fit">会员</Badge>}
                            {!article.requireLogin && !article.requirePayment && !article.requireMembership && (
                              <span className="text-xs text-muted-foreground">公开</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(article.status)}</TableCell>
                        <TableCell className="text-right">
                          <Link href={`/article/${article.id}`} target="_blank">
                            <Button variant="ghost" size="icon" title="查看">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/dashboard/articles/${article.id}/edit`}>
                            <Button variant="ghost" size="icon" title="编辑">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(article)} title="删除">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {articles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          暂无文章数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </UITable>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    共 {total} 条，第 {page}/{totalPages} 页
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除文章 &quot;{selectedArticle?.title}&quot; 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
