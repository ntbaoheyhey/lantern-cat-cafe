import type { GameLoopV2 } from '../../game/v2/loopV2';
import { useSyncStatusV2 } from '../../game/v2/useSyncStatus';

const labels = {
  live: ['●', 'Live'], hidden: ['☾', 'Hidden'], syncing: ['↻', 'Syncing…'],
  offline: ['○', 'Offline'], error: ['!', 'Sync error'],
} as const;

/** Ready for the status bar; the owning layout decides its placement. */
export function SyncStatus({ loop }: { loop?: GameLoopV2 }) {
  const status = useSyncStatusV2(loop);
  const [icon, label] = labels[status];
  return <span role="status" aria-live="polite" aria-atomic="true" data-sync-status={status}
    style={{ color: 'var(--muted, #b8a9c9)', fontFamily: 'var(--font-body)', display: 'inline-flex', gap: 'var(--sp-1, 4px)' }}>
    <span aria-hidden="true">{icon}</span><span>{label}</span>
  </span>;
}
