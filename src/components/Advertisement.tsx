"use client";

import { useSiteConfig } from "@/contexts/SiteConfigContext";
import { cn } from "@/lib/utils";

interface AdvertisementProps {
  type: "homepage" | "articleTop" | "articleBottom" | "global";
  className?: string;
}

export function Advertisement({ type, className }: AdvertisementProps) {
  const { config } = useSiteConfig();

  if (!config) return null;

  // 根据类型获取对应的广告配置
  let content = "";
  let position = "top";
  let style = "";

  switch (type) {
    case "homepage":
      content = config.ad_homepage_content ?? "";
      position = config.ad_homepage_position ?? "top";
      break;
    case "articleTop":
      content = config.ad_article_top_content ?? "";
      break;
    case "articleBottom":
      content = config.ad_article_bottom_content ?? "";
      break;
    case "global":
      content = config.ad_global_content ?? "";
      position = config.ad_global_position ?? "top";
      style = config.ad_global_style ?? "";
      break;
  }

  // 只要广告内容不为空就显示，不检查 enabled 开关
  if (!content) return null;

  // 全局广告特殊处理 position
  if (type === "global") {
    // 尝试解析 style 为 JSON，如果不是 JSON 则直接使用字符串作为 CSS
    let parsedStyle: React.CSSProperties | undefined;
    if (style) {
      try {
        parsedStyle = JSON.parse(style);
      } catch {
        // 如果不是 JSON，可能是 CSS 字符串，就不设置 style
        parsedStyle = undefined;
      }
    }

    return (
      <div
        className={cn(
          "w-full",
          position === "bottom" ? "fixed bottom-0 left-0 right-0 z-50 md:left-64" : "sticky top-0 z-40",
          className
        )}
        style={parsedStyle}
      >
        <div
          className="w-full"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    );
  }

  // 首页广告特殊处理 position
  if (type === "homepage") {
    return (
      <div
        className={cn(
          "w-full",
          position === "bottom" ? "mt-8" : "mb-8",
          className
        )}
      >
        <div
          className="w-full"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    );
  }

  // 文章顶部和底部广告
  return (
    <div className={cn("w-full my-6", className)}>
      <div
        className="w-full"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
