'use client';

import { useMutation } from '@tanstack/react-query';
import { orderControllerCreateMembershipOrder, paymentControllerCreatePayment } from '@/api/sdk.gen';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star, Loader2, CreditCard, CheckCircle, ExternalLink, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from '@/i18n';
import { toast } from 'sonner';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
import { isStrictBrowser, getBrowserName } from '@/hooks/useSafePaymentRedirect';

const VIP_FEATURES = [
  'features.unlimitedBrowse',
  'features.hdDownload',
  'features.vipBadge',
  'features.prioritySupport',
  'features.exclusiveContent',
  'features.adFree',
];

interface VipPlan {
  id: string;
  nameKey: 'monthly' | 'quarterly' | 'halfYear' | 'yearly' | 'lifetime';
  priceKey: 'membership_price_1m' | 'membership_price_3m' | 'membership_price_6m' | 'membership_price_12m' | 'membership_price_lifetime';
  periodKey: 'month' | 'quarter' | 'halfYear' | 'year' | 'lifetime';
  popular: boolean;
  discountKey?: 'lifetime';
}

const VIP_PLANS: VipPlan[] = [
  { id: '1m', nameKey: 'monthly', priceKey: 'membership_price_1m', periodKey: 'month', popular: false },
  { id: '3m', nameKey: 'quarterly', priceKey: 'membership_price_3m', periodKey: 'quarter', popular: true, },
  { id: '6m', nameKey: 'halfYear', priceKey: 'membership_price_6m', periodKey: 'halfYear', popular: false,},
  { id: '12m', nameKey: 'yearly', priceKey: 'membership_price_12m', periodKey: 'year', popular: false, },
  { id: 'lifetime', nameKey: 'lifetime', priceKey: 'membership_price_lifetime', periodKey: 'lifetime', popular: false, discountKey: 'lifetime' },
];

interface PaymentMethod {
  value: string;
  label: string;
  icon: string;
}

interface EpayType {
  value: string;
  label: string;
  icon: string;
}

interface VIPClientProps {
  config: Record<string, unknown>;
}

export function VIPClient({ config }: VIPClientProps) {
  const { isAuthenticated, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const t = useTranslations('vip');
  const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // 过滤价格为0的套餐
  const availablePlans = useMemo(() => {
    return VIP_PLANS.filter(plan => ((config[plan.priceKey] as number) || 0) > 0);
  }, [config]);

  // 获取套餐价格
  const getPrice = useCallback((plan: VipPlan): number => {
    return (config[plan.priceKey] as number) || 0;
  }, [config]);

  // 根据套餐数量动态计算 grid 列数（Tailwind 需要预定义类名）
  const planGridCols = useMemo(() => {
    const count = availablePlans.length;
    // 预定义的 grid 类名映射
    const gridMap: Record<number, string> = {
      1: 'grid-cols-1 md:grid-cols-1 lg:grid-cols-1',
      2: 'grid-cols-2 md:grid-cols-2 lg:grid-cols-2',
      3: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3',
      4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
      5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    };
    return gridMap[count] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';
  }, [availablePlans.length]);

  // 从 config 中获取可用的支付方式
  const availablePaymentMethods = useMemo<PaymentMethod[]>(() => {
    const methods: PaymentMethod[] = [];

    if (config.payment_alipay_enabled) {
      methods.push({ value: 'ALIPAY', label: t('paymentMethod.alipay'), icon: '💳' });
    }
    if (config.payment_wechat_enabled) {
      methods.push({ value: 'WECHAT', label: t('paymentMethod.wechat'), icon: '💚' });
    }
    if (config.payment_epay_enabled) {
      methods.push({ value: 'EPAY', label: t('paymentMethod.epay'), icon: '🔐' });
    }

    return methods;
  }, [config, t]);

  // 从 config 中获取可用的易支付类型
  const availableEpayTypes = useMemo<EpayType[]>(() => {
    const types: EpayType[] = [];

    if (config.payment_epay_alipay_enabled) {
      types.push({ value: 'alipay', label: t('epayType.alipay'), icon: '💳' });
    }
    if (config.payment_epay_wxpay_enabled) {
      types.push({ value: 'wxpay', label: t('epayType.wxpay'), icon: '💚' });
    }
    if (config.payment_epay_usdt_enabled) {
      types.push({ value: 'usdt', label: t('epayType.usdt'), icon: '💵' });
    }

    return types;
  }, [config, t]);

  // 使用第一个可用的支付方式作为默认值
  const defaultPaymentMethod = availablePaymentMethods[0]?.value || 'ALIPAY';
  const defaultEpayType = availableEpayTypes[0]?.value || 'alipay';

  const [paymentMethod, setPaymentMethod] = useState<string>(defaultPaymentMethod);
  const [epayType, setEpayType] = useState<string>(defaultEpayType);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      // 使用 requestAnimationFrame 避免同步 setState
      requestAnimationFrame(() => {
        setShowSuccessDialog(true);
        refreshUser();
        window.history.replaceState({}, '', '/vip');
      });
    }
  }, [searchParams, refreshUser]);

  const createOrderMutation = useMutation({
    mutationFn: async (plan: string) => {
      const response = await orderControllerCreateMembershipOrder({ body: { plan } });
      return response.data;
    },
    onSuccess: (data) => {
      const orderId = data?.data?.data?.id;
      if (orderId) {
        toast.success(t('toast.orderCreating'));
        createPaymentMutation.mutate({ orderId, paymentMethod, epayType });
      } else {
        toast.error(t('toast.orderCreateFailed'));
      }
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err?.message || t('toast.createOrderFailed'));
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: async ({ orderId, paymentMethod, epayType }: { orderId: number; paymentMethod: string; epayType?: string }) => {
      const response = await paymentControllerCreatePayment({
        body: {
          orderId,
          paymentMethod: paymentMethod as 'ALIPAY' | 'WECHAT' | 'BALANCE' | 'EPAY',
          type: paymentMethod === 'EPAY' ? (epayType as 'wxpay' | 'alipay' | 'usdt') : undefined,
          returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/vip?success=true` : undefined,
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setShowPaymentDialog(false);
      const paymentUrl = data?.data?.data?.paymentUrl;

      if (paymentUrl) {
        // 检测是否为严格浏览器（Safari、iOS等）
        const isStrict = isStrictBrowser();

        if (!isStrict) {
          // 非严格浏览器，在新标签页打开
          window.open(paymentUrl, '_blank', 'noopener,noreferrer');
        } else {
          // 严格浏览器，显示提示对话框让用户确认
          setPaymentRedirectUrl(paymentUrl);
          setShowRedirectDialog(true);
        }
      } else {
        toast.success(t('toast.paymentCreated'));
      }
    },
    onError: (error: unknown) => {
      const err = error as { message?: string };
      toast.error(err?.message || t('toast.createPaymentFailed'));
    },
  });

  // Safari/严格浏览器兼容：支付跳转相关状态
  const [paymentRedirectUrl, setPaymentRedirectUrl] = useState<string | null>(null);
  const [showRedirectDialog, setShowRedirectDialog] = useState(false);
  const [browserName, setBrowserName] = useState('Browser');

  // 在客户端获取浏览器名称，避免 hydration 不匹配
  useEffect(() => {
    requestAnimationFrame(() => {
      setBrowserName(getBrowserName());
    });
  }, []);

  // Safari/严格浏览器兼容：在新标签页打开
  const handleOpenInNewTab = useCallback(() => {
    if (paymentRedirectUrl) {
      window.open(paymentRedirectUrl, '_blank', 'noopener,noreferrer');
      setShowRedirectDialog(false);
    }
  }, [paymentRedirectUrl, setShowRedirectDialog]);

  // Safari/严格浏览器兼容：复制链接
  const handleCopyPaymentLink = useCallback(async () => {
    if (paymentRedirectUrl) {
      try {
        await navigator.clipboard.writeText(paymentRedirectUrl);
        toast.success(t('toast.linkCopied'));
        setShowRedirectDialog(false);
      } catch {
        toast.error(t('toast.copyFailed'));
      }
    }
  }, [paymentRedirectUrl, t, setShowRedirectDialog]);

  const handlePurchase = (plan: VipPlan) => {
    if (!isAuthenticated) {
      toast.error(t('toast.pleaseLogin'));
      return;
    }
    setSelectedPlan(plan);
    // 每次打开对话框时，重置为第一个可用的支付方式
    if (availablePaymentMethods.length > 0) {
      setPaymentMethod(availablePaymentMethods[0].value);
    }
    if (availableEpayTypes.length > 0) {
      setEpayType(availableEpayTypes[0].value);
    }
    setShowPaymentDialog(true);
  };

  const confirmPurchase = () => {
    if (!selectedPlan) return;
    createOrderMutation.mutate(selectedPlan.id);
  };

  const isProcessing = createOrderMutation.isPending || createPaymentMutation.isPending;

  return (
    <>
      <div className="space-y-8">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            <Crown className="h-3 w-3 mr-1" />
            {t('title')}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('unlockMore')}</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('becomeVipDesc')}
          </p>
        </div>

        <div className={`grid ${planGridCols} gap-4 max-w-6xl mx-auto`}>
          {availablePlans.map((plan) => {
            const price = getPrice(plan);
            return (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      {t('popular')}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{t(`plans.${plan.nameKey}`)}</CardTitle>
                  <CardDescription>
                    {plan.discountKey && <Badge variant="destructive" className="text-xs">{t(`discount.${plan.discountKey}`)}</Badge>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-2">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">¥{price}</span>
                    {plan.periodKey !== 'lifetime' && <span className="text-muted-foreground text-sm">/{t(`period.${plan.periodKey}`)}</span>}
                  </div>
                  <ul className="space-y-1 text-xs text-left">
                    {VIP_FEATURES.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span>{t(feature)}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-0">
                  {isAuthenticated ? (
                    <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} size="sm" onClick={() => handlePurchase(plan)} disabled={isProcessing}>
                      {t('openNow')}
                    </Button>
                  ) : (
                    <Link href="/login" className="w-full">
                      <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} size="sm">{t('loginToOpen')}</Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">{t('benefits')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {VIP_FEATURES.map((feature, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{t(feature)}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {t('selectPayment')}
            </DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <span>{t('willOpenPlan', { plan: t(`plans.${selectedPlan.nameKey}`), price: getPrice(selectedPlan) })}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('paymentChannel')}</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder={t('selectPaymentMethod')} /></SelectTrigger>
                <SelectContent>
                  {availablePaymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <span className="flex items-center gap-2"><span>{method.icon}</span><span>{method.label}</span></span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {paymentMethod === 'EPAY' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('paymentType')}</label>
                <Select value={epayType} onValueChange={setEpayType}>
                  <SelectTrigger><SelectValue placeholder={t('selectPaymentType')} /></SelectTrigger>
                  <SelectContent>
                    {availableEpayTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <span className="flex items-center gap-2"><span>{type.icon}</span><span>{type.label}</span></span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>{t('cancel')}</Button>
            <Button onClick={confirmPurchase} disabled={isProcessing}>
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('confirmPayment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-8 w-8" />
              {t('paymentSuccess')}
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              {t('paymentSuccessDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <Crown className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">{t('backToHome')}</Button>
            </Link>
            <Link href="/profile" className="w-full sm:w-auto">
              <Button className="w-full">{t('viewStatus')}</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Safari/严格浏览器兼容：支付跳转提示对话框 */}
      <Dialog open={showRedirectDialog} onOpenChange={setShowRedirectDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              {t('redirectDialog.title')}
            </DialogTitle>
            <DialogDescription className="pt-2">
              {t('redirectDialog.description', { browser: browserName })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              {t('redirectDialog.linkLabel')}：<code className="text-xs bg-muted px-1 py-0.5 rounded">{paymentRedirectUrl?.substring(0, 50)}...</code>
            </p>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleCopyPaymentLink}
              className="w-full sm:w-auto"
            >
              <Copy className="h-4 w-4 mr-2" />
              {t('redirectDialog.copyLink')}
            </Button>
            <Button
              onClick={handleOpenInNewTab}
              className="w-full sm:w-auto"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('redirectDialog.openNewTab')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
