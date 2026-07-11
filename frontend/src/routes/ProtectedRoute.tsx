import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMe } from '@/hooks/useMe';
import { clearMeCache } from '@/lib/meCache';

function AuthBootScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">{message}</p>
    </main>
  );
}

export function ProtectedRoute() {
  const { t } = useTranslation();
  const { session, isLoading: authLoading, signOut } = useAuth();
  const { data: me, isPending: mePending, isError, isFetching } = useMe();
  const location = useLocation();

  if (authLoading) {
    return <AuthBootScreen message={t('loading')} />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // No cached profile yet — wait for first /me. Cached profile → render shell immediately
  // while /me refreshes in the background (initialData + initialDataUpdatedAt: 0).
  if (!me && (mePending || isFetching)) {
    return <AuthBootScreen message={t('loadingProfile')} />;
  }

  if (isError || !me) {
    clearMeCache();
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
  const { data: me, isPending: mePending, isError, isFetching } = useMe();

  if (isLoading || (session && !me && (mePending || isFetching))) {
    return <AuthBootScreen message={t('loading')} />;
  }

  if (session && isError) {
    clearMeCache();
    void signOut();
    return <Navigate to="/login" replace />;
  }

  if (session && me) {
    return <Navigate to={me.mustResetPassword ? '/reset-password' : '/'} replace />;
  }

  return <Outlet />;
}
