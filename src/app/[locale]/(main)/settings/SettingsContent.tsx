'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation } from '@tanstack/react-query';
import { userControllerChangePassword, userControllerGetUserConfig, userControllerUpdateUserConfig } from '@/api/sdk.gen';
import Link from 'next/link';
import { Crown, Bell, Shield, Moon, Sun, Monitor, LogOut, Loader2, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
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

interface UserConfig {
  enableSystemNotification?: boolean;
  enableCommentNotification?: boolean;
  enableLikeNotification?: boolean;
}

export default function SettingsContent() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [notificationSettings, setNotificationSettings] = useState<UserConfig>({
    enableSystemNotification: true,
    enableCommentNotification: true,
    enableLikeNotification: true,
  });

  const { data: userConfig } = useQuery({
    queryKey: ['user-config'],
    queryFn: async () => {
      const response = await userControllerGetUserConfig();
      return response.data?.data as UserConfig | undefined;
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (userConfig) {
      setNotificationSettings({
        enableSystemNotification: userConfig.enableSystemNotification ?? true,
        enableCommentNotification: userConfig.enableCommentNotification ?? true,
        enableLikeNotification: userConfig.enableLikeNotification ?? true,
      });
    }
  }, [userConfig]);

  const updateConfigMutation = useMutation({
    mutationFn: async (data: UserConfig) => {
      const response = await userControllerUpdateUserConfig({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success('设置已保存');
    },
    onError: (error: any) => {
      toast.error(error?.message || '保存失败');
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { oldPassword: string; newPassword: string }) => {
      const response = await userControllerChangePassword({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success('密码修改成功');
      setShowPasswordDialog(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(error?.message || '密码修改失败');
    },
  });

  const handleNotificationChange = (key: keyof UserConfig, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    updateConfigMutation.mutate(newSettings);
  };

  const handlePasswordSubmit = () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error('请填写完整信息');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('新密码长度至少6位');
      return;
    }
    updatePasswordMutation.mutate({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    });
  };

  if (isAuthLoading) {
    return (
      <div className="container py-6 max-w-2xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 bg-muted rounded" />
          <div className="h-40 w-full bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-6 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>请先登录</CardTitle>
            <CardDescription>登录后查看设置</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button>去登录</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      <div className="space-y-6">
        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              账户安全
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">修改密码</p>
                <p className="text-sm text-muted-foreground">定期更换密码可以保护账户安全</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPasswordDialog(true)}>
                修改
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">绑定手机</p>
                <p className="text-sm text-muted-foreground">
                  {user?.phone ? `已绑定 ${user.phone}` : '未绑定'}
                </p>
              </div>
              <Button variant="outline" size="sm">
                {user?.phone ? '更换' : '绑定'}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">绑定邮箱</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email ? `已绑定 ${user.email}` : '未绑定'}
                </p>
              </div>
              <Button variant="outline" size="sm">
                {user?.email ? '更换' : '绑定'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* VIP */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5" />
              会员
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/vip" className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-muted cursor-pointer">
              <div>
                <p className="font-medium">会员中心</p>
                <p className="text-sm text-muted-foreground">查看会员权益和续费</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              偏好设置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'light' && <Sun className="h-5 w-5" />}
                {theme === 'dark' && <Moon className="h-5 w-5" />}
                {theme === 'system' && <Monitor className="h-5 w-5" />}
                <div>
                  <p className="font-medium">外观模式</p>
                  <p className="text-sm text-muted-foreground">
                    {theme === 'light' && '浅色模式'}
                    {theme === 'dark' && '深色模式'}
                    {theme === 'system' && '跟随系统'}
                  </p>
                </div>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>浅色</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span>深色</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>系统</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">系统通知</p>
                <p className="text-sm text-muted-foreground">接收系统消息和公告</p>
              </div>
              <Switch 
                checked={notificationSettings.enableSystemNotification}
                onCheckedChange={(checked) => handleNotificationChange('enableSystemNotification', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">评论通知</p>
                <p className="text-sm text-muted-foreground">有人评论时通知我</p>
              </div>
              <Switch 
                checked={notificationSettings.enableCommentNotification}
                onCheckedChange={(checked) => handleNotificationChange('enableCommentNotification', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">点赞通知</p>
                <p className="text-sm text-muted-foreground">有人点赞时通知我</p>
              </div>
              <Switch 
                checked={notificationSettings.enableLikeNotification}
                onCheckedChange={(checked) => handleNotificationChange('enableLikeNotification', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">关于</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">版本</p>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </div>
            <Separator />
            <div className="flex items-center justify-between cursor-pointer">
              <p className="font-medium">用户协议</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <Separator />
            <div className="flex items-center justify-between cursor-pointer">
              <p className="font-medium">隐私政策</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <Separator />
            <div className="flex items-center justify-between cursor-pointer">
              <p className="font-medium">联系客服</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Button 
          variant="destructive" 
          className="w-full" 
          onClick={logout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          退出登录
        </Button>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>请输入旧密码和新密码</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">旧密码</Label>
              <Input 
                id="oldPassword" 
                type="password" 
                value={passwordForm.oldPassword} 
                onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))} 
                placeholder="输入旧密码" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input 
                id="newPassword" 
                type="password" 
                value={passwordForm.newPassword} 
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))} 
                placeholder="输入新密码（至少6位）" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                value={passwordForm.confirmPassword} 
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))} 
                placeholder="再次输入新密码" 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>取消</Button>
            <Button onClick={handlePasswordSubmit} disabled={updatePasswordMutation.isPending}>
              {updatePasswordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
