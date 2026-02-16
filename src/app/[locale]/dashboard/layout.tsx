'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Tag, 
  ShoppingCart, 
  Settings,
  Menu,
  X,
  ChevronLeft,
  Grid3X3
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ADMIN_NAV_LINKS = [
  { href: '/dashboard', label: '概览', icon: LayoutDashboard },
  { href: '/dashboard/users', label: '用户管理', icon: Users },
  { href: '/dashboard/cosers', label: 'Coser管理', icon: Grid3X3 },
  { href: '/dashboard/articles', label: '文章管理', icon: FileText },
  { href: '/dashboard/tags', label: '标签管理', icon: Tag },
  { href: '/dashboard/orders', label: '订单管理', icon: ShoppingCart },
  { href: '/dashboard/settings', label: '系统设置', icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    console.log('Dashboard auth state:', { isLoading, isAuthenticated, user: user?.username });
    if (!isLoading && !isAuthenticated) {
      console.log('Not authenticated, redirecting to login');
      router.push('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, isLoading, router, user]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const isAdmin = user.roles?.some((role) => 
        (role.name === 'admin' || role.name === 'super-admin') && role.isActive !== false
      );
      if (!isAdmin) {
        console.log('User roles:', user.roles);
        router.push('/');
      }
    }
  }, [user, isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const NavLink = ({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: React.ElementType; onClick?: () => void }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
        )}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className={cn(!sidebarOpen && 'hidden')}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col border-r bg-background transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b h-16">
          {sidebarOpen && (
            <Link href="/dashboard" className="text-xl font-bold text-primary">
              PicArt Admin
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(!sidebarOpen && 'mx-auto')}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {ADMIN_NAV_LINKS.map((link) => (
            <NavLink key={link.href} {...link} />
          ))}
        </nav>

        <div className="p-3 border-t">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5 flex-shrink-0" />
            {sidebarOpen && <span>返回前台</span>}
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b bg-background flex items-center justify-between px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-lg font-bold text-primary">PicArt Admin</span>
        <div className="w-10" />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="w-64 h-full bg-background border-r"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b h-14">
              <span className="text-lg font-bold text-primary">PicArt Admin</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-3 space-y-1">
              {ADMIN_NAV_LINKS.map((link) => (
                <NavLink key={link.href} {...link} onClick={() => setMobileMenuOpen(false)} />
              ))}
            </nav>
            <div className="p-3 border-t">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
                <span>返回前台</span>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-full overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
