import { act, cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ResourceGain } from './ResourceGain';

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });
it('shows only acknowledged gains, replaces the timer, and clears on spending', () => {
  vi.useFakeTimers();
  const view = render(<ResourceGain value={100} />);
  expect(view.container.textContent).toBe('');
  view.rerender(<ResourceGain value={125} />);
  expect(view.container.textContent).toBe('+25');
  act(() => vi.advanceTimersByTime(800));
  view.rerender(<ResourceGain value={140} />);
  act(() => vi.advanceTimersByTime(100));
  expect(view.container.textContent).toBe('+15');
  view.rerender(<ResourceGain value={90} />);
  expect(view.container.textContent).toBe('');
  expect(vi.getTimerCount()).toBe(0);
});
it('removes feedback on hidden tabs and releases timers on unmount', () => {
  vi.useFakeTimers();
  const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  const view = render(<ResourceGain value={0} />);
  view.rerender(<ResourceGain value={10} />);
  hidden.mockReturnValue(true);
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(view.container.textContent).toBe('');
  expect(vi.getTimerCount()).toBe(0);
  view.rerender(<ResourceGain value={20} />);
  expect(view.container.textContent).toBe('');
  hidden.mockReturnValue(false);
  view.rerender(<ResourceGain value={30} />);
  view.unmount();
  expect(vi.getTimerCount()).toBe(0);
});
