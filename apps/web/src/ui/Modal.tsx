import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  description?: string;
}

const stack: HTMLElement[] = [];
const selector = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]';
function focusable(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(selector)).filter(el => {
    if (el.tabIndex < 0 || el.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
    for (let node: HTMLElement | null = el; node && node !== dialog; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
    }
    return true;
  });
}

/** Controlled, portalled dialog. Escape/backdrop close; background is inert until cleanup. */
export function Modal({ open, title, description, children, onClose, initialFocusRef, returnFocusRef }: ModalProps) {
  const id = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open || !dialog.current || !backdrop.current) return;
    const node = dialog.current;
    const opener = returnFocusRef?.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const siblings = Array.from(document.body.children).filter(el => el !== backdrop.current);
    const previous = siblings.map(el => ({ el, inert: el.getAttribute('inert'), hidden: el.getAttribute('aria-hidden') }));
    stack.push(node);
    (initialFocusRef?.current ?? focusable(node)[0] ?? node).focus();
    for (const { el } of previous) { el.setAttribute('inert', ''); el.setAttribute('aria-hidden', 'true'); }
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
      for (const { el, inert, hidden } of previous) {
        if (inert === null) el.removeAttribute('inert'); else el.setAttribute('inert', inert);
        if (hidden === null) el.removeAttribute('aria-hidden'); else el.setAttribute('aria-hidden', hidden);
      }
      if (opener?.isConnected) opener.focus();
    };
  }, [open, initialFocusRef, returnFocusRef]);
  if (!open) return null;
  return createPortal(
    <div className="ui-modal-backdrop" ref={backdrop} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="ui-modal" ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}
        aria-describedby={description ? `${id}-description` : undefined} tabIndex={-1}>
        <div className="ui-modal-heading"><h2 id={`${id}-title`}>{title}</h2>
          <button type="button" className="ui-modal-close" aria-label={`Close ${title}`} onClick={onClose}>×</button>
        </div>
        {description && <p id={`${id}-description`}>{description}</p>}
        {children}
      </div>
    </div>, document.body,
  );
}
