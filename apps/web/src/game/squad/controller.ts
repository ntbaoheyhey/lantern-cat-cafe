import { advance, createBattle, queueCommand } from '@taskbar-hero/game-rules/src/squad/engine';
import { SQUAD_CONFIG as C } from '@taskbar-hero/game-rules/src/squad/config';
import type { Battle, BattleEvent, CommandBody, Encounter, Preset } from '@taskbar-hero/game-rules/src/squad/types';

/** Ephemeral local owner. Intentionally no storage, account, API or verified-game imports. */
export class SquadController {
  battle: Battle = createBattle();
  running = false;
  speed = 1;
  private listeners = new Set<() => void>();
  private eventListeners = new Set<(events: readonly BattleEvent[], reset: boolean) => void>();
  private revision = 0;
  private uiElapsed = 0;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  subscribeEvents = (fn: (events: readonly BattleEvent[], reset: boolean) => void) => { this.eventListeners.add(fn); return () => { this.eventListeners.delete(fn); }; };
  snapshot = () => this.revision;
  get priority() { const c = [...this.battle.commands].reverse().find(c => c.tick > this.battle.tick && c.type === 'priority'); return c?.type === 'priority' ? c.target : this.battle.priority; }
  get tactic() { const c = [...this.battle.commands].reverse().find(c => c.tick > this.battle.tick && c.type === 'tactic'); return c?.type === 'tactic' ? c.value : this.battle.tactic; }
  autoFor(id: string) { const c = [...this.battle.commands].reverse().find(c => c.tick > this.battle.tick && c.type === 'auto' && c.hero === id); return c?.type === 'auto' ? c.enabled : this.battle.actors.find(a => a.id === id)?.auto ?? true; }
  notify = () => { this.revision++; for (const fn of this.listeners) fn(); };
  reset(options: { seed: number; preset: Preset; encounter: Encounter; wave?: number }) {
    this.battle = createBattle(options); this.running = false; this.uiElapsed = 0;
    for (const fn of this.eventListeners) fn(this.battle.events, true);
    this.notify();
  }
  command(body: CommandBody) { queueCommand(this.battle, body); this.notify(); }
  tick(delta: number, hidden: boolean) {
    if (hidden || !this.running || this.battle.result) return;
    // No catch-up after hidden tabs. Foreground hitches are passed whole to the pure core.
    const events = advance(this.battle, delta * this.speed);
    for (const fn of this.eventListeners) fn(events, false);
    this.uiElapsed += delta;
    if (this.uiElapsed >= C.presentation.uiMs || this.battle.result) { this.uiElapsed = 0; this.notify(); }
    if (this.battle.result) this.running = false;
  }
  grantCharge() { // Dev review only; charge is not an economic resource.
    for (const a of this.battle.actors.filter(a => a.side === 'party')) a.charge = C.ultimate.max;
    this.notify();
  }
}
