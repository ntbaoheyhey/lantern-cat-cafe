import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';

/** Catalogue effects are base values; route ranks and cooldowns remain owned by combat. */
export function SkillContextA6({state,skill}:{state:R.DepthAccount;skill:R.Skill}) {
 const cooldown=R.kitSkillV5(skill).cooldown;
 const rank=state.run&&!state.run.complete&&state.team.includes(skill.catId)?state.run.upgrades[skill.id]??0:0;
 return <div className="a6-skill-context">
  <p><b>Cooldown</b> · {cooldown?`Wait ${cooldown} round${cooldown===1?'':'s'} after use.`:'Can be used every round.'}</p>
  <p>Base effects shown.{rank>0&&` Your patrol rank ${rank} adds ${R.routeSkillPowerBonusPercent(rank)}% effect power.`}</p>
 </div>;
}
