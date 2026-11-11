import {SettingsA6} from '../ui-v3/SettingsA6';
import { RelicA6 } from '../ui-v3/RelicA6';
import { showReviewTools } from './player-mode';
import { CollectibleDesigns } from './CollectibleDesigns';
import { SharpnessEvidence } from './SharpnessEvidence';
import { MotionEvidence } from './MotionEvidence';
import { EffectEvidence } from './EffectEvidence';
import { useState } from 'react';
import type { EIP1193Provider } from 'viem';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import { PageTitle } from '../shared';
import { readConnectedRelics } from './relic-reader';
import type { DepthModel } from './model';
export function Relics({ m }: { m: DepthModel }) { return R.gameplayA6(m.state) ? <RelicA6 m={m}/> : <LegacyRelics m={m}/>; }
function LegacyRelics({ m }: { m: DepthModel }) {
  const [reading, setReading] = useState(false);
  const read = async () => {
    setReading(true);
    m.apply(R.acceptRelicSnapshot(m.state, 43113, []), 'Reading the connected wallet at a single Fuji block…');
    try {
      const provider = (window as unknown as { ethereum?: EIP1193Provider }).ethereum;
      if (!provider) throw new Error('Open the app with an injected wallet connected to Fuji. Fixture mode is available below.');
      const snapshot = await readConnectedRelics(provider);
      m.liveRelicNote = `Fuji block ${snapshot.block} · ${snapshot.address.slice(0, 8)}…${snapshot.address.slice(-4)}`;
      m.apply(R.acceptRelicSnapshot(m.state, snapshot.chainId, snapshot.holdings), 'Wallet holdings and rarity attributes read from Fuji.');
    } catch (error) { m.liveRelicNote = 'Wallet read needs attention'; m.notice = String(error); m.error = true; m.notify(false); }
    finally { setReading(false); }
  };
  return <><PageTitle eyebrow="Avalanche Fuji · chain 43113" title="A keepsake from your other adventures." />
    <section className="cr-panel"><h2>{m.liveRelicNote}</h2><p className="dp-address">{R.FUJI_RELIC_ADDRESS}</p><div className="cr-actions">{!m.offline && <button disabled={reading} onClick={() => void read()}>{reading ? 'Reading…' : 'Read connected wallet'}</button>}<button onClick={() => { m.liveRelicNote = 'Fixture collection · simulated ownership'; m.apply(R.acceptRelicSnapshot(m.state, 43113, R.RELIC_FIXTURE), 'Fixture holdings loaded.'); }}>Load fixture holdings</button><button onClick={() => m.apply(R.selectRelic(m.state, null))}>Use ordinary relic equipment</button></div>
      <p>One selected Relic occupies {R.CAT_BY_ID[m.state.team[0]!]!.name}’s relic slot. Additional copies keep the same effect. Ordinary legendary gear has a higher power ceiling.</p><div className="dp-three">{R.RELIC_EFFECTS.map(relic => <button key={relic.id} disabled={!m.state.relics.includes(relic.id)} aria-pressed={m.state.selectedRelic === relic.id} onClick={() => m.apply(R.selectRelic(m.state, relic.id), `${relic.name} selected for the lead cat.`)}><h3>{relic.name}</h3><p>{relic.description}</p><small>ERC-1155 ID {relic.id} · rarityOf {relic.rarity}</small></button>)}</div></section>
    <CollectibleDesigns m={m} />
    <section className="cr-panel"><h2>Idle result adapter</h2><p>A read-only result receipt maps boss clears and loot to at most six mastery materials. Run and idle rewards share a 30-material daily ceiling.</p><button onClick={() => m.apply(R.acceptIdleResult(m.state, { ...R.IDLE_RECEIPT_FIXTURE, day: m.state.account.day }), 'Fixture idle result read and deduplicated.')}>Read fixture idle result</button><small>Fixture provider · production adapter contract in packages/game-rules/src/cardrpg/depth/bridge.ts</small></section></>;
}
export function SaveSettings({m}:{m:DepthModel}) {
  return R.gameplayA6(m.state)?<SettingsA6 m={m}/>:<LegacySaveSettings m={m}/>;
}
function LegacySaveSettings({m}:{m:DepthModel}) {
  const [code,setCode]=useState(''),[reset,setReset]=useState(false);
  return <><PageTitle eyebrow={m.offline?'Offline demo · manual save codes':'Versioned local account'} title="Keep a place at the table."/>
    <section className="cr-panel"><h2>Export / import progress</h2><p>{m.offline?'Export the code before closing. Paste it here after reopening to continue.':'Progress saves locally after each action. Export a copy to keep or move your account.'}</p>
      <label>Save code<textarea aria-label="Save code" rows={5} value={code} onChange={e=>setCode(e.target.value)} spellCheck={false}/></label>
      <div className="cr-actions"><button onClick={()=>setCode(R.exportSave(m.state))}>Export save code</button><button disabled={!code.trim()} onClick={()=>m.import(code)}>Import save code</button><button onClick={()=>{if(reset){m.reset();setCode('');setReset(false);}else setReset(true);}}>{reset?'Confirm reset account':'Reset account'}</button></div>
      <small>Schema {R.CONTRACT_VERSION}. Checksum detects copy errors. Legacy 0.4 JSON and 0.5 save codes migrate on import.</small>
    </section>
    <section className="cr-panel"><h2>Comfort and playback</h2><button aria-pressed={m.audio.enabled} onClick={()=>{void m.audio.toggle().then(()=>{m.state.settings.sound=m.audio.enabled;m.notify();});}}>Sound {m.audio.enabled?'on':'off'}</button><div className="dp-three"><label>Quality<select value={m.state.settings.quality} onChange={e=>{m.state.settings.quality=e.target.value as R.DepthAccount['settings']['quality'];m.notify();}}>{['low','medium','high'].map(q=><option key={q}>{q}</option>)}</select></label><label>Playback speed<select value={m.state.settings.speed} onChange={e=>{m.state.settings.speed=Number(e.target.value);m.notify();}}>{[1,2,4].map(n=><option key={n} value={n}>{n}×</option>)}</select></label><label><input type="checkbox" checked={m.state.settings.reducedMotion} onChange={e=>{m.state.settings.reducedMotion=e.target.checked;m.notify();}}/> Reduced motion</label></div><p>Build your team, press Fight, watch, then improve. Space pauses battle playback. Speed and sound controls are at the battle table.</p><button disabled={!m.canReplay} onClick={()=>m.replayLast()}>Replay last battle</button></section>
    {m.offline&&showReviewTools(R.gameplayV4(m.state))&&<section className="cr-panel dp-shortcuts"><h2>Demo shortcuts</h2><p>Reviewer-granted progress lets you inspect the later systems.</p><div className="cr-actions"><button onClick={()=>m.shortcut('unlock')}>Unlock all cats and build materials</button><button onClick={()=>m.shortcut('stamps')}>Add 1500 demo stamps</button><button onClick={()=>m.shortcut('chapter')}>Unlock chapters and Tower</button><button onClick={()=>m.command({type:'advanceLocalDay'})}>Advance fixture day</button></div></section>}
  </>;
}
export function Evidence() {
  const rows = [['Companion kits', '3', '12'], ['Battle skills', 'Fixed', 'All unlocked skills, chosen automatically'], ['Playable enemies', '9', '13'], ['Phased bosses', '1', '3'], ['Keywords', '7', '16'], ['Playable chapters', '1', '3'], ['Route choices', 'Fixed waves', '9 nodes, 2 branches'], ['Run charms', '0', '30 across 6 archetypes'], ['Equipment templates', '48', String(R.GEAR.length)], ['Affixes / sets', '3 / 3', `${R.AFFIXES.length} / ${R.SETS.length}`], ['Progress transfer', 'Reload resets', 'Versioned export / import'], ['Fuji integration', 'Design preview', 'Read-only wallet adapter and offline fixtures']];
  return <><PageTitle eyebrow="Depth pass · source-bound census" title="More choices at every table." /><section className="cr-panel"><table className="dp-table"><thead><tr><th>Content</th><th>Before</th><th>This build</th></tr></thead><tbody>{rows.map(row => <tr key={row[0]}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody></table><p className="dp-reference">REFERENCE — reports/cardrpg-depth/baseline/audit.json · packages/game-rules/src/cardrpg/depth/catalog.ts · equipment.ts · run.ts · save.ts · bridge.ts</p></section><p>Measured balance, performance, test results and remaining gates are recorded in reports/cardrpg-depth/CARDRPG-DEPTH-REPORT.md.</p><SharpnessEvidence /><MotionEvidence /><EffectEvidence /></>;
}
