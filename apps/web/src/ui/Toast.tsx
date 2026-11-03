import { useEffect, useRef, useState } from 'react';
export type ToastTone = 'success' | 'warning' | 'error';
export interface ToastMessage { id: string; tone: ToastTone; message: string; durationMs?: number }
export interface ToastProps { toast: ToastMessage; onDismiss: (id: string) => void }
export const TOAST_DURATION_MS = 8000;
const labels: Record<ToastTone, string> = { success: 'Saved', warning: 'Heads up', error: 'Failed' };
export function Toast({ toast, onDismiss }: ToastProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const dismiss = useRef(onDismiss); dismiss.current = onDismiss;
  useEffect(() => {
    if (toast.tone === 'error' || hovered || focused) return;
    const timer = setTimeout(() => dismiss.current(toast.id), toast.durationMs ?? TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast.id, toast.message, toast.tone, toast.durationMs, hovered, focused]);
  return <div className="ui-toast" data-tone={toast.tone} role={toast.tone === 'error' ? 'alert' : 'status'}
    aria-live={toast.tone === 'error' ? 'assertive' : 'polite'} aria-atomic="true"
    onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    onFocus={() => setFocused(true)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <strong>{labels[toast.tone]}</strong><span>{toast.message}</span>
    <button type="button" aria-label={`Dismiss ${toast.message}`} onClick={() => onDismiss(toast.id)}>×</button>
  </div>;
}
export interface ToastHostProps { toasts: readonly ToastMessage[]; onDismiss: (id: string) => void }
export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  return <div className="ui-toast-host" role="region" aria-label="Notifications">{toasts.map(toast => <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />)}</div>;
}
