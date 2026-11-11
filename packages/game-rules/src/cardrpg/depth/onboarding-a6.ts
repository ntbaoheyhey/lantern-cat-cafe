import type { DepthAccount, NodeKind } from './contract';

export function campaignPressureA6(chapter:number,kind:NodeKind,depth:number):number {
  return kind==='boss'?(chapter===3?1.51:chapter===2?1.18:1.08):kind==='elite'?1.52:depth<4?1.36:1.52;
}

/** Early campaign bands teach the route with a gradual pressure ramp, including replays. */
export function patrolPressureA6(state: DepthAccount): number {
  const run = state.run;
  if (!run?.gameplayA6 || run.mode !== 'campaign') return 1;
  const node = run.nodes.find(n => n.id === run.current);
  return campaignPressureA6(run.chapter,node?.kind??'battle',node?.depth??0);
}

/** Shared Night Patrol defaults. Unfinished first clears keep their starting band. */
export function patrolDefaultsA6(state: DepthAccount) {
  const active = !!state.run && !state.run.complete;
  const ceiling = Math.min(...state.team.map(id => state.account.cards.find(c => c.cardId === id)!.level));
  const unlocked = [1, 2, 3].filter(chapter => chapter === 1 || state.cleared.includes(chapter - 1));
  const next = unlocked.find(chapter => !state.cleared.includes(chapter));
  const pending = Object.values(state.v4?.journey?.stars ?? {}).filter(r => r.conditions.some(c => !c)
    && r.band >= 1 && r.band <= ceiling && unlocked.includes(r.chapter));
  const first = next ? (state.run?.chapter === next ? state.run.challengeLevel : undefined) ?? 1 : undefined;
  const band = active ? state.run!.challengeLevel ?? ceiling : Math.min(first ?? pending[0]?.band ?? ceiling, ceiling);
  const replay = !next ? pending.find(r => r.band === band) : undefined;
  return { active, ceiling, band, chapter: active ? state.run!.chapter : next ?? replay?.chapter ?? 3 };
}
export function introductionA6(state: DepthAccount) {
  const trained = state.account.cards.some(card => card.level > 1);
  const guide = state.tutorial < 3 ? 'patrol' : !state.freeInvite ? 'recruit' : !trained ? 'upgrade' : null;
  const features = [
    { id: 'team', name: 'Team formation', hint: 'Choose who stands in front.', open: state.tutorial >= 3 },
    { id: 'gear', name: 'Cat gear', hint: 'A good keepsake makes a stronger crew.', open: state.freeInvite },
    { id: 'bonds', name: 'Bond Book', hint: 'Friends bring out each other’s best.', open: state.freeInvite && state.account.cards.length >= 4 },
    { id: 'daily', name: 'Cafe gifts', hint: 'Small goals, a gift every day.', open: trained },
    { id: 'tower', name: 'Yarn Tower', hint: 'Thirty floors above the lanterns.', open: state.cleared.includes(1) },
    { id: 'relic', name: 'Relic Fuji', hint: 'One keepsake supports your whole crew.', open: state.cleared.includes(2) },
  ];
  const goal = guide === 'patrol' ? 'Meet your crew on a short first patrol.' : guide === 'recruit' ? 'A free friend is waiting at Recruit.'
    : guide === 'upgrade' ? 'Give one cat its first level.' : !state.cleared.includes(1) ? 'Clear Tangled Cafe to open Yarn Tower.'
    : !state.cleared.includes(2) ? 'Reach the rooftops and discover Relic Fuji.' : 'Collect three stars or climb the next tower floor.';
  return { guide, goal, features };
}
