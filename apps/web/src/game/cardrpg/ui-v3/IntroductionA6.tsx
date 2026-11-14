import {GameIcon} from '../../../ui/GameIcon';
import {HelpC2} from './TextDietC2';
import { useEffect, useRef, useState } from 'react';
import * as R from '@taskbar-hero/game-rules/src/cardrpg/depth/index';
import type { DepthModel } from '../depth/model';

const firstSteps = [
  { id: 'patrol', title: 'First patrol', action: 'Tap Night Patrol. Your cats fight together.', reward: 'Finish practice to one free friend', screen: 'prepare', detail: 'Tap Fight. Your cats attack and use ultimates on their own.' },
  { id: 'recruit', title: 'Free friend', action: 'A free friend is waiting at Recruit.', reward: 'Welcome a friend to gear and bonds open', screen: 'gacha', detail: 'Choose Welcome a friend. This invitation costs no stamps.' },
  { id: 'upgrade', title: 'First level', action: 'Open Cats and level up one friend.', reward: 'First level to Cafe gifts open', screen: 'collection', detail: 'Choose Level up in Growth. Review the cost and stronger stats before you spend.' },
] as const;

/** Keep the saved milestone, but point to an action available on this account. */
export function firstStepViewA6(m: DepthModel) {
  const guide = R.introductionA6(m.state).guide, index = firstSteps.findIndex(step => step.id === guide);
  const step = firstSteps[index];
  if (!step) return null;
  let action: string = step.action, detail: string = step.detail, target: typeof step.id = step.id;
  if (step.id !== 'patrol' && m.state.run && !m.state.run.complete) {
    target = 'patrol';
    action = step.id === 'recruit' ? 'Continue Night Patrol. Your free friend will wait until this route ends.' : 'Continue Night Patrol, then return to Cats for your first level.';
    detail = step.id === 'recruit' ? 'Finish this route first. Your free invitation will be waiting here.' : 'Finish this route first, then return to Growth to level up.';
  } else if (step.id === 'upgrade') {
    const trainable = m.state.account.cards.some(card => R.metaCommand(m.state, { type: 'level', cardId: card.id }).ok);
    if (!trainable) {
      target = 'patrol';
      action = 'Night Patrol brings fish and threads. Then level up a friend in Cats.';
      detail = 'Review the missing supplies in Growth. Night Patrol gives fish and threads.';
    }
    if (!m.state.account.cards.some(card => card.cardId === m.cardId))
      detail = trainable ? 'Choose a cat you own in the roster, then open Growth to level up.' : 'Choose a cat you own to see needed supplies. Patrol gives fish and threads.';
  }
  return { ...step, index, action, detail, target };
}

/** Presentation only: completion and unlocks remain owned by the existing account rules. */
export function FirstStepsA6({ m }: { m: DepthModel }) {
  const step = firstStepViewA6(m);
  if (!R.gameplayA6(m.state) || !step || m.screen !== step.screen) return null;
  return <aside className="a6-first-step" aria-label="Your next action"><strong>{step.index + 1} / 3 · {step.title}</strong><span>{step.detail}</span><small>{step.reward}</small></aside>;
}

const seenByModel = new WeakMap<DepthModel, Set<string>>();

export function IntroductionA6({ m }: { m: DepthModel }) {
  const intro = R.introductionA6(m.state);
  const prior = useRef(seenByModel.get(m) ?? new Set(intro.features.filter(f => f.open).map(f => f.id)));
  seenByModel.set(m, prior.current);
  const [pending, setPending] = useState<{ name: string; hint: string }[]>([]);
  const discoveryVisible = m.screen !== 'gacha' && !!m.state.v4?.journey?.pending.length;
  const celebration = discoveryVisible ? undefined : pending[0];
  const dismiss = () => setPending(queue => queue.slice(1));
  const opened = intro.features.filter(f => f.open).map(f => f.id).join(',');
  useEffect(() => {
    const next = R.introductionA6(m.state).features.filter(f => f.open && !prior.current.has(f.id));
    for (const feature of R.introductionA6(m.state).features.filter(f => f.open)) prior.current.add(feature.id);
    if (next.length) setPending(queue => [...queue, ...next]);
  }, [m, opened]);
  useEffect(() => { if (!celebration) return; m.audio.ui(); const timer = setTimeout(() => setPending(queue => queue.slice(1)), 5000); return () => clearTimeout(timer); }, [m, celebration]);
  if (!R.gameplayA6(m.state)) return null;
  const step = firstStepViewA6(m), stepIndex = step?.index ?? -1;
  return <>{m.state.formationC2&&m.screen==='hub'&&<div className="c2-home-help"><HelpC2 label="Your next goal"><p>{step?.action??intro.goal}</p>{step&&<p>{step.reward}</p>}</HelpC2></div>}{!m.state.formationC2&&m.screen === 'hub' && <aside className="a6-next-goal" aria-label="Your next goal"><small>{step ? 'YOUR FIRST EVENING' : 'NEXT LITTLE ADVENTURE'}</small>
    {step && <ol className="a6-first-path" aria-label="First three steps">{firstSteps.map((item, index) => <li key={item.id} aria-current={index === stepIndex ? 'step' : undefined} data-done={index < stepIndex}><span aria-hidden="true">{index < stepIndex ? 'Done' : index + 1}</span>{item.title}</li>)}</ol>}
    <p>{step?.action ?? intro.goal}</p>{step && <strong className="a6-first-reward">{step.reward}</strong>}
  </aside>}
    {celebration && <aside className="a6-unlock-toast" role="status"><span aria-hidden="true"><GameIcon name="season" size={18}/></span><div><small>Unlocked</small><strong>{celebration.name}</strong>{!m.state.formationC2&&<p>{celebration.hint}</p>}</div><button aria-label="Dismiss celebration" onClick={dismiss}><GameIcon name="close" size={20}/></button></aside>}
  </>;
}
