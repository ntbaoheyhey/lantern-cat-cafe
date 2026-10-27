import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { ServerStateV2, BossFightResultV2, GainsV2, ItemV2, GearSlotId } from '../api/GameApiV2';
import { v2 } from '@taskbar-hero/game-rules';
import { useAccount } from 'wagmi';
import type { RelicVoucher } from '@taskbar-hero/api-contract';
import { MintPanel } from '../forge/MintPanel';
import { loadUnreported, type UnreportedMint } from '../forge/mintStore';
import { reportMint } from '../forge/report';
import { getGameApi, getGameLoop } from '../game/store';
import { StageCanvas } from '../game/stage/StageCanvas';
import { createEquipQueueV2, forgeRelicForWalletV2, getGameLoopV2, useGameSnapshotV2, useGameModeV2 } from '../game/v2/storeV2';
import { usePrefersReducedMotion } from '../motion/reducedMotion';
import { HudBar } from './hud/HudBar';
import { ClassPicker } from './classpicker/ClassPicker';
import { BossGatePanel } from './boss/BossGatePanel';
import { bossGateStatus } from './boss/bossGate';
import { ForgePanel } from './forge/ForgePanel';
import { ChapterMap } from '../map/ChapterMap';
import { WelcomeBack } from './loot/WelcomeBack';
import { LootSummary } from './loot/LootSummary';
import { ChestReveal } from './loot/ChestReveal';
import { BossArena } from '../game/arena/BossArena';
import { HowToPlay } from '../onboarding/HowToPlay';
import { PixelIcon, type IconName } from '../art/pixelIcons';
import { TabIcon } from './tabIcons';
import { WalletButton } from '../wallet/WalletButton';
import { BagPanel } from './bag/BagPanel';
import { equipBest } from './bag/equipRules';
import { CharacterPanel } from './character/CharacterPanel';
import { MarketTab } from '../market/MarketTab';
import { HelpTab } from './HelpTab';
import { layoutKind, stageHeight, stageZoom, useViewport } from './metrics';
import { itemName, rarityLabel } from './itemView';
import './layout.css';

export type StageTabName = 'Character' | 'Bag' | 'Boss' | 'Forge' | 'Market' | 'Help';

export interface StageTabDef {
  id: StageTabName;
  label: string;
  icon: IconName | 'help';
}

export const STAGE_TABS: readonly StageTabDef[] = [
  { id: 'Character', label: 'Character', icon: 'paw' },
  { id: 'Bag', label: 'Bag', icon: 'bag' },
  { id: 'Boss', label: 'Boss', icon: 'sword' },
  { id: 'Forge', label: 'Forge', icon: 'flask' },
  { id: 'Market', label: 'Market', icon: 'shop' },
  { id: 'Help', label: 'Help', icon: 'help' },
];

function TabButtons({
  active,
  onSelect,
  className,
}: {
  active: StageTabName;
  onSelect: (tab: StageTabName) => void;
  className: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

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
      {STAGE_TABS.map(({ id, label, icon }) => (
        <button
          key={id}
          role="tab"
          id={`tab-${id}`}
          aria-label={label}
          aria-selected={active === id}
          aria-controls={`panel-${id}`}
          className="v2-tab"
          onClick={() => onSelect(id)}
        >
          <span className="v2-tab-icon">
            {icon === 'help' ? <TabIcon /> : <PixelIcon name={icon} />}
          </span>
          <span className="v2-tab-label">{label}</span>
        </button>
      ))}
    </div>
  );
}

function ActivePanel({
  tab,
  label,
  hidden,
  children,
}: {
  tab: StageTabName;
  label: string;
  hidden: boolean;
  children: ReactNode;
}) {
  return (
    <div
      role="tabpanel"
      id={`panel-${tab}`}
      aria-label={label}
      className="v2-tabpanel"
      hidden={hidden}
    >
      <h2 className="v2-tabpanel-title">{label}</h2>
      <div className="v2-panel-body-inner">{children}</div>
    </div>
  );
}

/**
 * Stage-first layout for Cat RPG v2.
 * Single CSS grid fitted to the window (100dvh). No whole-page re-render on a timer.
 */
function computeStageWidth(width: number, height: number): number {
  if (width <= 600) return width;
  if (width >= 1024 && height >= 640) {
    const panelWidth = Math.min(460, Math.max(380, width * 0.32));
    return Math.floor(width - panelWidth);
  }
  return Math.floor(width * 0.55);
}

export interface StageLayoutProps {
  onMiniMode?: () => void;
}

export function StageLayout(_props: StageLayoutProps = {}) {
  const { width, height } = useViewport();
  const kind = layoutKind(width);
  const stageW = computeStageWidth(width, height);
  const stageH = stageHeight(width, height);
  const zoom = stageZoom(stageW, stageH);
  const [tab, setTab] = useState<StageTabName>('Character');
  const [visited, setVisited] = useState<Set<StageTabName>>(() => new Set<StageTabName>(['Character']));

  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(tab)) return prev;
      const next = new Set(prev);
      next.add(tab);
      return next;
    });
  }, [tab]);
  const phone = kind === 'phone';
  const navRef = useRef<HTMLElement>(null);
  const loop = getGameLoopV2();
  const equipQueue = useRef<ReturnType<typeof createEquipQueueV2> | null>(null);
  const wallet = useAccount();
  const [voucher, setVoucher] = useState<RelicVoucher | null>(null);
  const [mintedNonce, setMintedNonce] = useState<string | null>(null);
  const [unreported, setUnreported] = useState<UnreportedMint | null>(loadUnreported);
  const [savingMint, setSavingMint] = useState(false);
  const snapshot = useGameSnapshotV2(loop);
  const mode = useGameModeV2();
  const state = snapshot.state;
  const reducedMotion = usePrefersReducedMotion();
  const [chapter, setChapter] = useState<number | null>(null);
  const [fight, setFight] = useState<{
    result: BossFightResultV2;
    chapter: number;
    maxHp: number;
    firstClear: boolean;
    complete: boolean;
  } | null>(null);
  const [gains, setGains] = useState<GainsV2 | null>(null);
  const [away, setAway] = useState(0);
  const [welcome, setWelcome] = useState(false);
  const [notice, setNotice] = useState('');
  const [crafted, setCrafted] = useState<ItemV2 | null>(null);
  const hiddenAt = useRef<number | null>(null);
  const awayRef = useRef(0);

  useEffect(() => {
    const queue = createEquipQueueV2(loop);
    equipQueue.current = queue;
    try {
      const lastVisit = Number(localStorage.getItem('taskbar-hero:v2-last-visit'));
      if (lastVisit > 0 && lastVisit <= Date.now()) awayRef.current = (Date.now() - lastVisit) / 1000;
    } catch {
      /* Browser storage can be unavailable. */
    }
    const saveVisit = () => {
      try {
        localStorage.setItem('taskbar-hero:v2-last-visit', String(Date.now()));
      } catch {
        /* Optional metadata */
      }
    };
    const off = loop.onEvent((event) => {
      if (event.type === 'claimed') {
        setGains(event.gains);
        if (awayRef.current >= 60) {
          setAway(awayRef.current);
          setWelcome(true);
          awayRef.current = 0;
        }
      }
      if (event.type === 'error') setNotice(event.message);
      if (event.type === 'refused') setNotice(event.code.replaceAll('_', ' '));
    });
    const visibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        saveVisit();
      } else if (hiddenAt.current !== null) {
        awayRef.current = (Date.now() - hiddenAt.current) / 1000;
        hiddenAt.current = null;
      }
    };
    document.addEventListener('visibilitychange', visibility);
    void loop.start();
    // No timer interval here! PIECE 4 satisfied.
    return () => {
      queue.dispose();
      if (equipQueue.current === queue) equipQueue.current = null;
      saveVisit();
      off();
      loop.stop();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [loop]);

  useEffect(() => {
    setVoucher(null);
    setMintedNonce(null);
  }, [mode.demo, wallet.address]);

  // Focus moves into newly opened panel and back to its tab on Escape
  const handleSelectTab = (newTab: StageTabName) => {
    setTab(newTab);
    requestAnimationFrame(() => {
      const panel = document.getElementById(`panel-${newTab}`);
      if (panel) {
        const focusable = panel.querySelector<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex="0"]'
        );
        if (focusable) focusable.focus();
        else {
          panel.setAttribute('tabindex', '-1');
          panel.focus();
        }
      }
    });
  };

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        const activeTabEl = document.getElementById(`tab-${tab}`);
        activeTabEl?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [tab]);

  const retryMintConfirmation = async () => {
    if (!unreported || savingMint || mode.demo || !wallet.isConnected) return;
    setSavingMint(true);
    try {
      const outcome = await reportMint(getGameApi(), getGameLoop(), unreported);
      if (outcome === 'retry') setNotice('Could not save the mint confirmation. Try again.');
      else {
        setUnreported(null);
        setVoucher(null);
        await loop.retry();
        setNotice('Relic mint confirmation saved.');
      }
    } finally {
      setSavingMint(false);
    }
  };

  const classId = state?.cat.classId;
  const stats =
    state && classId
      ? v2.deriveStats(
          { classId, level: state.cat.level },
          state.inventory.filter((i) => i.equipped).map((i) => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus }))
        )
      : null;

  const fightBoss = async (selected: number) => {
    if (!state || !stats) return;
    setNotice('');
    const firstClear = !state.bosses.chapters.find((c) => c.chapter === selected)?.cleared;
    const result = await loop.fightBoss(selected);
    if (result) {
      setFight({ result, chapter: selected, maxHp: stats.hp, firstClear, complete: false });
    }
  };

  const upgrades = state ? equipBest(state) : [];
  const bossStatus = state ? bossGateStatus(state, state.progress.chapter, Math.floor(Date.now() / 1000)) : null;
  const isBossReady = bossStatus?.kind === 'ready';

  let hintText: string;
  let handleHintAction: () => void;

  if (upgrades.length > 0) {
    hintText = state?.progress.gated
      ? `Equip best (+${upgrades.length}) · Equip better gear`
      : `Equip best (+${upgrades.length})`;
    handleHintAction = () => {
      handleSelectTab('Bag');
      upgrades.forEach((u) => equipQueue.current?.equip(u.itemId, u.slot));
    };
  } else if (isBossReady) {
    hintText = 'Boss ready';
    handleHintAction = () => {
      handleSelectTab('Boss');
    };
  } else {
    const gated = state?.progress.gated;
    hintText = `Next: ${gated ? 'Equip better gear to keep exploring' : 'Explore the chapter and challenge its boss'}`;
    handleHintAction = () => {
      handleSelectTab(gated ? 'Bag' : 'Boss');
    };
  }

  const isTall = height >= 820 && width >= 1024;
  const isShortLandscape = height < 480 && width > height;

  return (
    <div
      className="v2-shell"
      data-game-v2={import.meta.env.VITE_GAME_V2 === '1' ? 'stage-v2-enabled' : undefined}
      data-layout={kind}
      data-tall={isTall ? 'true' : undefined}
      data-short-landscape={isShortLandscape ? 'true' : undefined}
      style={{ '--stage-h': `${stageH}px` } as CSSProperties}
    >
      <header className="v2-topbar">
        <h1 className="v2-title">Taskbar Hero</h1>

        {state && <HudBar state={state} power={stats ? Math.round(v2.powerRating(stats)) : 0} />}

        <div className="v2-hint" data-testid="next-hint">
          <span className="v2-hint-lead" aria-hidden="true">
            Next
          </span>
          <button type="button" className="v2-hint-btn" onClick={handleHintAction}>
            {hintText}
          </button>
        </div>

        <div className="v2-wallet">
          <WalletButton />
          <span className="v2-wallet-icon" aria-hidden="true">
            <PixelIcon name="bag" />
          </span>
          <p
            className="v2-mode-note"
            title={
              mode.demo
                ? 'Demo mode — progress is saved in this browser.'
                : 'Signed in — progress is saved to your account.'
            }
          >
            <span className="v2-mode-full">
              {mode.demo
                ? 'Demo mode — progress is saved in this browser.'
                : 'Signed in — progress is saved to your account.'}
            </span>
            <span aria-hidden="true">
              {mode.demo ? 'Demo · saved in this browser' : 'Signed in · saved to your account'}
            </span>{' '}
            {mode.notice}
          </p>
        </div>

        <div data-slot="sync-status" className="v2-sync-status-slot" aria-hidden="true" />
      </header>

      <main className="v2-main">
        {snapshot.loadFailed && (
          <p role="alert" className="v2-alert">
            Could not load your cat. <button onClick={() => { void loop.retry(); }}>Retry</button>
          </p>
        )}
        {notice && (
          <p role="status" className="v2-action-notice">
            {notice}
            <button aria-label="Dismiss message" onClick={() => setNotice('')}>
              ×
            </button>
          </p>
        )}
        {state && !classId && (
          <ClassPicker
            locked={snapshot.busy !== null}
            busy={snapshot.busy === 'chooseClass'}
            onChoose={(id) => {
              void loop.chooseClass(id);
            }}
          />
        )}
        {fight && classId && (
          <div className="v2-fight-result">
            <BossArena
              result={fight.result}
              chapter={fight.chapter}
              classId={classId}
              catMaxHp={fight.maxHp}
              reducedMotion={reducedMotion}
              onDone={() => setFight((current) => (current ? { ...current, complete: true } : null))}
            />
            {fight.complete && (
              <>
                <p role="status">{fight.result.won ? 'Victory!' : 'Defeat. Your key was kept.'}</p>
                {fight.result.chest ? (
                  <ChestReveal
                    chest={fight.result.chest}
                    firstClear={fight.firstClear}
                    chapter={fight.chapter}
                    onDone={() => setFight(null)}
                  />
                ) : (
                  <button onClick={() => setFight(null)}>Back to exploring</button>
                )}
              </>
            )}
          </div>
        )}
        {welcome && gains && <WelcomeBack gains={gains} awaySeconds={away} onClose={() => setWelcome(false)} />}

        <div role="region" aria-label="Game stage" className="v2-stage">
          {state && classId ? (
            <StageCanvas state={state} zoom={zoom} width={stageW} reducedMotion={reducedMotion} />
          ) : (
            <p className="v2-stage-placeholder">Your adventure starts with a class.</p>
          )}
          {gains && !welcome && (
            <div className="v2-recent-loot">
              <LootSummary loot={gains} heading="Recent finds" />
            </div>
          )}
        </div>

        <section className="v2-panel" aria-label="Game panel">
          {isTall && state && (
            <div className="v2-character-compact-strip" role="region" aria-label="Character compact">
              <CharacterPanel state={state} compact={true} onSelectSlot={() => handleSelectTab('Bag')} />
            </div>
          )}

          {!phone && <TabButtons active={tab} onSelect={handleSelectTab} className="v2-tabs" />}

          <div className="v2-panel-body">
            {/* Character tab */}
            <ActivePanel tab="Character" label="Character" hidden={tab !== 'Character'}>
              {state ? (
                <CharacterPanel state={state} onSelectSlot={() => handleSelectTab('Bag')} />
              ) : (
                <p>Loading your cat…</p>
              )}
            </ActivePanel>

            {/* Bag tab */}
            <ActivePanel tab="Bag" label="Bag" hidden={tab !== 'Bag'}>
              {state ? (
                <BagPanel
                  state={state}
                  busy={snapshot.busy}
                  onEquip={(id, slot: GearSlotId) => {
                    void equipQueue.current?.equip(id, slot);
                  }}
                  onToggleLock={(id, locked) => {
                    void loop.setLocked(id, locked);
                  }}
                />
              ) : (
                <p>Loading your cat…</p>
              )}
            </ActivePanel>

            {/* Boss tab */}
            <ActivePanel tab="Boss" label="Boss" hidden={tab !== 'Boss'}>
              {state ? (
                <>
                  <BossGatePanel
                    state={state}
                    chapter={chapter ?? state.progress.chapter}
                    busy={snapshot.busy === 'fightBoss' || fight !== null}
                    onFight={(selected) => {
                      void fightBoss(selected);
                    }}
                    onSelectChapter={setChapter}
                  />
                  <ChapterMap
                    currentChapter={state.progress.chapter}
                    round={state.progress.round}
                    clearedChapters={state.bosses.chapters.filter((c) => c.cleared).map((c) => c.chapter)}
                    onSelect={setChapter}
                  />
                </>
              ) : (
                <p>Loading your cat…</p>
              )}
            </ActivePanel>

            {/* Forge tab */}
            <ActivePanel tab="Forge" label="Forge" hidden={tab !== 'Forge'}>
              {state ? (
                classId ? (
                  <>
                    <ForgePanel
                      stacks={{
                        ...state.materials,
                        fish: state.currencies.fish,
                        yarn: state.currencies.yarn,
                        catKey: state.currencies.keys,
                      }}
                      items={state.inventory}
                      relic={{
                        today: state.forge.today,
                        pending: state.forge.pending,
                        blockedReason: state.forge.blockedBy,
                      }}
                      classWeaponType={v2.CLASSES.find((c) => c.id === classId)!.weaponType}
                      busy={snapshot.busy}
                      onCraft={async (recipe, slot) => {
                        setCrafted(null);
                        const result = await loop.craft(recipe, slot);
                        if (result) setCrafted(result.item);
                      }}
                      onSalvage={async (ids) => {
                        await loop.salvage(ids);
                      }}
                      onRelic={async () => {
                        const message = await forgeRelicForWalletV2(loop, {
                          connected: wallet.isConnected,
                          mint: (next) => {
                            setVoucher(next);
                          },
                        });
                        setNotice(message ?? 'Relic voucher ready. Confirm minting below.');
                      }}
                    />
                    {crafted && (
                      <div className="forge-reveal" role="status" data-testid="craft-result">
                        <strong>
                          Crafted: {rarityLabel(crafted.rarity)} {itemName(crafted.itemKey)}
                        </strong>{' '}
                        (level {crafted.level}). It is in your Bag. Gear is not tradable; only Relics from the Relic
                        tab can be listed in the Market.
                      </div>
                    )}
                    <p className="forge-note">
                      Daily Relic limit (1 per day) is shared across classic and v2. Minting on Fuji testnet uses free
                      test AVAX and costs no real money.
                    </p>
                    {unreported ? (
                      <div role="status">
                        <p>
                          {mode.demo
                            ? 'Sign in to finish saving your minted Relic.'
                            : 'Your Relic was minted. Finish saving its confirmation.'}
                        </p>
                        <button
                          disabled={savingMint || mode.demo || !wallet.isConnected}
                          onClick={() => {
                            void retryMintConfirmation();
                          }}
                        >
                          {savingMint ? 'Saving…' : 'Retry saving mint confirmation'}
                        </button>
                      </div>
                    ) : (
                      (voucher ?? state.forge.pending) &&
                      (voucher ?? state.forge.pending)!.nonce !== mintedNonce && (
                        <MintPanel
                          voucher={(voucher ?? state.forge.pending)!}
                          api={getGameApi()}
                          loop={getGameLoop()}
                          onMinted={(mint, confirmed) => {
                            setVoucher(null);
                            setMintedNonce(mint.nonce);
                            if (confirmed) {
                              setUnreported(null);
                              setNotice('Relic minted. In your wallet!');
                              void loop.retry();
                            } else {
                              setUnreported(mint);
                              setNotice('Relic minted. Finish saving its confirmation below.');
                            }
                          }}
                        />
                      )
                    )}
                  </>
                ) : (
                  <p>Choose a class to use the forge.</p>
                )
              ) : (
                <p>Loading your cat…</p>
              )}
            </ActivePanel>

            {/* Market tab */}
            <ActivePanel tab="Market" label="Market" hidden={tab !== 'Market'}>
              {visited.has('Market') ? <MarketTab /> : null}
            </ActivePanel>

            {/* Help tab */}
            <ActivePanel tab="Help" label="Help" hidden={tab !== 'Help'}>
              <HelpTab />
            </ActivePanel>
          </div>
        </section>

        {phone && (
          <nav className="v2-nav" aria-label="Game menu" ref={navRef}>
            <TabButtons active={tab} onSelect={handleSelectTab} className="v2-nav-tabs" />
          </nav>
        )}
      </main>

      <HowToPlay />
    </div>
  );
}
