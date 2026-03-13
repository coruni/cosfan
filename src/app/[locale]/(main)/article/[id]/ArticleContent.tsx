"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  articleControllerFindOne,
  articleControllerLike,
  articleControllerFavoriteArticle,
  articleControllerFindRecommendations,
} from "@/api/sdk.gen";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Lock,
  Crown,
  Download,
  ExternalLink,
  Copy,
  Key,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { ImageGallery } from "@/components/article/ImageGallery";
import { ArticleComments } from "@/components/article/ArticleComments";
import { toast } from "sonner";
import { Link } from "@/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Advertisement } from "@/components/Advertisement";

interface Article {
  id: number;
  title: string;
  summary?: string;
  content?: string;
  images: string[];
  imageCount?: number;
  views: number;
  likes: number;
  favoriteCount: number;
  commentCount: number;
  cover: string;
  author: {
    id: number;
    nickname: string;
    avatar: string;
  };
  category?: {
    id: number;
    name: string;
    avatar: string;
  };
  requireLogin: boolean;
  requirePayment: boolean;
  requireMembership: boolean;
  viewPrice?: string;
  createdAt: string;
  isLiked?: boolean;
  isFavorited?: boolean;
  downloads?: Array<{
    id?: number;
    type?: string;
    url?: string;
    password?: string;
    extractionCode?: string;
  }>;
  downloadCount?: number;
}

interface ArticleContentProps {
  initialData?: Article;
}

export function ArticleContent({ initialData }: ArticleContentProps) {
  const t = useTranslations("article");
  const tAuth = useTranslations("auth");
  const params = useParams();
  const pathname = usePathname();
  const id = params.id as string;
  const { isAuthenticated, user } = useAuth();
  const { config } = useSiteConfig();
  const queryClient = useQueryClient();

  const { data: article, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: async () => {
      const response = await articleControllerFindOne({
        path: { id },
      });
      return response.data?.data as Article | undefined;
    },
    initialData,
  });

  // 获取推荐文章
  const { data: recommendationsData } = useQuery({
    queryKey: ["article-recommendations", id],
    queryFn: async () => {
      const response = await articleControllerFindRecommendations({
        path: { id },
      });
      return response.data?.data?.data;
    },
    enabled: !!id,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      await articleControllerLike({
        path: { id },
        body: {
          reactionType: "like",
        },
      });
    },
    onSuccess: () => {
      const newIsLiked = !isLiked;
      toast.success(newIsLiked ? t("liked") : t("unliked"));
      queryClient.setQueryData(["article", id], (old: Article | undefined) => {
        if (!old) return old;
        return {
          ...old,
          isLiked: newIsLiked,
          likes: newIsLiked ? old.likes + 1 : Math.max(0, old.likes - 1),
        };
      });
    },
    onError: () => {
      toast.error(t("operationFailed"));
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      await articleControllerFavoriteArticle({
        path: { id },
      });
    },
    onSuccess: () => {
      const newIsFavorited = !isFavorited;
      toast.success(newIsFavorited ? t("favorited") : t("unfavorited"));
      queryClient.setQueryData(["article", id], (old: Article | undefined) => {
        if (!old) return old;
        return { ...old, isFavorited: newIsFavorited };
      });
    },
    onError: () => {
      toast.error(t("operationFailed"));
    },
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error(tAuth("pleaseLogin"));
      return;
    }
    likeMutation.mutate();
  };

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast.error(tAuth("pleaseLogin"));
      return;
    }
    favoriteMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("linkCopied"));
    }
  };

  const getDownloadTypeLabel = (type?: string) => {
    const typeKey = type || "unknown";
    return t(
      `downloadType.${typeKey}` as
        | "downloadType.original"
        | "downloadType.preview"
        | "downloadType.unknown",
    );
  };

  if (isLoading && !initialData) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-3/4 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">{t("notFound")}</p>
        <Link href="/">
          <Button className="mt-4">{t("backToHome")}</Button>
        </Link>
      </div>
    );
  }

  // 不再使用 isLocked 一刀切的逻辑
  // 后端会根据权限返回相应数量的图片
  // 前端只需要显示后端返回的图片，并根据 imageCount 判断是否还有更多内容

  const isLiked = article.isLiked ?? false;
  const isFavorited = article.isFavorited ?? false;

  // 判断是否能看到全部图片：imageCount 和 images.length 相等
  const imagesLength = article.images?.length ?? 0;
  const canViewAllImages = article.imageCount === imagesLength;
  const remainingImages =
    article.imageCount && imagesLength ? article.imageCount - imagesLength : 0;

  // 判断是否有图片可以显示
  const hasImages = imagesLength > 0;

  return (
    <>
      {/* 文章顶部广告 */}
      <Advertisement type="articleTop" />

      <article
        className="space-y-6"
        itemScope
        itemType="https://schema.org/Article"
      >
        <header className="space-y-4">
          <h1 className="text-2xl font-bold" itemProp="headline">
            {article.title}
          </h1>

          <div className="flex items-center gap-4">
            <Link
              href={`/cosers/${article.category?.id}`}
              className="flex items-center gap-2"
              itemProp="author"
              itemScope
              itemType="https://schema.org/Person"
            >
              <Image
                src={article.category?.avatar || "/default-avatar.png"}
                alt={t("uncategorizedAvatar", {
                  name: article.category?.name || t("uncategorized"),
                })}
                width={40}
                height={40}
                className="rounded-full object-cover w-10 h-10"
              />
              {/* <span className="font-medium" itemProp="name">
                {article.category?.name}
              </span> */}
            </Link>
            <Link href={`/cosers/${article.category?.id}`}>
              <Badge variant="secondary">
                {article.category?.name || t("uncategorized")}
              </Badge>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground cursor-default"
              aria-label={t("aria.viewCount", { count: article.views })}
            >
              <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
              {article.views}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground cursor-default"
              aria-label={t("aria.commentCount", {
                count: article.commentCount,
              })}
            >
              <MessageCircle className="h-4 w-4 mr-1" aria-hidden="true" />
              {article.commentCount}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={
                isLiked ? "text-red-500 border-red-500 hover:bg-red-50" : ""
              }
              aria-label={isLiked ? t("aria.unlike") : t("aria.like")}
              aria-pressed={isLiked}
            >
              <Heart
                className={`h-4 w-4 mr-1 ${isLiked ? "fill-current" : ""}`}
                aria-hidden="true"
              />
              {article.likes}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleFavorite}
              disabled={favoriteMutation.isPending}
              className={
                isFavorited
                  ? "text-amber-500 border-amber-500 hover:bg-amber-50"
                  : ""
              }
              aria-label={
                isFavorited ? t("aria.unfavorite") : t("aria.favorite")
              }
              aria-pressed={isFavorited}
            >
              <Bookmark
                className={`h-4 w-4 mr-1 ${isFavorited ? "fill-current" : ""}`}
                aria-hidden="true"
              />
              {isFavorited ? t("favorited") : t("favoriteAction")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              aria-label={t("aria.share")}
            >
              <Share2 className="h-4 w-4 mr-1" aria-hidden="true" />
              {t("share")}
            </Button>
            {article.downloads && article.downloads.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    {t("downloadCount", { count: article.downloads.length })}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Download className="h-5 w-5" />
                      {t("downloadResources")}
                    </DialogTitle>
                    <DialogDescription>
                      {t("resourcesCount", { count: article.downloads.length })}
                    </DialogDescription>
                  </DialogHeader>
                  {config?.site_mail && (
                    <div className="bg-muted/50 border rounded-lg p-3 text-sm text-muted-foreground">
                      {config.site_mail}
                    </div>
                  )}
                  <div className="space-y-3 mt-2">
                    {article.downloads.map((download, index) => (
                      <div
                        key={download.id || index}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Download className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded bg-muted font-medium">
                                {getDownloadTypeLabel(download.type)}
                              </span>
                            </div>
                            <p className="text-sm truncate text-muted-foreground mt-0.5">
                              {download.url}
                            </p>
                            {(download.password || download.extractionCode) && (
                              <div className="flex items-center gap-3 mt-1.5">
                                {download.password && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Key className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      {t("password")}:
                                    </span>
                                    <code className="px-1 py-0.5 bg-muted rounded font-mono text-xs">
                                      {download.password}
                                    </code>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          download.password || "",
                                        );
                                        toast.success(t("passwordCopied"));
                                      }}
                                      className="text-primary hover:underline"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                                {download.extractionCode && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <span className="text-muted-foreground">
                                      {t("extractionCode")}:
                                    </span>
                                    <code className="px-1 py-0.5 bg-muted rounded font-mono text-xs">
                                      {download.extractionCode}
                                    </code>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          download.extractionCode || "",
                                        );
                                        toast.success(
                                          t("extractionCodeCopied"),
                                        );
                                      }}
                                      className="text-primary hover:underline"
                                    >
                                      <Copy className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (download.url) {
                              window.open(download.url, "_blank");
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {article?.content && (
            <p className="text-muted-foreground" itemProp="description">
              {article?.content}
            </p>
          )}
        </header>

        {hasImages ? (
          <>
            <figure itemProp="image">
              <ImageGallery images={article?.images || []} />
            </figure>

            {!canViewAllImages && remainingImages > 0 && (
              <div className="flex flex-col items-center justify-center py-10 space-y-4 border-t">
                <Lock className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">
                  {t("remainingImages", { count: remainingImages })}
                </p>
                {article.requirePayment && article.viewPrice && (
                  <p className="text-muted-foreground">
                    {t("payToView", { price: article.viewPrice })}
                  </p>
                )}
                {article.requireMembership && (
                  <div className="flex items-center gap-2 text-primary">
                    <Crown className="h-5 w-5" />
                    <span>{t("vipCanViewAll")}</span>
                  </div>
                )}
                {article.requireLogin && !isAuthenticated && (
                  <p className="text-muted-foreground">
                    {t("loginToViewMore")}
                  </p>
                )}
                {!isAuthenticated ? (
                  <Link
                    href={`/login?redirect=${encodeURIComponent(pathname)}`}
                  >
                    <Button>{t("loginToView")}</Button>
                  </Link>
                ) : article.requireMembership && !user?.membershipStatus ? (
                  <Link href="/vip">
                    <Button>
                      <Crown className="h-4 w-4 mr-2" />
                      {t("openVip")}
                    </Button>
                  </Link>
                ) : article.requirePayment ? (
                  <Button>
                    {t("payToUnlock", { price: article.viewPrice || 0 })}
                  </Button>
                ) : null}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Lock
              className="h-16 w-16 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="text-lg font-medium">{t("noImages")}</p>
          </div>
        )}
      </article>

      {/* 推荐文章 */}
      {recommendationsData && recommendationsData.length > 0 && (
        <section className="mt-12 border-t pt-8">
          <h2 className="text-lg font-semibold mb-6">{t("recommendations")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {recommendationsData.slice(0, 12).map((recArticle) => (
              <Link
                key={recArticle.id}
                href={`/article/${recArticle.id}`}
                className="group block relative aspect-[16/10] overflow-hidden rounded-lg bg-muted"
              >
                {recArticle.cover || recArticle.images?.[0] ? (
                  <Image
                    src={recArticle.cover || recArticle.images![0]}
                    alt={recArticle.title || ""}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                    {t("noImages")}
                  </div>
                )}
                {/* 渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {/* 信息层 */}
                <div className="absolute bottom-0 left-0 right-0 p-2">
                  <h3 className="text-white text-xs font-medium line-clamp-1 mb-1">
                    {recArticle.title}
                  </h3>
                  <div className="flex items-center gap-2 text-white/80 text-[10px]">
                    <span>{recArticle.views || 0} 浏览</span>
                    {recArticle.imageCount && recArticle.imageCount > 0 && (
                      <span>{recArticle.imageCount}P</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 文章底部广告 */}
      <Advertisement type="articleBottom" />

      {/* 悬浮评论按钮 */}
      <ArticleComments articleId={id} />
    </>
  );
}
