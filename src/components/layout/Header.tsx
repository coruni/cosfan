'use client';

import { Link, usePathname } from '@/i18n';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserDropdown } from '@/components/layout/UserDropdown';
import { ROUTES } from '@/config/constants';
import { Menu, Search, User, Crown, Home, Grid3X3, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslations } from 'next-intl';

const NAV_LINKS = [
  { href: ROUTES.HOME, labelKey: 'home', icon: Home },
  { href: '/cosers', labelKey: 'coser', icon: Grid3X3 },
  { href: ROUTES.SEARCH, labelKey: 'search', icon: Search },
];

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tNav = useTranslations('nav');

  const NavLink = ({ href, labelKey, icon: Icon }: { href: string; labelKey: string; icon: React.ElementType }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        {tNav(labelKey as any)}
      </Link>
    );
  };

  const MobileNavLink = ({ href, labelKey, icon: Icon }: { href: string; labelKey: string; icon: React.ElementType }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setMobileMenuOpen(false)}
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {tNav(labelKey as any)}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href={ROUTES.HOME} className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">PicArt</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label={tNav('menu')}>
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} {...link} />
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
                  <MobileNavLink key={link.href} {...link} />
                ))}
                {isAuthenticated && (
                  <>
                    <div className="h-px bg-border my-2" role="separator" />
                    <MobileNavLink href={ROUTES.VIP} labelKey="vip" icon={Crown} />
                    <MobileNavLink href={ROUTES.PROFILE} labelKey="profile" icon={User} />
                    <MobileNavLink href={ROUTES.SETTINGS} labelKey="settings" icon={Settings} />
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
