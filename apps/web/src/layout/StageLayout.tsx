import {
  useEffect,
  useRef,
  useMemo,
  useState,
  type ComponentType,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { ServerStateV2, BossFightResultV2, GainsV2 } from '../api/GameApiV2';
import { v2 } from '@taskbar-hero/game-rules';
import { StageCanvas } from '../game/stage/StageCanvas';
import { getGameLoopV2, useGameSnapshotV2, useGameModeV2 } from '../game/v2/storeV2';
import { usePrefersReducedMotion } from '../motion/reducedMotion';
import { HudBar } from './hud/HudBar';
import { ClassPicker } from './classpicker/ClassPicker';
import { BossGatePanel } from './boss/BossGatePanel';
import { ForgePanel } from './forge/ForgePanel';
import { ChapterMap } from '../map/ChapterMap';
import { WelcomeBack } from './loot/WelcomeBack';
import { LootSummary } from './loot/LootSummary';
import { ChestReveal } from './loot/ChestReveal';
import { BossArena } from '../game/arena/BossArena';
import { HowToPlay } from '../onboarding/HowToPlay';
import type { HintTab } from '../onboarding/nextStep';
import { TABS } from '../Panel';
import { WalletButton } from '../wallet/WalletButton';
import { BagPanel } from './bag/BagPanel';
import { CharacterPanel } from './character/CharacterPanel';
import { HelpTab } from './HelpTab';
import { layoutKind, stageHeight, stageZoom, useViewport } from './metrics';
import './layout.css';

type StageTabName = 'Inventory' | 'Boss' | 'Forge' | 'Market' | 'Help';

interface StageTab {
  id: StageTabName;
  label: string;
  Component: ComponentType;
}

const STAGE_TABS: StageTab[] = [
  ...TABS.filter((t): t is (typeof TABS)[number] & { id: Exclude<StageTabName, 'Help'> } => t.id !== 'Hero'),
  { id: 'Help', label: 'Help', Component: HelpTab },
];

const PANEL_ID = 'tabpanel';

function TabButtons({
  active,
  onSelect,
  className,
}: {
  /** Selected tab, or null while the phone sheet is closed. */
  active: StageTabName | null;
  onSelect: (tab: StageTabName) => void;
  className: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Arrow keys, Home and End move focus along the tabs; every tab also stays in the Tab order.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    const buttons = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
    const at = buttons.indexOf(document.activeElement as HTMLElement);
    if (at < 0) return;
    let next: number | null = null;
    if (e.key in keys) next = (at + keys[e.key]! + buttons.length) % buttons.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = buttons.length - 1;
    if (next === null) return;
    e.preventDefault();
    buttons[next]!.focus();
  };

  return (
    <div role="tablist" aria-label="Game panel tabs" className={className} ref={listRef} onKeyDown={onKeyDown}>
      {STAGE_TABS.map(({ id, label }) => (
        <button
          key={id}
          role="tab"
          id={`tab-${id}`}
          aria-selected={active === id}
          aria-controls={PANEL_ID}
          className="v2-tab"
          onClick={() => onSelect(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ActivePanel({ tab, hidden, content }: { tab: StageTabName; hidden?: boolean; content: ReactNode }) {
  const active = STAGE_TABS.find((t) => t.id === tab)!;
  const Active = active.Component;
  return (
    <div role="tabpanel" id={PANEL_ID} aria-labelledby={`tab-${tab}`} className="tabpanel v2-tabpanel" hidden={hidden}>
      {!hidden && (
        <div key={tab} className="tab-content">
          <h2>{active.label}</h2>
          {content ?? <Active />}
        </div>
      )}
    </div>
  );
}

function CharacterArea({ state }: { state: ServerStateV2 }) {
  return <CharacterPanel state={state} />;
}

/**
 * Stage-first layout for Cat RPG v2. Desktop: top bar, large stage, character area and tabs below.
 * Phone: stage on top, bottom nav, tabs open in a bottom sheet. Mini mode returns to the classic strip.
 */
export function StageLayout({ onMiniMode }: { onMiniMode: () => void }) {
  const { width, height } = useViewport();
  const kind = layoutKind(width);
  const stageH = stageHeight(width, height);
  const zoom = stageZoom(width, stageH);
  const [tab, setTab] = useState<StageTabName>('Inventory');
  const [sheetOpen, setSheetOpen] = useState(false);
  const phone = kind === 'phone';
  const navRef = useRef<HTMLDivElement>(null);
  const sheetCloseRef = useRef<HTMLButtonElement>(null);
  const loop = getGameLoopV2();
  const snapshot = useGameSnapshotV2(loop), mode = useGameModeV2();
  const state = snapshot.state;
  const reducedMotion = usePrefersReducedMotion();
  const [chapter, setChapter] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now);
  const [fight, setFight] = useState<{ result: BossFightResultV2; chapter: number; maxHp: number; firstClear: boolean; complete: boolean } | null>(null);
  const [gains, setGains] = useState<GainsV2 | null>(null);
  const [away, setAway] = useState(0);
  const [welcome, setWelcome] = useState(false);
  const [notice, setNotice] = useState('');
  const hiddenAt = useRef<number | null>(null);
  const awayRef = useRef(0);
  const offset = useMemo(() => state ? state.serverTime - Date.now() / 1000 : 0, [state?.serverTime]);
  useEffect(() => {
    try {
      const lastVisit = Number(localStorage.getItem('taskbar-hero:v2-last-visit'));
      if (lastVisit > 0 && lastVisit <= Date.now()) awayRef.current = (Date.now() - lastVisit) / 1000;
    } catch { /* Browser storage can be unavailable. */ }
    const saveVisit = () => { try { localStorage.setItem('taskbar-hero:v2-last-visit', String(Date.now())); } catch { /* Optional presentation metadata. */ } };
    const off = loop.onEvent(event => {
      if (event.type === 'claimed') {
        setGains(event.gains);
        if (awayRef.current >= 60) { setAway(awayRef.current); setWelcome(true); awayRef.current = 0; }
      }
      if (event.type === 'error') setNotice(event.message);
      if (event.type === 'refused') setNotice(event.code.replaceAll('_', ' '));
    });
    const visibility = () => {
      if (document.hidden) { hiddenAt.current = Date.now(); saveVisit(); }
      else if (hiddenAt.current !== null) { awayRef.current = (Date.now() - hiddenAt.current) / 1000; hiddenAt.current = null; }
    };
    document.addEventListener('visibilitychange', visibility);
    void loop.start();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { saveVisit(); off(); loop.stop(); clearInterval(timer); document.removeEventListener('visibilitychange', visibility); };
  }, [loop]);
  const classId = state?.cat.classId;
  const stats = state && classId ? v2.deriveStats({ classId, level: state.cat.level }, state.inventory.filter(i => i.equipped).map(i => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus }))) : null;
  const fightBoss = async (selected: number) => {
    if (!state || !stats) return;
    setNotice('');
    const firstClear = !state.bosses.chapters.find(c => c.chapter === selected)?.cleared;
    const result = await loop.fightBoss(selected);
    if (result) { setSheetOpen(false); setFight({ result, chapter: selected, maxHp: stats.hp, firstClear, complete: false }); }
  };
  const bag = state ? <BagPanel state={state} onEquip={(id, slot) => { void loop.equip(id, slot); }} onToggleLock={(id, locked) => { void loop.setLocked(id, locked); }} /> : null;
  const content = !state ? <p>Loading your cat…</p> : tab === 'Inventory' ? bag : tab === 'Boss' ? <>
    <BossGatePanel state={state} chapter={chapter ?? state.progress.chapter} nowS={Math.floor(now / 1000 + offset)} busy={snapshot.busy === 'fightBoss' || fight !== null} onFight={selected => { void fightBoss(selected); }} onSelectChapter={setChapter} />
    <ChapterMap currentChapter={state.progress.chapter} round={state.progress.round} clearedChapters={state.bosses.chapters.filter(c => c.cleared).map(c => c.chapter)} onSelect={setChapter} />
  </> : tab === 'Forge' ? classId ? <ForgePanel stacks={{ ...state.materials, fish: state.currencies.fish, yarn: state.currencies.yarn, catKey: state.currencies.keys }} items={state.inventory}
    relic={{ today: state.forge.today, pending: state.forge.pending, blockedReason: state.forge.blockedBy }} classWeaponType={v2.CLASSES.find(c => c.id === classId)!.weaponType}
    onCraft={async (recipe, slot) => { await loop.craft(recipe, slot); }} onSalvage={async ids => { await loop.salvage(ids); }} onRelic={() => { setNotice('Relic minting will be available after wallet wiring.'); }} /> : <p>Choose a class to use the forge.</p> : null;

  const closeSheet = () => {
    setSheetOpen(false);
    navRef.current?.querySelector<HTMLElement>(`#tab-${tab}`)?.focus();
  };

  useEffect(() => {
    if (!phone || !sheetOpen) return;
    sheetCloseRef.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') closeSheet();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phone, sheetOpen, tab]);

  const selectPhoneTab = (id: StageTabName) => {
    if (sheetOpen && id === tab) setSheetOpen(false);
    else {
      setTab(id);
      setSheetOpen(true);
    }
  };

  const handleGo = (target: HintTab) => {
    setTab(target);
    setSheetOpen(true);
  };

  return (
    <div className="v2-shell" data-layout={kind} style={{ '--stage-h': `${stageH}px` } as CSSProperties}>
      <header className="v2-topbar">
        <h1 className="v2-title">Taskbar Hero</h1>
        <button type="button" className="v2-mini-toggle" onClick={onMiniMode}>
          Mini mode
        </button>
        {state && <HudBar state={state} power={stats ? Math.round(v2.powerRating(stats)) : 0} />}
        <div className="v2-hint" data-testid="next-hint"><button className="v2-hint-btn" onClick={() => handleGo(state?.progress.gated ? 'Inventory' : 'Boss')}>{state?.progress.gated ? 'Equip better gear to keep exploring' : 'Explore the chapter and challenge its boss'}</button></div>
        <WalletButton />
      </header>

      <main>
        <p className="v2-mode-note">{mode.demo ? 'Demo mode — progress is saved in this browser.' : 'Signed in — progress is saved to your account.'} {mode.notice}</p>
        {snapshot.loadFailed && <p role="alert">Could not load your cat. <button onClick={() => { void loop.retry(); }}>Retry</button></p>}
        {notice && <p role="status" className="v2-action-notice">{notice}<button aria-label="Dismiss message" onClick={() => setNotice('')}>×</button></p>}
        {state && !classId && <ClassPicker locked={snapshot.busy !== null} onChoose={id => { void loop.chooseClass(id); }} />}
        {fight && classId && <div className="v2-fight-result">
          <BossArena result={fight.result} chapter={fight.chapter} classId={classId} catMaxHp={fight.maxHp} reducedMotion={reducedMotion} onDone={() => setFight(current => current ? { ...current, complete: true } : null)} />
          {fight.complete && <><p role="status">{fight.result.won ? 'Victory!' : 'Defeat. Your key was kept.'}</p>
            {fight.result.chest ? <ChestReveal chest={fight.result.chest} firstClear={fight.firstClear} chapter={fight.chapter} onDone={() => setFight(null)} /> : <button onClick={() => setFight(null)}>Back to exploring</button>}</>}
        </div>}
        {welcome && gains && <WelcomeBack gains={gains} awaySeconds={away} onClose={() => setWelcome(false)} />}
        <div role="region" aria-label="Game stage" className="v2-stage">
          {state && classId ? <StageCanvas state={state} zoom={zoom} width={width} reducedMotion={reducedMotion} /> : <p className="v2-stage-placeholder">Your adventure starts with a class.</p>}
        </div>

        {phone ? (
          <>
            <div className="v2-lower">
              {state && <CharacterArea state={state} />}
            </div>
            <div className={`v2-sheet${sheetOpen ? ' open' : ''}`} hidden={!sheetOpen}>
              <button type="button" className="v2-sheet-close" ref={sheetCloseRef} aria-label="Close panel" onClick={closeSheet}>
                ×
              </button>
              <ActivePanel tab={tab} hidden={!sheetOpen} content={content} />
            </div>
            <nav className="v2-nav" aria-label="Game menu" ref={navRef}>
              <TabButtons active={sheetOpen ? tab : null} onSelect={selectPhoneTab} className="v2-nav-tabs" />
            </nav>
          </>
        ) : (
          <div className="v2-lower">
            {state && <CharacterArea state={state} />}
            <section className="v2-tabs-area pixel-card" aria-label="Game panel">
              <TabButtons active={tab} onSelect={setTab} className="v2-tabs" />
              <ActivePanel tab={tab} content={content} />
            </section>
          </div>
        )}
      </main>
      {gains && !welcome && <div className="v2-recent-loot"><LootSummary loot={gains} heading="Recent finds" /></div>}
      <HowToPlay />
    </div>
  );
}
