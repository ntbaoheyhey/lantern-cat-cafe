import { useState } from 'react';
import { CONFIG } from '@taskbar-hero/game-rules';
import type { ScreenId } from '../nav/screens';
export const COACH_KEY = 'taskbar-hero:guest-coach:1';
export function isNewGuest() {
  const query = new URLSearchParams(window.location.search);
  if (query.has('demo') && query.get('coach') === 'off') return false;
  try { return localStorage.getItem(COACH_KEY) !== 'done' && localStorage.getItem('taskbar-hero.howToPlaySeen') !== '1'; }
  catch { return true; }
}
const STEPS = [
  { title: 'Mochi explores for you', text: 'Watch the fight. Fish, XP and finds arrive when progress is saved. You can browse while Mochi plays.', action: 'Watch Mochi', screen: 'home' },
  { title: 'Give each find a job', text: 'Open Bag, select a drop and compare offence with survival. Equip a keeper; lock it before salvaging anything.', action: 'Open Bag', screen: 'bag' },
  { title: 'Meet the household boss', text: 'Clear the chapter, then use a Cat Key to challenge its boss. Combat is automatic. A loss keeps your key.', action: 'Open Map', screen: 'map' },
] as const;
export function GuestCoach({ enabled, onNavigate }: { enabled: boolean; onNavigate: (screen: ScreenId) => void }) {
  const [step, setStep] = useState(0), [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(COACH_KEY) === 'done'; } catch { return false; }
  });
  const dismiss = () => { setDismissed(true); try { localStorage.setItem(COACH_KEY, 'done'); } catch { /* Session dismissal still works. */ } };
  if (!enabled || dismissed) return null;
  const current = STEPS[step]!;
  return <aside className="guest-coach" aria-label="Getting started" data-testid="guest-coach">
    <span className="guest-coach__step">{step + 1}/{CONFIG.gameplay.coachSteps}</span>
    <div><strong>{current.title}</strong><p>{current.text}</p></div>
    <button className="pixel-btn" onClick={() => onNavigate(current.screen)}>{current.action}</button>
    <button className="pixel-btn" onClick={() => step + 1 === STEPS.length ? dismiss() : setStep(step + 1)}>{step + 1 === STEPS.length ? 'Done' : 'Next tip'}</button>
    <button className="guest-coach__dismiss" onClick={dismiss}>Dismiss forever</button>
  </aside>;
}
