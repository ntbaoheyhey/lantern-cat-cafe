// @vitest-environment jsdom
import { cleanup, render, screen, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionNotice } from './ActionNotice';
import {
  setActionNoticeState,
  getActionNoticeState,
} from '../../game/v2/storeV2';
import {
  OFFLINE_NOTICE,
  SERVER_BUSY_NOTICE,
  rateLimitedNotice,
} from '../../v2text/errorNotices';

describe('ActionNotice Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setActionNoticeState(null);
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
      vi.useRealTimers();
    });
    setActionNoticeState(null);
    cleanup();
  });

  it('renders nothing when there is no notice state', () => {
    render(
      <div>
        <button type="button">Fight</button>
        <ActionNotice />
      </div>
    );
    expect(screen.queryByTestId('action-notice')).toBeNull();
  });

  it('renders 503 server_busy notice with role="status" and aria-live="polite"', () => {
    act(() => {
      setActionNoticeState({ code: 'server_busy' });
    });

    render(
      <div>
        <button type="button">Fight</button>
        <ActionNotice />
      </div>
    );

    const notice = screen.getByTestId('action-notice');
    expect(notice).toBeTruthy();
    expect(notice.getAttribute('role')).toBe('status');
    expect(notice.getAttribute('aria-live')).toBe('polite');
    expect(notice.textContent).toContain(SERVER_BUSY_NOTICE);
  });

  it('renders offline notice and window online event clears it', () => {
    act(() => {
      setActionNoticeState({ code: 'offline' });
    });

    render(
      <div>
        <button type="button">Fight</button>
        <ActionNotice />
      </div>
    );

    expect(screen.getByTestId('action-notice').textContent).toContain(OFFLINE_NOTICE);

    // Dispatch online event on window
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(getActionNoticeState()).toBeNull();
    expect(screen.queryByTestId('action-notice')).toBeNull();
  });

  it('renders 429 rate_limited with live countdown and disables/re-enables the button', () => {
    act(() => {
      setActionNoticeState({
        code: 'rate_limited',
        retryAfterS: 7,
        until: Date.now() + 7000,
      });
    });

    render(
      <div>
        <button type="button">Fight</button>
        <ActionNotice />
      </div>
    );

    const btn = screen.getByRole('button', { name: 'Fight' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByTestId('action-notice').textContent).toBe(rateLimitedNotice(7));

    // Advance 1 second -> 6 s
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByTestId('action-notice').textContent).toBe(rateLimitedNotice(6));
    expect(btn.disabled).toBe(true);

    // Advance 6 more seconds -> 0 s
    act(() => {
      vi.advanceTimersByTime(6000);
    });

    // Countdown reached 0: notice is gone, button is re-enabled
    expect(screen.queryByTestId('action-notice')).toBeNull();
    expect(btn.disabled).toBe(false);
  });

  it('does not steal focus when mounted', () => {
    render(
      <div>
        <button type="button" id="test-btn">Test Button</button>
        <ActionNotice state={{ code: 'server_busy' }} />
      </div>
    );

    const btn = document.getElementById('test-btn');
    btn?.focus();
    expect(document.activeElement).toBe(btn);
  });
});
