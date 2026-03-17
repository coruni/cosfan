'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/i18n';
import { Link } from '@/i18n';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { configControllerGetPublicConfigs, userControllerRegisterUser, userControllerSendVerificationCode } from '@/api/sdk.gen';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ROUTES } from '@/config/constants';
import { toast } from 'sonner';

const registerSchema = z.object({
  username: z.string().min(3, 'validation.usernameMinLength').max(20, 'validation.usernameMaxLength'),
  email: z.string().email('validation.validEmail'),
  password: z.string().min(6, 'validation.passwordMinLength').max(50, 'validation.passwordMaxLength'),
  confirmPassword: z.string(),
  // 是否必填由公共配置 user_email_verification 控制，这里先设为可选
  code: z.string().optional(),
  inviteCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'validation.passwordMismatch',
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const tAuth = useTranslations('auth');
  const tToast = useTranslations('toast');
  const tValidation = useTranslations('validation');
  const tCommon = useTranslations('common');
  const { login, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [configLoading, setConfigLoading] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [inviteRequired, setInviteRequired] = useState(false);
  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      code: '',
      inviteCode: '',
    },
  });

  useEffect(() => {
    let mounted = true;

    async function fetchPublicConfig() {
      try {
        const response = await configControllerGetPublicConfigs();
        const data = response.data?.data;

        if (!mounted || !data) return;

        // 是否允许注册
        setRegistrationEnabled(data.user_registration_enabled !== false);
        // 是否启用并强制邀请码
        setInviteRequired(Boolean(data.invite_code_enabled && data.invite_code_required));
        // 是否启用邮箱验证码
        setEmailVerificationRequired(Boolean(data.user_email_verification));
      } catch (error) {
        console.error('Failed to fetch public config:', error);
      } finally {
        if (mounted) {
          setConfigLoading(false);
        }
      }
    }

    fetchPublicConfig();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) {
      router.replace(ROUTES.HOME);
    }
  }, [isAuthLoading, isAuthenticated, router]);

  const sendCode = async () => {
    const email = form.getValues('email');
    if (!email || !z.string().email().safeParse(email).success) {
      toast.error(tValidation('validEmail'));
      return;
    }

    setIsSendingCode(true);
    try {
      const response = await userControllerSendVerificationCode({
        body: {
          email,
          type: 'register',
        },
      });

      if (response.data) {
        toast.success(tToast('codeSent'));
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(tToast('sendFailed'));
      }
    } catch (error) {
      console.error('Send code error:', error);
      toast.error(tToast('sendCodeFailed'));
    } finally {
      setIsSendingCode(false);
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    if (emailVerificationRequired && (!values.code || values.code.length !== 6)) {
      form.setError('code', {
        type: 'required',
        message: tAuth('emailCodeRequired'),
      });
      return;
    }

    if (inviteRequired && !values.inviteCode) {
      form.setError('inviteCode', {
        type: 'required',
        message: tAuth('enterInviteCode'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const body: Record<string, unknown> = {
        username: values.username,
        email: values.email,
        password: values.password,
      };

      if (emailVerificationRequired && values.code) {
        body.code = values.code;
      }

      if (values.inviteCode) {
        body.inviteCode = values.inviteCode;
      }

      const response = await userControllerRegisterUser({
        body,
      });

      if (response.data?.data) {
        const { token, refreshToken } = response.data.data;
        await login(token, refreshToken);
        toast.success(tToast('registerSuccess'));
        // 使用 window.location.href 刷新页面，确保拦截器重新初始化
        window.location.href = ROUTES.HOME;
      } else {
        toast.error(tToast('registerFailed'));
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error(tToast('registerFailedRetry'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-pulse">{tCommon('loading')}</div>
      </div>
    );
  }

  if (!registrationEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center text-muted-foreground">
          {tAuth('registrationClosed')}
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">{tAuth('register')}</CardTitle>
          <CardDescription className="text-center">
            {tAuth('registerDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuth('username')}</FormLabel>
                    <FormControl>
                      <Input placeholder={tAuth('enterUsername')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuth('email')}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder={tAuth('enterEmail')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {emailVerificationRequired && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tAuth('verificationCode')}</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder={tAuth('enterCode')} {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={sendCode}
                          disabled={isSendingCode || countdown > 0}
                        >
                          {countdown > 0 ? `${countdown}s` : isSendingCode ? tAuth('sending') : tAuth('sendCode')}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {inviteRequired && (
                <FormField
                  control={form.control}
                  name="inviteCode"
                  render={({ field }) => (
                    <FormItem>
                    <FormLabel>{tAuth('inviteCode')}</FormLabel>
                      <FormControl>
                      <Input placeholder={tAuth('enterInviteCode')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuth('password')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={tAuth('enterPassword')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAuth('confirmPassword')}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={tAuth('enterPasswordAgain')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? tAuth('registering') : tAuth('register')}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <div className="text-sm text-muted-foreground text-center w-full">
            {tAuth('hasAccount')}{' '}
            <Link href={ROUTES.LOGIN} className="text-primary hover:underline">
              {tAuth('loginNow')}
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
