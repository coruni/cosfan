'use client';

import { Link, usePathname } from '@/i18n';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserDropdown } from '@/components/layout/UserDropdown';
import { ROUTES } from '@/config/constants';
import { Menu, Search, User, Crown, Home, Grid3X3, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { useTranslations } from 'next-intl';

const NAV_LINKS = [
  { href: ROUTES.HOME, labelKey: 'home', icon: Home },
  { href: '/cosers', labelKey: 'coser', icon: Grid3X3 },
  { href: ROUTES.SEARCH, labelKey: 'search', icon: Search },
];

interface NavLinkProps {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick?: () => void;
  className?: string;
  tNav: (key: string) => string;
}

function NavLink({ href, labelKey, icon: Icon, isActive, className, tNav }: NavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      } ${className || ''}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {tNav(labelKey)}
    </Link>
  );
}

interface MobileNavLinkProps extends NavLinkProps {
  onClick?: () => void;
}

function MobileNavLink({ href, labelKey, icon: Icon, isActive, onClick, tNav }: MobileNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {tNav(labelKey)}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { siteName } = useSiteConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tNav = useTranslations('nav');

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">{siteName}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label={tNav('menu')}>
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} {...link} isActive={pathname === link.href} tNav={tNav} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <UserDropdown user={user} isAuthenticated={isAuthenticated} onLogout={logout} />

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{tNav('openMenu')}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]" title={tNav('menu')}>
              <nav className="flex flex-col gap-2 mt-8" aria-label={tNav('menu')}>
                {NAV_LINKS.map((link) => (
                  <MobileNavLink key={link.href} {...link} isActive={pathname === link.href} onClick={() => setMobileMenuOpen(false)} tNav={tNav} />
                ))}
                {isAuthenticated && (
                  <>
                    <div className="h-px bg-border my-2" role="separator" />
                    <MobileNavLink href={ROUTES.VIP} labelKey="vip" icon={Crown} isActive={pathname === ROUTES.VIP} onClick={() => setMobileMenuOpen(false)} tNav={tNav} />
                    <MobileNavLink href={ROUTES.PROFILE} labelKey="profile" icon={User} isActive={pathname === ROUTES.PROFILE} onClick={() => setMobileMenuOpen(false)} tNav={tNav} />
                    <MobileNavLink href={ROUTES.SETTINGS} labelKey="settings" icon={Settings} isActive={pathname === ROUTES.SETTINGS} onClick={() => setMobileMenuOpen(false)} tNav={tNav} />
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
