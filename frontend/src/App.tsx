import { Button } from '@/components/ui/button';
import { env } from '@/lib/env';

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Shivayogi Jnana Mandir</h1>
        <p className="mt-2 text-muted-foreground">Divine Charitable Trust ERP</p>
      </div>

      <Button type="button">Frontend scaffold ready</Button>

      <dl className="rounded-lg border bg-card p-4 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">API:</dt>
          <dd className="font-mono">{env.apiBaseUrl}</dd>
        </div>
        <div className="mt-1 flex gap-2">
          <dt className="text-muted-foreground">Env:</dt>
          <dd>{env.isConfigured ? 'configured' : 'missing VITE_* variables'}</dd>
        </div>
      </dl>
    </main>
  );
}

export default App;
