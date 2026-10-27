// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { createEquipQueueV2 } from '../v2/storeV2';
import { GameLoopV2 } from '../v2/loopV2';
import { MockGameApiV2, MOCK_V2_STORAGE_KEY } from '../../api/MockGameApiV2';
import { mockV2Save } from '../../api/mockV2Fixtures';

const cleanups: (() => void)[] = [];
afterEach(() => { cleanups.splice(0).forEach(fn => fn()); vi.restoreAllMocks(); });
async function setup() {
  const nowMs = Date.now();
  const save = mockV2Save('midGame', { nowMs, classId: 'warrior' });
  const upgrades = save.state.items.filter(i => i.slot === 'weapon' || i.slot === 'helmet');
  upgrades.forEach(i => { i.equipped = false; });
  const storage = { getItem: (key: string) => key === MOCK_V2_STORAGE_KEY ? JSON.stringify(save) : null, setItem: vi.fn(), removeItem: vi.fn() };
  const api = new MockGameApiV2({ storage, now: () => nowMs });
  const loop = new GameLoopV2({ api });
  await loop.start(document);
  const queue = createEquipQueueV2(loop);
  cleanups.push(() => { queue.dispose(); loop.stop(); });
  return { api, loop, queue, upgrades };
}
it('applies both same-click upgrades through the real busy-guarded loop', async () => {
  const { api, loop, queue, upgrades } = await setup();
  const equip = vi.spyOn(api, 'equip');
  expect(upgrades).toHaveLength(2);
  await Promise.all(upgrades.map(i => queue.equip(i.id, i.slot)));
  expect(equip).toHaveBeenCalledTimes(2);
  for (const i of upgrades) expect(loop.getSnapshot().state!.equipped[i.slot]).toBe(i.id);
  expect(loop.getSnapshot().busy).toBeNull();
});
it('does not dispatch pending equipment after an account switch', async () => {
  const { api, loop, queue, upgrades } = await setup();
  let release!: () => void;
  const original = api.equip.bind(api);
  const equip = vi.spyOn(api, 'equip').mockImplementationOnce(async (...args) => {
    await new Promise<void>(resolve => { release = resolve; });
    return original(...args);
  });
  const pending = upgrades.map(i => queue.equip(i.id, i.slot));
  await vi.waitFor(() => expect(equip).toHaveBeenCalledOnce());
  const other = new MockGameApiV2({ storage: null });
  const otherEquip = vi.spyOn(other, 'equip');
  loop.switchApi(other);
  release();
  await Promise.all(pending);
  expect(equip).toHaveBeenCalledOnce();
  expect(otherEquip).not.toHaveBeenCalled();
});
it('cancels queued callbacks when the stage is disposed', async () => {
  const { api, queue, upgrades } = await setup();
  const equip = vi.spyOn(api, 'equip');
  const pending = upgrades.map(i => queue.equip(i.id, i.slot));
  queue.dispose();
  await Promise.all(pending);
  expect(equip).not.toHaveBeenCalled();
});
it('allows unequipping with null through the queue', async () => {
  const { api, loop, queue } = await setup();
  const weapon = loop.getSnapshot().state!.inventory.find(i => i.slot === 'weapon')!;
  await queue.equip(weapon.id, 'weapon');
  const equip = vi.spyOn(api, 'equip');
  await queue.equip(null, 'weapon');
  expect(equip).toHaveBeenCalledWith(null, 'weapon');
  expect(loop.getSnapshot().state!.equipped.weapon).toBeNull();
});
it('deduplicates a double Equip best click, reports two intents immediately and skips confirmed equips', async () => {
  const { api, loop, queue, upgrades } = await setup();
  let release!: () => void;
  const original = api.equip.bind(api);
  const equip = vi.spyOn(api, 'equip').mockImplementationOnce(async (...args) => {
    await new Promise<void>(yes => { release = yes; });
    return original(...args);
  });
  const first = upgrades.map(i => queue.equip(i.id, i.slot));
  expect(loop.getSnapshot().queued).toBe(2);
  const second = upgrades.map(i => queue.equip(i.id, i.slot));
  expect(second[0]).toBe(first[0]);
  expect(second[1]).toBe(first[1]);
  expect(loop.getSnapshot().queued).toBe(2);
  await vi.waitFor(() => expect(equip).toHaveBeenCalledOnce());
  expect(loop.getSnapshot().pending).toEqual({ action: 'equip', itemId: upgrades[0]!.id, slot: upgrades[0]!.slot });
  release();
  await Promise.all([...first, ...second]);
  expect(equip).toHaveBeenCalledTimes(2);
  expect(loop.getSnapshot().queued).toBe(0);
  await Promise.all(upgrades.map(i => queue.equip(i.id, i.slot)));
  expect(equip).toHaveBeenCalledTimes(2);
});
it('skips an already empty slot', async () => {
  const { api, queue } = await setup();
  const equip = vi.spyOn(api, 'equip');
  await queue.equip(null, 'weapon');
  expect(equip).not.toHaveBeenCalled();
});
it('waits behind another action and continues after a refused equip without inventing success', async () => {
  const { api, loop, queue, upgrades } = await setup();
  let release!: () => void;
  const original = api.setLocked.bind(api);
  vi.spyOn(api, 'setLocked').mockImplementationOnce(async (...args) => {
    await new Promise<void>(yes => { release = yes; });
    return original(...args);
  });
  const locking = loop.setLocked(upgrades[0]!.id, true);
  await vi.waitFor(() => expect(release).toBeTypeOf('function'));
  const equip = vi.spyOn(api, 'equip').mockRejectedValueOnce({ code: 'stale' });
  const pending = upgrades.map(i => queue.equip(i.id, i.slot));
  await Promise.resolve();
  expect(equip).not.toHaveBeenCalled();
  release(); await locking; await Promise.all(pending);
  expect(equip).toHaveBeenCalledTimes(2);
  expect(loop.getSnapshot().state!.equipped[upgrades[0]!.slot]).toBeNull();
  expect(loop.getSnapshot().state!.equipped[upgrades[1]!.slot]).toBe(upgrades[1]!.id);
  expect(loop.getSnapshot().queued).toBe(0);
});
