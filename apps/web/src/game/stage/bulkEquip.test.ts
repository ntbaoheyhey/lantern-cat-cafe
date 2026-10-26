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
  const equip = vi.spyOn(api, 'equip');
  await queue.equip(null, 'weapon');
  expect(equip).toHaveBeenCalledWith(null, 'weapon');
  expect(loop.getSnapshot().state!.equipped.weapon).toBeNull();
});
