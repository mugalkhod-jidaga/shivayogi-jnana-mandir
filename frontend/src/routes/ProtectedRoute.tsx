import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMe } from '@/hooks/useMe';

export function ProtectedRoute() {
  const { t } = useTranslation();
  const { session, isLoading: authLoading, signOut } = useAuth();
  const { data: me, isLoading: meLoading, isError } = useMe();
  const location = useLocation();

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </main>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (meLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('loadingProfile')}</p>
      </main>
    );
  }

  if (isError || !me) {
    void signOut();
    return <Navigate to="/login" replace />;
  }

  if (me.mustResetPassword && location.pathname !== '/reset-password') {
    return <Navigate to="/reset-password" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { t } = useTranslation();
  const { session, isLoading, signOut } = useAuth();
  const { data: me, isLoading: meLoading, isError } = useMe();

  if (isLoading || (session && meLoading)) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('loading')}</p>
      </main>
    );
  }

  if (session && isError) {
    void signOut();
    return <Navigate to="/login" replace />;
  }

  if (session && me) {
    return <Navigate to={me.mustResetPassword ? '/reset-password' : '/'} replace />;
  }

  return <Outlet />;
}
