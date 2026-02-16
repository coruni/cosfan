import { Metadata } from 'next';
import Image from 'next/image';
import { articleControllerFindAll, categoryControllerFindAll } from '@/api/sdk.gen';
import { client } from '@/api/client.gen';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { User } from 'lucide-react';
import { API_BASE_URL } from '@/config/constants';

export const metadata: Metadata = {
  title: '发现',
  description: '发现更多精彩Cosplay图集',
  openGraph: {
    title: '发现 - PicArt',
    description: '发现更多精彩Cosplay图集',
  },
};

async function getInitialData() {
  try {
    client.setConfig({
      baseUrl: API_BASE_URL,
    });

    const [articlesResponse, categoriesResponse] = await Promise.all([
      articleControllerFindAll({
        query: { limit: 8 },
      }),
      categoryControllerFindAll(),
    ]);

    return {
      articles: articlesResponse.data?.data || [],
      categories: Array.isArray(categoriesResponse.data?.data) ? categoriesResponse.data.data : [],
    };
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
    return {
      articles: [],
      categories: [],
    };
  }
}

export default async function DiscoverPage() {
  const { articles, categories } = await getInitialData();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">发现</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">热门Coser</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((category: any, index: number) => (
            <Link key={category.id} href={`/cosers/${category.id}`}>
              <div className="aspect-[3/4] bg-muted relative overflow-hidden rounded-lg group cursor-pointer">
                {category.cover || category.avatar ? (
                  <Image
                    src={category.cover || category.avatar}
                    alt={category.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 16vw, 12vw"
                    loading={index < 6 ? 'eager' : 'lazy'}
                    priority={index < 6}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                    <User className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <h3 className="font-medium text-sm text-white truncate">{category.name}</h3>
                  {category.articleCount !== undefined && (
                    <p className="text-xs text-white/80 mt-0.5">{category.articleCount} 套</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">热门推荐</h2>
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            查看更多 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.isArray(articles) && articles.map((article: any, index: number) => (
            <Link key={article.id} href={`/article/${article.id}`}>
              <Card className="overflow-hidden h-full hover:shadow-md transition-shadow border border-border">
                <div className="relative aspect-[3/4] bg-muted">
                  {article.cover ? (
                    <Image
                      src={article.cover}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                      loading={index < 4 ? 'eager' : 'lazy'}
                      priority={index < 4}
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {article.requireMembership && (
                    <Badge className="absolute top-2 right-2 bg-amber-500 text-white">
                      VIP
                    </Badge>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {article.images?.length || 0}P
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  {article.subTitle || article.categoryName ? (
                    <p className="text-xs text-muted-foreground mb-2">
                      {article.subTitle || article.categoryName}
                    </p>
                  ) : null}
                </CardContent>
                <CardContent className="p-3 pt-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {article.author && (
                      <>
                        <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                          {article.author.avatar ? (
                            <Image
                              src={article.author.avatar}
                              alt={article.author.nickname}
                              fill
                              className="object-cover"
                              sizes="20px"
                            />
                          ) : (
                            <User className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {article.author.nickname || article.author.username || 'Unknown'}
                        </span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
