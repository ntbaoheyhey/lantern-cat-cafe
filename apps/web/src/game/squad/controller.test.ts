import { describe, expect, it } from 'vitest';
import { SquadController } from './controller';
import { squadEnabled } from './gate';
import { SQUAD_CONFIG as C } from '@taskbar-hero/game-rules/src/squad/config';
import { run } from '@taskbar-hero/game-rules/src/squad/engine';

describe('local squad owner', () => {
  it('requires explicit guest context and stays off otherwise', () => {
    expect(squadEnabled('', true)).toBe(false);
    expect(squadEnabled('?squad=1', false)).toBe(false);
    expect(squadEnabled('?squad=1', true)).toBe(true);
    expect(squadEnabled('?squad=0', true)).toBe(false);
  });
  it('never advances a paused or hidden battle', () => {
    const c = new SquadController(); c.tick(5000, false); expect(c.battle.time).toBe(0);
    c.running = true; c.tick(5000, true); expect(c.battle.time).toBe(0);
    c.tick(100, false); expect(c.battle.time).toBe(100);
  });
  it('passes foreground hitches intact and does not retain a hidden catch-up delta', () => {
    const c = new SquadController(); c.running = true;
    c.tick(3749, false); expect(c.battle.time).toBe(3700);
    c.tick(60000, true); c.tick(1, false); expect(c.battle.time).toBe(3750);
  });
  it('previewing queued target, tactic and auto commands does not advance time', () => {
    const c = new SquadController(), target = c.battle.actors[3]!.id;
    c.command({ type: 'priority', target }); c.command({ type: 'tactic', value: 'caster' });
    c.command({ type: 'auto', hero: 'witch', enabled: false });
    expect(c.priority).toBe(target); expect(c.tactic).toBe('caster'); expect(c.autoFor('witch')).toBe(false);
    expect(c.battle.time).toBe(0);
    c.running = true; c.tick(C.tickMs, false);
    expect(c.battle.priority).toBe(target); expect(c.battle.tactic).toBe('caster');
  });
  it('streams events once and resets local counters on retry', () => {
    const c = new SquadController(); const received: number[] = []; let resets = 0;
    const stop = c.subscribeEvents((events, reset) => { if (reset) resets++; else received.push(...events.map(e => e.seq)); });
    c.running = true; c.tick(500, false); c.tick(500, false);
    expect(new Set(received).size).toBe(received.length);
    c.reset({ seed: 1, encounter: 'boss', preset: 'lanternbreakers' });
    expect(resets).toBe(1); expect(c.battle.fishFound).toBe(0); expect(c.running).toBe(false); stop();
  });
  it('stops after a settled result without another reward or event', () => {
    const c = new SquadController(); run(c.battle); const count = c.battle.events.length;
    c.running = true; c.tick(100000, false); expect(c.battle.events).toHaveLength(count);
    expect(c.battle.events.filter(e => e.type === 'reward')).toHaveLength(1);
  });
});
