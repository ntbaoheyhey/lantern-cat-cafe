import {GameIcon} from '../../../ui/GameIcon';
import {DropOddsC2,RewardOddsC2} from './OddsC2';
import {HelpC2} from './TextDietC2';
import {useEffect,useId,useMemo,useRef,useState,useSyncExternalStore} from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type {DepthModel} from '../depth/model';
import {artPropsA6 as portraitProps} from './art-a6';
import {PowerA6} from './PowerA6';
import {TowerSceneryA6} from './TowerSceneryA6';
import {GiftArtA6} from './KeepsakeArtA6';
import {GiftAmountsA6,giftReducedA6,REDUCED_GIFT_NOTE_A6} from './GiftAmountsA6';
import {badgesA6} from './badges-a6';
import {enemyGuideA6} from './guide-a6';

export function TowerA6({m,onReturn}:{m:DepthModel;onReturn?:()=>void}) {
 useSyncExternalStore(m.subscribe,m.snapshot);
 const [selected,setSelected]=useState(m.state.run?.towerA6&&!m.state.run.complete?m.state.run.floor:Math.min(30,m.state.towerBest+1));
 const [section,setSection]=useState<'climb'|'gifts'>('climb'),panelId=useId();
 const climbButton=useRef<HTMLButtonElement>(null),focusClimb=useRef(false);
 useEffect(()=>{if(section==='climb'&&focusClimb.current){focusClimb.current=false;climbButton.current?.focus();}},[section]);
 const spec=R.towerFloorA6(selected),active=!!m.state.run&&!m.state.run.complete;
 const locked=!m.state.cleared.includes(1),next=R.TOWER_CHESTS_A6.find(f=>!m.state.challengeClaims.includes(`a6-tower-chest-${f}`));
 const chests=R.TOWER_CHESTS_A6.map(f=>R.towerChestA6(m.state,f)),ready=badgesA6(m.state,m.cafeNow).tower;
 const waiting=chests.some(p=>m.state.towerBest>=p.floor&&!p.claimed&&!!p.reason);
 const reduced=chests.some(p=>!p.reason&&giftReducedA6(p.requested,p.reward));
 const foes=useMemo(()=>R.createBattle({seed:spec.seed,chapter:spec.chapter,cats:[],enemies:spec.enemies,
  enemyStats:spec.enemyStats,challengeLevel:spec.level,gameplayV4:true,skillsV5:true,gameplayA6:true}).actors,[selected]);
 const start=()=>{if(m.apply(R.startTowerFloorA6(m.state,selected),`Yarn Tower · floor ${selected}`))m.enter('0-0');};
 const planNext=()=>{setSelected(Math.min(R.TOWER_FLOORS_A6,m.state.towerBest+1));focusClimb.current=true;setSection('climb');};
 const returnToRun=()=>onReturn?onReturn():m.go(m.battle?(m.battle.result?'result':'prepare'):'map');
 if(m.state.formationC2)return <div className="a6-tower c2-tower"><header className="a6-tower-heading"><b><GameIcon name="tower" size={18}/> {Math.min(30,m.state.towerBest)}/30 · <GameIcon name="bag" size={18}/> {next??'Done'}</b><nav className="a6-tower-sections" aria-label="Tower sections"><button aria-pressed={section==='climb'} onClick={()=>setSection('climb')}><GameIcon name="tower" size={18}/> Climb</button><button aria-pressed={section==='gifts'} onClick={()=>setSection('gifts')}><GameIcon name="bag" size={18}/> Gifts {ready.length}</button></nav>{section==='climb'&&<DropOddsC2 state={m.state} kind={spec.boss?'boss':'battle'} chapter={spec.chapter}/>}<HelpC2 label="Yarn Tower"><p>{locked?'Clear Tangled Cafe to open the tower.':'One automatic battle per floor. Your crew starts at full health.'}</p><p>{enemyGuideA6(spec.enemies[0]!).counter}</p><p>{REDUCED_GIFT_NOTE_A6}</p></HelpC2></header>
  {section==='climb'?<div className="a6-tower-layout"><section className="a6-tower-board" aria-label="Thirty tower floors"><TowerSceneryA6/><div className="a6-tower-floors">{Array.from({length:30},(_,i)=>i+1).map(f=><button key={f} data-cleared={f<=m.state.towerBest} data-milestone={f%5===0} style={{gridRow:6-Math.floor((f-1)/5),gridColumn:Math.floor((f-1)/5)%2===0?(f-1)%5+1:5-(f-1)%5}} disabled={locked||active||f>m.state.towerBest+1} aria-pressed={f===selected} aria-label={'Floor '+f} onClick={()=>setSelected(f)}><b>{f}</b><span title={f%5===0?'Boss':f<=m.state.towerBest?'Cleared':'Thread'}><GameIcon name={f%5===0?'boss-seal':f<=m.state.towerBest?'check':'thread'} size={18}/></span></button>)}</div></section><aside className="a6-tower-preview"><h2><GameIcon name="tower" size={18}/> {selected}</h2><PowerA6 label="Your Power" value={R.teamPowerV4(m.state)}/><PowerA6 label="Recommended Power" value={foes.reduce((n,a)=>n+R.powerScoreA6(a),0)}/><div className="a6-tower-enemies">{foes.map(a=><figure key={a.id}><img {...portraitProps(a.catalogId)} alt=""/><figcaption>{a.name}</figcaption></figure>)}</div><button ref={climbButton} className="uv-fight" aria-label={'Climb floor '+selected} disabled={locked||active||selected>m.state.towerBest+1} onClick={start}><GameIcon name="tower" size={18}/> Climb {selected}</button>{active&&<button onClick={returnToRun}><GameIcon name="arrow-left" size={18}/> Return</button>}</aside></div>:<section className="a6-tower-gifts" aria-label="Tower milestone chests"><div className="a6-tower-parcels">{chests.map((p,i)=>{const earned=m.state.towerBest>=p.floor,canPlan=!earned&&!locked&&!active;return <article key={p.id} data-ready={!p.reason} data-collected={p.claimed} aria-label={'Floor '+p.floor+' gift'}><GiftArtA6 variant={i}/><div><b><GameIcon name="tower" size={18}/> {Math.min(p.floor,m.state.towerBest)}/{p.floor}</b>{!p.claimed&&<GiftAmountsA6 requested={p.requested} reward={p.reward}/>}<RewardOddsC2 source={'Floor '+p.floor+' gift'} reward={p.reward}/><HelpC2 label={'Floor '+p.floor}><p>{p.reason??'Ready to collect.'}</p><p>{REDUCED_GIFT_NOTE_A6}</p></HelpC2></div>{canPlan?<button aria-label={'Plan floor '+(m.state.towerBest+1)} onClick={planNext}><GameIcon name="tower" size={18}/> {m.state.towerBest+1}</button>:<button aria-label={'Collect floor '+p.floor+' gift'} disabled={!!p.reason} onClick={()=>m.apply(R.claimTowerChestA6(m.state,p.floor),'Gift collected.')}>{p.claimed?'Done':p.reason?'Locked':'Collect'}</button>}</article>;})}</div>{active&&<button onClick={returnToRun}><GameIcon name="arrow-left" size={18}/> Return</button>}</section>}
 </div>;
 return <div className="a6-tower">
  <header className="a6-tower-heading"><div><small>ABOVE THE LANTERNS</small><h2>Yarn Tower</h2><p>{Math.min(30,m.state.towerBest)}/30 floors cleared · {next?`${m.state.towerBest>=next?'Uncollected chest':'Next chest'}: floor ${next}`:'Every milestone collected'}</p></div>
   <nav className="a6-tower-sections" aria-label="Tower sections"><button aria-pressed={section==='climb'} aria-controls={panelId} onClick={()=>setSection('climb')}>Climb</button><button aria-pressed={section==='gifts'} aria-controls={panelId} onClick={()=>setSection('gifts')}>Milestone gifts <span data-ready={ready.length>0}>{ready.length}</span></button></nav>
  </header>
  {locked?<p className="a6-tower-locked">Clear Tangled Cafe to open the tower. Your crew will climb together.</p>:null}
  <div className="a6-tower-view" id={panelId}>
  {section==='climb'?<div className="a6-tower-layout"><section className="a6-tower-board" aria-label="Thirty tower floors"><TowerSceneryA6/><div className="a6-tower-floors">{Array.from({length:30},(_,i)=>i+1).map(f=><button key={f} data-cleared={f<=m.state.towerBest} data-milestone={f%5===0} style={{gridRow:6-Math.floor((f-1)/5),gridColumn:Math.floor((f-1)/5)%2===0?(f-1)%5+1:5-(f-1)%5}} disabled={locked||active||f>m.state.towerBest+1} aria-pressed={f===selected} aria-label={`Floor ${f}${f<=m.state.towerBest?' cleared':f>m.state.towerBest+1?' locked':''}`} onClick={()=>setSelected(f)}><b>{f}</b><span>{f%5===0?'Boss':f<=m.state.towerBest?'Done':'thread'}</span></button>)}</div></section>
   <aside className="a6-tower-preview"><small>{spec.boss?'MILESTONE GUARDIAN':selected<=m.state.towerBest?'A FAMILIAR CLIMB':'YOUR NEXT CLIMB'}</small><h2>Floor {selected}</h2><PowerA6 label="Your Power" value={R.teamPowerV4(m.state)}/><PowerA6 label="Recommended Power" value={foes.reduce((n,a)=>n+R.powerScoreA6(a),0)}/>
    <div className="a6-tower-enemies">{foes.map(a=><figure key={a.id}><img {...portraitProps(a.catalogId)} alt=""/><figcaption>{a.name}</figcaption></figure>)}</div>
    <p className="a6-tower-counter">{enemyGuideA6(spec.enemies[0]!).counter}</p><small>One automatic battle. Your crew starts each floor at full health.</small>
    <button ref={climbButton} className="uv-fight" disabled={locked||active||selected>m.state.towerBest+1} onClick={start}>Climb floor {selected} <GameIcon name="arrow" size={18}/></button>
    {active&&<button onClick={returnToRun}>{m.state.run?.towerA6?'Return to formation':'Return to your patrol'}</button>}
   </aside></div>:<section className="a6-tower-gifts" aria-label="Tower milestone chests">
    <header><img {...portraitProps('brioche')} alt=""/><div><small>A PARCEL EVERY FIVE FLOORS</small><h2>{next?'Treasures from the climb':'Every milestone, a memory'}</h2><p role="status">{ready.length?`${ready.length} ${ready.length===1?'gift is':'gifts are'} ready for your crew.`:waiting?active?'Finish your route to collect your gifts.':'Today’s supplies are full. Your gifts can wait.':next?'Your first clear of each milestone earns a gift.':'All six gifts are safely with your crew.'}</p>{reduced&&<p className="a6-gift-cap-note" id={panelId+'-cap'}>{REDUCED_GIFT_NOTE_A6}</p>}</div>{active&&<button onClick={returnToRun}>{m.state.run?.towerA6?'Return to formation':'Return to your patrol'}</button>}</header>
    <div className="a6-tower-parcels" tabIndex={0} role="region" aria-label="All six Tower gifts">{chests.map((p,i)=>{const earned=m.state.towerBest>=p.floor,available=ready.some(f=>f===p.floor),partial=available&&giftReducedA6(p.requested,p.reward),canPlan=!earned&&!locked&&!active,detailId=panelId+'-'+p.id;return <article key={p.id} data-ready={available} data-collected={p.claimed} aria-label={`Floor ${p.floor} gift`}>
     <GiftArtA6 variant={i}/><div><small>{p.claimed?'COLLECTED':earned?'A MILESTONE EARNED':'ALONG YOUR CLIMB'}</small><h3>Floor {p.floor}</h3>
      <div id={detailId}>{!p.claimed&&<GiftAmountsA6 requested={p.requested} reward={p.reward}/>}
      <p>{p.claimed?'A little care for your crew.':available?partial?'Reduced by today’s limit':'Ready to collect':earned?p.reason:`${Math.min(p.floor,m.state.towerBest)}/${p.floor} floors cleared`}</p></div></div>
     {canPlan?<button aria-label={`Plan floor ${m.state.towerBest+1} toward floor ${p.floor} gift`} aria-describedby={detailId} onClick={planNext}>Plan floor {m.state.towerBest+1} <GameIcon name="arrow" size={18}/></button>:<button className={available?'cr-primary':undefined} aria-label={`Floor ${p.floor} ${p.claimed?'Collected':earned?'Collect':`${m.state.towerBest}/${p.floor}`}`} aria-describedby={detailId+(partial?' '+panelId+'-cap':'')} disabled={!!p.reason} title={p.reason??'Collect milestone reward'} onClick={()=>m.apply(R.claimTowerChestA6(m.state,p.floor),`Floor ${p.floor} chest collected.`)}>{p.claimed?'Collected':available?partial?'Collect reduced gift':'Collect gift':earned?active?'After this route':'Supplies full':`Clear floor ${p.floor}`}</button>}
    </article>;})}</div>
    <small className="a6-tower-scroll-hint">Six one-time gifts · scroll to review every floor</small>
   </section>}
  </div>
 </div>;
}
