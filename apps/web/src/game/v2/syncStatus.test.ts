import { expect, it } from 'vitest';
import { deriveSyncStatusV2, type SyncStatusInputV2 } from './syncStatus';
const base: SyncStatusInputV2 = { visibility: 'visible', online: true, claimInFlight: false, lastError: null };
it.each([
  [{}, 'live'],
  [{ visibility: 'hidden' }, 'hidden'],
  [{ online: false }, 'offline'],
  [{ claimInFlight: true }, 'syncing'],
  [{ lastError: 'Failed request' }, 'error'],
  [{ visibility: 'hidden', online: false, claimInFlight: true, lastError: 'Failed' }, 'hidden'],
  [{ online: false, claimInFlight: true, lastError: 'Failed' }, 'offline'],
  [{ claimInFlight: true, lastError: 'Failed' }, 'syncing'],
] as [Partial<SyncStatusInputV2>, string][])('derives %j as %s', (patch, status) => {
  expect(deriveSyncStatusV2({ ...base, ...patch })).toBe(status);
});
