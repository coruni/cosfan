"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { usePathname, Link } from "@/i18n";
import { categoryControllerFindAll } from "@/api/sdk.gen";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { User } from "lucide-react";
import type { CategoryControllerFindAllResponse } from "@/api";

type Category = NonNullable<
  CategoryControllerFindAllResponse["data"]["data"]
>[number];

function CategoryCardSkeleton() {
  return (
    <div className="aspect-3/4 rounded-lg overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
  );
}

export function CosersContent() {
  const t = useTranslations("coser");
  const tPagination = useTranslations("pagination");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useQuery({
    queryKey: ["cosers", currentPage],
    queryFn: async () => {
      const response = await categoryControllerFindAll({
        query: {
          page: currentPage,
          limit: 24,
        },
      });
      return (
        response.data || {
          data: { data: [], meta: { total: 0, page: 1, limit: 24 } },
        }
      );
    },
  });

  const cosers = data?.data?.data || [];
  const meta = data?.data?.meta as
    | { total: number; page: number; limit: number }
    | undefined;
  const total = meta?.total || 0;
  const totalPages = Math.ceil(total / 24);

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    return `${pathname}?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    // 减少显示页码数量，避免移动端溢出
    const showPages = 3;

    if (totalPages <= showPages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 2) {
        pages.push("ellipsis");
      }

      const start = Math.max(2, currentPage - Math.floor(showPages / 2));
      const end = Math.min(totalPages - 1, start + showPages - 1);

      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 1) {
        pages.push("ellipsis");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("list")}</h1>
        {total > 0 && (
          <span className="text-sm text-muted-foreground">
            {t("totalCount", { count: total })}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      ) : cosers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <User className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg">{t("empty")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {cosers.map((coser, index) => (
              <Link key={coser.id} href={`/cosers/${coser.id}`}>
                <div className="aspect-[3/4] bg-muted relative overflow-hidden rounded-lg group cursor-pointer">
                  {coser.cover || coser.avatar ? (
                    <Image
                      src={coser.cover || coser.avatar || ""}
                      alt={coser.name || ""}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
                      loading={index < 6 ? "eager" : "lazy"}
                      priority={index < 6}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                      <User className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-medium text-white truncate">
                      {coser.name}
                    </h3>
                    {coser.articleCount !== undefined && (
                      <p className="text-xs text-white/80 mt-1">
                        {t("articlesCount", { count: coser.articleCount })}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 mt-8">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href={
                        currentPage > 1 ? createPageUrl(currentPage - 1) : "#"
                      }
                      className={
                        currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>

                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>
                      {page === "ellipsis" ? (
                        <PaginationEllipsis />
                      ) : (
                        <PaginationLink
                          href={createPageUrl(page)}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      )}
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href={
                        currentPage < totalPages
                          ? createPageUrl(currentPage + 1)
                          : "#"
                      }
                      className={
                        currentPage >= totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <p className="text-sm text-muted-foreground">
                {tPagination("pageInfo", {
                  page: currentPage,
                  total: totalPages,
                })}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
