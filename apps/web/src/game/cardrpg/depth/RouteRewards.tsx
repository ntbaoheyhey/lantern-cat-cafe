import {GameIcon} from '../../../ui/GameIcon';
import {useMemo,useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from './model';
import './route-stops.css';

export function RouteRewards({m}:{m:DepthModel}){
 useSyncExternalStore(m.subscribe,m.snapshot);
 const state=m.state,run=state.run;
 const choices=useMemo(()=>state.run?.rewardChoices.map(id=>({id,result:R.chooseReward(state,id)}))??[],[state]);
 if(!run)return null;
 return <div className="dp-route-rewards"><h2>Carry one good thing forward.</h2><p>Choose one reward. It lasts for this route.</p>
  <div className="dp-three">{choices.map(({id,result})=>{
   const skillId=id.startsWith('skill:')?id.slice(6):null,skill=skillId?R.skillById(skillId,!!run.skillsV5):null;
   const boon=skillId?null:R.boonForMode(id,!!run.gameplayV4),rank=skillId?(run.upgrades[skillId]??0):(run.boons[id]??0);
   const next=skillId?result.state.run!.upgrades[skillId]:result.state.run!.boons[id];
   return <button className="dp-reward" key={id} disabled={!result.ok} onClick={()=>m.apply(R.chooseReward(m.state,id),'Choice added for this run. Continue along the map.')}>
    <h3>{skill?.name??boon?.name}</h3>
    {skill?<><p>{R.CAT_BY_ID[skill.catId]!.name} · Skill upgrade</p>
      <p><b>Rank {rank}{result.ok?` to ${next}`:''}/3</b></p>
      {result.ok&&<p>Effect power +{R.routeSkillPowerBonusPercent(rank)}% to +{R.routeSkillPowerBonusPercent(next!)}%.</p>}
      <small>{skill.effects.some(effect=>(effect.power??0)>0)?'Status stacks and timing stay the same.':'This skill has no power-based effect to increase.'}</small>
     </>:<><p>{boon?.description}</p><p><b>Stack {rank}{result.ok?` to ${next}`:''}/{boon?.cap}</b></p><small>Night charm · {boon?.archetype}</small></>}
    {!result.ok&&<p className="dp-route-reward-reason">{result.error}</p>}
   </button>;
  })}</div>
 </div>;
}
