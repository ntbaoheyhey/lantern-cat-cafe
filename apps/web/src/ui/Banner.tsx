import type { HTMLAttributes, ReactNode, Ref } from 'react';
export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  tone: 'offline' | 'error' | 'warning';
  children: ReactNode;
  ref?: Ref<HTMLDivElement>;
  action?: { label: string; onAction: () => void };
}
/** Persistent inline notice. Does not infer connectivity or make API calls. */
export function Banner({ tone, children, action, className = '', ref, role = 'status', ...props }: BannerProps) {
  return <div {...props} ref={ref} className={`ui-banner ${className}`} data-tone={tone} role={role} aria-live={role === 'alert' ? 'assertive' : 'polite'}>
    <span className="ui-banner-message">{children}</span>
    {action && <button type="button" className="pixel-btn--secondary" onClick={action.onAction}>{action.label}</button>}
  </div>;
}
