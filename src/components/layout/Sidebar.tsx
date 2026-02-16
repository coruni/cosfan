'use client';

import { Link, usePathname } from '@/i18n';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserDropdown } from '@/components/layout/UserDropdown';
import { ROUTES } from '@/config/constants';
import { Home, Grid3X3, Search, Compass, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NAV_LINKS = [
  { href: ROUTES.HOME, label: '首页', icon: Home },
  { href: '/discover', label: '发现', icon: Compass },
  { href: '/cosers', label: 'Coser', icon: Grid3X3 },
  { href: ROUTES.SEARCH, label: '搜索', icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLink = ({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: React.ElementType; onClick?: () => void }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
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

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      <div className="p-4 border-b">
        <Link href={ROUTES.HOME} className="flex items-center gap-2" onClick={onClose}>
          <span className="text-xl font-bold text-primary">PicArt</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} {...link} onClick={onClose} />
        ))}
      </nav>

      <div className="p-4 border-t">
        <UserDropdown variant="sidebar" user={user} isAuthenticated={isAuthenticated} onLogout={logout} onClose={onClose} />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background flex items-center justify-between px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64" title="侧边栏菜单">
            <div className="flex flex-col h-full">
              <SidebarContent onClose={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
        <Link href={ROUTES.HOME}>
          <span className="text-lg font-bold text-primary">PicArt</span>
        </Link>
        <div className="w-10" />
      </div>
    </>
  );
}
