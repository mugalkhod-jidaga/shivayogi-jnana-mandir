import { Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useMe } from '@/hooks/useMe';

export function HomePage() {
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const { data: me, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading profile…</p>
      </main>
    );
  }

  if (isError || !me) {
    return <Navigate to="/login" replace />;
  }

  const displayName = [me.firstName, me.lastName].filter(Boolean).join(' ');
  const roleName = me.roles[0]?.name ?? 'Staff';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Welcome, {displayName}</h1>
        <p className="mt-1 text-muted-foreground">{roleName}</p>
      </div>

      <p className="max-w-md text-center text-sm text-muted-foreground">
        App shell and navigation arrive in FE-2. You are signed in and ready to continue.
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          void (async () => {
            await signOut();
            queryClient.clear();
          })();
        }}
      >
        Sign out
      </Button>
    </main>
  );
}
