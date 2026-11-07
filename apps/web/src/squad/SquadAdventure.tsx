import { useEffect, useMemo, useRef, useState } from 'react';
import { squad } from '@taskbar-hero/game-rules';
import { usePrefersReducedMotion } from '../motion/reducedMotion';
import { SquadCanvas } from './SquadCanvas';
import { RigPortrait } from './RigPortrait';
import type { SquadBridge } from './SquadScene';
import './squad.css';
import { SquadCamp } from './SquadCamp';
import { downloadJson, loadLab } from './storage';

const sec = (ticks: number) => Math.ceil(Math.max(0, ticks) / 20);
export default function SquadAdventure({ active = true }: { active?: boolean }) {
  const [initial] = useState(loadLab);
  const [lab, setLab] = useState(initial.save), labRef = useRef(lab);
  const [notice, setNotice] = useState(initial.error);
  const saveBlocked = useRef(Boolean(initial.error));
  const [battle, setBattle] = useState(() => initial.save.run ? squad.replayBattle(initial.save.run.replay) : squad.createBattle({ team: initial.save.profile.team, level: squad.squadLevel(initial.save.profile) }));
  const current = useRef(battle);
  const [started, setStarted] = useState(Boolean(initial.save.run)), [paused, setPaused] = useState(Boolean(initial.save.run)), [hidden, setHidden] = useState(document.hidden);
  const [compact, setCompact] = useState(false), [inspect, setInspect] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [replayFile, setReplayFile] = useState<squad.BattleReplay | null>(initial.save.run && !initial.save.run.eligible ? initial.save.run.replay : null);
  const playback = useRef<{ tape: squad.BattleReplay; index: number; remainder: number } | null>(null);
  const [watching, setWatching] = useState(false);
  const reduced = usePrefersReducedMotion();
  const finished = battle.phase === 'won' || battle.phase === 'lost';
  const running = started && !paused && !hidden && active && !finished;
  const view = useRef({ running, reduced, speed, restoration: lab.profile.restoration }); view.current = { running, reduced, speed, restoration: lab.profile.restoration };
  const persist = (next: squad.LabSave) => {
    labRef.current = next;
    if (!saveBlocked.current) try { localStorage.setItem(squad.SAVE_KEY, JSON.stringify(next)); } catch { setNotice('Browser storage is unavailable. Export your progress before leaving.'); }
  };
  const commit = (next: squad.LabSave) => { persist(next); setLab(next); };
  const checkpoint = () => { const saved = labRef.current; if (saved.run) persist({ ...saved, run: { ...saved.run, replay: playback.current?.tape ?? squad.exportReplay(current.current) } }); };
  useEffect(() => {
    const timer = window.setInterval(checkpoint, 3000);
    const flush = () => checkpoint(); window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', flush);
    return () => { clearInterval(timer); flush(); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', flush); };
  }, []);
  useEffect(() => {
    if (!finished || !labRef.current.run || labRef.current.run.settled) return;
    const saved = { ...labRef.current, run: { ...labRef.current.run, replay: squad.exportReplay(current.current) } };
    const next = squad.settleRun(saved, current.current); commit(next);
  }, [finished, battle]);
  const update = (next: squad.Battle) => { current.current = next; setBattle(next); };
  const command = (c: squad.Command) => { if (!playback.current) update(squad.commandBattle(current.current, c)); };
  const bridge = useMemo<SquadBridge>(() => ({ read: () => ({ battle: current.current, ...view.current }), pick: target => { if (playback.current) return; current.current = squad.commandBattle(current.current, { type: 'focus', target }); setBattle(current.current); } }), []);
  useEffect(() => { const change = () => setHidden(document.hidden); document.addEventListener('visibilitychange', change); return () => document.removeEventListener('visibilitychange', change); }, []);
  useEffect(() => {
    if (!running) return;
    let raf = 0, last = performance.now(), publish = last;
    const frame = (now: number) => {
      const elapsed = Math.min(250, now - last) * speed; last = now;
      const tape = playback.current;
      if (tape) {
        tape.remainder += elapsed;
        while (tape.remainder >= squad.STEP_MS && current.current.tick < tape.tape.ticks && !['won', 'lost'].includes(current.current.phase)) {
          while (tape.tape.commands[tape.index]?.tick === current.current.tick) current.current = squad.commandBattle(current.current, tape.tape.commands[tape.index++]!.command);
          current.current = squad.advanceBattle(current.current, squad.STEP_MS); tape.remainder -= squad.STEP_MS;
        }
        if (current.current.tick >= tape.tape.ticks || ['won', 'lost'].includes(current.current.phase)) {
          while (tape.tape.commands[tape.index]?.tick === current.current.tick) current.current = squad.commandBattle(current.current, tape.tape.commands[tape.index++]!.command);
          playback.current = null; setWatching(false); setPaused(true); setBattle(current.current); return;
        }
      } else current.current = squad.advanceBattle(current.current, elapsed);
      const ended = current.current.phase === 'won' || current.current.phase === 'lost';
      if (now - publish >= 100 || ended) { setBattle(current.current); publish = now; }
      if (!ended) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame); return () => cancelAnimationFrame(raf);
  }, [running, speed]);
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.altKey || e.ctrlKey || e.metaKey || (e.target instanceof HTMLElement && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName))) return;
      const index = Number(e.key) - 1;
      if (index >= 0 && index < 3 && started) { e.preventDefault(); command({ type: 'ultimate', actor: `cat-${index}` }); }
    };
    document.addEventListener('keydown', onKey); return () => document.removeEventListener('keydown', onKey);
  }, [active, started]);
  const reset = (options: squad.BattleOptions = current.current.options, start = false) => {
    playback.current = null; setWatching(false); setReplayFile(null);
    const next = squad.createBattle({ ...options, team: labRef.current.profile.team, level: squad.squadLevel(labRef.current.profile) });
    update(next); setStarted(start); setPaused(false); setInspect(null);
    commit({ ...labRef.current, run: start ? { replay: squad.exportReplay(next), eligible: true, settled: false } : null });
  };
  const changeProfile = (profile: squad.Profile) => {
    commit({ ...labRef.current, profile });
    if (!started) update(squad.createBattle({ ...current.current.options, team: profile.team, level: squad.squadLevel(profile) }));
  };
  const importFile = async (file: File | undefined, kind: 'replay' | 'save') => {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Please choose a JSON file smaller than 2 MB.');
      const data: unknown = JSON.parse(await file.text());
      const saved = kind === 'save' ? squad.parseSave(data) : { ...labRef.current, run: { replay: squad.parseReplay(data), eligible: false, settled: true } };
      const next = saved.run ? squad.replayBattle(saved.run.replay) : squad.createBattle({ team: saved.profile.team, level: squad.squadLevel(saved.profile) });
      playback.current = null; setWatching(false); setReplayFile(saved.run && !saved.run.eligible ? saved.run.replay : null);
      if (kind === 'save') saveBlocked.current = false;
      commit(saved); update(next); setStarted(Boolean(saved.run)); setPaused(true); setInspect(null);
      setNotice(kind === 'replay' ? `Replay v${next.version} opened at ${(next.tick / 20).toFixed(1)}s. Replay viewing grants no supplies.` : 'Save restored. The encounter is paused.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Could not import this file.'); }
  };
  const watchReplay = () => {
    if (!replayFile) return;
    update(squad.replayBattle({ ...replayFile, ticks: 0, commands: [] }));
    playback.current = { tape: replayFile, index: 0, remainder: 0 }; setWatching(true); setStarted(true); setPaused(false);
  };
  const team = battle.actors.filter(a => a.side === 'hero'), enemies = battle.actors.filter(a => a.side === 'enemy' && a.hp > 0);
  const customFormation = team.map(a => a.role).join(',') !== squad.PRESETS[battle.options.preset].join(',');
  const selected = enemies.find(a => a.id === battle.focus);
  const tells = enemies.filter(a => a.cast && ['sweep', 'thread', 'charge', 'volley', 'suction', 'motor', 'debris'].includes(a.cast.skill));
  const inspected = team.find(a => a.id === inspect);
  const latest = battle.events.filter(e => ['wave', 'interrupt', 'passive', 'death', 'settle'].includes(e.type)).slice(-6).reverse();
  return <section className={`squad-adventure${compact ? ' squad-compact' : ''}`} aria-label="Squad combat prototype" data-testid="squad-adventure" data-phase={battle.phase}>
    <header className="squad-heading">
      <div><span className="squad-eyebrow">ADVENTURE LAB · LOCAL PROTOTYPE</span><h2>The hearth patrol</h2><p>Three cats. One cozy home worth defending.</p></div>
      <div className="squad-heading-actions"><button type="button" aria-pressed={compact} onClick={() => setCompact(!compact)}>{compact ? 'Full battlefield' : 'Compact view'}</button><span className="squad-local-note">Saved locally · no account rewards</span></div>
    </header>
    <div className="squad-toolbar">
      <label>Squad<select aria-label="Squad" value={customFormation ? 'custom' : battle.options.preset} disabled={started && !finished} onChange={e => { const preset = e.target.value as keyof typeof squad.PRESETS; const profile = squad.equipTeam(labRef.current.profile, squad.PRESETS[preset].map(squad.defaultLoadout)); changeProfile(profile); reset({ ...battle.options, preset }); }}>{customFormation && <option value="custom" disabled>Custom formation</option>}<option value="hearth">Hearthkeepers · guard / control / heal</option><option value="cinders">Twin embers · control / burst / heal</option><option value="hunters" disabled={!lab.profile.recruited.includes('rogue') || !lab.profile.recruited.includes('archer')}>Hunters · guard / burst / arrows</option></select></label>
      <label>Encounter<select aria-label="Encounter" value={battle.options.scenario} disabled={started && !finished} onChange={e => reset({ ...battle.options, scenario: e.target.value as squad.BattleOptions['scenario'] })}><option value="patrol">Three waves + Yarn Giant</option><option value="boss">Yarn Giant practice</option><option value="crowd">Eight-enemy training</option><option value="dummy">Single-target training</option><option value="vacuum" disabled={lab.profile.clears < 1}>Kitchen · Vacuum Beast (after 1 patrol)</option></select></label>
      <label>Tactics<select aria-label="Tactics" disabled={watching} value={battle.tactic} onChange={e => command({ type: 'tactic', tactic: e.target.value as 'protect' | 'backline' })}><option value="protect">Protect allies</option><option value="backline">Focus enemy support</option></select></label>
      <button type="button" className="squad-primary" onClick={() => { if (!started) { commit({ ...labRef.current, run: { replay: squad.exportReplay(current.current), eligible: true, settled: false } }); setPaused(false); setStarted(true); } else if (finished) reset(battle.options, true); else setPaused(!paused); }}>{!started ? 'Begin patrol' : finished ? 'Retry encounter' : paused ? 'Resume' : 'Pause'}</button>
      {started && !finished && <button type="button" onClick={() => reset()}>Prepare</button>}
    </div>
    <div className="squad-battle-layout">
      <div className="squad-main">
        <div className="squad-arena-shell">
          <div className="squad-arena-top"><span>{battle.options.scenario === 'vacuum' ? 'BOSS · VACUUM BEAST' : battle.options.scenario === 'dummy' ? 'TRAINING · CUSHION' : battle.options.scenario === 'crowd' ? 'TRAINING · 8 ENEMIES' : battle.wave === 3 ? 'BOSS · YARN GIANT' : `WAVE ${battle.wave + 1} / 3`}</span><strong>{battle.options.scenario === 'vacuum' ? 'Trouble in the kitchen' : battle.options.scenario === 'dummy' ? 'Practice your build' : squad.WAVES[battle.wave]!.name}</strong><span>{Math.floor(battle.tick / 20)}s</span></div>
          {active && <SquadCanvas bridge={bridge} />}
          {(!started || paused || battle.phase === 'between' || finished) && <div className="squad-arena-message" role="status">{!started ? 'Your squad is ready. Begin the patrol.' : paused && !finished ? 'Paused · plan your next move' : battle.phase === 'between' ? 'Room cleared · moving onward with current HP' : battle.phase === 'won' ? 'Hearth secured!' : 'The squad needs a new plan'}</div>}
          <div className="squad-arena-bottom"><span>{tells.length ? tells.map(a => `${a.name}: ${squad.SKILLS[a.cast!.skill].name}`).join(' · ') : battle.options.scenario === 'vacuum' ? 'Interrupt Motor overload to overheat the beast. Shield against dust barrage.' : battle.wave === 3 ? 'Break the knot to free a bound ally. Strike when the Giant is exposed.' : 'Select an enemy to focus the squad. Cooldown skills fire automatically.'}</span></div>
        </div>
        <div className="squad-party" aria-label="Party and ultimate controls">
          {team.map((a, i) => {
            const kit = squad.HERO_KITS[a.role as squad.HeroRole], remaining = sec((a.cooldowns[kit.ultimate] ?? 0) - battle.tick);
            return <article className="squad-card" key={a.id} data-defeated={!a.hp}>
              <div className="squad-card-title"><RigPortrait role={a.role as squad.HeroRole} name={a.name} /><button type="button" onClick={() => setInspect(inspect === a.id ? null : a.id)} aria-expanded={inspect === a.id}><strong>{a.name}</strong><span>{a.role}</span></button><span className="squad-hp-number">{a.hp}<small> / {a.maxHp}</small></span></div>
              <meter min={0} max={a.maxHp} value={a.hp} aria-label={`${a.name} HP`} />
              <div className="squad-status-line">{!a.hp ? 'Defeated' : a.statuses.length ? a.statuses.map(x => `${x.kind}${x.kind === 'shield' ? ` ${x.value}` : ''}`).join(' · ') : 'Ready for trouble'}</div>
              <div className="squad-cooldowns">{kit.abilities.map(id => <span key={id} title={squad.SKILLS[id].help}>{squad.SKILLS[id].name} <b>{sec((a.cooldowns[id] ?? 0) - battle.tick) || '✓'}</b></span>)}</div>
              <button type="button" className="squad-ultimate" title={squad.SKILLS[kit.ultimate].help} disabled={watching || !started || finished || !a.hp || remaining > 0 || a.requestedUlt} onClick={() => command({ type: 'ultimate', actor: a.id })}><kbd>{i + 1}</kbd> {squad.SKILLS[kit.ultimate].name}<span>{remaining ? `${remaining}s` : a.requestedUlt ? 'Queued' : 'Ready'}</span></button>
            </article>;
          })}
        </div>
        {inspected && <section className="squad-inspect" aria-label={`${inspected.name} details`}><strong>{inspected.name} · {inspected.gear.map(id => squad.gearById(id)?.name).join(' / ')}</strong><p>Attack {inspected.attack} · Defense {inspected.defense} · Basic every {(inspected.interval / 20).toFixed(1)}s</p><p>{squad.HERO_KITS[inspected.role as squad.HeroRole].passive}</p>{[...squad.HERO_KITS[inspected.role as squad.HeroRole].abilities, squad.HERO_KITS[inspected.role as squad.HeroRole].ultimate].map(id => <p key={id}><b>{squad.SKILLS[id].name}:</b> {squad.SKILLS[id].help}</p>)}</section>}
        <div className="squad-playback"><label><input type="checkbox" disabled={watching} checked={battle.auto} onChange={e => command({ type: 'auto', enabled: e.target.checked })} /> Auto ultimates</label><label>Speed <select aria-label="Playback speed" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value={1}>1×</option><option value={2}>2×</option></select></label><span>{hidden ? 'Paused while hidden' : reduced ? 'Reduced motion · all danger marks remain visible' : 'Keys 1–3 trigger a ready ultimate'}</span></div>
        {finished && <section className="squad-results" aria-label="Encounter result"><h3>{battle.phase === 'won' ? 'A little safer, a little cozier.' : 'Regroup at the hearth.'}</h3><p>{battle.diagnosis}</p><table><caption>Encounter breakdown</caption><thead><tr><th>Cat</th><th>Damage</th><th>Healing</th><th>Shield granted</th></tr></thead><tbody>{team.map(a => <tr key={a.id}><th>{a.name}</th><td>{a.damage}</td><td>{a.healing}</td><td>{a.shielding}</td></tr>)}</tbody></table><p>Practice score: {battle.settlements.reduce((n, x) => n + x.budget, 0)} · {battle.settlements.length} rooms cleared · seed {battle.options.seed}</p><button type="button" onClick={() => reset({ ...battle.options, seed: battle.options.seed + 1 }, true)}>Try a new seed</button> <button type="button" onClick={() => downloadJson(squad.exportReplay(battle), `hearth-patrol-${battle.options.seed}.json`)}>Save battle replay</button></section>}
      </div>
      <aside className="squad-sidebar" aria-label="Encounter tactics">
        <span className="squad-eyebrow">READ THE ROOM</span><h3>{battle.options.scenario === 'vacuum' ? 'Cool the motor' : battle.wave === 3 ? 'Untangle the Giant' : 'Choose your opening'}</h3><p>{battle.options.scenario === 'vacuum' ? 'The suction lane pulls cats forward. Interrupt Motor overload with Bash or Snare to trigger a long opening, then spend your ultimates.' : battle.wave === 3 ? 'Watch the sweep lane. Destroy a binding knot to free your ally, then burst during the golden opening.' : 'The mender keeps its friends alive. Focus it, or snare the front pack and let an Ember Orb land.'}</p>
        <div className="squad-target-heading"><strong>Priority target</strong><button type="button" onClick={() => command({ type: 'focus', target: null })} disabled={!battle.focus}>Clear</button></div>
        <div className="squad-targets" aria-label="Enemy targets">{enemies.map(a => <button type="button" key={a.id} aria-pressed={battle.focus === a.id} onClick={() => command({ type: 'focus', target: a.id })}><span>{a.role === 'knot' ? '◇' : a.role === 'mender' ? '+' : a.role === 'charger' ? '»' : '◆'} {a.name}</span><small>{a.hp} / {a.maxHp}</small><meter min={0} max={a.maxHp} value={a.hp} aria-label={`${a.name} HP`} /></button>)}</div>
        {selected && <p className="squad-target-help">{squad.ENEMIES[selected.role as squad.EnemyRole].help}</p>}
        <details className="squad-journal"><summary>Battle notes</summary><ol>{latest.map(e => <li key={e.id}><time>{(e.tick / 20).toFixed(1)}s</time> {e.text ?? (e.type === 'death' ? 'A fighter fell' : e.type)}</li>)}</ol></details>
      </aside>
    </div>
    <div className="squad-session-tools">
      <label>Patrol route <select aria-label="Patrol route" disabled={started && !finished} value={battle.options.route} onChange={e => reset({ ...battle.options, route: e.target.value as squad.Route })}><option value="safe">Hearth path · rest before boss · 35 supplies</option><option value="supplies">Sewing cache · extra mender · 50 supplies</option><option value="challenge">Ram's corridor · extra charger · 60 supplies</option></select></label>
      <button type="button" onClick={() => { checkpoint(); downloadJson(labRef.current, 'hearth-patrol-save-v2.json'); }}>Export save</button>
      <label className="squad-file">Import save<input aria-label="Import save" disabled={started && !finished} type="file" accept=".json,application/json" onChange={e => { void importFile(e.target.files?.[0], 'save'); e.target.value = ''; }} /></label>
      <label className="squad-file">Open replay<input aria-label="Open replay" disabled={started && !finished} type="file" accept=".json,application/json" onChange={e => { void importFile(e.target.files?.[0], 'replay'); e.target.value = ''; }} /></label>
    </div>
    {replayFile && <div className="squad-session-tools"><button type="button" disabled={watching} onClick={watchReplay}>Watch replay from start</button><span>{watching ? 'Playing recorded commands' : 'Replay session · no supplies earned'}</span></div>}
    {notice && <p className="squad-notice" role="status">{notice}</p>}
    {finished && lab.run?.eligible && <p className="squad-notice">{battle.phase === 'won' && ['patrol', 'vacuum'].includes(battle.options.scenario) ? `Progress saved · ${lab.profile.coins} supplies · shared level ${squad.squadLevel(lab.profile)}. Visit camp to recruit, craft or restore the café.` : 'Training and defeats grant no supplies. Your discoveries have been recorded.'}</p>}
    <SquadCamp profile={lab.profile} change={changeProfile} disabled={started && !finished} />
  </section>;
}
