"use client";

import { useState, useCallback, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@/i18n/routing";
import Image from "next/image";
import {
  articleControllerCreate,
  categoryControllerFindAll,
  categoryControllerCreate,
  tagControllerFindAll,
  uploadControllerUploadFile,
} from "@/api/sdk.gen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Image as ImageIcon,
  Upload,
  Check,
  Download,
  Lock,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n";
import {
  CategoryControllerFindAllResponse,
  CreateArticleDto,
  TagControllerFindAllResponse,
} from "@/api";
import { cn } from "@/lib/utils";

type Category = NonNullable<
  CategoryControllerFindAllResponse["data"]["data"]
>[number];
type Tag = NonNullable<TagControllerFindAllResponse["data"]["data"]>[number];

type DownloadType =
  | "baidu"
  | "onedrive"
  | "google"
  | "quark"
  | "aliyun"
  | "dropbox"
  | "direct"
  | "lanzou"
  | "mega"
  | "telegram"
  | "other";

type DownloadItem = {
  type: DownloadType;
  url: string;
  password?: string;
  extractionCode?: string;
};

const DOWNLOAD_TYPES: { value: DownloadType; label: string }[] = [
  { value: "baidu", label: "百度网盘" },
  { value: "quark", label: "夸克网盘" },
  { value: "aliyun", label: "阿里云盘" },
  { value: "onedrive", label: "OneDrive" },
  { value: "google", label: "Google Drive" },
  { value: "dropbox", label: "Dropbox" },
  { value: "lanzou", label: "蓝奏云" },
  { value: "mega", label: "Mega" },
  { value: "direct", label: "直链下载" },
  { value: "telegram", label: "Telegram" },
  { value: "other", label: "其他" },
];

const naturalSort = (a: string, b: string) => {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
};

const uploadFiles = async (files: File[]): Promise<string[]> => {
  const response = await uploadControllerUploadFile({
    body: files as unknown as Record<string, unknown>,
  });
  const data = response.data?.data;
  if (!data) return [];
  return data.map((f) => f.url).filter((url): url is string => Boolean(url));
};

export default function ArticleNewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    images: [] as string[],
    cover: "",
    categoryId: 0,
    tagNames: [] as string[],
    status: "DRAFT" as "DRAFT" | "PENDING" | "PUBLISHED",
    requireLogin: false,
    requireFollow: false,
    requirePayment: false,
    listRequireLogin: false,
    requireMembership: false,
    viewPrice: 0,
    sort: 0,
    type: "image" as "image" | "mixed",
    downloads: [] as DownloadItem[],
  });
  const [tagInput, setTagInput] = useState("");
  const [categoryInput, setCategoryInput] = useState("");
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false);
  const [newDownload, setNewDownload] = useState<DownloadItem>({
    type: "baidu",
    url: "",
    password: "",
    extractionCode: "",
  });
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryForm, setNewCategoryForm] = useState({
    name: "",
    description: "",
  });
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingMultiple, setIsUploadingMultiple] = useState(false);

  const { data: categoriesData, refetch: refetchCategories } = useQuery({
    queryKey: ["categories", categoryInput],
    queryFn: async () => {
      const response = await categoryControllerFindAll({
        query: { name: categoryInput || undefined, limit: 100 },
      });
      return response.data;
    },
  });

  const { data: tagsData } = useQuery({
    queryKey: ["tags", tagInput],
    queryFn: async () => {
      const response = await tagControllerFindAll({
        query: { name: tagInput || undefined },
      });
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const response = await articleControllerCreate({
        body: data as CreateArticleDto & { images: string | string[] },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("文章创建成功");
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      router.back();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "创建失败";
      toast.error(message);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      status: string;
      sort: number;
    }) => {
      const response = await categoryControllerCreate({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success("分类创建成功");
      refetchCategories();
      setCategoryDialogOpen(false);
      setNewCategoryForm({ name: "", description: "" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "创建失败";
      toast.error(message);
    },
  });

  const handleCreateCategory = () => {
    if (!newCategoryForm.name) {
      toast.error("请输入分类名称");
      return;
    }
    createCategoryMutation.mutate({
      ...newCategoryForm,
      status: "ENABLED",
      sort: 0,
    });
  };

  const uploadFilesInOrder = async (files: File[]) => {
    const sortedFiles = [...files].sort((a, b) => naturalSort(a.name, b.name));

    try {
      return await uploadFiles(sortedFiles);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "未知错误";
      toast.error(`上传失败: ${message}`);
      return [];
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) {
      toast.error("请拖入图片文件");
      return;
    }

    setIsUploadingMultiple(true);
    try {
      const urls = await uploadFilesInOrder(files);
      if (urls.length > 0) {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, ...urls],
        }));
        toast.success(`成功上传 ${urls.length} 张图片`);
      }
    } finally {
      setIsUploadingMultiple(false);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length === 0) return;

    setIsUploadingMultiple(true);
    try {
      const urls = await uploadFilesInOrder(files);
      if (urls.length > 0) {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, ...urls],
        }));
        toast.success(`成功上传 ${urls.length} 张图片`);
      }
    } finally {
      setIsUploadingMultiple(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSingleImageUpload = async (file: File, index: number) => {
    setUploadingIndex(index);
    try {
      const urls = await uploadFiles([file]);
      if (urls[0]) {
        setForm((prev) => {
          const newImages = [...prev.images];
          newImages[index] = urls[0];
          return { ...prev, images: newImages };
        });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "上传失败";
      toast.error(message);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleCoverUpload = async (file: File) => {
    setIsUploadingCover(true);
    try {
      const urls = await uploadFiles([file]);
      if (urls[0]) {
        setForm((prev) => ({ ...prev, cover: urls[0] }));
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "上传失败";
      toast.error(message);
    } finally {
      setIsUploadingCover(false);
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= form.images.length) return;

    setForm((prev) => {
      const newImages = [...prev.images];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return { ...prev, images: newImages };
    });
  };

  const addTag = (tagName: string) => {
    const name = tagName.trim();
    if (!name) return;

    setForm((prev) => {
      if (prev.tagNames.includes(name)) return prev;
      return {
        ...prev,
        tagNames: [...prev.tagNames, name],
      };
    });
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tagNames: prev.tagNames.filter((t) => t !== tag),
    }));
  };

  const addDownload = () => {
    if (!newDownload.url.trim()) {
      toast.error("请输入下载链接");
      return;
    }
    setForm((prev) => ({
      ...prev,
      downloads: [...prev.downloads, { ...newDownload }],
    }));
    setNewDownload({
      type: "baidu",
      url: "",
      password: "",
      extractionCode: "",
    });
  };

  const removeDownload = (index: number) => {
    setForm((prev) => ({
      ...prev,
      downloads: prev.downloads.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!form.title) {
      toast.error("请输入文章标题");
      return;
    }
    if (!form.categoryId) {
      toast.error("请选择分类");
      return;
    }
    createMutation.mutate({
      ...form,
      images: form.images,
      sort: 0,
      requireFollow: false,
      downloads: form.downloads,
    });
  };

  const categories = categoriesData?.data?.data || [];
  const tags = tagsData?.data?.data || [];
  const filteredTags = tags.filter((t: Tag) => !form.tagNames.includes(t.name));

  const selectedCategory = categories.find((cat: Category) => cat.id === form.categoryId);

  const handleSelectCategory = (categoryId: number) => {
    setForm({ ...form, categoryId });
    setCategoryPopoverOpen(false);
    setCategoryInput("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/articles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">创建文章</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            创建新的图片文章
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>标题 *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="输入文章标题"
                  />
                </div>
                <div className="space-y-2">
                  <Label>分类 *</Label>
                  <div className="flex gap-2">
                    <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={categoryPopoverOpen}
                          className="flex-1 justify-between"
                        >
                          {selectedCategory ? selectedCategory.name : "选择分类"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="搜索分类..."
                            value={categoryInput}
                            onValueChange={setCategoryInput}
                          />
                          <CommandList>
                            <CommandEmpty>
                              <div className="p-2 text-center text-sm text-muted-foreground">
                                未找到分类
                              </div>
                            </CommandEmpty>
                            <CommandGroup>
                              {categories.map((cat: Category) => (
                                <CommandItem
                                  key={cat.id}
                                  value={String(cat.id)}
                                  onSelect={() => handleSelectCategory(cat.id)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      form.categoryId === cat.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {cat.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setCategoryDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>内容</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  rows={4}
                  placeholder="输入文章内容"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>图片 ({form.images.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <label
                className={`border-2 border-dashed rounded-lg p-8 text-center mb-4 transition-colors cursor-pointer block ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploadingMultiple ? (
                  <Loader2 className="h-10 w-10 mx-auto text-muted-foreground mb-2 animate-spin" />
                ) : (
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                )}
                <p className="text-muted-foreground">
                  点击或拖拽图片到此处上传
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  支持多张图片，将按文件名自然排序
                </p>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {form.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group aspect-square border rounded-lg overflow-hidden bg-muted"
                  >
                    {img ? (
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        unoptimized
                      />
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-muted/50">
                        <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">
                          上传
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSingleImageUpload(file, idx);
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
                    {form.cover === img && img && (
                      <div className="absolute top-1 left-8 bg-primary text-white text-xs px-1.5 py-0.5 rounded">
                        封面
                      </div>
                    )}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveImage(idx, idx - 1)}
                        disabled={idx === 0}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveImage(idx, idx + 1)}
                        disabled={idx === form.images.length - 1}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {img && form.cover !== img && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setForm({ ...form, cover: img })}
                          title="设为封面"
                        >
                          <ImageIcon className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeImage(idx)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>发布设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={form.status}
                  onValueChange={(v: "DRAFT" | "PENDING" | "PUBLISHED") =>
                    setForm({ ...form, status: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">草稿</SelectItem>
                    <SelectItem value="PENDING">待审核</SelectItem>
                    <SelectItem value="PUBLISHED">已发布</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>类型</Label>
                <Select
                  value={form.type}
                  onValueChange={(v: "image" | "mixed") =>
                    setForm({ ...form, type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">图片</SelectItem>
                    <SelectItem value="mixed">混合</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>封面</Label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer relative group">
                    {form.cover ? (
                      <Image
                        src={form.cover}
                        alt="封面"
                        width={80}
                        height={56}
                        className="rounded object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-20 h-14 rounded bg-muted flex items-center justify-center group-hover:bg-muted/80">
                        {isUploadingCover ? (
                          <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleCoverUpload(file);
                      }}
                    />
                  </label>
                  {form.cover && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setForm({ ...form, cover: "" })}
                    >
                      删除
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>访问权限</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2">
                <Switch
                  checked={form.requireLogin}
                  onCheckedChange={(v) => setForm({ ...form, requireLogin: v })}
                />
                <span className="text-sm">需要登录</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={form.listRequireLogin}
                  onCheckedChange={(v) =>
                    setForm({ ...form, listRequireLogin: v })
                  }
                />
                <span className="text-sm">列表登录可见</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={form.requirePayment}
                  onCheckedChange={(v) =>
                    setForm({ ...form, requirePayment: v })
                  }
                />
                <span className="text-sm">需要付费</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={form.requireMembership}
                  onCheckedChange={(v) =>
                    setForm({ ...form, requireMembership: v })
                  }
                />
                <span className="text-sm">需要会员</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={form.listRequireLogin}
                  onCheckedChange={(v) =>
                    setForm({ ...form, listRequireLogin: v })
                  }
                />
                <span className="text-sm">列表需要登录</span>
              </label>
              {form.requirePayment && (
                <div className="space-y-2">
                  <Label>查看价格</Label>
                  <Input
                    type="number"
                    value={form.viewPrice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        viewPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-32"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>标签</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Command className="rounded-lg border" shouldFilter={false}>
                <CommandInput
                  placeholder="搜索标签..."
                  value={tagInput}
                  onValueChange={setTagInput}
                />
                <CommandList>
                  <CommandEmpty>
                    <div className="p-2">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => addTag(tagInput)}
                        disabled={!tagInput.trim()}
                      >
                        创建 &quot;{tagInput}&quot;
                      </Button>
                    </div>
                  </CommandEmpty>
                  <CommandGroup heading="可选标签">
                    {filteredTags.map((tag: Tag) => (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => addTag(tag.name)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            form.tagNames.includes(tag.name)
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {tag.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>

              {form.tagNames.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {form.tagNames.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        className="ml-1 rounded-full hover:bg-foreground/20 p-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTag(tag);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                下载资源 ({form.downloads.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 p-3 border rounded-lg bg-muted/30">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">网盘类型</Label>
                    <Select
                      value={newDownload.type}
                      onValueChange={(v) =>
                        setNewDownload({
                          ...newDownload,
                          type: v as DownloadType,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOWNLOAD_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">下载链接 *</Label>
                    <Input
                      placeholder="输入下载链接"
                      value={newDownload.url}
                      onChange={(e) =>
                        setNewDownload({ ...newDownload, url: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs">提取密码</Label>
                    <Input
                      placeholder="如: 123456"
                      value={newDownload.password || ""}
                      onChange={(e) =>
                        setNewDownload({
                          ...newDownload,
                          password: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">提取码</Label>
                    <Input
                      placeholder="如: 1234"
                      value={newDownload.extractionCode || ""}
                      onChange={(e) =>
                        setNewDownload({
                          ...newDownload,
                          extractionCode: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <Button size="sm" onClick={addDownload} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  添加下载资源
                </Button>
              </div>

              {form.downloads.length > 0 && (
                <div className="space-y-2">
                  {form.downloads.map((download, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg bg-background"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <Download className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                              {
                                DOWNLOAD_TYPES.find(
                                  (t) => t.value === download.type
                                )?.label
                              }
                            </span>
                            {(download.password || download.extractionCode) && (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                          <p className="text-sm truncate text-muted-foreground">
                            {download.url}
                          </p>
                          {(download.password || download.extractionCode) && (
                            <p className="text-xs text-muted-foreground">
                              {download.password &&
                                `密码: ${download.password}`}
                              {download.password &&
                                download.extractionCode &&
                                " / "}
                              {download.extractionCode &&
                                `提取码: ${download.extractionCode}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="flex-shrink-0"
                        onClick={() => removeDownload(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Link href="/dashboard/articles" className="flex-1">
              <Button variant="outline" className="w-full">
                取消
              </Button>
            </Link>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              创建文章
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建分类</DialogTitle>
            <DialogDescription>创建新的文章分类</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>名称 *</Label>
              <Input
                value={newCategoryForm.name}
                onChange={(e) =>
                  setNewCategoryForm({
                    ...newCategoryForm,
                    name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>描述</Label>
              <Textarea
                value={newCategoryForm.description}
                onChange={(e) =>
                  setNewCategoryForm({
                    ...newCategoryForm,
                    description: e.target.value,
                  })
                }
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCategoryDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateCategory}
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
