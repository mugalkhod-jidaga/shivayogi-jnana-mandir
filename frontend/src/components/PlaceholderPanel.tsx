import type { ReactNode } from 'react';

type PlaceholderPanelProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderPanel({ title, description, children }: PlaceholderPanelProps) {
  return (
    <div className="rounded-lg border border-dashed bg-muted/30 p-8 text-center">
      <h2 className="text-lg font-medium">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}
