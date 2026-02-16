'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  userControllerFindAll, 
  userControllerRemove, 
  userControllerUpdate,
  userControllerCreate,
  uploadControllerUploadFile,
} from '@/api/sdk.gen';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCropDialog } from '@/components/ui/image-crop-dialog';
import { Search, Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow, Table } from '@/components/ui/table';
import { UserControllerFindAllResponse } from '@/api/types.gen';

type User = {
  id: number;
  username: string;
  nickname?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  membershipStatus?: 'ACTIVE' | 'INACTIVE';
  membershipExpiredAt?: string;
  wallet?: number;
  createdAt?: string;
  roles?: Array<{ id: number; name: string; displayName?: string }>;
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [avatarCropDialogOpen, setAvatarCropDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    nickname: '',
    email: '',
    phone: '',
    avatar: '',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'BANNED',
    membershipStatus: 'INACTIVE' as 'ACTIVE' | 'INACTIVE',
    membershipExpiredAt: '',
    wallet: 0,
  });
  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    nickname: '',
    email: '',
    phone: '',
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page, limit, search],
    queryFn: async () => {
      const response = await userControllerFindAll({
        query: { page, limit, username: search || undefined },
      });
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await userControllerUpdate({
        path: { id: String(id) },
        body: data,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('用户更新成功');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || '更新失败');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await userControllerCreate({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success('用户创建成功');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setCreateDialogOpen(false);
      setCreateForm({ username: '', password: '', nickname: '', email: '', phone: '' });
    },
    onError: (error: any) => {
      toast.error(error?.message || '创建失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await userControllerRemove({ path: { id: String(id) } });
      return response.data;
    },
    onSuccess: () => {
      toast.success('用户删除成功');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
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

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      nickname: user.nickname || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      status: user.status || 'ACTIVE',
      membershipStatus: user.membershipStatus || 'INACTIVE',
      membershipExpiredAt: user.membershipExpiredAt || '',
      wallet: user.wallet || 0,
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedUser) return;
    updateMutation.mutate({ id: selectedUser.id, data: editForm });
  };

  const handleCreateSubmit = () => {
    if (!createForm.username || !createForm.password) {
      toast.error('用户名和密码为必填项');
      return;
    }
    createMutation.mutate(createForm);
  };

  const handleDeleteConfirm = () => {
    if (!selectedUser) return;
    deleteMutation.mutate(selectedUser.id);
  };

  const openAvatarCropDialog = (user: User) => {
    setSelectedUser(user);
    setAvatarCropDialogOpen(true);
  };

  const handleAvatarCrop = async (file: File) => {
    if (!selectedUser) return;
    
    try {
      const response = await uploadControllerUploadFile({
        body: { file },
      });
      
      const uploadedFile = response.data?.data?.[0];
      if (uploadedFile?.url) {
        setEditForm(prev => ({ ...prev, avatar: uploadedFile.url||'' }));
        setAvatarCropDialogOpen(false);
      } else {
        throw new Error('上传失败');
      }
    } catch (error: any) {
      toast.error(error?.message || '上传失败');
    }
  };

  const users = (usersData?.data.data || []) as User[];
  const total = (usersData?.data.meta?.total || 0);
  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default">正常</Badge>;
      case 'INACTIVE':
        return <Badge variant="secondary">未激活</Badge>;
      case 'BANNED':
        return <Badge variant="destructive">已封禁</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">用户管理</h1>
          <p className="text-muted-foreground">管理平台所有用户</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加用户
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="搜索用户名、昵称、邮箱..."
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
                    <TableHead>用户</TableHead>
                    <TableHead>邮箱</TableHead>
                    <TableHead>手机</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>钱包余额</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>注册时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: User) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>
                              {(user.nickname || user.username || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.nickname || user.username}</p>
                            <p className="text-xs text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.roles?.map((role) => (
                            <Badge key={role.id} variant="outline" className="text-xs">
                              {role.displayName || role.name}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>¥{user.wallet?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        暂无用户数据
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                  onClick={() => setAvatarCropDialogOpen(true)}
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
              <Label htmlFor="edit-nickname">昵称</Label>
              <Input
                id="edit-nickname"
                value={editForm.nickname}
                onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">邮箱</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">手机</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
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
                  <SelectItem value="ACTIVE">正常</SelectItem>
                  <SelectItem value="INACTIVE">未激活</SelectItem>
                  <SelectItem value="BANNED">已封禁</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-membershipStatus">会员状态</Label>
              <Select
                value={editForm.membershipStatus}
                onValueChange={(value: any) => setEditForm({ ...editForm, membershipStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">会员</SelectItem>
                  <SelectItem value="INACTIVE">非会员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-membershipExpiredAt">会员到期时间</Label>
              <Input
                id="edit-membershipExpiredAt"
                type="datetime-local"
                value={editForm.membershipExpiredAt ? editForm.membershipExpiredAt.slice(0, 16) : ''}
                onChange={(e) => setEditForm({ ...editForm, membershipExpiredAt: e.target.value ? new Date(e.target.value).toISOString() : '' })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-wallet">钱包余额</Label>
              <Input
                id="edit-wallet"
                type="number"
                value={editForm.wallet}
                onChange={(e) => setEditForm({ ...editForm, wallet: parseFloat(e.target.value) || 0 })}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加用户</DialogTitle>
            <DialogDescription>创建新用户账号</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-username">用户名 *</Label>
              <Input
                id="create-username"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">密码 *</Label>
              <Input
                id="create-password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-nickname">昵称</Label>
              <Input
                id="create-nickname"
                value={createForm.nickname}
                onChange={(e) => setCreateForm({ ...createForm, nickname: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">邮箱</Label>
              <Input
                id="create-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">手机</Label>
              <Input
                id="create-phone"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
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
              确定要删除用户 "{selectedUser?.nickname || selectedUser?.username}" 吗？此操作不可撤销。
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

      {/* Avatar Crop Dialog */}
      <ImageCropDialog
        open={avatarCropDialogOpen}
        onOpenChange={setAvatarCropDialogOpen}
        title="上传头像"
        description="拖拽调整位置，滚轮或双指缩放"
        width={200}
        height={200}
        aspectRatio={1}
        onConfirm={handleAvatarCrop}
        initialImage={editForm.avatar || ''}
      />
    </div>
  );
}
