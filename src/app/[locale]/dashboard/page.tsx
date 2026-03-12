'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { userControllerFindAll, articleControllerFindAll, tagControllerFindAll, orderControllerGetAllOrders, categoryControllerFindAll } from '@/api/sdk.gen';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Tag, ShoppingCart } from 'lucide-react';
import { Link } from '@/i18n';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await userControllerFindAll({ query: { limit: 1 } });
      return response.data;
    },
  });

  const { data: articlesData } = useQuery({
    queryKey: ['admin-articles'],
    queryFn: async () => {
      const response = await articleControllerFindAll({ query: { limit: 1 } });
      return response.data;
    },
  });

  const { data: tagsData } = useQuery({
    queryKey: ['admin-tags'],
    queryFn: async () => {
      const response = await tagControllerFindAll({ query: { limit: 1 } });
      return response.data;
    },
  });

  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const response = await orderControllerGetAllOrders({ query: { limit: 1 } });
      return response.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await categoryControllerFindAll();
      return response.data;
    },
  });

  const stats = [
    {
      title: t('stats.totalUsers'),
      value: usersData?.total || 0,
      icon: Users,
      description: t('stats.totalUsersDesc'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: t('stats.totalArticles'),
      value: articlesData?.total || 0,
      icon: FileText,
      description: t('stats.totalArticlesDesc'),
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: t('stats.totalTags'),
      value: tagsData?.total || 0,
      icon: Tag,
      description: t('stats.totalTagsDesc'),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: t('stats.totalOrders'),
      value: ordersData?.total || 0,
      icon: ShoppingCart,
      description: t('stats.totalOrdersDesc'),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('overview.title')}</h1>
        <p className="text-muted-foreground">{t('overview.welcome')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('quickActions.title')}</CardTitle>
            <CardDescription>{t('quickActions.description')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Link href="/dashboard/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">{t('quickActions.userManagement')}</p>
                <p className="text-sm text-muted-foreground">{t('quickActions.userManagementDesc')}</p>
              </div>
            </Link>
            <Link href="/dashboard/articles" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">{t('quickActions.articleManagement')}</p>
                <p className="text-sm text-muted-foreground">{t('quickActions.articleManagementDesc')}</p>
              </div>
            </Link>
            <Link href="/dashboard/orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
              <ShoppingCart className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium">{t('quickActions.orderManagement')}</p>
                <p className="text-sm text-muted-foreground">{t('quickActions.orderManagementDesc')}</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('categoryStats.title')}</CardTitle>
            <CardDescription>{t('categoryStats.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categoriesData?.data?.data.slice(0, 5).map((category: { id: number; name: string; _count?: { articles?: number } }) => (
                <div key={category.id} className="flex items-center justify-between">
                  <span className="text-sm">{category.name}</span>
                  <span className="text-sm text-muted-foreground">{category._count?.articles || 0} {tCommon('articlesCount')}</span>
                </div>
              ))}
              {(!categoriesData?.data || categoriesData.data?.data.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">{t('categoryStats.empty')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
