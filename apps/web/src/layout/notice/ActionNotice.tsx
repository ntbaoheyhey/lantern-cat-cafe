import { useEffect, useRef, useState } from 'react';
import {
  OFFLINE_NOTICE,
  SERVER_BUSY_NOTICE,
  rateLimitedNotice,
} from '../../v2text/errorNotices';
import {
  setActionNoticeState,
  useActionNoticeState,
  type ActionNoticeState,
} from '../../game/v2/storeV2';
import './ActionNotice.css';

export interface ActionNoticeProps {
  /** Optional state override for testing or isolated usage. */
  state?: ActionNoticeState | null;
  onClear?: () => void;
}

export function ActionNotice({ state: propState, onClear }: ActionNoticeProps) {
  const storeState = useActionNoticeState();
  const activeState = propState !== undefined ? propState : storeState;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanelHidden, setIsPanelHidden] = useState(false);

  const retrySeconds =
    activeState?.code === 'rate_limited'
      ? Math.max(
          1,
          Math.ceil(
            ((activeState.until ?? Date.now() + (activeState.retryAfterS ?? 5) * 1000) - Date.now()) / 1000
          )
        )
      : 0;

  const [secondsLeft, setSecondsLeft] = useState<number>(retrySeconds);

  // Sync secondsLeft when rate_limited state changes
  useEffect(() => {
    if (activeState?.code === 'rate_limited') {
      const targetUntil =
        activeState.until ?? Date.now() + (activeState.retryAfterS ?? 5) * 1000;
      const initialS = Math.max(0, Math.ceil((targetUntil - Date.now()) / 1000));
      setSecondsLeft(initialS);

      const updateCountdown = () => {
        const remainingMs = targetUntil - Date.now();
        const s = Math.max(0, Math.ceil(remainingMs / 1000));
        setSecondsLeft(s);
        if (s <= 0) {
          if (onClear) onClear();
          else setActionNoticeState(null);
        }
      };

      const interval = setInterval(updateCountdown, 250);
      return () => clearInterval(interval);
    }
  }, [activeState?.code, activeState?.until, activeState?.retryAfterS, onClear]);

  // Check if enclosing panel has [hidden]
  useEffect(() => {
    const checkHidden = () => {
      const panel = containerRef.current?.closest('.v2-tabpanel');
      if (panel) {
        setIsPanelHidden(panel.hasAttribute('hidden'));
      }
    };
    checkHidden();
    const panel = containerRef.current?.closest('.v2-tabpanel');
    if (panel) {
      const obs = new MutationObserver(checkHidden);
      obs.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
      return () => obs.disconnect();
    }
  }, []);

  // Action button disabling during countdown
  useEffect(() => {
    if (activeState?.code !== 'rate_limited' || secondsLeft <= 0) return;

    const root =
      containerRef.current?.closest(
        '[role="tabpanel"], section, .boss-gate-panel, .forge-panel, .bag, .character-panel'
      ) ?? containerRef.current?.parentElement;
    if (!root) return;

    const isTargetButton = (btn: HTMLButtonElement) => {
      if (btn.getAttribute('role') === 'tab') return false;
      if (btn.closest('[role="tablist"]')) return false;
      if (btn.getAttribute('aria-label') === 'Dismiss message') return false;
      if (btn.classList.contains('v2-tab')) return false;
      if (btn.classList.contains('boss-chapter-btn')) return false;
      if (containerRef.current?.contains(btn)) return false;
      return true;
    };

    const disabledButtons = new Set<HTMLButtonElement>();

    const disableButtons = () => {
      const allButtons = root.querySelectorAll<HTMLButtonElement>('button');
      allButtons.forEach((btn) => {
        if (isTargetButton(btn) && !btn.disabled) {
          btn.disabled = true;
          btn.setAttribute('data-disabled-by-action-notice', 'true');
          disabledButtons.add(btn);
        }
      });
    };

    disableButtons();

    const observer = new MutationObserver(() => {
      disableButtons();
    });
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });

    return () => {
      observer.disconnect();
      disabledButtons.forEach((btn) => {
        if (btn.getAttribute('data-disabled-by-action-notice') === 'true') {
          btn.removeAttribute('data-disabled-by-action-notice');
          btn.disabled = false;
        }
      });
    };
  }, [activeState?.code, secondsLeft]);

  if (!activeState || isPanelHidden) return null;
  if (activeState.code === 'rate_limited' && secondsLeft <= 0) return null;

  let text = '';
  if (activeState.code === 'rate_limited') {
    text = rateLimitedNotice(secondsLeft);
  } else if (activeState.code === 'server_busy') {
    text = SERVER_BUSY_NOTICE;
  } else if (activeState.code === 'offline') {
    text = OFFLINE_NOTICE;
  }

  return (
    <div
      ref={containerRef}
      role="status"
      aria-live="polite"
      data-testid="action-notice"
      className="action-notice"
    >
      <span className="action-notice-text">{text}</span>
    </div>
  );
}
