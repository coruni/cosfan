'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  paymentControllerFindUserPayments,
} from '@/api/sdk.gen';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { Search, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Table as UITable, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

type Payment = {
  id: number;
  orderId: number;
  orderNo?: string;
  userId: number;
  amount: number;
  paymentMethod: string;
  paymentOrderNo?: string;
  status: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  user?: {
    id: number;
    username: string;
    nickname: string;
    avatar?: string;
  };
  article?: {
    id: number;
    title: string;
  };
};

type PaymentsResponse = {
  data?: {
    data?: Payment[];
    meta?: { total?: number };
  };
  meta?: { total?: number };
};

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['admin-payments', page, limit, search, statusFilter, methodFilter],
    queryFn: async () => {
      const response = await paymentControllerFindUserPayments({
        query: {
          page,
          limit,
          // userId: Number(search) || undefined,
          // status: statusFilter === 'all' ? undefined : statusFilter,
          // paymentMethod: methodFilter === 'all' ? undefined : methodFilter,
        },
      });
      return response.data as PaymentsResponse;
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const openDetailDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailDialogOpen(true);
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">待支付</Badge>;
      case 'SUCCESS':
      case 'PAID':
        return <Badge variant="default">已支付</Badge>;
      case 'FAILED':
        return <Badge variant="destructive">支付失败</Badge>;
      case 'REFUNDED':
        return <Badge variant="outline">已退款</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">已取消</Badge>;
      default:
        return <Badge variant="outline">{status || '未知'}</Badge>;
    }
  };

  const getMethodLabel = (method?: string) => {
    switch (method) {
      case 'ALIPAY':
        return '支付宝';
      case 'WECHAT':
        return '微信支付';
      case 'BALANCE':
        return '余额';
      case 'EPAY':
        return '易支付';
      default:
        return method || '-';
    }
  };

  const payments = (paymentsData?.data?.data || paymentsData?.data || []) as Payment[];
  const total = paymentsData?.data?.meta?.total || paymentsData?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">支付管理</h1>
          <p className="text-muted-foreground">管理平台所有支付记录</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Input
                placeholder="搜索用户ID..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-[140px] sm:w-[200px]"
              />
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[100px] sm:w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="PENDING">待支付</SelectItem>
                <SelectItem value="SUCCESS">已支付</SelectItem>
                <SelectItem value="FAILED">支付失败</SelectItem>
                <SelectItem value="REFUNDED">已退款</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[100px] sm:w-[120px]">
                <SelectValue placeholder="支付方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部方式</SelectItem>
                <SelectItem value="ALIPAY">支付宝</SelectItem>
                <SelectItem value="WECHAT">微信</SelectItem>
                <SelectItem value="BALANCE">余额</SelectItem>
                <SelectItem value="EPAY">易支付</SelectItem>
              </SelectContent>
            </Select>
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
                      <TableHead>支付单号</TableHead>
                      <TableHead>订单号</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>支付方式</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>支付时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                            {payment.transactionId || payment.paymentOrderNo || payment.id}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {payment.orderNo || payment.orderId}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {payment.user?.nickname || payment.user?.username || `用户ID: ${payment.userId}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium whitespace-nowrap">
                            ¥{Number(payment.amount || 0).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {getMethodLabel(payment.paymentMethod)}
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {payment.paidAt
                            ? new Date(payment.paidAt).toLocaleDateString()
                            : payment.createdAt
                            ? new Date(payment.createdAt).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailDialog(payment)}
                            title="查看详情"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          暂无支付记录
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>支付详情</DialogTitle>
            <DialogDescription>查看支付详细信息</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">支付单号</Label>
                  <p className="text-sm font-mono">
                    {selectedPayment.transactionId || selectedPayment.paymentOrderNo || selectedPayment.id}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">订单号</Label>
                  <p className="text-sm">{selectedPayment.orderNo || selectedPayment.orderId}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">支付金额</Label>
                  <p className="text-lg font-bold">¥{Number(selectedPayment.amount || 0).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">支付状态</Label>
                  <p>{getStatusBadge(selectedPayment.status)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">支付方式</Label>
                  <p className="text-sm">{getMethodLabel(selectedPayment.paymentMethod)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">用户ID</Label>
                  <p className="text-sm">{selectedPayment.userId}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">创建时间</Label>
                  <p className="text-sm">
                    {selectedPayment.createdAt ? new Date(selectedPayment.createdAt).toLocaleString() : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">支付时间</Label>
                  <p className="text-sm">
                    {selectedPayment.paidAt ? new Date(selectedPayment.paidAt).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
              {selectedPayment.paymentOrderNo && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">第三方订单号</Label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">
                    {selectedPayment.paymentOrderNo}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}