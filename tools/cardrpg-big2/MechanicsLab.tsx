import { useEffect, useState, useSyncExternalStore } from 'react';
import { BattleView } from '../../apps/web/src/game/cardrpg/depth/Battle';
import { autoIntentHints, DEFAULT_AUTO_EXTRAS } from '@taskbar-hero/game-rules/src/cardrpg/depth/auto-extras/index';
import { MechanicsModel, LAB_TEAMS } from './mechanics-model';
import './lab.css';
export function MechanicsLab({ close }: { close: () => void }) {
  const [m] = useState(() => new MechanicsModel(true));
  useSyncExternalStore(m.subscribe, m.snapshot);
  const [encounter, setEncounter] = useState(0);
  const [team, setTeam] = useState<keyof typeof LAB_TEAMS>('garden');
  const [chapter, setChapter] = useState(1), [seed, setSeed] = useState(4011);
  const [options, setOptions] = useState({ ...DEFAULT_AUTO_EXTRAS });
  useEffect(() => {
    window.__mechanicsLab = m;
    m.state.settings.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return () => { m.audio.dispose(); delete window.__mechanicsLab; };
  }, [m]);
  const active = m.watching, hints = m.battle ? autoIntentHints(m.battle, m.options) : [];
  return <section className="b2-lab" aria-label="Mechanics lab">
    <div className="b2-lab-heading"><div><small>THE LANTERN · EXPERIMENT TABLE</small><h1>Mechanics lab</h1></div><button onClick={close}>Return to cafe</button></div>
    {!active && <div className="b2-lab-prep">
      <p>Prepare three companions, then watch them act. Experiments start off. This table has its own account and grants no rewards.</p>
      <div className="b2-lab-settings"><label>Team<select value={team} onChange={e => setTeam(e.target.value as typeof team)}>{Object.entries(LAB_TEAMS).map(([id, cats]) => <option key={id} value={id}>{cats.join(' · ')}</option>)}</select></label>
        <label>Chapter<select value={chapter} onChange={e => setChapter(Number(e.target.value))}>{[1,2,3].map(n => <option key={n}>{n}</option>)}</select></label>
        <label>Seed<input type="number" value={seed} min={1} max={2147483647} onChange={e => setSeed(Math.max(1, Math.min(2147483647, Math.floor(Number(e.target.value) || 1))))} /></label>
      </div>
      <label className="b2-master"><input type="checkbox" checked={options.autoExtras} onChange={e => setOptions({ ...options, autoExtras: e.target.checked })} /> Enable automatic extras</label>
      <fieldset disabled={!options.autoExtras}><legend>Team ideas to try</legend>
        <label><input type="checkbox" checked={options.teaCloud} onChange={e => setOptions({ ...options, teaCloud: e.target.checked })} /><b>Tea cloud</b><span>Scald from one companion + a tide/garden hit from another gives the most injured ally up to 18 shield. Once per round.</span></label>
        <label><input type="checkbox" checked={options.frontRelay} onChange={e => setOptions({ ...options, frontRelay: e.target.checked })} /><b>Front relay</b><span>A rear companion who heals or shields a front ally gives them up to 6 ultimate charge. Once per round.</span></label>
        <label><input type="checkbox" checked={options.intentLens} onChange={e => setOptions({ ...options, intentLens: e.target.checked })} /><b>Intent lens</b><span>Read the enemy’s committed target, phase and flavour weakness. Changes no rules.</span></label>
      </fieldset>
      <button className="b2-fight" onClick={() => { m.prepare(team, chapter, seed, options); setEncounter(n => n + 1); m.fight(); }}>Fight experiment</button>
      {m.battle?.result && <div className="b2-lab-result" role="status"><h2>{m.battle.result === 'party' ? 'Companions win' : 'The night wins'}</h2><p>{m.battle.round} rounds · {m.battle.choices.length} recorded party actions · {m.battle.log.filter(e => e.kind === 'auto-extra').length} extra triggers</p><details><summary>Experiment log</summary>{m.battle.log.filter(e => e.kind === 'auto-extra').map((e,i) => <p key={i}>Round {e.round}: {e.text}</p>)}</details></div>}
      <small>Evidence: 18,000 variant fights, 50 seeds per cell. Disabled/lens-only state parity: 7,200/7,200. All level 6 reference cells win 100%; no balance conclusion from those ceilings. Changes remain experimental.</small>
    </div>}
    {m.sceneStarted && <BattleView key={encounter} m={m} />}
    {active && <aside className="b2-lab-live" aria-label="Experiment cues"><b>Experiment · options locked during Fight</b>
      {m.impactVisible && m.cues.map(c => <p key={c.id}>{c.label}</p>)}
      {hints.map(h => <p key={h.actorId}>{h.name} → {h.target} ({h.row}) · phase {h.phase} · weak to {h.weakTo.join('/')} · {h.counter}</p>)}
    </aside>}
  </section>;
}
declare global { interface Window { __mechanicsLab?: MechanicsModel } }
