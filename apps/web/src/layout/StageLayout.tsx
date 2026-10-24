import { useEffect, useRef, useState, type ComponentType, type CSSProperties, type KeyboardEvent } from 'react';
import { CatPortrait } from '../CatPortrait';
import { GameCanvas } from '../GameCanvas';
import { DemoNote } from '../game/DemoNote';
import { Hud } from '../game/Hud';
import { HeroTab } from '../HeroTab';
import { HowToPlay } from '../onboarding/HowToPlay';
import type { HintTab } from '../onboarding/nextStep';
import { TABS } from '../Panel';
import { WalletButton } from '../wallet/WalletButton';
import { HelpTab } from './HelpTab';
import { HintChip } from './HintChip';
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

function ActivePanel({ tab, hidden }: { tab: StageTabName; hidden?: boolean }) {
  const active = STAGE_TABS.find((t) => t.id === tab)!;
  const Active = active.Component;
  return (
    <div role="tabpanel" id={PANEL_ID} aria-labelledby={`tab-${tab}`} className="tabpanel v2-tabpanel" hidden={hidden}>
      {!hidden && (
        <div key={tab} className="tab-content">
          <h2>{active.label}</h2>
          <DemoNote />
          <Active />
        </div>
      )}
    </div>
  );
}

function CharacterArea() {
  return (
    <section className="v2-character pixel-card" aria-label="Character">
      <div className="v2-character-head">
        <div className="cat-portrait-wrap">
          <CatPortrait size={64} />
        </div>
        <h2 className="v2-character-name">Mochi the cat</h2>
      </div>
      <HeroTab />
    </section>
  );
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

  const closeSheet = () => {
    setSheetOpen(false);
    navRef.current?.querySelector<HTMLElement>(`#tab-${tab}`)?.focus();
  };

  useEffect(() => {
    if (!phone || !sheetOpen) return;
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
        <Hud />
        <HintChip onGo={handleGo} />
        <WalletButton />
      </header>

      <main>
        <div role="region" aria-label="Game stage" className="v2-stage">
          <GameCanvas zoom={zoom} hud={false} />
        </div>

        {phone ? (
          <>
            <div className="v2-lower">
              <CharacterArea />
            </div>
            <div className={`v2-sheet${sheetOpen ? ' open' : ''}`} hidden={!sheetOpen}>
              <button type="button" className="v2-sheet-close" aria-label="Close panel" onClick={closeSheet}>
                ×
              </button>
              <ActivePanel tab={tab} hidden={!sheetOpen} />
            </div>
            <nav className="v2-nav" aria-label="Game menu" ref={navRef}>
              <TabButtons active={sheetOpen ? tab : null} onSelect={selectPhoneTab} className="v2-nav-tabs" />
            </nav>
          </>
        ) : (
          <div className="v2-lower">
            <CharacterArea />
            <section className="v2-tabs-area pixel-card" aria-label="Game panel">
              <TabButtons active={tab} onSelect={setTab} className="v2-tabs" />
              <ActivePanel tab={tab} />
            </section>
          </div>
        )}
      </main>
      <HowToPlay />
    </div>
  );
}
