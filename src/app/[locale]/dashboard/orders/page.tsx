'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  orderControllerGetAllOrders,
  orderControllerCancelOrder,
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
import { Search, Eye, Loader2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Table as UITable, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

type Order = {
  id: number;
  userId: number;
  authorId: number;
  articleId: unknown;
  orderNo: string;
  type: string;
  title: string;
  amount: string;
  paymentMethod: unknown;
  paymentOrderNo: unknown;
  status: string;
  paidAt: unknown;
  details: {
    plan: string;
    duration: number;
    basePrice: number;
    isLifetime: boolean;
    totalAmount: number;
    membershipName: string;
    membershipLevel: number;
    remark?: string;
  };
  remark: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['admin-orders', page, limit, search, statusFilter, typeFilter],
    queryFn: async () => {
      const response = await orderControllerGetAllOrders({
        query: {
          page,
          limit,
          userId: Number(search) || undefined,
          status: statusFilter && statusFilter !== 'ALL' ? statusFilter as any : undefined,
          type: typeFilter && typeFilter !== 'ALL' ? typeFilter as any : undefined,
        },
      });
      return response.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await orderControllerCancelOrder({ path: { id: String(id) } });
      return response.data;
    },
    onSuccess: () => {
      toast.success('订单已取消');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setCancelDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || '取消失败');
    },
  });

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const openDetailDialog = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const openCancelDialog = (order: Order) => {
    setSelectedOrder(order);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (!selectedOrder) return;
    cancelMutation.mutate(selectedOrder.id);
  };

  const orders: Order[] = (ordersData as any)?.data?.data || [];
  const total = (ordersData as any)?.data?.meta?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">待支付</Badge>;
      case 'PAID':
        return <Badge variant="default">已支付</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">已取消</Badge>;
      case 'REFUNDED':
        return <Badge variant="destructive">已退款</Badge>;
      case 'EXPIRED':
        return <Badge variant="outline">已过期</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getTypeBadge = (type?: string) => {
    switch (type) {
      case 'ARTICLE':
        return <Badge variant="outline">文章</Badge>;
      case 'MEMBERSHIP':
        return <Badge variant="outline">会员</Badge>;
      case 'PRODUCT':
        return <Badge variant="outline">商品</Badge>;
      case 'SERVICE':
        return <Badge variant="outline">服务</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getPaymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'ALIPAY':
        return '支付宝';
      case 'WECHAT':
        return '微信';
      case 'BALANCE':
        return '余额';
      case 'EPAY':
        return '易支付';
      default:
        return '-';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">订单管理</h1>
          <p className="text-muted-foreground">管理平台所有订单</p>
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
            <Select value={statusFilter || undefined} onValueChange={(v) => { setStatusFilter(v as any); setPage(1); }}>
              <SelectTrigger className="w-[100px] sm:w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="PENDING">待支付</SelectItem>
                <SelectItem value="PAID">已支付</SelectItem>
                <SelectItem value="CANCELLED">已取消</SelectItem>
                <SelectItem value="REFUNDED">已退款</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter || undefined} onValueChange={(v) => { setTypeFilter(v as any); setPage(1); }}>
              <SelectTrigger className="w-[100px] sm:w-[120px]">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部类型</SelectItem>
                <SelectItem value="ARTICLE">文章</SelectItem>
                <SelectItem value="MEMBERSHIP">会员</SelectItem>
                <SelectItem value="PRODUCT">商品</SelectItem>
                <SelectItem value="SERVICE">服务</SelectItem>
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
                      <TableHead>订单号</TableHead>
                      <TableHead>标题</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>金额</TableHead>
                      <TableHead>支付方式</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded whitespace-nowrap">
                            {order.orderNo}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm truncate max-w-[150px] block">
                            {order.title}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(order.type)}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium whitespace-nowrap">¥{Number(order.amount || 0).toFixed(2)}</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{getPaymentMethodLabel(order.paymentMethod as string)}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDetailDialog(order)}
                            title="查看详情"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openCancelDialog(order)}
                              title="取消订单"
                            >
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          暂无订单数据
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
            <DialogTitle>订单详情</DialogTitle>
            <DialogDescription>查看订单详细信息</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">订单号</Label>
                  <p className="text-sm font-mono">{selectedOrder.orderNo}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">订单类型</Label>
                  <p>{getTypeBadge(selectedOrder.type)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">订单金额</Label>
                  <p className="text-lg font-bold">¥{Number(selectedOrder.amount || 0).toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">订单状态</Label>
                  <p>{getStatusBadge(selectedOrder.status)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">支付方式</Label>
                  <p className="text-sm">{getPaymentMethodLabel(selectedOrder.paymentMethod as string)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">用户ID</Label>
                  <p className="text-sm">{selectedOrder.userId}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">创建时间</Label>
                  <p className="text-sm">
                    {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">支付时间</Label>
                  <p className="text-sm">
                    {selectedOrder.paidAt ? new Date(selectedOrder.paidAt as string).toLocaleString() : '-'}
                  </p>
                </div>
              </div>
              {selectedOrder.title && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">标题</Label>
                  <p className="text-sm">{selectedOrder.title}</p>
                </div>
              )}
              {selectedOrder.details && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">订单详情</Label>
                  <div className="text-sm bg-muted p-3 rounded-md">
                    {selectedOrder.details.membershipName && (
                      <p>会员类型: {selectedOrder.details.membershipName}</p>
                    )}
                    {selectedOrder.details.plan && (
                      <p>套餐: {selectedOrder.details.plan}</p>
                    )}
                    {selectedOrder.details.duration && (
                      <p>时长: {selectedOrder.details.duration}天</p>
                    )}
                    <p>总金额: ¥{selectedOrder.details.totalAmount}</p>
                  </div>
                </div>
              )}
              {selectedOrder.remark && (
                <div className="space-y-1">
                  <Label className="text-muted-foreground">备注</Label>
                  <p className="text-sm">{selectedOrder.remark}</p>
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

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认取消订单</DialogTitle>
            <DialogDescription>
              确定要取消订单 "{selectedOrder?.orderNo}" 吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              确认取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
