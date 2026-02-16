import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

const FOOTER_LINKS = {
  about: [
    { label: '关于我们', href: '/about' },
    { label: '联系我们', href: '/contact' },
    { label: '加入我们', href: '/jobs' },
  ],
  support: [
    { label: '帮助中心', href: '/help' },
    { label: '隐私政策', href: '/privacy' },
    { label: '服务条款', href: '/terms' },
  ],
  social: [
    { label: '微博', href: '#' },
    { label: '微信公众号', href: '#' },
    { label: 'QQ群', href: '#' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">PicArt</h3>
            <p className="text-sm text-muted-foreground">
              专业的Cosplay图集展示平台，汇聚海量优质Cosplay作品，为用户提供最佳的浏览体验。
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">关于我们</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">帮助支持</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">关注我们</h4>
            <ul className="space-y-2">
              {FOOTER_LINKS.social.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PicArt. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              服务条款
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
