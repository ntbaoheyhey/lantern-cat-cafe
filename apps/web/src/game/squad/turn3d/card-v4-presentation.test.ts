import { describe, expect, it, vi } from 'vitest';
import bossEvents from '../../../../../../tools/cardrpg-look/fixtures/a4-boss.json';
import earnedEvents from '../../../../../../tools/cardrpg-look/fixtures/a4-earned.json';
import { bossCueV4, earnedRevealV4, presentationEventV4, presentationV4, skillReadinessV4, standingPlanText } from './card-v4-presentation';
import { TurnScene } from './scene';

describe('A4 read-only presentation contract', () => {
  it('leaves old battles and future versions alone', () => {
    expect(presentationV4({})).toBeUndefined();
    expect(presentationV4({ v4: { version: 2, plan: {}, events: [] } })).toBeUndefined();
    expect(presentationV4({ v4: { version: 1, plan: null, events: [] } })).toBeUndefined();
    expect(presentationEventV4({ version: 1, sequence: -1, round: 0, kind: 'boss-phase', text: 'Bad receipt' })).toBe(false);
    expect(presentationEventV4({ version: 1, sequence: 1, round: 0, kind: 'crew-active', text: 'Incomplete crew' })).toBe(false);
  });
  it('reads a standing plan and rejects malformed events without mutating input', () => {
    const battle = { v4: { version: 1, plan: { focus: 'leader', care: 'protect' }, events: [...bossEvents, null, { version: 2 }] } };
    const original = JSON.stringify(battle), view = presentationV4(battle)!;
    expect(view.events).toHaveLength(2);
    expect(standingPlanText(view)).toBe('Focus the leader · Protect the crew');
    expect(JSON.stringify(battle)).toBe(original);
  });
  it('shows fixed opening delay and actual cooldown without charge or energy', () => {
    const actor = { turns: 0, cooldowns: { ultimate: 4 }, passiveUsed: false };
    const skill = { id: 'ultimate', type: 'ultimate', effects: [] };
    expect(skillReadinessV4(actor, skill)).toBe('4 turns');
    actor.cooldowns.ultimate = 0;
    expect(skillReadinessV4(actor, skill)).toBe('2 turns');
    actor.turns = 1; expect(skillReadinessV4(actor, skill)).toBe('1 turn');
    actor.turns = 2; expect(skillReadinessV4(actor, skill)).toBe('Ready');
    expect(skillReadinessV4({ ...actor, passiveUsed: true }, { ...skill, effects: [{ kind: 'revive' }] })).toBe('Used this battle');
  });
  it.each(bossEvents)('bounds $kind from the real A fixture inside the existing action', event => {
    expect(presentationEventV4(event)).toBe(true);
    if (!presentationEventV4(event)) throw Error('Fixture contract changed');
    const events = [event], limit = event.kind === 'boss-phase' ? 400 : 800;
    expect(bossCueV4(events, 299, 300, 1500)).toBeUndefined();
    expect(bossCueV4(events, 300, 300, 1500)?.duration).toBe(limit);
    expect(bossCueV4(events, 300 + limit, 300, 1500)).toBeUndefined();
    expect(bossCueV4(events, 300, 300, 450)?.duration).toBe(150);
    expect(bossCueV4(events, 450, 300, 450)).toBeUndefined();
  });
  it('accepts exact earned/duplicate receipts and refuses future/malformed receipts', () => {
    expect(earnedRevealV4(earnedEvents.events[0])?.itemId).toBe('sorrel');
    expect(earnedRevealV4(earnedEvents.events[1])?.duplicate).toBe(2);
    expect(earnedRevealV4({ ...earnedEvents.events[0], version: 2 })).toBeUndefined();
    expect(earnedRevealV4({ ...earnedEvents.events[0], duplicate: NaN })).toBeUndefined();
    expect(earnedRevealV4({ ...earnedEvents.events[0], draw: 0 })).toBeUndefined();
    expect(earnedRevealV4({ ...earnedEvents.events[0], duplicate: .5 })).toBeUndefined();
  });
  it('renders an earned receipt once, using the existing entrance and no reward mutation', async () => {
    const receipt = earnedEvents.events[0]!, host = document.createElement('div');
    const view = { actors: [{ id: 'cat', role: 'alchemist' }], models: { cat: 'sorrel' }, earnedReveal: receipt };
    const runtime = { warming: Promise.resolve(), disposed: false, ready: true, view: () => view,
      ensure: vi.fn(async () => undefined), puppets: new Map([['cat', {}]]), time: 10, host,
      entrance: undefined as { asset: string; startedAt: number } | undefined };
    const scene = runtime as unknown as TurnScene, before = JSON.stringify(receipt);
    expect(await TurnScene.prototype.playEntrance.call(scene, 'sorrel')).toBe(true);
    expect(host.querySelector('[role="status"]')?.textContent).toBe(receipt.text);
    expect(runtime.entrance?.startedAt).toBe(10);
    runtime.time = 11;
    expect(await TurnScene.prototype.playEntrance.call(scene, 'sorrel')).toBe(true);
    expect(runtime.entrance?.startedAt).toBe(10);
    expect(host.children).toHaveLength(1);
    expect(JSON.stringify(receipt)).toBe(before);
    expect(await TurnScene.prototype.playEntrance.call(scene, 'mochi', receipt)).toBe(false);
  });
  it('does not announce a receipt after a preview is disposed while loading', async () => {
    const host = document.createElement('div'), receipt = earnedEvents.events[0]!;
    let ready!: () => void;
    const runtime = { warming: new Promise<void>(resolve => { ready = resolve; }), disposed: false,
      ready: true, view: () => ({ actors: [], earnedReveal: receipt }), host };
    const pending = TurnScene.prototype.playEntrance.call(runtime as unknown as TurnScene, 'sorrel', receipt);
    runtime.disposed = true; ready();
    expect(await pending).toBe(false);
    expect(host.childElementCount).toBe(0);
  });
  it('discards an entrance when the preview changes during model preparation', async () => {
    const host = document.createElement('div'), receipt = earnedEvents.events[0]!;
    const view = { actors: [{ id: 'cat', role: 'alchemist' }], models: { cat: 'sorrel' } };
    const runtime = { warming: Promise.resolve(), disposed: false, ready: true, host,
      view: () => view, puppets: new Map([['cat', {}]]),
      ensure: async () => { view.models.cat = 'mochi'; } };
    expect(await TurnScene.prototype.playEntrance.call(runtime as unknown as TurnScene, 'sorrel', receipt)).toBe(false);
    expect(host.childElementCount).toBe(0);
  });
});
