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
import { Link, usePathname, useRouter } from '@/i18n';
import { useTranslations } from 'next-intl';
import { Crown, Bell, Shield, Moon, Sun, Monitor, LogOut, Loader2, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useLocale } from 'next-intl';
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
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tToast = useTranslations('toast');
  const tAuth = useTranslations('auth');
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
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
      toast.success(tToast('settingsSaved'));
    },
    onError: (error: any) => {
      toast.error(error?.message || tToast('updateFailed'));
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { oldPassword: string; newPassword: string }) => {
      const response = await userControllerChangePassword({ body: data });
      return response.data;
    },
    onSuccess: () => {
      toast.success(tToast('passwordChanged'));
      setShowPasswordDialog(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error: any) => {
      toast.error(error?.message || tToast('passwordChangeFailed'));
    },
  });

  const handleNotificationChange = (key: keyof UserConfig, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    updateConfigMutation.mutate(newSettings);
  };

  const handlePasswordSubmit = () => {
    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      toast.error(t('validation.fillComplete'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t('validation.passwordMismatch'));
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error(t('validation.newPasswordMinLength'));
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
            <CardTitle>{tAuth('pleaseLogin')}</CardTitle>
            <CardDescription>{tAuth('loginToViewSettings')}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button>{tAuth('goLogin')}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <div className="space-y-6">
        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t('accountSecurity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('changePassword')}</p>
                <p className="text-sm text-muted-foreground">{t('changePasswordDesc')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPasswordDialog(true)}>
                {t('edit')}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('bindPhone')}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.phone ? t('phoneBound', { phone: user.phone }) : t('notBound')}
                </p>
              </div>
              <Button variant="outline" size="sm">
                {user?.phone ? t('change') : t('bind')}
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('bindEmail')}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.email ? t('phoneBound', { phone: user.email }) : t('notBound')}
                </p>
              </div>
              <Button variant="outline" size="sm">
                {user?.email ? t('change') : t('bind')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* VIP */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5" />
              {t('membership')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/vip" className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-muted cursor-pointer">
              <div>
                <p className="font-medium">{t('vipCenter')}</p>
                <p className="text-sm text-muted-foreground">{t('vipCenterDesc')}</p>
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
              {t('preferences')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {mounted && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span suppressHydrationWarning className="inline-flex">
                    {theme === 'light' && <Sun className="h-5 w-5" />}
                    {theme === 'dark' && <Moon className="h-5 w-5" />}
                    {theme === 'system' && <Monitor className="h-5 w-5" />}
                  </span>
                  <div>
                    <p className="font-medium">{t('theme')}</p>
                    <p className="text-sm text-muted-foreground">
                      {theme === 'light' && t('themeLight')}
                      {theme === 'dark' && t('themeDark')}
                      {theme === 'system' && t('themeSystem')}
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
                        <span>{t('light')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        <span>{t('dark')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <span>{t('system')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('nav.language') || 'Language'}</p>
              <p className="text-sm text-muted-foreground">
                {locale === 'zh' ? '简体中文' : 'English'}
              </p>
            </div>
            <Select
              value={locale}
              onValueChange={(value) => {
                router.push(pathname, { locale: value as any });
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zh">简体中文</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('systemNotification')}</p>
                <p className="text-sm text-muted-foreground">{t('systemNotificationDesc')}</p>
              </div>
              <Switch
                checked={notificationSettings.enableSystemNotification}
                onCheckedChange={(checked) => handleNotificationChange('enableSystemNotification', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('commentNotification')}</p>
                <p className="text-sm text-muted-foreground">{t('commentNotificationDesc')}</p>
              </div>
              <Switch
                checked={notificationSettings.enableCommentNotification}
                onCheckedChange={(checked) => handleNotificationChange('enableCommentNotification', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t('likeNotification')}</p>
                <p className="text-sm text-muted-foreground">{t('likeNotificationDesc')}</p>
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
            <CardTitle className="text-lg">{t('about')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-medium">{t('version')}</p>
              <p className="text-sm text-muted-foreground">1.0.0</p>
            </div>
            <Separator />
            <Link href="/user-agreement" className="flex items-center justify-between cursor-pointer hover:bg-muted p-2 -mx-2 rounded-lg">
              <p className="font-medium">{t('userAgreement')}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Separator />
            <Link href="/privacy-policy" className="flex items-center justify-between cursor-pointer hover:bg-muted p-2 -mx-2 rounded-lg">
              <p className="font-medium">{t('privacyPolicy')}</p>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Separator />
            <div className="flex items-center justify-between cursor-pointer">
              <p className="font-medium">{t('contactSupport')}</p>
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
          {tAuth('logout')}
        </Button>
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('changePassword')}</DialogTitle>
            <DialogDescription>{t('changePasswordDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="oldPassword">{t('oldPassword')}</Label>
              <Input
                id="oldPassword"
                type="password"
                value={passwordForm.oldPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                placeholder={t('enterOldPassword')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder={t('enterNewPassword')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder={t('enterNewPasswordAgain')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>{tCommon('cancel')}</Button>
            <Button onClick={handlePasswordSubmit} disabled={updatePasswordMutation.isPending}>
              {updatePasswordMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('confirmChange')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
