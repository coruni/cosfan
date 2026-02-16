'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Link } from '@/i18n';
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
  account: z.string().min(1, '请输入用户名或邮箱'),
  password: z.string().min(6, '密码至少6位'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
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
        toast.success('登录成功');
        const redirect = searchParams.get('redirect') || ROUTES.HOME;
        router.push(redirect);
      } else {
        toast.error(response.data?.message || '登录失败');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('登录失败，请检查账号密码');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-pulse">加载中...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
        <CardDescription className="text-center">
          输入您的账号信息登录
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
                  <FormLabel>用户名/邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入用户名或邮箱" {...field} />
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
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="请输入密码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? '登录中...' : '登录'}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="text-sm text-muted-foreground text-center">
          还没有账号？{' '}
          <Link href={ROUTES.REGISTER} className="text-primary hover:underline">
            立即注册
          </Link>
        </div>
        <Link 
          href="/forgot-password" 
          className="text-sm text-muted-foreground hover:text-foreground text-center"
        >
          忘记密码？
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Suspense fallback={<div className="animate-pulse">加载中...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
