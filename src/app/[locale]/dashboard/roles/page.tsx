"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from 'next-intl';
import {
  roleControllerFindWithPagination,
  roleControllerCreate,
  roleControllerRemove,
  roleControllerUpdate,
  roleControllerAssignPermissions,
  permissionControllerFindAll,
} from "@/api/sdk.gen";
import { usePagination } from "@/hooks";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  ShieldCheck,
  Power,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Table as UITable,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Role = {
  id: number;
  name: string;
  displayName?: string;
  description?: string;
  isActive?: boolean;
  permissions?: Array<{ id: number; name: string }>;
};

type Permission = {
  id: number;
  name: string;
  description?: string;
};

export default function RolesPage() {
  const queryClient = useQueryClient();
  const t = useTranslations('pagination');
  const { page, limit, setPage, resetPage } = usePagination({ defaultLimit: 10 });
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    displayName: "",
    description: "",
  });
  const [createForm, setCreateForm] = useState({
    name: "",
    displayName: "",
    description: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ["admin-roles", page, limit, search],
    queryFn: async () => {
      const response = await roleControllerFindWithPagination({
        query: { page, limit, name: search || undefined },
      });
      return response.data;
    },
  });

  const { data: permissionsData } = useQuery({
    queryKey: ["admin-permissions-all"],
    queryFn: async () => {
      const response = await permissionControllerFindAll({});
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: { name: string; displayName: string; description: string };
    }) => {
      const response = await roleControllerUpdate({
        path: { id: String(id) },
        body: data,
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("角色更新成功");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      setEditDialogOpen(false);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err?.message || "更新失败");
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      displayName: string;
      description: string;
    }) => {
      const response = await roleControllerCreate({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success("角色创建成功");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      setCreateDialogOpen(false);
      setCreateForm({ name: "", displayName: "", description: "" });
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err?.message || "创建失败");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await roleControllerRemove({ path: { id: String(id) } });
      return response.data;
    },
    onSuccess: () => {
      toast.success("角色删除成功");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      setDeleteDialogOpen(false);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err?.message || "删除失败");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await roleControllerUpdate({
        path: { id: String(id) },
        body: { isActive },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("状态更新成功");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err?.message || "状态更新失败");
    },
  });

  const assignPermissionsMutation = useMutation({
    mutationFn: async ({
      id,
      permissions,
    }: {
      id: number;
      permissions: number[];
    }) => {
      const response = await roleControllerAssignPermissions({
        path: { id: String(id) },
        body: { permissions },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("权限分配成功");
      queryClient.invalidateQueries({ queryKey: ["admin-roles"] });
      setPermissionsDialogOpen(false);
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err?.message || "权限分配失败");
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    resetPage();
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setEditForm({
      name: role.name || "",
      displayName: role.displayName || "",
      description: role.description || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (role: Role) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  const openPermissionsDialog = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions?.map((p) => p.id) || []);
    setPermissionsDialogOpen(true);
  };

  const handleEditSubmit = () => {
    if (!selectedRole) return;
    updateMutation.mutate({ id: selectedRole.id, data: editForm });
  };

  const handleCreateSubmit = () => {
    if (!createForm.name) {
      toast.error("角色名称为必填项");
      return;
    }
    createMutation.mutate(createForm);
  };

  const handleDeleteConfirm = () => {
    if (!selectedRole) return;
    deleteMutation.mutate(selectedRole.id);
  };

  const handleToggleStatus = (role: Role) => {
    toggleStatusMutation.mutate({ id: role.id, isActive: !role.isActive });
  };

  const handlePermissionsSubmit = () => {
    if (!selectedRole) return;
    assignPermissionsMutation.mutate({
      id: selectedRole.id,
      permissions: selectedPermissions,
    });
  };

  const togglePermission = (permissionId: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const roles = (rolesData?.data?.data || rolesData?.data || []) as Role[];
  const permissions = (permissionsData?.data?.data || []) as Permission[];
  const total = rolesData?.data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">角色管理</h1>
          <p className="text-muted-foreground">管理系统角色</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          添加角色
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Input
                placeholder="搜索角色名称..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
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
                      <TableHead className="w-[60px]">ID</TableHead>
                      <TableHead>角色名称</TableHead>
                      <TableHead>显示名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>权限数量</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="text-muted-foreground text-sm">{role.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{role.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{role.displayName || "-"}</TableCell>
                        <TableCell>{role.description || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {role.permissions?.length || 0} 个
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={role.isActive ? "default" : "secondary"}
                          >
                            {role.isActive ? "启用" : "禁用"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openPermissionsDialog(role)}
                            title="分配权限"
                          >
                            <ShieldCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(role)}
                            title={role.isActive ? "禁用" : "启用"}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(role)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(role)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {roles.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-muted-foreground"
                        >
                          暂无角色数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </UITable>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    {t('info', { total, page, totalPages })}
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
            <DialogTitle>编辑角色</DialogTitle>
            <DialogDescription>修改角色信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">角色名称</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-displayName">显示名称</Label>
              <Input
                id="edit-displayName"
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm({ ...editForm, displayName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">描述</Label>
              <Input
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加角色</DialogTitle>
            <DialogDescription>创建新角色</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">角色名称 *</Label>
              <Input
                id="create-name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm({ ...createForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-displayName">显示名称</Label>
              <Input
                id="create-displayName"
                value={createForm.displayName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, displayName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">描述</Label>
              <Input
                id="create-description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
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
              确定要删除角色 &quot;{selectedRole?.displayName || selectedRole?.name}&quot;
              吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>分配权限</DialogTitle>
            <DialogDescription>
              为角色 &quot;{selectedRole?.displayName || selectedRole?.name}&quot;
              分配权限
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {permissions.map((permission) => (
              <div key={permission.id} className="flex items-center gap-2">
                <Checkbox
                  id={`permission-${permission.id}`}
                  checked={selectedPermissions.includes(permission.id)}
                  onCheckedChange={() => togglePermission(permission.id)}
                />
                <Label
                  htmlFor={`permission-${permission.id}`}
                  className="cursor-pointer"
                >
                  {permission.name}
                  {permission.description && (
                    <span className="text-muted-foreground text-sm ml-1">
                      - {permission.description}
                    </span>
                  )}
                </Label>
              </div>
            ))}
            {permissions.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                暂无权限数据
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPermissionsDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handlePermissionsSubmit}
              disabled={assignPermissionsMutation.isPending}
            >
              {assignPermissionsMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
