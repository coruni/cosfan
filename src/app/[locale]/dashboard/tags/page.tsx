'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  tagControllerFindAll, 
  tagControllerRemove, 
  tagControllerUpdate,
  tagControllerCreate,
  uploadControllerUploadFile,
} from '@/api/sdk.gen';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { Search, Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { TagControllerFindAllResponse } from '@/api';

type Tag = NonNullable<TagControllerFindAllResponse['data']['data']>[number];

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageCropDialogOpen, setImageCropDialogOpen] = useState(false);
  const [imageCropField, setImageCropField] = useState<'avatar' | 'background' | 'cover'>('avatar');
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    avatar: '',
    background: '',
    cover: '',
    sort: 0,
  });
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    avatar: '',
    background: '',
    cover: '',
    sort: 0,
  });

  const { data: tagsData, isLoading } = useQuery({
    queryKey: ['admin-tags', page, limit, search],
    queryFn: async () => {
      const response = await tagControllerFindAll({
        query: { page, limit, name: search || undefined },
      });
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await tagControllerUpdate({
        path: { id: String(id) },
        body: data,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('标签更新成功');
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新失败');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await tagControllerCreate({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success('标签创建成功');
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
      setCreateDialogOpen(false);
      setCreateForm({ name: '', description: '', avatar: '', background: '', cover: '', sort: 0 });
    },
    onError: (error: any) => {
      toast.error(error?.message || '创建失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await tagControllerRemove({ path: { id: String(id) } });
      return response.data;
    },
    onSuccess: () => {
      toast.success('标签删除成功');
      queryClient.invalidateQueries({ queryKey: ['admin-tags'] });
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

  const openEditDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setEditForm({
      name: tag.name || '',
      description: tag.description || '',
      avatar: tag.avatar || '',
      background: tag.background || '',
      cover: tag.cover || '',
      sort: tag.sort || 0,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (tag: Tag) => {
    setSelectedTag(tag);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedTag) return;
    updateMutation.mutate({ id: selectedTag.id, data: editForm });
  };

  const handleCreateSubmit = () => {
    if (!createForm.name) {
      toast.error('标签名称为必填项');
      return;
    }
    createMutation.mutate(createForm);
  };

  const handleDeleteConfirm = () => {
    if (!selectedTag) return;
    deleteMutation.mutate(selectedTag.id);
  };

  const handleImageCrop = async (file: File) => {
    if (!selectedTag) return;
    
    try {
      const response = await uploadControllerUploadFile({
        body: { file },
      });
      
      const uploadedFile = response.data?.data?.[0];
      if (uploadedFile?.url) {
        setEditForm(prev => ({ ...prev, [imageCropField]: uploadedFile.url }));
        setImageCropDialogOpen(false);
      } else {
        throw new Error('上传失败');
      }
    } catch (error: any) {
      toast.error(error?.message || '上传失败');
    }
  };

  const tags = tagsData?.data?.data || [];
  const total = tagsData?.data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">标签管理</h1>
          <p className="text-muted-foreground">管理平台所有标签</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加标签
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="搜索标签名称..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
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
                    <TableHead>标签</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>文章数</TableHead>
                    <TableHead>关注数</TableHead>
                    <TableHead>排序</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {tag.avatar && (
                            <img 
                              src={tag.avatar} 
                              alt={tag.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          )}
                          <span className="font-medium">{tag.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-xs truncate">
                          {tag.description || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tag.articleCount || 0}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tag.followCount || 0}</Badge>
                      </TableCell>
                      <TableCell>{tag.sort || 0}</TableCell>
                      <TableCell>
                        {tag.createdAt ? new Date(tag.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(tag)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(tag)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tags.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        暂无标签数据
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
            <DialogTitle>编辑标签</DialogTitle>
            <DialogDescription>修改标签信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">名称 *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>头像</Label>
              <div className="flex items-center gap-3">
                {editForm.avatar ? (
                  <img src={editForm.avatar} alt="头像" className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedTag(selectedTag || ({} as Tag)); setImageCropField('avatar'); setImageCropDialogOpen(true); }}
                >
                  {editForm.avatar ? '更换' : '上传'}
                </Button>
                {editForm.avatar && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditForm({ ...editForm, avatar: '' })}
                  >
                    删除
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>背景图</Label>
              <div className="flex items-center gap-3">
                {editForm.background ? (
                  <img src={editForm.background} alt="背景图" className="w-16 h-10 rounded object-cover" />
                ) : (
                  <div className="w-16 h-10 rounded bg-muted flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedTag(selectedTag || ({} as Tag)); setImageCropField('background'); setImageCropDialogOpen(true); }}
                >
                  {editForm.background ? '更换' : '上传'}
                </Button>
                {editForm.background && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditForm({ ...editForm, background: '' })}
                  >
                    删除
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>封面图</Label>
              <div className="flex items-center gap-3">
                {editForm.cover ? (
                  <img src={editForm.cover} alt="封面图" className="w-16 h-10 rounded object-cover" />
                ) : (
                  <div className="w-16 h-10 rounded bg-muted flex items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setSelectedTag(selectedTag || ({} as Tag)); setImageCropField('cover'); setImageCropDialogOpen(true); }}
                >
                  {editForm.cover ? '更换' : '上传'}
                </Button>
                {editForm.cover && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditForm({ ...editForm, cover: '' })}
                  >
                    删除
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sort">排序</Label>
              <Input
                id="edit-sort"
                type="number"
                value={editForm.sort}
                onChange={(e) => setEditForm({ ...editForm, sort: parseInt(e.target.value) || 0 })}
              />
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>添加标签</DialogTitle>
            <DialogDescription>创建新标签</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">名称 *</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">描述</Label>
              <Textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-avatar">头像URL</Label>
              <Input
                id="create-avatar"
                value={createForm.avatar}
                onChange={(e) => setCreateForm({ ...createForm, avatar: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-background">背景图URL</Label>
              <Input
                id="create-background"
                value={createForm.background}
                onChange={(e) => setCreateForm({ ...createForm, background: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-cover">封面图URL</Label>
              <Input
                id="create-cover"
                value={createForm.cover}
                onChange={(e) => setCreateForm({ ...createForm, cover: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-sort">排序</Label>
              <Input
                id="create-sort"
                type="number"
                value={createForm.sort}
                onChange={(e) => setCreateForm({ ...createForm, sort: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              创建
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
              确定要删除标签 "{selectedTag?.name}" 吗？此操作不可撤销。
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

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={imageCropDialogOpen}
        onOpenChange={setImageCropDialogOpen}
        title={`上传${imageCropField === 'avatar' ? '头像' : imageCropField === 'background' ? '背景图' : '封面图'}`}
        description="拖拽调整位置，滚轮或双指缩放"
        width={imageCropField === 'avatar' ? 200 : 400}
        height={imageCropField === 'avatar' ? 200 : 200}
        aspectRatio={imageCropField === 'avatar' ? 1 : 2}
        onConfirm={handleImageCrop}
        initialImage={editForm[imageCropField] || ''}
      />
    </div>
  );
}
