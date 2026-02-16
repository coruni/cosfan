'use client';

import { useMutation } from '@tanstack/react-query';
import { orderControllerCreateMembershipOrder, paymentControllerCreatePayment } from '@/api/sdk.gen';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star, Loader2, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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

const VIP_FEATURES = [
  '无限浏览所有内容',
  '高清原图下载',
  '专属VIP标识',
  '优先客服支持',
  '独家内容抢先看',
  '无广告体验',
];

interface VipPlan {
  id: string;
  name: string;
  priceKey: 'membership_price_1m' | 'membership_price_3m' | 'membership_price_6m' | 'membership_price_12m' | 'membership_price_lifetime';
  period: string;
  popular: boolean;
  discount?: string;
}

const VIP_PLANS: VipPlan[] = [
  { id: '1m', name: '月度会员', priceKey: 'membership_price_1m', period: '月', popular: false },
  { id: '3m', name: '季度会员', priceKey: 'membership_price_3m', period: '季', popular: true, discount: '省10%' },
  { id: '6m', name: '半年会员', priceKey: 'membership_price_6m', period: '半年', popular: false, discount: '省15%' },
  { id: '12m', name: '年度会员', priceKey: 'membership_price_12m', period: '年', popular: false, discount: '省20%' },
  { id: 'lifetime', name: '永久会员', priceKey: 'membership_price_lifetime', period: '永久', popular: false, discount: '一次付费永久享用' },
];

const PAYMENT_METHODS = [
  { value: 'ALIPAY', label: '支付宝', icon: '💳' },
  { value: 'WECHAT', label: '微信支付', icon: '💚' },
  { value: 'EPAY', label: '易支付', icon: '🔐' },
];

const EPAY_TYPES = [
  { value: 'alipay', label: '支付宝', icon: '💳' },
  { value: 'wxpay', label: '微信支付', icon: '💚' },
  { value: 'usdt', label: 'USDT', icon: '💵' },
];

interface VIPClientProps {
  config: Record<string, unknown>;
}

export function VIPClient({ config }: VIPClientProps) {
  const { isAuthenticated, refreshUser } = useAuth();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState<VipPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('ALIPAY');
  const [epayType, setEpayType] = useState<string>('alipay');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setShowSuccessDialog(true);
      refreshUser();
      window.history.replaceState({}, '', '/vip');
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
        createPaymentMutation.mutate({ orderId, paymentMethod, epayType });
      } else {
        toast.error('订单创建失败，请重试');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || '创建订单失败');
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
      if (data?.data?.data?.paymentUrl) {
        window.location.href = data.data.data.paymentUrl;
      } else {
        toast.success('支付创建成功');
      }
    },
    onError: (error: any) => {
      toast.error(error?.message || '创建支付失败');
    },
  });

  const handlePurchase = (plan: VipPlan) => {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const confirmPurchase = () => {
    if (!selectedPlan) return;
    createOrderMutation.mutate(selectedPlan.id);
  };

  const getPrice = (plan: VipPlan): number => {
    return (config[plan.priceKey] as number) || 0;
  };

  const isProcessing = createOrderMutation.isPending || createPaymentMutation.isPending;

  return (
    <>
      <div className="space-y-8">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            <Crown className="h-3 w-3 mr-1" />
            VIP会员
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">解锁更多精彩内容</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            成为VIP会员，享受专属权益，畅享海量高清图集
          </p>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {VIP_PLANS.map((plan) => {
            const price = getPrice(plan);
            return (
              <Card key={plan.id} className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">
                      <Star className="h-3 w-3 mr-1" />
                      最受欢迎
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.discount && <Badge variant="destructive" className="text-xs">{plan.discount}</Badge>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-2">
                  <div className="mb-4">
                    <span className="text-3xl font-bold">¥{price}</span>
                    {plan.period !== '永久' && <span className="text-muted-foreground text-sm">/{plan.period}</span>}
                  </div>
                  <ul className="space-y-1 text-xs text-left">
                    {VIP_FEATURES.slice(0, 4).map((feature, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-0">
                  {isAuthenticated ? (
                    <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} size="sm" onClick={() => handlePurchase(plan)} disabled={isProcessing}>
                      立即开通
                    </Button>
                  ) : (
                    <Link href="/login" className="w-full">
                      <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} size="sm">登录后开通</Button>
                    </Link>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">会员权益</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {VIP_FEATURES.map((feature, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">{feature}</span>
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
              选择支付方式
            </DialogTitle>
            <DialogDescription>
              {selectedPlan && (
                <span>您将开通 <strong>{selectedPlan.name}</strong>，需支付 <strong>¥{getPrice(selectedPlan)}</strong></span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">支付渠道</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="选择支付方式" /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <span className="flex items-center gap-2"><span>{method.icon}</span><span>{method.label}</span></span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {paymentMethod === 'EPAY' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">支付类型</label>
                <Select value={epayType} onValueChange={setEpayType}>
                  <SelectTrigger><SelectValue placeholder="选择支付类型" /></SelectTrigger>
                  <SelectContent>
                    {EPAY_TYPES.map((type) => (
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
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>取消</Button>
            <Button onClick={confirmPurchase} disabled={isProcessing}>
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认支付
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
              支付成功
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              恭喜您已成为VIP会员，现在可以享受所有会员权益！
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <Crown className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">返回首页</Button>
            </Link>
            <Link href="/profile" className="w-full sm:w-auto">
              <Button className="w-full">查看会员状态</Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
