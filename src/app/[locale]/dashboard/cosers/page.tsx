'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  categoryControllerFindAll, 
  categoryControllerCreate,
  categoryControllerUpdate,
  categoryControllerRemove,
  uploadControllerUploadFile,
} from '@/api/sdk.gen';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table as UITable, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
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
import { CategoryControllerFindAllResponse } from '@/api';

type Category = NonNullable<CategoryControllerFindAllResponse['data']['data']>[number];

export default function CosersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageCropDialogOpen, setImageCropDialogOpen] = useState(false);
  const [imageCropField, setImageCropField] = useState<'avatar' | 'background' | 'cover'>('avatar');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    avatar: '',
    background: '',
    cover: '',
    sort: 0,
    status: 'ACTIVE',
  });
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    avatar: '',
    background: '',
    cover: '',
    sort: 0,
    status: 'ACTIVE',
  });

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['admin-categories', search],
    queryFn: async () => {
      const response = await categoryControllerFindAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await categoryControllerCreate({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success('分类创建成功');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setCreateDialogOpen(false);
      setCreateForm({ name: '', description: '', avatar: '', sort: 0,background:'',cover:'',status:'ACTIVE' });
    },
    onError: (error: any) => {
      toast.error(error?.message || '创建失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await categoryControllerUpdate({
        path: { id: String(id) },
        body: data,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('分类更新成功');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await categoryControllerRemove({ path: { id: String(id) } });
      return response.data;
    },
    onSuccess: () => {
      toast.success('分类删除成功');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || '删除失败');
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setEditForm({
      name: category.name || '',
      description: category.description || '',
      avatar: category.avatar || '',
      background: category.background || '',
      cover: category.cover || '',
      sort: category.sort || 0,
      status: category.status || 'ACTIVE',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedCategory?.id) return;
    updateMutation.mutate({ id: selectedCategory.id, data: editForm });
  };

  const handleCreateSubmit = () => {
    if (!createForm.name) {
      toast.error('分类名称为必填项');
      return;
    }
    createMutation.mutate(createForm);
  };

  const handleDeleteConfirm = () => {
    if (!selectedCategory?.id) return;
    deleteMutation.mutate(selectedCategory.id);
  };

  const openImageCropDialog = (category: Category, field: 'avatar' | 'background' | 'cover') => {
    setSelectedCategory(category);
    setImageCropField(field);
    setImageCropDialogOpen(true);
  };

  const handleImageCrop = async (file: File) => {
    if (!selectedCategory) return;
    
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

  const categories = categoriesData?.data?.data || [];
  const filteredCategories = search 
    ? categories.filter((c: Category) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">分类管理</h1>
          <p className="text-muted-foreground">管理平台内容分类</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加分类
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="搜索分类名称..."
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
            <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
              <UITable>
              <TableHeader>
                <TableRow>
                  <TableHead>分类名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>头像</TableHead>
                  <TableHead>文章数</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.map((category: Category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <span className="font-medium">{category.name}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-xs truncate">
                        {category.description || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {category.avatar ? (
                        <img src={category.avatar} alt={category.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{category.articleCount || 0}</Badge>
                    </TableCell>
                    <TableCell>{category.sort || 0}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(category)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCategories.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      暂无分类数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              </UITable>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>添加分类</DialogTitle>
            <DialogDescription>创建新的内容分类</DialogDescription>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑分类</DialogTitle>
            <DialogDescription>修改分类信息</DialogDescription>
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
                  onClick={() => { setSelectedCategory(selectedCategory || ({} as Category)); setImageCropField('avatar'); setImageCropDialogOpen(true); }}
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
                  onClick={() => { setSelectedCategory(selectedCategory || ({} as Category)); setImageCropField('background'); setImageCropDialogOpen(true); }}
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
                  onClick={() => { setSelectedCategory(selectedCategory || ({} as Category)); setImageCropField('cover'); setImageCropDialogOpen(true); }}
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除分类 "{selectedCategory?.name}" 吗？此操作不可撤销。
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
