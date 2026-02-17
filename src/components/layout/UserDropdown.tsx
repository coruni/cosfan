import { Link } from '@/i18n';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROUTES } from '@/config/constants';
import { User, Settings, LogOut, Crown } from 'lucide-react';
import type { UserData } from '@/lib/auth';

interface UserDropdownProps {
  variant?: 'header' | 'sidebar';
  user: UserData | null;
  isAuthenticated: boolean;
  onLogout: () => void;
  onClose?: () => void;
}

export function UserDropdown({ variant = 'header', user, isAuthenticated, onLogout, onClose }: UserDropdownProps) {
  if (!isAuthenticated || !user) {
    return (
      <div className={variant === 'sidebar' ? 'space-y-2' : 'flex items-center gap-2'}>
        <Link href={ROUTES.LOGIN} onClick={onClose}>
          <Button variant="ghost" size="sm" className={variant === 'sidebar' ? 'w-full' : ''}>
            登录
          </Button>
        </Link>
        <Link href={ROUTES.REGISTER} onClick={onClose}>
          <Button size="sm" className={variant === 'sidebar' ? 'w-full' : ''}>注册</Button>
        </Link>
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.avatar} alt={user.nickname || user.username} />
              <AvatarFallback className="text-xs">
                {user.nickname?.[0] || user.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{user.nickname || user.username || '用户'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <div className="flex items-center justify-start gap-2 p-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.nickname || user.username} />
              <AvatarFallback>{user.nickname?.[0] || user.username?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col space-y-1 leading-none">
              <p className="font-medium">{user.nickname || user.username}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={ROUTES.VIP} className="cursor-pointer" onClick={onClose}>
              <Crown className="mr-2 h-4 w-4" />
              会员
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.PROFILE} className="cursor-pointer" onClick={onClose}>
              <User className="mr-2 h-4 w-4" />
              个人中心
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={ROUTES.SETTINGS} className="cursor-pointer" onClick={onClose}>
              <Settings className="mr-2 h-4 w-4" />
              设置
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive">
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.nickname || user.username} />
            <AvatarFallback>{user.nickname?.[0] || user.username?.[0] || 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.nickname || user.username} />
            <AvatarFallback>{user.nickname?.[0] || user.username?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{user.nickname || user.username}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={ROUTES.VIP} className="cursor-pointer">
            <Crown className="mr-2 h-4 w-4" />
            会员
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.PROFILE} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            个人中心
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={ROUTES.SETTINGS} className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            设置
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
