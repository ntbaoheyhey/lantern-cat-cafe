import { useLayoutEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  description?: string;
  className?: string;
  backdropClassName?: string;
  closeLabel?: string;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
}

const stack: HTMLElement[] = [];
const background = new Map<Element, { inert: string | null; hidden: string | null }>();
let firstOpener: HTMLElement | null = null;
function restoreBackgroundElement(el: Element, saved: { inert: string | null; hidden: string | null }) {
  if (saved.inert === null) el.removeAttribute('inert'); else el.setAttribute('inert', saved.inert);
  if (saved.hidden === null) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', saved.hidden);
}
/** Restore original attributes only when the last dialog closes, regardless of cleanup order. */
function syncBackground() {
  const topBackdrop = stack.at(-1)?.parentElement;
  if (!topBackdrop) {
    for (const [el, saved] of background) restoreBackgroundElement(el, saved);
    background.clear();
    return;
  }
  for (const el of document.body.children) {
    if (!background.has(el)) background.set(el, { inert: el.getAttribute('inert'), hidden: el.getAttribute('aria-hidden') });
    if (el === topBackdrop) restoreBackgroundElement(el, background.get(el)!);
    else { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
  }
}
const selector = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]';
function focusable(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(selector)).filter(el => {
    if (el.tabIndex < 0 || el.matches(':disabled') || el.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    for (let node: HTMLElement | null = el; node && node !== dialog; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
    }
    return true;
  });
}

/** Controlled, portalled dialog. Escape/backdrop close; background is inert until cleanup. */
export function Modal({ open, title, description, children, onClose, initialFocusRef, returnFocusRef,
  className = '', backdropClassName = '', closeLabel, showCloseButton = true, closeOnBackdrop = true }: ModalProps) {
  const id = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useLayoutEffect(() => {
    if (!open || !dialog.current || !backdrop.current) return;
    const node = dialog.current;
    const opener = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    if (stack.length === 0) firstOpener = opener;
    stack.push(node);
    syncBackground();
    (initialFocusRef?.current ?? focusable(node)[0] ?? node).focus();
    const onKey = (event: KeyboardEvent) => {
      if (stack.at(-1) !== node) return;
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopPropagation(); close.current();
      } else if (event.key === 'Tab') {
        const items = focusable(node);
        const first = items[0] ?? node, last = items.at(-1) ?? node;
        if (!node.contains(document.activeElement) || items.length === 0 ||
            (event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault(); (event.shiftKey ? last : first).focus();
        }
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (stack.at(-1) === node && !node.contains(event.target as Node)) (focusable(node)[0] ?? node).focus();
    };
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocus);
      stack.splice(stack.indexOf(node), 1);
      syncBackground();
      const remaining = stack.at(-1);
      if (remaining) {
        if (opener?.isConnected && remaining.contains(opener)) opener.focus();
        else if (!remaining.contains(document.activeElement)) (focusable(remaining)[0] ?? remaining).focus();
      } else {
        const preferred = returnFocusRef?.current;
        const target = preferred?.isConnected ? preferred : opener?.isConnected ? opener : firstOpener;
        firstOpener = null;
        const focusFallback = () => {
          const available = focusable(document.body);
          (available.find(el => el.getAttribute('role') === 'tab' && el.getAttribute('aria-selected') === 'true') ?? available[0])?.focus();
        };
        if (target?.isConnected && target !== document.body && !target.matches(':disabled')) target.focus();
        else focusFallback();
        // Cleanup can precede removal of the opener in the same React commit.
        // Repair only lost focus; a newly opened modal or a new focus target wins.
        queueMicrotask(() => {
          if (stack.length === 0 && document.activeElement === document.body) focusFallback();
        });
      }
    };
  }, [open, initialFocusRef, returnFocusRef]);
  if (!open) return null;
  return createPortal(
    <div className={`ui-modal-backdrop ${backdropClassName}`.trim()} ref={backdrop}
      onClick={event => { if (closeOnBackdrop && event.target === event.currentTarget) onClose(); }}>
      <div className={`ui-modal ${className}`.trim()} ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined} tabIndex={-1}>
        <div className="ui-modal-heading"><h2 id={`${id}-title`}>{title}</h2>
          {showCloseButton && <button type="button" className="ui-modal-close" aria-label={closeLabel ?? `Close ${title}`} onClick={onClose}>×</button>}
        </div>
        {description && <p id={`${id}-description`}>{description}</p>}
        {children}
      </div>
    </div>, document.body,
  );
}
