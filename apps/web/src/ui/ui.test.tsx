// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Banner, ConfirmModal, EmptyState, Modal, Tabs, ToastHost } from './index';
afterEach(() => { cleanup(); vi.useRealTimers(); });

function DialogExample() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}>Open</button><ConfirmModal open={open} title="Confirm choice" onClose={() => setOpen(false)}
    confirmLabel="Save" onConfirm={() => setOpen(false)}><p>Review choice.</p><button disabled>Unavailable</button></ConfirmModal></>;
}
describe('shared UI', () => {
  it('labels modal, starts on Cancel, traps both directions, ignores disabled and restores opener after Escape', () => {
    render(<DialogExample />);
    const opener = screen.getByText('Open'); opener.focus(); fireEvent.click(opener);
    const dialog = screen.getByRole('dialog', { name: 'Confirm choice' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(document.activeElement).toBe(screen.getByText('Cancel'));
    expect(opener.closest('[inert]')).not.toBeNull();
    screen.getByText('Save').focus(); fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(screen.getByLabelText('Close Confirm choice'));
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(screen.getByText('Save'));
    opener.focus(); expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull(); expect(document.activeElement).toBe(opener);
    expect(opener.closest('[inert]')).toBeNull(); expect(opener.closest('[aria-hidden=true]')).toBeNull();
  });
  it('restores preexisting hidden/inert attributes and closes only on backdrop, not contents', () => {
    const background = document.createElement('div'); background.setAttribute('inert', ''); background.setAttribute('aria-hidden', 'true'); document.body.append(background);
    const close = vi.fn(); const { unmount } = render(<Modal open title="Review" onClose={close}>Inside</Modal>);
    fireEvent.click(screen.getByText('Inside')); expect(close).not.toHaveBeenCalled();
    fireEvent.click(document.querySelector('.ui-modal-backdrop')!); expect(close).toHaveBeenCalledTimes(1);
    unmount(); expect(background.getAttribute('aria-hidden')).toBe('true'); expect(background.hasAttribute('inert')).toBe(true); background.remove();
  });
  it('keeps the background locked when an older modal closes first, then restores it and the original opener', () => {
    const opener = document.createElement('button'); opener.textContent = 'Page opener'; document.body.append(opener); opener.focus();
    const view = (outer: boolean, inner: boolean) => <>
      <Modal open={outer} title="Outer" onClose={() => {}}><button>Outer action</button></Modal>
      <Modal open={inner} title="Inner" onClose={() => {}}><button>Inner action</button></Modal>
    </>;
    const { rerender, unmount } = render(view(true, false));
    try {
      screen.getByText('Outer action').focus(); rerender(view(true, true));
      expect(opener.hasAttribute('inert')).toBe(true);
      rerender(view(false, true));
      expect(opener.hasAttribute('inert')).toBe(true);
      expect(opener.getAttribute('aria-hidden')).toBe('true');
      expect(screen.getByRole('dialog', { name: 'Inner' }).contains(document.activeElement)).toBe(true);
      rerender(view(false, false));
      expect(opener.hasAttribute('inert')).toBe(false); expect(opener.hasAttribute('aria-hidden')).toBe(false);
      expect(document.activeElement).toBe(opener);
    } finally { unmount(); opener.remove(); }
  });
  it('makes the top dialog usable when two portals open in the same render', () => {
    const opener = document.createElement('button'); document.body.append(opener); opener.focus();
    const { unmount } = render(<>
      <Modal open title="First" onClose={() => {}}>First content</Modal>
      <Modal open title="Top" onClose={() => {}}>Top content</Modal>
    </>);
    try {
      const top = screen.getByRole('dialog', { name: 'Top' });
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      expect(top.closest('[inert]')).toBeNull();
      expect(top.contains(document.activeElement)).toBe(true);
      expect(opener.hasAttribute('inert')).toBe(true);
    } finally { unmount(); }
    expect(opener.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(opener); opener.remove();
  });
  it('success and warning dismiss on schedule while failure persists and can be closed', () => {
    vi.useFakeTimers(); const dismiss = vi.fn();
    render(<ToastHost onDismiss={dismiss} toasts={[{ id: 's', tone: 'success', message: 'Done' }, { id: 'w', tone: 'warning', message: 'Check' }, { id: 'e', tone: 'error', message: 'Failed request' }]} />);
    act(() => vi.advanceTimersByTime(7999)); expect(dismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1)); expect(dismiss.mock.calls).toEqual([['s'], ['w']]);
    act(() => vi.advanceTimersByTime(60000)); expect(dismiss).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('alert').textContent).toContain('Failed request');
    expect(screen.getAllByRole('status')).toHaveLength(2);
    fireEvent.click(screen.getByLabelText('Dismiss Failed request')); expect(dismiss).toHaveBeenLastCalledWith('e');
  });
  it('pauses toast while hovered or focused, restarting the interval afterwards', () => {
    vi.useFakeTimers(); const dismiss = vi.fn(); render(<ToastHost onDismiss={dismiss} toasts={[{ id: 'w', tone: 'warning', message: 'Read me', durationMs: 1000 }]} />);
    const toast = screen.getByRole('status'); fireEvent.mouseEnter(toast); act(() => vi.advanceTimersByTime(3000)); expect(dismiss).not.toHaveBeenCalled();
    fireEvent.mouseLeave(toast); fireEvent.focus(screen.getByRole('button')); act(() => vi.advanceTimersByTime(3000)); expect(dismiss).not.toHaveBeenCalled();
    fireEvent.blur(screen.getByRole('button'), { relatedTarget: document.body }); act(() => vi.advanceTimersByTime(999)); expect(dismiss).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1)); expect(dismiss).toHaveBeenCalledWith('w');
  });
  it('tabs have linked panels and roving automatic activation with wrap, Home and End', () => {
    render(<Tabs label="Sections" tabs={[{ id: 'one', label: 'One', content: 'First panel' }, { id: 'two', label: 'Two', content: 'Second panel' }]} />);
    const one = screen.getByRole('tab', { name: 'One' }), two = screen.getByRole('tab', { name: 'Two' }); one.focus();
    fireEvent.keyDown(one, { key: 'ArrowLeft' }); expect(document.activeElement).toBe(two); expect(two.getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tabpanel').id).toBe(two.getAttribute('aria-controls')); expect(one.tabIndex).toBe(-1);
    fireEvent.keyDown(two, { key: 'Home' }); expect(document.activeElement).toBe(one);
    fireEvent.keyDown(one, { key: 'End' }); expect(document.activeElement).toBe(two);
    fireEvent.keyDown(two, { key: 'ArrowRight' }); expect(document.activeElement).toBe(one);
  });
  it('banner and empty-state actions announce and invoke their owners', () => {
    const retry = vi.fn(); render(<><Banner tone="offline" action={{ label: 'Retry', onAction: retry }}>Offline</Banner><EmptyState title="No items">Come back later</EmptyState></>);
    expect(screen.getByRole('status').getAttribute('data-tone')).toBe('offline'); fireEvent.click(screen.getByText('Retry')); expect(retry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('heading', { name: 'No items' })).toBeTruthy();
  });
});
