'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  articleControllerFindAll,
  articleControllerRemove,
  articleControllerUpdate,
  categoryControllerFindAll,
  tagControllerFindAll
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, ExternalLink, Eye } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { Table as UITable, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArticleControllerFindAllResponse } from '@/api';

type Article = ArticleControllerFindAllResponse['data']['data'][number]

export default function ArticlesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    summary: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    requireLogin: false,
    requirePayment: false,
    requireMembership: false,
    viewPrice: 0,
  });

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

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryControllerFindAll();
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await articleControllerUpdate({
        path: { id: String(id) },
        body: data,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('文章更新成功');
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新失败');
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

  const openEditDialog = (article: Article) => {
    setSelectedArticle(article);
    setEditForm({
      title: article.title || '',
      summary: article.summary || '',
      status: (article.status || 'DRAFT') as 'DRAFT' | 'PUBLISHED',
      requireLogin: article.requireLogin || false,
      requirePayment: article.requirePayment || false,
      requireMembership: article.requireMembership || false,
      viewPrice: Number(article.viewPrice) || 0,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (article: Article) => {
    setSelectedArticle(article);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedArticle) return;
    updateMutation.mutate({ id: selectedArticle.id, data: editForm });
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
          <h1 className="text-3xl font-bold">文章管理</h1>
          <p className="text-muted-foreground">管理平台所有文章</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="搜索文章标题..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter || undefined} onValueChange={(v) => { setStatusFilter(v || ''); setPage(1); }}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态筛选" />
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
                    <TableHead>作者</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>标签</TableHead>
                    <TableHead>浏览/点赞/评论</TableHead>
                    <TableHead>权限</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {articles.map((article: Article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {article.cover && (
                            <img
                              src={article.cover}
                              alt={article.title}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="max-w-xs">
                            <p className="font-medium truncate">{article.title}</p>
                            {article.summary && (
                              <p className="text-xs text-muted-foreground truncate">{article.summary}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{article.author?.nickname || article.author?.username}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{article.category?.name || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-[150px]">
                          {article.tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="secondary" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))}
                          {(article.tags?.length || 0) > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{article.tags!.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {article?.views || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {article.requireLogin && (
                            <Badge variant="outline" className="text-xs w-fit">需登录</Badge>
                          )}
                          {article.requirePayment && (
                            <Badge variant="outline" className="text-xs w-fit">付费 ¥{article.viewPrice}</Badge>
                          )}
                          {article.requireMembership && (
                            <Badge variant="outline" className="text-xs w-fit">会员</Badge>
                          )}
                          {!article.requireLogin && !article.requirePayment && !article.requireMembership && (
                            <span className="text-xs text-muted-foreground">公开</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(article.status)}</TableCell>
                      <TableCell>
                        {article.createdAt ? new Date(article.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/article/${article.id}`} target="_blank">
                          <Button variant="ghost" size="icon" title="查看">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(article)}
                          title="编辑"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(article)}
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {articles.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
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
                    共 {total} 条记录，第 {page} / {totalPages} 页
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑文章</DialogTitle>
            <DialogDescription>修改文章信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">标题</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-summary">摘要</Label>
              <Textarea
                id="edit-summary"
                value={editForm.summary}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">状态</Label>
              <Select
                value={editForm.status}
                onValueChange={(value: any) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">草稿</SelectItem>
                  <SelectItem value="PUBLISHED">已发布</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>访问权限</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.requireLogin}
                    onChange={(e) => setEditForm({ ...editForm, requireLogin: e.target.checked })}
                  />
                  <span className="text-sm">需要登录</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.requirePayment}
                    onChange={(e) => setEditForm({ ...editForm, requirePayment: e.target.checked })}
                  />
                  <span className="text-sm">需要付费</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editForm.requireMembership}
                    onChange={(e) => setEditForm({ ...editForm, requireMembership: e.target.checked })}
                  />
                  <span className="text-sm">需要会员</span>
                </label>
              </div>
            </div>
            {editForm.requirePayment && (
              <div className="space-y-2">
                <Label htmlFor="edit-viewPrice">查看价格</Label>
                <Input
                  id="edit-viewPrice"
                  type="number"
                  value={editForm.viewPrice}
                  onChange={(e) => setEditForm({ ...editForm, viewPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除文章 "{selectedArticle?.title}" 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
