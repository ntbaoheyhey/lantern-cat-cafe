import { useState } from 'react';
import { BossArena } from '../game/arena/BossArena';
import { ARENA_FIXTURES } from '../game/arena/arenaFixtures';
import { prefersReducedMotion } from '../game/combat';
export function ArenaPreview() {
  const [id, setId] = useState(new URLSearchParams(location.search).get('fixture') ?? 'ch1-loss');
  const [round, setRound] = useState(0);
  const fixture = ARENA_FIXTURES.find(f => f.id === id) ?? ARENA_FIXTURES[0]!;
  return <main className="arena-preview"><h1>Boss arena preview</h1><label>Fight fixture<select value={id} onChange={e => setId(e.target.value)}>{ARENA_FIXTURES.map(f => <option key={f.id}>{f.id}</option>)}</select></label>
    <button onClick={() => setRound(n => n + 1)}>Replay</button>
    <BossArena key={`${id}:${round}`} {...fixture} reducedMotion={prefersReducedMotion()} onDone={() => {}} />
  </main>;
}
