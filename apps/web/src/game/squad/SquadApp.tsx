import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ABILITIES, HEROES, KITS, PASSIVES, SQUAD_CONFIG as C } from '@taskbar-hero/game-rules/src/squad/config';
import type { Actor, Encounter, Hero, Preset } from '@taskbar-hero/game-rules/src/squad/types';
import { SquadController } from './controller';
import { SquadCanvas } from './SquadCanvas';
import { squadAsset } from './assets';
import './squad.css';

const LABEL = 'Prototype - Squad Combat. Candidate build, not live.';
const roleLabel = (a: Actor) => a.role === 'yarn' ? a.statuses.some(s => s.kind === 'exposed') ? 'Boss · exposed knot' : 'Boss · armored knot' : a.role === 'thread' ? 'Destroy to free ally' : a.role;

export default function SquadApp({ offline = false }: { offline?: boolean }) {
  const [controller] = useState(() => new SquadController());
  useSyncExternalStore(controller.subscribe, controller.snapshot);
  const [preset, setPreset] = useState<Preset>('hearthkeepers');
  const [encounter, setEncounter] = useState<Encounter>('patrol');
  const [seed, setSeed] = useState<number>(C.defaultSeed);
  const [calm, setCalm] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [inspect, setInspect] = useState<Hero | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const debug = import.meta.env.DEV && new URLSearchParams(location.search).get('squadDebug') === '1';
  const b = controller.battle, cats = b.actors.filter(a => a.side === 'party'), enemies = b.actors.filter(a => a.side === 'enemy' && a.hp > 0);
  const selected = enemies.find(a => a.id === controller.priority);
  const cast = b.casts.find(c => ABILITIES[c.skill]?.heavy && !c.released);
  const wave = C.waves[b.wave]!;
  const reset = (e = encounter, p = preset, waveIndex?: number) => controller.reset({ seed, preset: p, encounter: e, wave: waveIndex });
  const target = (id: string) => controller.command({ type: 'priority', target: id });
  const ultimate = (hero: Hero) => controller.command({ type: 'ultimate', hero });
  useEffect(() => {
    let last = performance.now(), frame = 0;
    const tick = (now: number) => { const delta = now - last; last = now; controller.tick(delta, document.hidden); frame = requestAnimationFrame(tick); };
    const visibility = () => { last = performance.now(); };
    document.addEventListener('visibilitychange', visibility); frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); };
  }, [controller]);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setCalm(media.matches); media.addEventListener('change', change);
    return () => media.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) || inspect) return;
      const hero = HEROES[Number(e.key) - 1];
      if (hero) { e.preventDefault(); ultimate(hero); }
      if (e.code === 'Space' && e.target === document.body) { e.preventDefault(); controller.running = !controller.running; controller.notify(); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [controller, inspect]);
  useEffect(() => { if (inspect) dialog.current?.showModal(); else dialog.current?.close(); }, [inspect]);
  const boss = enemies.find(a => a.role === 'yarn');
  const next = b.casts.find(c => cats.some(a => a.id === c.source));
  return <div className="sq-shell" data-testid="squad-prototype">
    <aside className="sq-rail" aria-label="Cafe navigation">
      <a className="sq-brand" href={offline ? '#local' : '?demo#home'} aria-label={offline ? "Return to the review overview" : "Return to the main guest game"}><span aria-hidden="true">♜</span><b>CAT<br />CAFE</b></a>
      <nav aria-label="Prototype scenes">
        <button className={encounter === 'patrol' ? 'is-current' : ''} onClick={() => { setEncounter('patrol'); reset('patrol'); }}><span aria-hidden="true">⚔</span>Patrol</button>
        <button className={encounter === 'boss' ? 'is-current' : ''} onClick={() => { setEncounter('boss'); reset('boss'); }}><span aria-hidden="true">◉</span>Yarn Giant</button>
        <button className={['dummy', 'group'].includes(encounter) ? 'is-current' : ''} onClick={() => { setEncounter('group'); reset('group'); }}><span aria-hidden="true">◎</span>Training</button>
      </nav>
      <span className="sq-rail-note">LOCAL<br />PROTOTYPE</span>
      <a href={offline ? '#local' : '?demo#home'} className="sq-return">{offline ? "Review overview ↑" : "Main game ↗"}</a>
    </aside>
    <div className="sq-main">
      <header className="sq-topbar">
        <div><p className="sq-eyebrow">Lantern Cat Café <span> / Combat study 01</span></p><h1>The last lantern</h1></div>
        <div className="sq-hud"><span>Guest squad <b>3 cats</b></span><span>Fish found <b>{b.fishFound} <small>cosmetic</small></b></span><span>Run time <b>{(b.time / 1000).toFixed(1)}s</b></span></div>
      </header>
      <p className="sq-prototype">{LABEL}</p>
      <main className="sq-content">
        <div className="sq-titlebar"><div><span className="sq-eyebrow">{encounter === 'patrol' ? `Evening patrol / Wave ${b.wave + 1} of 3` : encounter === 'boss' ? `Yarn Giant / Phase ${b.phase}` : 'Training yard / Prototype gear'}</span><h2>{encounter === 'patrol' ? wave.name : encounter === 'boss' ? 'A knot worth untying' : encounter === 'group' ? 'The crowded yard' : 'One patient cushion'}</h2></div>
          <div className="sq-tools"><label>Squad <select value={preset} onChange={e => { const p = e.target.value as Preset; setPreset(p); reset(encounter, p); }}><option value="hearthkeepers">A · Hearthkeepers</option><option value="lanternbreakers">B · Lanternbreakers</option></select></label>
            <button className="sq-start" onClick={() => { if (b.result) reset(); else { controller.running = !controller.running; controller.notify(); } }}>{b.result ? 'Retry encounter' : controller.running ? 'Pause' : b.time ? 'Resume' : 'Start encounter'}</button></div>
        </div>
        <div className="sq-battle-grid">
          <section className="sq-arena-column" aria-label="Battle and party">
            <div className="sq-arena-frame">
              <div className="sq-arena-caption"><span><i className={controller.running ? 'sq-live' : ''} />{b.result ? b.result.winner === 'party' ? 'Cafe secured' : 'Squad defeated' : controller.running ? 'Squad in action' : b.time ? 'Paused' : 'Ready when you are'}</span><span>{encounter === 'boss' ? `${Math.max(0, Math.ceil((C.boss.enrageMs - b.time) / 1000))}s to enrage` : 'Click a foe to mark it'}</span></div>
              <SquadCanvas controller={controller} calm={calm} onTarget={target} />
              <div className={`sq-danger${cast ? ' is-danger' : ''}`} role="status">{cast ? `⚠ ${ABILITIES[cast.skill]!.name} → ${cast.targets.map(id => b.actors.find(a => a.id === id)?.name).join(', ')} · ${Math.max(0, (cast.release - b.time) / 1000).toFixed(1)}s` : b.transitionAt ? 'A breath between waves. HP carries forward.' : boss?.statuses.some(s => s.kind === 'exposed') ? '◆ Knot exposed — a strong moment for Lanternstorm.' : encounter === 'boss' ? 'Free a bound ally, clear loose threads, or burst the exposed knot.' : 'Mochi holds the front. Soot clears groups. Clover keeps them standing.'}</div>
            </div>
            <div className="sq-party" aria-label="Three independent heroes">
              {cats.map((a, i) => <article className={`sq-card ${a.hp <= 0 ? 'is-defeated' : ''}`} key={a.id}>
                <div className="sq-card-top"><img src={squadAsset(`portrait-${a.role}.png`)} alt="" /><div><button className="sq-hero-name" onClick={() => setInspect(a.role as Hero)}>{a.name} <span>↗</span></button><span className="sq-role">{a.role}</span></div><span className="sq-hp-text">{a.hp}/{a.maxHp}</span></div>
                <meter aria-label={`${a.name} health`} min={0} max={a.maxHp} value={a.hp} />
                <div className="sq-statuses">{a.shield > 0 && <span>◇ {a.shield}</span>}{a.statuses.length ? a.statuses.map(s => <span key={s.kind} title={`${s.kind}: ${Math.max(0, (s.until - b.time) / 1000).toFixed(1)} seconds`}>{s.kind}</span>) : <span className="sq-muted">{PASSIVES[a.role as Hero].name}</span>}</div>
                <div className="sq-cooldowns">{KITS[a.role as Hero].slice(0, 2).map(id => <span key={id} title={ABILITIES[id]!.description}><img src={squadAsset(`icon-${id}.png`)} alt="" /><b>{ABILITIES[id]!.name}</b><small>{(a.cooldowns[id] ?? 0) > b.time ? `${Math.ceil((a.cooldowns[id]! - b.time) / 1000)}s` : 'Ready'}</small></span>)}</div>
                <div className="sq-ultimate-row"><button className="sq-ultimate" onClick={() => ultimate(a.role as Hero)} disabled={a.hp <= 0 || a.charge < C.ultimate.max || a.castId !== null || b.result !== null} title={ABILITIES[KITS[a.role as Hero][2]!]!.description}><kbd>{i + 1}</kbd>{ABILITIES[KITS[a.role as Hero][2]!]!.name}<span>{Math.floor(a.charge)}%</span></button><label className="sq-auto"><input type="checkbox" checked={controller.autoFor(a.id)} onChange={e => controller.command({ type: 'auto', hero: a.role as Hero, enabled: e.target.checked })} />Auto<span className="sr-only"> ultimate for {a.name}</span></label></div>
              </article>)}
            </div>
          </section>
          <aside className="sq-side" aria-label="Encounter tactics">
            <div className="sq-goal"><span className="sq-eyebrow">Tonight's small victory</span><h3>{encounter === 'patrol' ? 'Bring everyone home.' : encounter === 'boss' ? 'Find the loose end.' : 'Learn your squad.'}</h3><p>{encounter === 'patrol' ? wave.goal : encounter === 'boss' ? 'Destroy a Binding Thread to free its cat. A broken knot takes extra damage.' : 'Compare the damage, healing and shields after the run.'}</p></div>
            {encounter === 'patrol' && <ol className="sq-waves" aria-label="Encounter waves">{C.waves.map((w, i) => <li className={i === b.wave ? 'is-current' : i < b.wave ? 'is-cleared' : ''} key={w.name}><span>{i < b.wave ? '✓' : i + 1}</span>{w.name}<small>{w.roles.length} foes</small></li>)}</ol>}
            {boss && <div className="sq-break"><span>Knot stagger <b>{boss.break}/{C.boss.breakMax}</b></span><meter aria-label="Yarn Giant stagger" min={0} max={C.boss.breakMax} value={boss.break} /><p>{b.phase === 2 ? 'Phase 2 · Cross Stitch hits both rows.' : 'Phase 1 · Read the sweep lane.'}</p></div>}
            <label className="sq-tactic">Tactics<select value={controller.tactic} onChange={e => controller.command({ type: 'tactic', value: e.target.value as 'protect' })}><option value="protect">Protect allies / free threads</option><option value="caster">Hit backline casters</option><option value="opening">Save storm for an opening</option></select></label>
            <div className="sq-target-heading"><h3>{selected ? 'Priority target' : 'Choose a priority'}</h3>{selected && <button onClick={() => controller.command({ type: 'priority', target: null })}>Clear</button>}</div>
            <div className="sq-targets" aria-label="Enemy targets">{enemies.map(a => <button key={a.id} aria-pressed={controller.priority === a.id} onClick={() => target(a.id)} className={controller.priority === a.id ? 'is-marked' : ''}><span className="sq-target-glyph" aria-hidden="true">{a.role === 'healer' ? '✚' : a.role === 'yarn' ? '◉' : a.role === 'thread' ? '⌗' : a.role === 'charger' ? '➤' : a.role === 'ranger' ? '↗' : '◇'}</span><span><b>{a.name}</b><small>{roleLabel(a)}</small></span><span className="sq-target-hp">{a.hp}<small>HP</small></span></button>)}</div>
            <p className="sq-next">Next: {next ? `${b.actors.find(a => a.id === next.source)?.name} → ${ABILITIES[next.skill]!.name}` : 'Squad chooses independently'}</p>
            <label className="sq-calm"><input type="checkbox" checked={calm} onChange={e => setCalm(e.target.checked)} />Calm effects <span>zones stay visible</span></label>
          </aside>
        </div>
        <div className="sq-footer"><span>Keys <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> ultimates · Tab to select targets · auto skills always active</span><details><summary>Combat log</summary><ol>{b.events.filter(e => ['cast_start', 'death', 'boss_phase', 'passive'].includes(e.type)).slice(-C.presentation.logEntries).reverse().map(e => <li key={e.seq}><time>{(e.time / 1000).toFixed(1)}s</time> {e.source && b.actors.find(a => a.id === e.source)?.name} {e.skill ? ABILITIES[e.skill]?.name ?? e.skill : e.type.replace('_', ' ')}</li>)}</ol></details></div>
        {['dummy', 'group'].includes(encounter) && <div className="sq-training-controls"><button onClick={() => { setEncounter('dummy'); reset('dummy'); }}>Single target</button><button onClick={() => { setEncounter('group'); reset('group'); }}>Eight targets</button><span>Prototype gear: {preset === 'hearthkeepers' ? 'Last Light: milk heals leave a shield.' : 'Needle Lantern: ordinary Witch sparks pierce a second foe.'} Mochi's guarded hits build boss stagger.</span></div>}
        {b.result && <section className="sq-result" aria-label="Encounter result"><div><span className="sq-eyebrow">{b.result.winner === 'party' ? 'A good night at the cafe' : 'A lesson for next time'}</span><h3>{b.result.cause}</h3><p>{b.result.suggestion}</p><button className="sq-start" onClick={() => { reset(); controller.running = true; controller.notify(); }}>Retry this encounter</button><button onClick={() => { setEncounter(encounter === 'boss' ? 'patrol' : 'boss'); reset(encounter === 'boss' ? 'patrol' : 'boss'); }}> {encounter === 'boss' ? 'Return to patrol' : 'Meet Yarn Giant'}</button></div><table><caption>Local breakdown · no save rewards</caption><thead><tr><th>Cat</th><th>Damage</th><th>Heal</th><th>Shield</th></tr></thead><tbody>{cats.map(a => <tr key={a.id}><th>{a.name}</th><td>{b.result!.totals[a.id]!.damage}</td><td>{b.result!.totals[a.id]!.healing}</td><td>{b.result!.totals[a.id]!.shielding}</td></tr>)}</tbody></table></section>}
        {debug && <details className="sq-debug"><summary>Local review controls</summary><label>Seed <input type="number" value={seed} onChange={e => setSeed(Number(e.target.value) || C.defaultSeed)} /></label><label>Speed<select value={controller.speed} onChange={e => { controller.speed = Number(e.target.value); controller.notify(); }}>{C.presentation.speeds.map(s => <option key={s} value={s}>×{s}</option>)}</select></label>{C.waves.map((_, i) => <button key={i} onClick={() => { setEncounter('patrol'); reset('patrol', preset, i); }}>Wave {i + 1}</button>)}<button onClick={() => { setEncounter('boss'); reset('boss'); }}>Spawn boss</button><button onClick={() => controller.grantCharge()}>Fill ultimate charge</button></details>}
      </main>
    </div>
    <dialog ref={dialog} className="sq-inspect" onClose={() => setInspect(null)} aria-labelledby="sq-inspect-title">{inspect && <><button className="sq-close" onClick={() => setInspect(null)}>Close ×</button><p className="sq-eyebrow">Prototype loadout · no saved equipment</p><h2 id="sq-inspect-title">{cats.find(a => a.id === inspect)?.name} · {inspect}</h2><p>{PASSIVES[inspect].name}: {PASSIVES[inspect].description}</p><dl>{Object.entries(C.stats[inspect]).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>{KITS[inspect].map(id => <article key={id}><img src={squadAsset(`icon-${id}.png`)} alt="" /><div><h3>{ABILITIES[id]!.name}</h3><p>{ABILITIES[id]!.description}</p></div></article>)}<p>Gear stub: {C.presets[preset].gear}. Stats shown here are base values before the preset. All progress disappears on reload.</p></>}</dialog>
  </div>;
}
