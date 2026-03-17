'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from '@/i18n';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/i18n';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userControllerLogin } from '@/api/sdk.gen';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ROUTES } from '@/config/constants';
import { toast } from 'sonner';

const loginSchema = z.object({
  account: z.string().min(1, 'validation.enterUsernameOrEmail'),
  password: z.string().min(6, 'validation.passwordMinLength'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const t = useTranslations('auth');
  const tToast = useTranslations('toast');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      account: '',
      password: '',
    },
  });

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      const redirect = searchParams.get('redirect') || ROUTES.HOME;
      router.replace(redirect);
    }
  }, [isAuthLoading, isAuthenticated, router, searchParams]);

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await userControllerLogin({
        body: {
          account: values.account,
          password: values.password,
        },
      });

      if (response.data?.data) {
        const { token, refreshToken } = response.data.data;
        await login(token, refreshToken);
        toast.success(tToast('loginSuccess'));
        const redirect = searchParams.get('redirect') || ROUTES.HOME;
        
        // 使用 window.location.href 刷新页面的原因：
        // 1. 确保拦截器重新读取最新的认证信息
        // 2. 清空React Query缓存，避免显示旧数据
        // 3. 重新执行SSR，获取需要认证的完整数据
        // 4. 确保所有组件状态重置
        window.location.href = redirect;
      } else {
        toast.error(response.data?.message || tToast('loginFailed'));
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(tToast('loginFailedCheck'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-pulse">{t('loggingIn')}</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">{t('login')}</CardTitle>
        <CardDescription className="text-center">
          {t('loginDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="account"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('usernameOrEmail')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('enterUsernameOrEmail')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('password')}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={t('enterPassword')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t('loggingIn') : t('login')}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-sm text-muted-foreground text-center">
          {t('noAccount')}{' '}
          <Link href={ROUTES.REGISTER} className="text-primary hover:underline">
            {t('registerNow')}
          </Link>
        </div>
        <Link 
          href="/forgot-password" 
          className="text-sm text-muted-foreground hover:text-foreground text-center"
        >
          {t('forgotPassword')}
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  const tCommon = useTranslations('common');
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Suspense fallback={<div className="animate-pulse">{tCommon('loading')}</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
