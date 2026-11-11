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
