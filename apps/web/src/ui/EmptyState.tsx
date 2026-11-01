import type { ReactNode } from 'react';
export interface EmptyStateProps { title: string; children: ReactNode; illustration?: ReactNode; action?: { label: string; onAction: () => void } }
export function EmptyState({ title, children, illustration, action }: EmptyStateProps) {
  return <div className="ui-empty"><div aria-hidden="true">{illustration}</div><h3>{title}</h3><div>{children}</div>
    {action && <button type="button" className="pixel-btn--secondary" onClick={action.onAction}>{action.label}</button>}
  </div>;
}
