'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  commentControllerFindAllComments,
  commentControllerRemove,
  commentControllerUpdate,
} from '@/api/sdk.gen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Search, Pencil, Trash2, Loader2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow, Table } from '@/components/ui/table';

type Comment = {
  id: number;
  content: string;
  images: string[];
  likes: number;
  replyCount: number;
  status: string;
  articleId?: number;
  article?: {
    id: number;
    title: string;
  };
  author: {
    id: number;
    username: string;
    nickname: string;
    avatar: string;
  };
  parentId?: number;
  createdAt?: string;
  updatedAt?: string;
};

export default function CommentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [editForm, setEditForm] = useState({
    content: '',
    status: '',
  });

  const { data: commentsData, isLoading } = useQuery({
    queryKey: ['admin-comments', page, limit, search, statusFilter],
    queryFn: async () => {
      const response = await commentControllerFindAllComments({
        query: {
          page,
          limit,
          content: search || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        },
      });
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await commentControllerUpdate({
        path: { id: String(id) },
        body: data,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('评论更新成功');
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await commentControllerRemove({ path: { id: String(id) } });
      return response.data;
    },
    onSuccess: () => {
      toast.success('评论删除成功');
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
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

  const openEditDialog = (comment: Comment) => {
    setSelectedComment(comment);
    setEditForm({
      content: comment.content || '',
      status: comment.status || 'PUBLISHED',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (comment: Comment) => {
    setSelectedComment(comment);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedComment) return;
    updateMutation.mutate({ id: selectedComment.id, data: editForm });
  };

  const handleDeleteConfirm = () => {
    if (!selectedComment) return;
    deleteMutation.mutate(selectedComment.id);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="default">已发布</Badge>;
      case 'PENDING':
        return <Badge variant="secondary">待审核</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">已拒绝</Badge>;
      case 'DELETED':
        return <Badge variant="outline">已删除</Badge>;
      default:
        return <Badge variant="outline">{status || '未知'}</Badge>;
    }
  };

  const comments = (commentsData?.data?.data || commentsData?.data || []) as Comment[];
  const total = (commentsData?.data?.meta?.total || commentsData?.meta?.total || 0);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">评论管理</h1>
          <p className="text-muted-foreground">管理平台评论</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Input
                placeholder="搜索评论内容..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="PUBLISHED">已发布</SelectItem>
                <SelectItem value="PENDING">待审核</SelectItem>
                <SelectItem value="REJECTED">已拒绝</SelectItem>
                <SelectItem value="DELETED">已删除</SelectItem>
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
                      <TableHead>评论内容</TableHead>
                      <TableHead>作者</TableHead>
                      <TableHead>文章</TableHead>
                      <TableHead>点赞</TableHead>
                      <TableHead>回复</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>发布时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comments.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>
                          <div className="max-w-xs truncate">
                            {comment.content}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={comment.author?.avatar} />
                              <AvatarFallback>
                                {(comment.author?.nickname || comment.author?.username || 'U').charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {comment.author?.nickname || comment.author?.username || '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {comment.article?.title || `ID: ${comment.articleId}` || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{comment.likes || 0}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{comment.replyCount || 0}</span>
                        </TableCell>
                        <TableCell>{getStatusBadge(comment.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(comment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(comment)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {comments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          暂无评论数据
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
                      {'<'}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      {'>'}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑评论</DialogTitle>
            <DialogDescription>修改评论信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-content">评论内容</Label>
              <Input
                id="edit-content"
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">状态</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PUBLISHED">已发布</SelectItem>
                  <SelectItem value="PENDING">待审核</SelectItem>
                  <SelectItem value="REJECTED">已拒绝</SelectItem>
                  <SelectItem value="DELETED">已删除</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              确定要删除这条评论吗？此操作不可撤销。
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