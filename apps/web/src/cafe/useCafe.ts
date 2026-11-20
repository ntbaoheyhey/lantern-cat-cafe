import { useEffect, useRef, useState } from 'react';
import { CONFIG } from '@taskbar-hero/game-rules';
import { actCafe, advanceCafe, copyCafe, createCafe, returnToCafe, SETS, SLOTS, type CafeAction, type CafeState } from '@taskbar-hero/game-rules/client/cafe';
import { CAFE_SAVE_KEY, parseCafeSave } from './save';

export function useCafe(active: boolean) {
  const lastSeen = useRef<number | null>(null), undo = useRef<CafeState | null>(null);
  const [saveError, setSaveError] = useState('');
  const [away, setAway] = useState<{ credited: number; patches: number } | null>(null);
  const [state, setState] = useState(() => {
    try { const saved = parseCafeSave(localStorage.getItem(CAFE_SAVE_KEY)); if (saved) { lastSeen.current = saved.lastSeen; return saved.state; } } catch { /* Memory fallback. */ }
    const seed = Number(new URLSearchParams(location.search).get('cafeSeed') ?? CONFIG.cafe.seed);
    return createCafe(Number.isSafeInteger(seed) && seed >= 0 ? seed : CONFIG.cafe.seed);
  });
  const current = useRef(state);
  const update = (next: CafeState) => { current.current = next; setState(next); };
  const persist = () => {
    try { localStorage.setItem(CAFE_SAVE_KEY, JSON.stringify({ state: current.current, lastSeen: lastSeen.current ?? Date.now() })); setSaveError(''); }
    catch { setSaveError('Local saving is unavailable. You can keep playing in this visit.'); }
  };
  const dispatch = (action: CafeAction) => {
    if (action.type === 'tour' && current.current.clears.length >= CONFIG.cafe.tour.unlockClears) undo.current = copyCafe(current.current);
    else undo.current = null;
    update(actCafe(current.current, action)); persist();
  };
  const undoTour = () => { if (undo.current) { update(undo.current); undo.current = null; persist(); } };
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const pause = () => { if (timer !== null) clearInterval(timer); timer = null; if (lastSeen.current === null) lastSeen.current = Date.now(); persist(); };
    const resume = () => {
      if (timer !== null || document.hidden) return;
      if (lastSeen.current !== null) {
        const seconds = (Date.now() - lastSeen.current) / CONFIG.cafe.tickMs;
        const returned = returnToCafe(current.current, seconds);
        if (seconds >= CONFIG.cafe.away.minSeconds) { update(returned.state); setAway({ credited: returned.credited, patches: returned.patches }); }
        lastSeen.current = null;
      }
      persist();
      timer = setInterval(() => { update(advanceCafe(current.current)); if (current.current.seconds % CONFIG.cafe.saveEverySeconds === 0) persist(); }, CONFIG.cafe.tickMs);
    };
    const visibility = () => document.hidden ? pause() : resume();
    document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', pause);
    resume();
    return () => { pause(); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pause); };
  }, [active]);
  // Explicit dev-only reviewer controls; absent from production even with the query.
  useEffect(() => {
    if (!import.meta.env.DEV || new URLSearchParams(location.search).get('adventureDebug') !== '1') return;
    const debug = { snapshot: () => copyCafe(current.current), dispatch,
      advance: (seconds: number) => { update(advanceCafe(current.current, seconds)); persist(); },
      chapter: (chapter: number) => { if (!Number.isInteger(chapter) || chapter < 1 || chapter > CONFIG.cafe.boss.hp.length) return;
        const s = copyCafe(current.current); s.chapter = chapter; s.encounters = CONFIG.cafe.bossGate * chapter; s.boss = null; s.lastBoss = null; s.encounter = null; s.nextEncounterAt = s.seconds + 1; update(s); persist(); },
      supplies: () => { const s = copyCafe(current.current); s.patches = Math.min(CONFIG.cafe.maxPatches, s.patches + CONFIG.cafe.debug.patches); update(s); persist(); },
      kit: () => {
        if (current.current.boss) return;
        let s = copyCafe(current.current); s.patches = CONFIG.cafe.maxPatches;
        for (const set of SETS) for (const slot of SLOTS) s = actCafe(s, { type: 'craft', set, slot });
        update(s); persist();
      },
    };
    const host = window as unknown as { __cafeDebug?: typeof debug }; host.__cafeDebug = debug;
    return () => { delete host.__cafeDebug; };
  }, []);
  return { state, dispatch, saveError, away, dismissAway: () => setAway(null), undoTour, canUndo: undo.current !== null };
}
