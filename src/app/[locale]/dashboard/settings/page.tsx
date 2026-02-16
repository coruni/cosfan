'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  configControllerFindByGroup,
  configControllerUpdateAll,
  configControllerCreate,
  configControllerRemove,
  uploadControllerUploadFile,
} from '@/api/sdk.gen';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import {
  Plus, Pencil, Trash2, Loader2, Save,
  Settings, Globe, CreditCard, Bell,
  Megaphone, Smartphone, Percent, FileText,
  Heart, UserPlus, Crown, Users, Image as ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

type Config = {
  id: number;
  key: string;
  value: string;
  type?: string;
  group?: string;
  description?: string;
  public?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const CONFIG_GROUPS = [
  { value: 'site', label: '网站设置', icon: Globe, description: '网站基本信息配置' },
  { value: 'app', label: 'APP设置', icon: Smartphone, description: '移动应用相关配置' },
  { value: 'user', label: '用户设置', icon: Users, description: '用户注册与验证配置' },
  { value: 'membership', label: '会员设置', icon: Crown, description: '会员价格与权益配置' },
  { value: 'payment', label: '支付设置', icon: CreditCard, description: '支付网关与渠道配置' },
  { value: 'content', label: '内容设置', icon: FileText, description: '文章与评论审核配置' },
  { value: 'advertisement', label: '广告设置', icon: Megaphone, description: '全站广告位配置' },
  { value: 'seo', label: 'SEO设置', icon: Globe, description: '搜索引擎优化配置' },
  { value: 'invite', label: '邀请设置', icon: UserPlus, description: '邀请码与奖励配置' },
  { value: 'commission', label: '佣金设置', icon: Percent, description: '佣金分成比例配置' },
  { value: 'favorite', label: '收藏夹设置', icon: Heart, description: '收藏夹创建费用配置' },
  { value: 'system', label: '系统设置', icon: Settings, description: '系统维护模式配置' },
];

const CONFIG_DESCRIPTIONS: Record<string, string> = {
  ad_article_bottom_content: '文章底部广告内容',
  ad_article_bottom_enabled: '文章底部广告开关',
  ad_article_top_content: '文章顶部广告内容',
  ad_article_top_enabled: '文章顶部广告开关',
  ad_global_content: '全局广告内容',
  ad_global_enabled: '全局广告开关',
  ad_global_position: '全局广告位置',
  ad_global_style: '全局广告样式',
  ad_homepage_content: '首页广告内容',
  ad_homepage_enabled: '首页广告开关',
  ad_homepage_position: '首页广告位置',
  app_android_download_url: 'Android下载链接',
  app_android_force_update_version: 'Android强制更新版本',
  app_android_version: 'Android当前版本',
  app_force_update: '是否强制更新',
  app_ios_download_url: 'iOS下载链接',
  app_ios_force_update_version: 'iOS强制更新版本',
  app_ios_version: 'iOS当前版本',
  app_maintenance: 'APP维护模式',
  app_maintenance_message: 'APP维护提示信息',
  app_name: 'APP名称',
  app_update_message: 'APP更新提示信息',
  app_version: 'APP当前版本',
  commission_author_rate: '作者佣金比例',
  commission_inviter_rate: '邀请人佣金比例',
  commission_platform_rate: '平台佣金比例',
  article_approval_required: '文章需要审核',
  article_free_images_count: '免费图片数量',
  comment_approval_required: '评论需要审核',
  favorite_create_cost: '创建收藏夹费用',
  favorite_max_free_count: '免费收藏夹数量上限',
  invite_code_enabled: '启用邀请码',
  invite_code_expire_days: '邀请码过期天数',
  invite_code_required: '注册需要邀请码',
  invite_default_commission_rate: '默认邀请佣金比例',
  membership_enabled: '启用会员功能',
  membership_name: '会员名称',
  membership_price: '会员价格',
  membership_price_12m: '12个月会员价格',
  membership_price_1m: '1个月会员价格',
  membership_price_3m: '3个月会员价格',
  membership_price_6m: '6个月会员价格',
  membership_price_lifetime: '终身会员价格',
  payment_alipay_app_id: '支付宝AppID',
  payment_alipay_enabled: '启用支付宝',
  payment_alipay_gateway: '支付宝网关',
  payment_alipay_private_key: '支付宝私钥',
  payment_alipay_public_key: '支付宝公钥',
  payment_epay_alipay_enabled: '易支付-支付宝开关',
  payment_epay_app_id: '易支付AppID',
  payment_epay_app_key: '易支付AppKey',
  payment_epay_enabled: '启用易支付',
  payment_epay_gateway: '易支付网关',
  payment_epay_notify_url: '易支付回调URL',
  payment_epay_usdt_enabled: '易支付-USDT开关',
  payment_epay_wxpay_enabled: '易支付-微信开关',
  payment_notify_url: '支付回调URL',
  payment_return_url: '支付返回URL',
  payment_wechat_api_key: '微信支付API密钥',
  payment_wechat_app_id: '微信AppID',
  payment_wechat_enabled: '启用微信支付',
  payment_wechat_mch_id: '微信商户号',
  payment_wechat_private_key: '微信支付私钥',
  payment_wechat_public_key: '微信支付公钥',
  payment_wechat_serial_no: '微信证书序列号',
  seo_article_page_keywords: '文章页关键词',
  seo_author_page_keywords: '作者页关键词',
  seo_home_keywords: '首页关键词',
  seo_long_tail_keywords: '长尾关键词',
  site_description: '网站描述',
  site_favicon: '网站图标',
  site_keywords: '网站关键词',
  site_layout: '网站布局',
  site_logo: '网站Logo',
  site_mail: '联系邮箱',
  site_name: '网站名称',
  site_subtitle: '网站副标题',
  maintenance_message: '维护提示信息',
  maintenance_mode: '维护模式',
  user_email_verification: '邮箱验证',
  user_registration_enabled: '开放注册',
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [activeGroup, setActiveGroup] = useState('site');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageCropDialogOpen, setImageCropDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<Config | null>(null);
  const [editForm, setEditForm] = useState({
    key: '',
    value: '',
    description: '',
  });
  const [createForm, setCreateForm] = useState({
    key: '',
    value: '',
    description: '',
  });

  const { data: configsData, isLoading } = useQuery({
    queryKey: ['admin-configs', activeGroup],
    queryFn: async () => {
      const response = await configControllerFindByGroup({
        path: { group: activeGroup },
      });
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await configControllerUpdateAll({
        body: [{ id, ...data }],
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('配置更新成功');
      queryClient.invalidateQueries({ queryKey: ['admin-configs'] });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新失败');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await configControllerCreate({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success('配置创建成功');
      queryClient.invalidateQueries({ queryKey: ['admin-configs'] });
      setCreateDialogOpen(false);
      setCreateForm({ key: '', value: '', description: '' });
    },
    onError: (error: any) => {
      toast.error(error?.message || '创建失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await configControllerRemove({ path: { id } });
      return response.data;
    },
    onSuccess: () => {
      toast.success('配置删除成功');
      queryClient.invalidateQueries({ queryKey: ['admin-configs'] });
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || '删除失败');
    },
  });

  const openEditDialog = (config: Config) => {
    setSelectedConfig(config);
    setEditForm({
      key: config.key || '',
      value: config.value || '',
      description: config.description || CONFIG_DESCRIPTIONS[config.key] || '',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (config: Config) => {
    setSelectedConfig(config);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedConfig) return;
    updateMutation.mutate({ id: selectedConfig.id, data: editForm });
  };

  const handleCreateSubmit = () => {
    if (!createForm.key || !createForm.value) {
      toast.error('配置键和值为必填项');
      return;
    }
    createMutation.mutate({ ...createForm, group: activeGroup });
  };

  const handleDeleteConfirm = () => {
    if (!selectedConfig) return;
    deleteMutation.mutate(selectedConfig.id);
  };

  const handleToggle = (config: Config) => {
    const newValue = config.value === 'true' ? 'false' : 'true';
    updateMutation.mutate({ id: config.id, data: { value: newValue } });
  };

  const configs: Config[] = (configsData as any)?.data?.data || [];

  const getConfigDescription = (key: string) => {
    return CONFIG_DESCRIPTIONS[key] || '';
  };

  const isBooleanConfig = (key: string) => {
    return key.includes('_enabled') || key.includes('_required') ||
      key.includes('maintenance_') || key.includes('app_force_update') ||
      key.includes('user_email_verification') || key.includes('user_registration_enabled');
  };

  const isImageConfig = (key: string) => {
    const lowerKey = key.toLowerCase();
    return lowerKey.includes('logo') || lowerKey.includes('favicon');
  };

  const openImageCropDialog = (config: Config) => {
    setSelectedConfig(config);
    setImageCropDialogOpen(true);
  };

  const handleImageCrop = async (file: File) => {
    if (!selectedConfig) return;

    try {
      const response = await uploadControllerUploadFile({
        body: { file },
      });

      const uploadedFile = response.data?.data?.[0];
      if (uploadedFile?.url) {
        setEditForm(prev => ({ ...prev, value: uploadedFile.url || '' }));
        setImageCropDialogOpen(false);
      } else {
        throw new Error('上传失败');
      }
    } catch (error: any) {
      toast.error(error?.message || '上传失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">系统设置</h1>
          <p className="text-muted-foreground text-sm md:text-base">管理平台系统配置</p>
        </div>
      </div>

      <Tabs value={activeGroup} onValueChange={setActiveGroup}>
        <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="flex flex-nowrap min-w-max h-auto gap-1 p-1 bg-muted">
            {CONFIG_GROUPS.map((group) => (
              <TabsTrigger
                key={group.value}
                value={group.value}
                className="flex items-center gap-1.5 data-[state=active]:bg-background whitespace-nowrap px-3 py-1.5 text-xs md:text-sm"
              >
                <group.icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span>{group.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {CONFIG_GROUPS.map((group) => (
          <TabsContent key={group.value} value={group.value}>
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                      <group.icon className="h-4 w-4 md:h-5 md:w-5" />
                      {group.label}
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">{group.description}</CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1 md:mr-2" />
                    添加配置
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : configs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>暂无配置数据</p>
                    <p className="text-sm mt-2">点击"添加配置"创建新配置</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                    <UITable>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[150px]">配置键</TableHead>
                          <TableHead className="min-w-[120px]">配置值</TableHead>
                          <TableHead className="min-w-[150px] hidden sm:table-cell">描述</TableHead>
                          <TableHead className="min-w-[80px] hidden md:table-cell">更新时间</TableHead>
                          <TableHead className="text-right min-w-[100px]">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {configs.map((config) => (
                          <TableRow key={config.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <code className="text-xs md:text-sm font-medium bg-muted px-1.5 md:px-2 py-0.5 rounded whitespace-nowrap">
                                  {config.key}
                                </code>
                                {config.public && (
                                  <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded hidden sm:inline">公开</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {isBooleanConfig(config.key) ? (
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={config.value === 'true'}
                                    onCheckedChange={() => handleToggle(config)}
                                  />
                                  <span className="text-xs md:text-sm text-muted-foreground">
                                    {config.value === 'true' ? '开启' : '关闭'}
                                  </span>
                                </div>
                              ) : isImageConfig(config.key) ? (
                                <div className="flex items-center gap-2">
                                  {config.value ? (
                                    <img
                                      src={config.value}
                                      alt={config.key}
                                      className="h-8 w-8 rounded object-cover border"
                                    />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">未设置</span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-xs md:text-sm max-w-[120px] md:max-w-[200px] truncate">
                                  {config.value || '-'}
                                </p>
                              )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <p className="text-xs md:text-sm text-muted-foreground max-w-[200px] truncate">
                                {config.description || getConfigDescription(config.key) || '-'}
                              </p>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-xs md:text-sm text-muted-foreground whitespace-nowrap">
                                {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString() : '-'}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditDialog(config)}
                              >
                                <Pencil className="h-3.5 w-3.5 md:h-4 md:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openDeleteDialog(config)}
                              >
                                <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </UITable>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑配置</DialogTitle>
            <DialogDescription>修改系统配置</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-key">配置键</Label>
              <Input
                id="edit-key"
                value={editForm.key}
                disabled
                className="bg-muted"
              />
            </div>
            {isBooleanConfig(editForm.key) ? (
              <div className="space-y-2">
                <Label htmlFor="edit-value">配置值</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editForm.value === 'true'}
                    onCheckedChange={(checked) => setEditForm({ ...editForm, value: checked ? 'true' : 'false' })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {editForm.value === 'true' ? '开启' : '关闭'}
                  </span>
                </div>
              </div>
            ) : isImageConfig(editForm.key) ? (
              <div className="space-y-2">
                <Label>图片</Label>
                <div className="flex items-center gap-3">
                  {editForm.value ? (
                    <img
                      src={editForm.value}
                      alt="预览"
                      className={editForm.key.includes('favicon') ? 'w-8 h-8 object-contain border rounded' : 'w-16 h-10 rounded object-cover'}
                    />
                  ) : (
                    <div className="w-16 h-10 rounded bg-muted flex items-center justify-center">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setImageCropDialogOpen(true)}
                  >
                    {editForm.value ? '更换' : '上传'}
                  </Button>
                  {editForm.value && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditForm({ ...editForm, value: '' })}
                    >
                      删除
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="edit-value">配置值</Label>
                <Textarea
                  id="edit-value"
                  value={editForm.value}
                  onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                  rows={4}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleEditSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>添加配置</DialogTitle>
            <DialogDescription>创建新的系统配置</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-key">配置键 *</Label>
              <Input
                id="create-key"
                value={createForm.key}
                onChange={(e) => setCreateForm({ ...createForm, key: e.target.value })}
                placeholder="例如：site_name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-value">配置值 *</Label>
              <Textarea
                id="create-value"
                value={createForm.value}
                onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                rows={4}
                placeholder="配置值"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">描述</Label>
              <Input
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="配置说明"
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
              确定要删除配置 "{selectedConfig?.key}" 吗？此操作不可撤销。
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
        title="上传图片"
        description="拖拽调整位置，滚轮或双指缩放"
        width={200}
        height={200}
        aspectRatio={1}
        onConfirm={handleImageCrop}
        initialImage={editForm.value || ''}
      />
    </div>
  );
}
