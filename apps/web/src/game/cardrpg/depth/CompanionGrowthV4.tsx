import { useId } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CostView } from '../shared';
import type { DepthModel } from './model';

/** The real transaction runs on a copy; only the click spends on the live account. */
export function CompanionGrowthV4({ m, catId, kind }: {
  m: DepthModel; catId: string; kind: 'level' | 'ascend';
}) {
  const descriptionId = useId();
  const card = m.state.account.cards.find(c => c.cardId === catId);
  if (!card || !R.gameplayV4(m.state)) return null;
  const command = { type: kind, cardId: card.id } as const;
  const preview = R.metaCommand(m.state, command);
  const action = kind === 'level' ? 'Level up' : 'Add a star';
  const locked = !!m.state.run && !m.state.run.complete;
  if (!preview.ok) return <div className="dp-v4-growth" data-growth={kind}>
    <button disabled aria-describedby={descriptionId}>{action}</button>
    <small id={descriptionId}>{locked ? 'Finish this route before training your companions.' : preview.error}</small>
  </div>;
  const next = preview.state.account.cards.find(c => c.id === card.id)!;
  const cost = Object.fromEntries(Object.entries(m.state.account.currencies)
    .map(([id, n]) => [id, n - preview.state.account.currencies[id as keyof typeof m.state.account.currencies]])
    .filter(([, n]) => Number(n) > 0));
  const before = R.depthStats(m.state, catId), after = R.depthStats(preview.state, catId);
  const stats = (['hp', 'attack', 'defense'] as const).filter(id => before[id] !== after[id])
    .map(id => `${after[id] - before[id] > 0 ? '+' : ''}${after[id] - before[id]} ${{ hp: 'Health', attack: 'Attack', defense: 'Defense' }[id]}`);
  const known = new Set(R.availableSkills(m.state, catId).map(s => s.id));
  const skills = R.availableSkills(preview.state, catId).filter(s => !known.has(s.id));
  return <div className="dp-v4-growth" data-growth={kind}>
    <button className={kind === 'level' ? 'cr-primary' : undefined} aria-describedby={descriptionId}
      onClick={() => m.command(command)}>{action}</button>
    <div id={descriptionId}>
      <b>{R.CAT_BY_ID[catId]!.name} → {kind === 'level' ? `level ${next.level}` : `${next.stars} stars`}</b>
      <CostView cost={cost} />
      {card.shards > next.shards && <small>{card.shards - next.shards} matching shards</small>}
      {!!stats.length && <small>{stats.join(' · ')}</small>}
      {skills.map(skill => <small key={skill.id}>Unlocks {skill.name}.</small>)}
    </div>
  </div>;
}
