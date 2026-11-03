import { test, expect, load, inspect } from '../support/server-fixture';

test('server fixture freezes at wall time when its clock advances before the pause command', async ({ page, request }) => {
  const pauseAt = page.clock.pauseAt.bind(page.clock);
  // Deterministic protocol interleaving, not a settling wait or retry. Time
  // passes after the caller chooses its target but before pauseAt receives it.
  page.clock.pauseAt = async (time) => {
    await page.clock.fastForward(1);
    await pauseAt(time);
  };
  const session = await load(page, request, 'stocked');
  page.clock.pauseAt = pauseAt;
  const frozen = await page.evaluate(() => Date.now());
  const state = await inspect(request, session);
  expect(state.raw.classId).not.toBeNull();
  expect(await page.evaluate(() => Date.now())).toBe(frozen);
  await page.clock.fastForward(1000);
  expect(await page.evaluate(() => Date.now())).toBe(frozen + 1000);
});
