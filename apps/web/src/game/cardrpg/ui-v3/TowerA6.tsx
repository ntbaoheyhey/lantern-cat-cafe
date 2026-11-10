import {useMemo,useState,useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {portraitProps} from '../depth/assets';
import {PowerA6} from './PowerA6';
import {Icon} from './Icon';

export function TowerA6({m,onReturn}:{m:DepthModel;onReturn?:()=>void}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 const [selected,setSelected]=useState(m.state.run?.towerA6&&!m.state.run.complete?m.state.run.floor:Math.min(30,m.state.towerBest+1));
 const spec=R.towerFloorA6(selected),active=!!m.state.run&&!m.state.run.complete;
 const locked=!m.state.cleared.includes(3),next=R.TOWER_CHESTS_A6.find(f=>!m.state.challengeClaims.includes(`a6-tower-chest-${f}`));
 const foes=useMemo(()=>R.createBattle({seed:spec.seed,chapter:spec.chapter,cats:[],enemies:spec.enemies,
  enemyStats:spec.enemyStats,challengeLevel:spec.level,gameplayV4:true,skillsV5:true,gameplayA6:true}).actors,[selected]);
 const start=()=>{if(m.apply(R.startTowerFloorA6(m.state,selected),`Yarn Tower · floor ${selected}`))m.enter('0-0');};
 return <div className="a6-tower">
  <header className="a6-tower-heading"><div><small>ABOVE THE LANTERNS</small><h2>Yarn Tower</h2><p>{Math.min(30,m.state.towerBest)}/30 floors cleared · {next?`Next chest: floor ${next}`:'Every milestone collected'}</p></div><Icon name="chest"/></header>
  {locked?<p className="a6-tower-locked">Clear Midnight Pantry to open the tower. Your crew will climb together.</p>:null}
  <div className="a6-tower-layout"><section aria-label="Thirty tower floors"><div className="a6-tower-floors">{Array.from({length:30},(_,i)=>i+1).map(f=><button key={f} disabled={locked||active||f>m.state.towerBest+1} aria-pressed={f===selected} aria-label={`Floor ${f}${f<=m.state.towerBest?' cleared':f>m.state.towerBest+1?' locked':''}`} onClick={()=>setSelected(f)}><b>{f}</b><span>{f%5===0?'♛':f<=m.state.towerBest?'✓':'⌁'}</span></button>)}</div></section>
   <aside className="a6-tower-preview"><small>{spec.boss?'MILESTONE GUARDIAN':'YOUR NEXT CLIMB'}</small><h2>Floor {selected}</h2><PowerA6 label="Your Power" value={R.teamPowerV4(m.state)}/><PowerA6 label="Recommended Power" value={foes.reduce((n,a)=>n+R.powerScoreA6(a),0)}/>
    <div className="a6-tower-enemies">{foes.map(a=><figure key={a.id}><img {...portraitProps(a.catalogId)} alt=""/><figcaption>{a.name}</figcaption></figure>)}</div>
    <p>{R.enemyGuideV4(spec.enemies[0]!).counter}</p><small>One automatic battle. Your crew starts each floor at full health.</small>
    <button className="uv-fight" disabled={locked||active||selected>m.state.towerBest+1} onClick={start}>Climb floor {selected} →</button>
    {active&&<button onClick={()=>onReturn?onReturn():m.go(m.battle?(m.battle.result?'result':'prepare'):'map')}>{m.state.run?.towerA6?'Return to formation':'Return to your patrol'}</button>}
   </aside></div>
  <div className="a6-tower-chests" aria-label="Tower milestone chests">{R.TOWER_CHESTS_A6.map(f=>{const p=R.towerChestA6(m.state,f);return <button key={f} aria-label={`Floor ${f} ${p.claimed?'Collected':m.state.towerBest>=f?'Collect':`${m.state.towerBest}/${f}`}`} disabled={!!p.reason} title={p.reason??'Collect milestone reward'} onClick={()=>m.apply(R.claimTowerChestA6(m.state,f),`Floor ${f} chest collected.`)}><Icon name="chest"/><b>Floor {f}</b><small>{p.claimed?'Collected':m.state.towerBest>=f?'Collect':`${m.state.towerBest}/${f}`}</small></button>})}</div>
 </div>;
}
