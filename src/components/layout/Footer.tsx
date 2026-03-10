import { Link } from '@/i18n';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';

export function Footer() {
  const t = useTranslations('component.footer');

  const FOOTER_LINKS = {
    about: [
      { label: t('aboutUs'), href: '/about' },
      { label: t('contactUs'), href: '/contact' },
      { label: t('joinUs'), href: '/jobs' },
    ],
    support: [
      { label: t('helpCenter'), href: '/help' },
      { label: t('privacyPolicy'), href: '/privacy' },
      { label: t('termsOfService'), href: '/terms' },
    ],
    social: [
      { label: t('weibo'), href: '#' },
      { label: t('wechat'), href: '#' },
      { label: t('qqGroup'), href: '#' },
    ],
  };

  return (
    <footer className="border-t bg-muted/50" role="contentinfo">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-primary">PicArt</h3>
            <p className="text-sm text-muted-foreground">
              {t('description')}
            </p>
          </div>

          <nav aria-label={t('aboutUs')}>
            <h4 className="font-semibold mb-4">{t('aboutUs')}</h4>
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
          </nav>

          <nav aria-label={t('helpCenter')}>
            <h4 className="font-semibold mb-4">{t('helpCenter')}</h4>
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
          </nav>

          <nav aria-label={t('followUs')}>
            <h4 className="font-semibold mb-4">{t('followUs')}</h4>
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
          </nav>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PicArt. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {t('privacyPolicy')}
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {t('termsOfService')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
