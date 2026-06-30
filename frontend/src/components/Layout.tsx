import { useQueryClient } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useMe } from '@/hooks/useMe';
import { usePermissions } from '@/hooks/usePermissions';
import { useNavItems } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function Layout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { data: me } = useMe();
  const { hasPermission } = usePermissions();
  const { t } = useTranslation();
  const navItems = useNavItems();

  const visibleNavItems = navItems.filter((item) => hasPermission(item.permission));
  const displayName = me ? [me.firstName, me.lastName].filter(Boolean).join(' ') : 'Staff';
  const roleName = me?.roles[0]?.name ?? 'Staff';

  const handleSignOut = () => {
    void (async () => {
      await signOut();
      queryClient.clear();
      navigate('/login');
    })();
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="border-b px-6 py-5">
          <p className="text-sm font-semibold leading-tight">{t('appName')}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t('appSubtitle')}</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:px-6">
          <div className="min-w-0 md:hidden">
            <p className="truncate text-sm font-semibold">{t('appName')}</p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <LanguageToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{roleName}</p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium sm:hidden">
              {roleName}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="size-4" />
              <span className="hidden sm:inline">{t('actions.signOut')}</span>
            </Button>
          </div>
        </header>

        <div className="border-b px-4 py-2 md:hidden">
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
