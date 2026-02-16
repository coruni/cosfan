'use client';

import { Link, usePathname } from '@/i18n';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserDropdown } from '@/components/layout/UserDropdown';
import { ROUTES } from '@/config/constants';
import { Menu, Search, User, Wallet, Crown, Home, Grid3X3, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NAV_LINKS = [
  { href: ROUTES.HOME, label: '首页', icon: Home },
  { href: '/cosers', label: 'Coser', icon: Grid3X3 },
  { href: ROUTES.SEARCH, label: '搜索', icon: Search },
];

export function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const NavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  const MobileNavLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        }`}
      >
        <Icon className="h-5 w-5" />
        {label}
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

          <nav className="hidden md:flex items-center gap-1">
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
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]" title="导航菜单">
              <nav className="flex flex-col gap-2 mt-8">
                {NAV_LINKS.map((link) => (
                  <MobileNavLink key={link.href} {...link} />
                ))}
                {isAuthenticated && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <MobileNavLink href={ROUTES.VIP} label="会员" icon={Crown} />
                    <MobileNavLink href={ROUTES.WALLET} label="钱包" icon={Wallet} />
                    <MobileNavLink href={ROUTES.PROFILE} label="个人中心" icon={User} />
                    <MobileNavLink href={ROUTES.SETTINGS} label="设置" icon={Settings} />
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
