'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  articleControllerFindAll,
  articleControllerCreate,
  articleControllerRemove,
  articleControllerUpdate,
  articleControllerFindOne,
  categoryControllerFindAll,
  categoryControllerCreate,
  tagControllerFindAll,
  uploadControllerUploadFile,
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
import { Switch } from '@/components/ui/switch';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { 
  Search, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, 
  ExternalLink, Eye, Plus, X, GripVertical, Image as ImageIcon,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@/i18n';
import { Table as UITable, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ArticleControllerFindAllResponse, CategoryControllerFindAllResponse } from '@/api';

type Article = NonNullable<ArticleControllerFindAllResponse['data']['data']>[number];
type Category = NonNullable<CategoryControllerFindAllResponse['data']['data']>[number];

const naturalSort = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

export default function ArticlesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    summary: '',
    content: '',
    images: [] as string[],
    cover: '',
    categoryId: 0,
    tagNames: [] as string[],
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    requireLogin: false,
    requirePayment: false,
    requireMembership: false,
    viewPrice: 0,
    type: 'image' as 'image' | 'mixed',
  });
  const [createForm, setCreateForm] = useState({
    title: '',
    summary: '',
    content: '',
    images: [] as string[],
    cover: '',
    categoryId: 0,
    tagNames: [] as string[],
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    requireLogin: false,
    requirePayment: false,
    requireMembership: false,
    viewPrice: 0,
    type: 'image' as 'image' | 'mixed',
  });
  const [tagInput, setTagInput] = useState('');
  const [createTagInput, setCreateTagInput] = useState('');
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: '',
    description: '',
  });
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

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

  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryControllerFindAll();
      return response.data;
    },
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await tagControllerFindAll();
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await articleControllerCreate({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success('文章创建成功');
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error: any) => {
      toast.error(error?.message || '创建失败');
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

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await categoryControllerCreate({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success('分类创建成功');
      refetchCategories();
      setCategoryDialogOpen(false);
      setNewCategoryForm({ name: '', description: '' });
    },
    onError: (error: any) => {
      toast.error(error?.message || '创建失败');
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      summary: '',
      content: '',
      images: [],
      cover: '',
      categoryId: 0,
      tagNames: [],
      status: 'DRAFT',
      requireLogin: false,
      requirePayment: false,
      requireMembership: false,
      viewPrice: 0,
      type: 'image',
    });
    setCreateTagInput('');
  };

  const openEditDialog = async (article: Article) => {
    setSelectedArticle(article);
    
    const detailResponse = await articleControllerFindOne({
      path: { id: String(article.id) },
    });
    const detail = detailResponse.data?.data;
    
    setEditForm({
      title: detail?.title || article.title || '',
      summary: detail?.summary || article.summary || '',
      content: detail?.content || '',
      images: detail?.images || [],
      cover: detail?.cover || article.cover || '',
      categoryId: detail?.category?.id || article.category?.id || 0,
      tagNames: detail?.tags?.map((t: any) => t.name) || [],
      status: (detail?.status || article.status || 'DRAFT') as 'DRAFT' | 'PUBLISHED',
      requireLogin: detail?.requireLogin ?? article.requireLogin ?? false,
      requirePayment: detail?.requirePayment ?? article.requirePayment ?? false,
      requireMembership: detail?.requireMembership ?? article.requireMembership ?? false,
      viewPrice: Number(detail?.viewPrice || article.viewPrice) || 0,
      type: (detail?.type || article.type || 'image') as 'image' | 'mixed',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (article: Article) => {
    setSelectedArticle(article);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedArticle) return;
    updateMutation.mutate({ 
      id: selectedArticle.id, 
      data: {
        ...editForm,
        images: editForm.images.join('\n'),
      }
    });
  };

  const handleCreateSubmit = () => {
    if (!createForm.title) {
      toast.error('请输入文章标题');
      return;
    }
    if (!createForm.categoryId) {
      toast.error('请选择分类');
      return;
    }
    createMutation.mutate({
      ...createForm,
      images: createForm.images.join('\n'),
      sort: 0,
      requireFollow: false,
      listRequireLogin: false,
    });
  };

  const handleDeleteConfirm = () => {
    if (!selectedArticle) return;
    deleteMutation.mutate(selectedArticle.id);
  };

  const handleCreateCategory = () => {
    if (!newCategoryForm.name) {
      toast.error('请输入分类名称');
      return;
    }
    createCategoryMutation.mutate({
      ...newCategoryForm,
      status: 'ACTIVE',
      sort: 0,
    });
  };

  const handleImageUpload = async (file: File, index: number, isCreate: boolean) => {
    setUploadingIndex(index);
    try {
      const response = await uploadControllerUploadFile({
        body: { file },
      });
      const uploadedFile = response.data?.data?.[0];
      if (uploadedFile?.url) {
        const url = uploadedFile.url;
        if (isCreate) {
          setCreateForm(prev => {
            const newImages = [...prev.images];
            newImages[index] = url;
            return { ...prev, images: newImages };
          });
        } else {
          setEditForm(prev => {
            const newImages = [...prev.images];
            newImages[index] = url;
            return { ...prev, images: newImages };
          });
        }
      }
    } catch (error: any) {
      toast.error(error?.message || '上传失败');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleCoverUpload = async (file: File, isCreate: boolean) => {
    setIsUploadingCover(true);
    try {
      const response = await uploadControllerUploadFile({
        body: { file },
      });
      const uploadedFile = response.data?.data?.[0];
      if (uploadedFile?.url) {
        const url = uploadedFile.url;
        if (isCreate) {
          setCreateForm(prev => ({ ...prev, cover: url }));
        } else {
          setEditForm(prev => ({ ...prev, cover: url }));
        }
      }
    } catch (error: any) {
      toast.error(error?.message || '上传失败');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const addImage = (isCreate: boolean) => {
    if (isCreate) {
      setCreateForm(prev => ({ ...prev, images: [...prev.images, ''] }));
    } else {
      setEditForm(prev => ({ ...prev, images: [...prev.images, ''] }));
    }
  };

  const removeImage = (index: number, isCreate: boolean) => {
    if (isCreate) {
      setCreateForm(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    }
  };

  const moveImage = (fromIndex: number, toIndex: number, isCreate: boolean) => {
    if (toIndex < 0 || toIndex >= (isCreate ? createForm.images.length : editForm.images.length)) return;
    
    if (isCreate) {
      setCreateForm(prev => {
        const newImages = [...prev.images];
        const [removed] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, removed);
        return { ...prev, images: newImages };
      });
    } else {
      setEditForm(prev => {
        const newImages = [...prev.images];
        const [removed] = newImages.splice(fromIndex, 1);
        newImages.splice(toIndex, 0, removed);
        return { ...prev, images: newImages };
      });
    }
  };

  const addTag = (isCreate: boolean) => {
    const input = isCreate ? createTagInput : tagInput;
    const tags = input.split(',').map(t => t.trim()).filter(Boolean);
    
    if (tags.length > 0) {
      if (isCreate) {
        setCreateForm(prev => ({
          ...prev,
          tagNames: [...new Set([...prev.tagNames, ...tags])],
        }));
        setCreateTagInput('');
      } else {
        setEditForm(prev => ({
          ...prev,
          tagNames: [...new Set([...prev.tagNames, ...tags])],
        }));
        setTagInput('');
      }
    }
  };

  const removeTag = (tag: string, isCreate: boolean) => {
    if (isCreate) {
      setCreateForm(prev => ({
        ...prev,
        tagNames: prev.tagNames.filter(t => t !== tag),
      }));
    } else {
      setEditForm(prev => ({
        ...prev,
        tagNames: prev.tagNames.filter(t => t !== tag),
      }));
    }
  };

  const articles = articlesData?.data?.data || [];
  const total = articlesData?.data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);
  const categories = categoriesData?.data?.data || [];

  const sortedImages = useMemo(() => {
    return (images: string[]) => {
      return images.map((img, idx) => ({ url: img, originalIndex: idx }))
        .sort((a, b) => naturalSort(a.url, b.url));
    };
  }, []);

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
        <Button onClick={() => { resetCreateForm(); setCreateDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          创建文章
        </Button>
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
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(article)} title="编辑">
                            <Pencil className="h-4 w-4" />
                          </Button>
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

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>创建文章</DialogTitle>
            <DialogDescription>创建新的图片文章</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>标题 *</Label>
                <Input value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>分类 *</Label>
                <div className="flex gap-2">
                  <Select value={String(createForm.categoryId)} onValueChange={(v) => setCreateForm({ ...createForm, categoryId: Number(v) })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: Category) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setCategoryDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>摘要</Label>
              <Textarea value={createForm.summary} onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })} rows={2} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>图片 ({createForm.images.length})</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addImage(true)}>
                  <Plus className="h-4 w-4 mr-1" /> 添加图片
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {createForm.images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square border rounded-lg overflow-hidden bg-muted">
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50">
                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">上传</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, idx, true);
                          }}
                        />
                      </label>
                    )}
                    {uploadingIndex === idx && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </div>
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveImage(idx, idx - 1, true)}
                        disabled={idx === 0}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveImage(idx, idx + 1, true)}
                        disabled={idx === createForm.images.length - 1}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(idx, true)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>封面</Label>
              <div className="flex items-center gap-3">
                {createForm.cover ? (
                  <img src={createForm.cover} alt="封面" className="w-20 h-14 rounded object-cover" />
                ) : (
                  <div className="w-20 h-14 rounded bg-muted flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" disabled={isUploadingCover}>
                    {isUploadingCover ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                    上传封面
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverUpload(file, true);
                    }}
                  />
                </label>
                {createForm.cover && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setCreateForm({ ...createForm, cover: '' })}>
                    删除
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="输入标签，逗号分隔"
                  value={createTagInput}
                  onChange={(e) => setCreateTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(true))}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => addTag(true)}>添加</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {createForm.tagNames.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag, true)} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={createForm.status} onValueChange={(v: any) => setCreateForm({ ...createForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">草稿</SelectItem>
                    <SelectItem value="PUBLISHED">已发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={createForm.type} onValueChange={(v: any) => setCreateForm({ ...createForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">图片</SelectItem>
                    <SelectItem value="mixed">混合</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>访问权限</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <Switch checked={createForm.requireLogin} onCheckedChange={(v) => setCreateForm({ ...createForm, requireLogin: v })} />
                  <span className="text-sm">需要登录</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={createForm.requirePayment} onCheckedChange={(v) => setCreateForm({ ...createForm, requirePayment: v })} />
                  <span className="text-sm">需要付费</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={createForm.requireMembership} onCheckedChange={(v) => setCreateForm({ ...createForm, requireMembership: v })} />
                  <span className="text-sm">需要会员</span>
                </label>
              </div>
              {createForm.requirePayment && (
                <div className="space-y-2">
                  <Label>查看价格</Label>
                  <Input
                    type="number"
                    value={createForm.viewPrice}
                    onChange={(e) => setCreateForm({ ...createForm, viewPrice: parseFloat(e.target.value) || 0 })}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑文章</DialogTitle>
            <DialogDescription>修改文章信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>标题</Label>
                <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>分类</Label>
                <div className="flex gap-2">
                  <Select value={String(editForm.categoryId)} onValueChange={(v) => setEditForm({ ...editForm, categoryId: Number(v) })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat: Category) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" onClick={() => setCategoryDialogOpen(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>摘要</Label>
              <Textarea value={editForm.summary} onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })} rows={2} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>图片 ({editForm.images.length})</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => addImage(false)}>
                  <Plus className="h-4 w-4 mr-1" /> 添加图片
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {editForm.images.map((img, idx) => (
                  <div key={idx} className="relative group aspect-square border rounded-lg overflow-hidden bg-muted">
                    {img ? (
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50">
                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">上传</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, idx, false);
                          }}
                        />
                      </label>
                    )}
                    {uploadingIndex === idx && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </div>
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveImage(idx, idx - 1, false)}
                        disabled={idx === 0}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveImage(idx, idx + 1, false)}
                        disabled={idx === editForm.images.length - 1}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute bottom-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(idx, false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>封面</Label>
              <div className="flex items-center gap-3">
                {editForm.cover ? (
                  <img src={editForm.cover} alt="封面" className="w-20 h-14 rounded object-cover" />
                ) : (
                  <div className="w-20 h-14 rounded bg-muted flex items-center justify-center">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm" disabled={isUploadingCover}>
                    {isUploadingCover ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                    上传封面
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleCoverUpload(file, false);
                    }}
                  />
                </label>
                {editForm.cover && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditForm({ ...editForm, cover: '' })}>
                    删除
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>标签</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="输入标签，逗号分隔"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(false))}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={() => addTag(false)}>添加</Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {editForm.tagNames.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag, false)} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>状态</Label>
                <Select value={editForm.status} onValueChange={(v: any) => setEditForm({ ...editForm, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">草稿</SelectItem>
                    <SelectItem value="PUBLISHED">已发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={editForm.type} onValueChange={(v: any) => setEditForm({ ...editForm, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">图片</SelectItem>
                    <SelectItem value="mixed">混合</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>访问权限</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <Switch checked={editForm.requireLogin} onCheckedChange={(v) => setEditForm({ ...editForm, requireLogin: v })} />
                  <span className="text-sm">需要登录</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={editForm.requirePayment} onCheckedChange={(v) => setEditForm({ ...editForm, requirePayment: v })} />
                  <span className="text-sm">需要付费</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch checked={editForm.requireMembership} onCheckedChange={(v) => setEditForm({ ...editForm, requireMembership: v })} />
                  <span className="text-sm">需要会员</span>
                </label>
              </div>
              {editForm.requirePayment && (
                <div className="space-y-2">
                  <Label>查看价格</Label>
                  <Input
                    type="number"
                    value={editForm.viewPrice}
                    onChange={(e) => setEditForm({ ...editForm, viewPrice: parseFloat(e.target.value) || 0 })}
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Create Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建分类</DialogTitle>
            <DialogDescription>创建新的文章分类</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>名称 *</Label>
              <Input value={newCategoryForm.name} onChange={(e) => setNewCategoryForm({ ...newCategoryForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea value={newCategoryForm.description} onChange={(e) => setNewCategoryForm({ ...newCategoryForm, description: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateCategory} disabled={createCategoryMutation.isPending}>
              {createCategoryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
              确定要删除文章 "{selectedArticle?.title}" 吗？此操作不可撤销。
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
