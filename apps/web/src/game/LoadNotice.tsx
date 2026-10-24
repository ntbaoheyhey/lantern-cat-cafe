import { GameApiError } from '../api/GameApi';
import { getGameLoop, useGameSnapshot } from './store';
import type { GameLoop } from './gameState';
import './loadNotice.css';

export const OFFLINE_TEXT = 'Mochi lost the signal. Check your connection and try again.';
export const SESSION_TEXT = 'Your session ended, so Mochi paused. Sign in again to keep playing.';
export const GENERIC_TEXT = 'Something knocked the yarn over. Please try again in a moment.';

export interface Failure {
  text: string;
  /** False when trying again cannot help (for example a session that ended). */
  retryable: boolean;
}

/** A plain message for a failed API call: never a raw error code. */
export function describeFailure(e: unknown): Failure {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { text: OFFLINE_TEXT, retryable: true };
  if (e instanceof GameApiError && e.code === 'unauthenticated') return { text: SESSION_TEXT, retryable: false };
  return { text: GENERIC_TEXT, retryable: true };
}

/** An error message with an optional Retry button. `className` keeps each tab's own error styling. */
export function ErrorNote({
  text,
  onRetry,
  className,
}: {
  text: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className="load-error">
      <p role="alert" className={className}>{text}</p>
      {onRetry && (
        <button type="button" className="pixel-btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * What a tab shows until the first server answer: a short wait message, or, if loading failed,
 * the failure with a Retry button.
 */
export function WaitingForServer({ what, loop = getGameLoop() }: { what: string; loop?: GameLoop }) {
  const { loadFailed } = useGameSnapshot(loop);
  if (!loadFailed) return <p className="load-note">Mochi is fetching {what}…</p>;
  return (
    <ErrorNote
      text={navigator.onLine === false ? OFFLINE_TEXT : "Mochi couldn't reach the café just now."}
      onRetry={() => void loop.retry()}
    />
  );
}
