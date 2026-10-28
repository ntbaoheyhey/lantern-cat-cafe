import type { SyncStatusV2 } from '../../game/v2/syncStatus';
import type { GameLoopV2 } from '../../game/v2/loopV2';
import { useSyncStatusV2 } from '../../game/v2/useSyncStatus';

const labels = {
  live: ['●', 'Live'], hidden: ['☾', 'Hidden'], syncing: ['↻', 'Syncing…'],
  offline: ['○', 'Offline'], error: ['!', 'Sync error'],
} as const;

/** Ready for the status bar; the owning layout decides its placement. */
export function SyncStatus({ loop, status }: { loop?: GameLoopV2; status?: SyncStatusV2 }) {
  return status === undefined ? <LiveSyncStatus loop={loop} /> : <StatusLabel status={status} />;
}
function LiveSyncStatus({ loop }: { loop?: GameLoopV2 }) {
  return <StatusLabel status={useSyncStatusV2(loop)} />;
}
function StatusLabel({ status }: { status: SyncStatusV2 }) {
  const [icon, label] = labels[status];
  return <span role="status" aria-live="polite" aria-atomic="true" data-sync-status={status}
    style={{ color: 'var(--muted, #b8a9c9)', fontFamily: 'var(--font-body)', display: 'inline-flex', gap: 'var(--sp-1, 4px)' }}>
    <span aria-hidden="true">{icon}</span><span>{label}</span>
  </span>;
}
