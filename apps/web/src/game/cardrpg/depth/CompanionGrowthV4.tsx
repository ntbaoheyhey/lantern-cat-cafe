import {GameIcon} from '../../../ui/GameIcon';
import {HelpC2} from '../ui-v3/TextDietC2';
import { useId } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { CARD_BY_ID, CARD_RPG_CONFIG as C, type Cost } from '@taskbar-hero/game-rules/cardrpg';
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
  if(m.state.formationC2){
    const next=preview.ok?preview.state.account.cards.find(c=>c.id===card.id)!:card;
    const cost:Cost=kind==='level'?{fish:C.level.fishBase*card.level,threads:C.level.threads}:{fish:C.level.ascendFish*card.stars};
    const before=R.depthStats(m.state,catId),after=preview.ok?R.depthStats(preview.state,catId):before;
    return <div className="dp-v4-growth c2-growth" data-growth={kind}><button className={kind==='level'?'cr-primary':undefined} disabled={!preview.ok} aria-label={action} aria-describedby={descriptionId} onClick={()=>m.command(command)}><GameIcon name={kind==='level'?'upgrade':'season'} size={24}/>{kind==='level'?'Level up':'Star'}</button><div id={descriptionId}><b>{kind==='level'?<>{card.level}<GameIcon name="arrow" size={16}/>{preview.ok?next.level:card.level+1}</>:<>{card.stars}<GameIcon name="arrow" size={16}/>{preview.ok?next.stars:card.stars+1}</>}</b><CostView cost={cost}/>{kind==='ascend'&&<small aria-label="Matching shards"><GameIcon name="season" size={18}/> {card.shards}/{C.level.shardsBase*card.stars}</small>}<small aria-label="Stat gains"><GameIcon name="heart" size={18}/> +{after.hp-before.hp} · <GameIcon name="fight" size={18}/> +{after.attack-before.attack} · <GameIcon name="shield" size={18}/> +{after.defense-before.defense}</small></div><HelpC2 label={action}><p>{preview.ok?'Costs are shown before you spend. The stat gains apply to this cat.':locked?'Finish this route before training.':preview.error}</p><p>Patrol gives fish and threads. Extra recruits give matching shards.</p></HelpC2></div>;
  }
  if (!preview.ok && R.gameplayA6(m.state) && !locked && !m.state.account.pendingRun) {
    const capped = kind === 'level' ? card.level >= CARD_BY_ID[catId]!.levelCap : card.stars >= C.level.maxStars;
    const cost: Cost = kind === 'level' ? { fish: C.level.fishBase * card.level, threads: C.level.threads } : { fish: C.level.ascendFish * card.stars };
    const shards = kind === 'ascend' ? C.level.shardsBase * card.stars : 0;
    const currencyNeeds = Object.entries(cost).flatMap(([id, amount]) => {
      const missing = amount - m.state.account.currencies[id as keyof Cost];
      return missing > 0 ? [`${missing} more ${id === 'threads' && missing === 1 ? 'thread' : id}`] : [];
    });
    const missingShards = Math.max(0, shards - card.shards);
    const needs = [...currencyNeeds, ...(missingShards ? [`${missingShards} more matching shard${missingShards === 1 ? '' : 's'}`] : [])];
    if (!capped && needs.length) return <div className="dp-v4-growth a6-growth-shortfall" data-growth={kind}>
      <button disabled aria-describedby={descriptionId}>{action}</button>
      <div id={descriptionId}>
        <b>{R.CAT_BY_ID[catId]!.name} to {kind === 'level' ? `level ${card.level + 1}` : `${card.stars + 1} stars`}</b>
        <CostView cost={cost}/>
        {shards > 0 && <small>{card.shards} / {shards} matching shards</small>}
        <small className="a6-growth-missing">Need {needs.join(' · ')}.</small>
        <small className="a6-growth-source">{currencyNeeds.length > 0 && (kind === 'level' ? 'Patrol gives fish and threads.' : 'Patrol gives fish.')}{currencyNeeds.length > 0 && shards > card.shards && ' '}{shards > card.shards && `Extra ${R.CAT_BY_ID[catId]!.name} recruits give shards.`}</small>
      </div>
    </div>;
  }
  if (!preview.ok) return <div className="dp-v4-growth" data-growth={kind}>
    <button disabled aria-describedby={descriptionId}>{action}</button>
    {kind === 'ascend' && R.gameplayA6(m.state) && <small>{card.shards} matching shards owned</small>}
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
      {kind === 'ascend' && R.gameplayA6(m.state) && <small>{card.shards} matching shards owned</small>}
      <b>{R.CAT_BY_ID[catId]!.name} to {kind === 'level' ? `level ${next.level}` : `${next.stars} stars`}</b>
      <CostView cost={cost} />
      {card.shards > next.shards && <small>{card.shards - next.shards} matching shards</small>}
      {!!stats.length && <small>{stats.join(' · ')}</small>}
      {skills.map(skill => <small key={skill.id}>Unlocks {skill.name}.</small>)}
    </div>
  </div>;
}
