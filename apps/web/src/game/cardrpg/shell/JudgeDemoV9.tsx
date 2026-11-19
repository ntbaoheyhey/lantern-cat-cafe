import {useEffect,useState} from 'react';
import {CAT_BY_ID} from '@taskbar-hero/game-rules/src/cardrpg/depth/catalog';
import {DEMO_CREW_V9,DEMO_WAVE_V9,demoRecordingV9,type DemoEncounterV9} from '@taskbar-hero/game-rules/src/cardrpg/depth/demo-v9';
import type {DepthModel} from '../depth/model';
import {artPropsA6} from '../ui-v3/art-a6';
import {CombatClassBadge} from '../ui-v3/CombatClassBadge';
import {PaintedButton} from './PaintedKit';
import {queueEncounterPreload} from '../depth/encounter-preloader';
import {audioEngine} from '../../../audio/engine';
import {ambienceScene,soundScene} from '../../../audio/scene';
import './demo-journey.css';
import './judge-demo-v9.css';

type Phase='intro'|'wave'|'boss-ready'|'boss'|'won';
export default function JudgeDemoV9({m}:{m:DepthModel}) {
  const [phase,setPhase]=useState<Phase>('intro'),[collection,setCollection]=useState(false),[error,setError]=useState('');
  const inBattle=phase==='wave'||phase==='boss';
  const boss=phase==='boss';
  useEffect(()=>{audioEngine.music(soundScene(m.screen,m.showBattle,boss));audioEngine.ambience(ambienceScene(m.screen,m.showBattle,boss,1));},[m.screen,m.showBattle,boss]);
  const roster=m.battle?.actors.map(a=>a.catalogId).join('|');
  useEffect(()=>{audioEngine.setBattleRoster(m.showBattle?roster?.split('|'):undefined);},[roster,m.showBattle]);
  useEffect(()=>queueEncounterPreload([...DEMO_CREW_V9,...(phase==='intro'?DEMO_WAVE_V9:['yarn-giant','binding-thread'])]),[phase]);
  useEffect(()=>{
    if(!inBattle||m.showBattle)return;
    const won=m.replay?.result==='party';
    if(m.replay)m.finish();
    if(won)setPhase(phase==='wave'?'boss-ready':'won');
    else {setPhase(phase==='wave'?'intro':'boss-ready');setError('The café needs another try.');}
  },[inBattle,phase,m.showBattle]);
  function start(encounter:DemoEncounterV9) {
    try {
      const recording=demoRecordingV9(encounter);
      if(!recording.won||!m.replayEncounter(recording.replay.setup,recording.replay.choices))throw Error('The encounter could not start.');
      m.state.settings.speed=1;
      setError('');setPhase(encounter);
    }catch(e){setError(e instanceof Error?e.message:String(e));}
  }
  const title=phase==='won'?'The last lantern stays lit':phase==='boss-ready'?'Face the Tangle':'Guard the last lit café';
  return <main className="ship-journey judge-demo-v9" aria-label="Lantern Cat Café demo" aria-hidden={inBattle} inert={inBattle} data-demo-phase={phase}>
    <header><strong>Lantern Cat Café</strong><button onClick={()=>setCollection(!collection)}>{collection?'Back to café':'Collection'}</button></header>
    <nav aria-label="Demo progress"><span aria-current={phase==='intro'||phase==='wave'?'step':undefined}>Street patrol</span><span aria-current={phase==='boss-ready'||phase==='boss'?'step':undefined}>The Yarn Giant</span><span aria-current={phase==='won'?'step':undefined}>Café memories</span></nav>
    {collection?<section className="judge-collection"><h1>Café Collection</h1><p>Meet all twelve companions. Mochi, Clover and Soot guard the café in this demo.</p><div className="ship-crew">{Object.values(CAT_BY_ID).map(cat=><figure key={cat.id}><img {...artPropsA6(cat.id)} alt={cat.name}/><figcaption>{cat.name}</figcaption></figure>)}</div></section>:<section className="ship-trial-card">
      <h1>{title}</h1>
      <p>{phase==='won'?'Relics are café memories the Tangle cannot erase. On Avalanche, those memories belong to you.':phase==='boss-ready'?'The street is clear. The Yarn Giant waits beyond the lantern.':'The Tangle, born from abandoned tasks, is knotting up the street. Mochi, Clover and Soot protect its last warm light.'}</p>
      <div className="ship-crew">{DEMO_CREW_V9.map(id=><figure key={id}><img {...artPropsA6(id)} alt=""/><figcaption>{CAT_BY_ID[id]!.name}<CombatClassBadge combatClass={CAT_BY_ID[id]!.combatClass}/></figcaption></figure>)}</div>
      <PaintedButton icon="quest" onClick={()=>start(phase==='boss-ready'?'boss':'wave')}>{phase==='boss-ready'?'Face the Yarn Giant':phase==='won'?'Play again':'Guard the café'}</PaintedButton>
    </section>}
    {error&&<p role="alert">{error}</p>}
  </main>;
}
