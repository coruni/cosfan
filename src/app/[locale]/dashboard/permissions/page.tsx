'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  permissionControllerFindAll,
  permissionControllerCreate,
  permissionControllerRemove,
  permissionControllerUpdate,
} from '@/api/sdk.gen';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Plus, Pencil, Trash2, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Table as UITable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Permission = {
  id: number;
  name: string;
  description?: string;
};

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
  });
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
  });

  // 获取全部权限数据（不分页）
  const { data: permissionsData, isLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: async () => {
      const response = await permissionControllerFindAll();
      return response.data;
    },
  });

  // 前端过滤搜索
  const allPermissions = useMemo(
    () => (permissionsData?.data?.data || permissionsData?.data || []) as Permission[],
    [permissionsData]
  );
  const permissions = useMemo(() => {
    if (!searchInput.trim()) return allPermissions;
    const keyword = searchInput.toLowerCase();
    return allPermissions.filter(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        p.description?.toLowerCase().includes(keyword)
    );
  }, [allPermissions, searchInput]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { name: string; description: string } }) => {
      const response = await permissionControllerUpdate({
        path: { id: String(id) },
        body: data,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('权限更新成功');
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      setEditDialogOpen(false);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err?.message || '更新失败');
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await permissionControllerCreate({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success('权限创建成功');
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      setCreateDialogOpen(false);
      setCreateForm({ name: '', description: '' });
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err?.message || '创建失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await permissionControllerRemove({ path: { id: String(id) } });
      return response.data;
    },
    onSuccess: () => {
      toast.success('权限删除成功');
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      setDeleteDialogOpen(false);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err?.message || '删除失败');
    },
  });

  const openEditDialog = (permission: Permission) => {
    setSelectedPermission(permission);
    setEditForm({
      name: permission.name || '',
      description: permission.description || '',
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (permission: Permission) => {
    setSelectedPermission(permission);
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedPermission) return;
    updateMutation.mutate({ id: selectedPermission.id, data: editForm });
  };

  const handleCreateSubmit = () => {
    if (!createForm.name) {
      toast.error('权限名称为必填项');
      return;
    }
    createMutation.mutate(createForm);
  };

  const handleDeleteConfirm = () => {
    if (!selectedPermission) return;
    deleteMutation.mutate(selectedPermission.id);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">权限管理</h1>
          <p className="text-muted-foreground">管理系统权限</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加权限
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索权限..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              共 {allPermissions.length} 条记录
              {searchInput && permissions.length !== allPermissions.length && (
                <span>，筛选后 {permissions.length} 条</span>
              )}
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
                      <TableHead>权限名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{permission.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{permission.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(permission)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(permission)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {permissions.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                          暂无权限数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </UITable>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑权限</DialogTitle>
            <DialogDescription>修改权限信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">权限名称</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
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
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加权限</DialogTitle>
            <DialogDescription>创建新权限</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">权限名称 *</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">描述</Label>
              <Input
                id="create-description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
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
              确定要删除权限 &quot;{selectedPermission?.name}&quot; 吗？此操作不可撤销。
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