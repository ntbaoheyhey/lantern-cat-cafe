export type SyncStatusV2 = 'live' | 'hidden' | 'syncing' | 'offline' | 'error';
export interface SyncStatusInputV2 {
  visibility: DocumentVisibilityState;
  online: boolean;
  claimInFlight: boolean;
  lastError: string | null;
}

/** Visibility is a rendering/claim policy; only the network signal means offline. */
export function deriveSyncStatusV2(input: SyncStatusInputV2): SyncStatusV2 {
  if (input.visibility === 'hidden') return 'hidden';
  if (!input.online) return 'offline';
  if (input.claimInFlight) return 'syncing';
  if (input.lastError !== null) return 'error';
  return 'live';
}
