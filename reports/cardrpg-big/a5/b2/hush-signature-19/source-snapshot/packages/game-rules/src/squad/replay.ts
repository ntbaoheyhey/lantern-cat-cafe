import { createBattle, queueCommand, run } from './engine';
import { HEROES } from './config';
import type { BattleEvent, Command, Hero, Projection } from './types';

export const createProjection = (): Projection => ({ actors: {}, casts: {}, wave: 0, phase: 1, result: null, fishFound: 0, time: 0 });
/** Event-only presenter model. It has no combat, randomness, network or persistence dependency. */
export function project(p: Projection, events: readonly BattleEvent[]): Projection {
  for (const e of events) {
    p.time = e.time;
    if (e.actors) { p.actors = Object.fromEntries(e.actors.map(a => [a.id, a])); p.casts = {}; }
    if (e.actor) p.actors[e.actor.id] = e.actor;
    if (e.cast) {
      if (['interrupt', 'fizzle'].includes(e.type)) delete p.casts[e.cast.id];
      else p.casts[e.cast.id] = e.cast;
    }
    if (e.wave !== undefined) p.wave = e.wave;
    if (e.phase !== undefined) p.phase = e.phase;
    if (e.type === 'reward') p.fishFound += e.amount ?? 0;
    if (e.result) p.result = e.result;
  }
  return p;
}
export function encodeCommands(commands: readonly Command[]): string {
  return JSON.stringify({ format: 'squad-local-commands', version: 1, commands });
}
export function decodeCommands(text: string): Command[] {
  const doc: unknown = JSON.parse(text);
  if (!doc || typeof doc !== 'object' || !('version' in doc) || doc.version !== 1 || !('format' in doc)
    || doc.format !== 'squad-local-commands' || !('commands' in doc) || !Array.isArray(doc.commands)) throw Error('Unsupported local command format');
  const sequences = new Set<number>();
  for (const c of doc.commands) {
    if (!c || c.version !== 1 || !Number.isSafeInteger(c.tick) || c.tick < 1 || !Number.isSafeInteger(c.seq) || c.seq < 0 || sequences.has(c.seq)) throw Error('Invalid command order');
    sequences.add(c.seq);
    if (c.type === 'priority' && (c.target === null || typeof c.target === 'string')) continue;
    if (c.type === 'tactic' && ['protect', 'caster', 'opening'].includes(c.value)) continue;
    if (HEROES.includes(c.hero as Hero) && (c.type === 'ultimate' || (c.type === 'auto' && typeof c.enabled === 'boolean'))) continue;
    throw Error('Invalid command');
  }
  return doc.commands.sort((a: Command, z: Command) => a.tick - z.tick || a.seq - z.seq) as Command[];
}
export function replayCommands(options: Parameters<typeof createBattle>[0], commands: readonly Command[]) {
  const b = createBattle(options);
  for (const c of [...commands].sort((a, z) => a.tick - z.tick || a.seq - z.seq)) queueCommand(b, c, c.tick);
  return run(b);
}
