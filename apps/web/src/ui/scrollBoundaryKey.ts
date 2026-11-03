import type { KeyboardEvent } from 'react';

/** Make Home/End deterministic when a focusable scroll region receives the key itself. */
export function scrollBoundaryKey(event: KeyboardEvent<HTMLElement>) {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
      (event.key !== 'Home' && event.key !== 'End')) return;
  const target = event.target;
  if (!(target instanceof HTMLElement) || target !== document.activeElement || target.tabIndex < 0 ||
      target.matches('input, textarea, select, button, a, [contenteditable="true"]') ||
      !/^(auto|scroll)$/.test(getComputedStyle(target).overflowY)) return;
  // Native smooth scrolling can leave a queued End animation running after Home.
  event.preventDefault();
  target.scrollTo({ top: event.key === 'Home' ? 0 : target.scrollHeight, behavior: 'instant' });
}
