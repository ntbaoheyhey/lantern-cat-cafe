import { useEffect, useId, useMemo, useRef, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';
import { CostView } from '../shared';

export function PowerA6({ value, label = 'Power', reducedMotion = false }: { value: number; label?: string; reducedMotion?: boolean }) {
  const [shown, setShown] = useState(value), [gain, setGain] = useState(0);
  const previous = useRef(value), visual = useRef(value);
  useEffect(() => {
    const from = visual.current, delta = value - previous.current;
    previous.current = value; setGain(Math.max(0, delta));
    const reduced = reducedMotion || globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || delta <= 0) { setGain(0); visual.current = value; setShown(value); return; }
    let frame = 0, started = 0;
    const paint = (now: number) => {
      if (!started) started = now;
      const progress = Math.min(1, (now - started) / 500);
      visual.current = Math.round(from + (value - from) * (1 - (1 - progress) ** 3));
      setShown(visual.current);
      if (progress < 1) frame = requestAnimationFrame(paint);
    };
    frame = requestAnimationFrame(paint);
    const clear = setTimeout(() => setGain(0), 1600);
    return () => { cancelAnimationFrame(frame); clearTimeout(clear); };
  }, [value, reducedMotion]);
  return <span className="a6-power" data-gain={gain > 0} aria-label={`${label} ${value}`}><span aria-hidden="true">{label} <b>{shown.toLocaleString('en-US')}</b>{gain > 0 && <em key={value}>+{gain.toLocaleString('en-US')}</em>}</span></span>;
}

export function QuickUpgradeA6({ m }: { m: DepthModel }) {
  const state = m.state;
  const options = useMemo(() => R.upgradeOptionsA6(state), [state]);
  const equipped = useMemo(() => R.autoEquipA6(state), [state]);
  const best = options[0], locked = !!state.run && !state.run.complete;
  const gearNote = useId(), power = Math.round(R.teamPowerV4(state));
  const gearGain = equipped.ok ? Math.round(R.teamPowerV4(equipped.state)) - power : 0;
  return <section className="a6-quick-upgrade" aria-label="Quick upgrades">
    <div><h2>One tap, stronger team</h2><PowerA6 value={power} label="Team Power" reducedMotion={state.settings.reducedMotion}/></div>
    {best ? <div><p>{best.label} · <b>+{best.after - best.before} Power</b></p><CostView cost={best.cost}/></div> : <p>{locked ? 'Finish this route to train your crew.' : 'Your next patrol brings more upgrade materials.'}</p>}
    <div className="cr-actions"><button className="cr-primary" disabled={!best} onClick={() => { if (best) m.apply(R.applyUpgradeA6(m.state, best.change, best.expectedBuild), best.label); }}>Quick upgrade</button>
      <div className="a6-equip-action"><button disabled={!equipped.ok} aria-describedby={gearNote} onClick={() => m.apply(R.autoEquipA6(m.state), 'Best available gear equipped.')}>Auto-equip best gear</button>
        <small id={gearNote}>{locked ? 'After this route' : equipped.ok ? <>Free · <b>+{gearGain.toLocaleString('en-US')} Power</b> · owned gear</> : 'No stronger gear available'}</small></div></div>
    {!locked && !equipped.ok && <small>{equipped.error}</small>}
  </section>;
}

/** Offer owned gear while the crew is still home; starting a route locks equipment. */
export function PatrolGearA6({ m, onEquipped }: { m: DepthModel; onEquipped: () => void }) {
  const state = m.state;
  const eligible = R.gameplayA6(state) && !R.introductionA6(state).guide && !m.battle && (!state.run || state.run.complete);
  const preview = useMemo(() => eligible ? R.autoEquipA6(state) : null, [state, eligible]);
  const gain = preview?.ok ? Math.round(R.teamPowerV4(preview.state)) - Math.round(R.teamPowerV4(state)) : 0;
  const [applied, setApplied] = useState<{ equipment: string; gain: number } | null>(null);
  const equipment = JSON.stringify([state.team, state.equipment]);
  const ready = applied?.equipment === equipment ? applied : null;
  if (!eligible || gain <= 0 && !ready) return null;
  const equip = () => {
    const before = Math.round(R.teamPowerV4(m.state)), result = R.autoEquipA6(m.state);
    if (!m.apply(result, 'Owned gear equipped. Your crew is ready for patrol.')) return;
    setApplied({ equipment: JSON.stringify([m.state.team, m.state.equipment]), gain: Math.round(R.teamPowerV4(m.state)) - before });
    onEquipped();
  };
  return <aside className="a6-patrol-gear" aria-label="Before your patrol">
    {gain > 0 ? <button onClick={equip} aria-label={`Equip owned gear · +${gain.toLocaleString('en-US')} Power`}>
      <small>FREE GEAR UPGRADE</small><strong>+{gain.toLocaleString('en-US')} Power</strong><span>Equip owned gear <span aria-hidden="true">→</span></span>
    </button> : <div role="status"><small>OWNED GEAR EQUIPPED</small><strong>+{ready!.gain.toLocaleString('en-US')} Power</strong><span>Ready for your patrol</span></div>}
  </aside>;
}
