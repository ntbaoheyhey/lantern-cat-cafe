import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
export function BattleSkillsV5({battle}:{battle:R.Battle}) {
  if(!battle.initial.skillsV5)return null;
  const latest=[...(battle.v4?.events??[])].reverse().find(e=>e.kind==='reaction');
  return <aside className="dp-v5-status-strip" aria-label="Battle conditions">
    <div className="dp-v5-unit-conditions">{battle.actors.filter(a=>a.hp>0).map(actor=><div className="dp-v5-unit-condition" key={actor.id}>
      <b>{actor.name}</b>{actor.statuses.length?actor.statuses.slice(0,4).map(status=>{
        const rule=R.statusRuleV5(status.id,R.STATUS_BY_ID[status.id]);
        const label=`${rule.name} ×${status.stacks}; ${status.remaining} rounds. ${rule.description}`;
        return <span key={status.id} className="dp-v5-keyword" tabIndex={0} aria-label={label}>
          {rule.name} {status.stacks}<span role="tooltip">{rule.name} · {R.STATUS_SUBTITLES_V5[status.id]??rule.name}<br/>{rule.description}<br/>{status.remaining} rounds left</span>
        </span>;
      }):<small>Clear</small>}{actor.statuses.length>4&&<span aria-label={`${actor.statuses.length-4} more statuses`}>+{actor.statuses.length-4}</span>}
    </div>)}</div>
    <p role="status">{latest?.text??'Watch for Burn, Bleed and prepared reactions.'}</p>
  </aside>;
}
