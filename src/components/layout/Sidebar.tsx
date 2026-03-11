"use client";

import { Link, usePathname } from "@/i18n";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { UserDropdown } from "@/components/layout/UserDropdown";
import { ROUTES } from "@/config/constants";
import { Home, Grid3X3, Search, Compass, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";

const NAV_LINKS = [
  { href: ROUTES.HOME, labelKey: "home", icon: Home },
  { href: "/discover", labelKey: "discover", icon: Compass },
  { href: "/cosers", labelKey: "coser", icon: Grid3X3 },
  { href: ROUTES.SEARCH, labelKey: "search", icon: Search },
];

interface SidebarNavLinkProps {
  href: string;
  labelKey: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick?: () => void;
  tNav: (key: string) => string;
}

function SidebarNavLink({ href, labelKey, icon: Icon, isActive, onClick, tNav }: SidebarNavLinkProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      {tNav(labelKey)}
    </Link>
  );
}

interface SidebarContentProps {
  onClose?: () => void;
  pathname: string;
  user: { id: number; username: string; avatar?: string; email?: string } | null;
  isAuthenticated: boolean;
  logout: () => void;
  tNav: (key: string) => string;
}

function SidebarContent({ onClose, pathname, user, isAuthenticated, logout, tNav }: SidebarContentProps) {
  return (
    <>
      <div className="p-4 border-b">
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2"
          onClick={onClose}
        >
          <span className="text-xl font-bold text-primary">PicArt</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_LINKS.map((link) => (
          <SidebarNavLink key={link.href} {...link} isActive={pathname === link.href} onClick={onClose} tNav={tNav} />
        ))}
      </nav>

      <div className="p-4 border-t">
        <UserDropdown
          variant="sidebar"
          user={user}
          isAuthenticated={isAuthenticated}
          onLogout={logout}
          onClose={onClose}
        />
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const tNav = useTranslations("nav");

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background flex-col">
        <SidebarContent pathname={pathname} user={user} isAuthenticated={isAuthenticated} logout={logout} tNav={tNav} />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background flex items-center justify-between px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64" title={tNav("menu")}>
            <div className="flex flex-col h-full">
              <SidebarContent onClose={() => setMobileOpen(false)} pathname={pathname} user={user} isAuthenticated={isAuthenticated} logout={logout} tNav={tNav} />
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
