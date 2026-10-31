import {
  useEffect,
  useRef,
  useReducer,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import type { GainsV2, ItemV2, GearSlotId } from '../api/GameApiV2';
import { v2 } from '@taskbar-hero/game-rules';
import { useAccount } from 'wagmi';
import type { RelicVoucher } from '@taskbar-hero/api-contract';
import { MintPanel } from '../forge/MintPanel';
import { loadUnreported, type UnreportedMint } from '../forge/mintStore';
import { reportMint } from '../forge/report';
import { getGameApi, getGameLoop } from '../game/store';
import { StageCanvas } from '../game/stage/StageCanvas';
import { createEquipQueueV2, forgeRelicForWalletV2, getGameLoopV2, useGameSnapshotV2, useGameModeV2 } from '../game/v2/storeV2';
import { useSyncStatusV2 } from '../game/v2/useSyncStatus';
import { bossPresentation, INITIAL_BOSS_PRESENTATION } from './bossPresentation';
import { usePrefersReducedMotion } from '../motion/reducedMotion';
import { ClassPicker, STARTER_CLASSES } from './classpicker/ClassPicker';
import { LandingHero } from './LandingHero';
import { HeroCard } from './home/HeroCard';
import { NextGoalCard } from './home/NextGoalCard';
import { RecentLootCard } from './home/RecentLootCard';
import { EventLog } from './home/EventLog';
import type { LoopEventV2 } from '../game/v2/events';
import './home/home.css';
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
import { BagPanel } from './bag/BagPanel';
import { equipBest } from './bag/equipRules';
import { CharacterPanel } from './character/CharacterPanel';
import { MarketTab } from '../market/MarketTab';
import { HelpTab } from './HelpTab';
import { layoutKind, stageHeight, stageZoom, useViewport } from './metrics';
import { itemName, rarityLabel } from './itemView';
import { getBlockReason } from '../v2text/blockReasons';
import { ScreenFrame } from '../shell/ScreenFrame';
import { SCREEN_REGISTRY, RAIL_SCREENS, type ScreenId, tabNameToScreenId } from '../nav/screens';
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

function computeStageWidth(width: number, height: number): number {
  if (width <= 600) return width;
  if (width >= 1024 && height >= 640) {
    const panelWidth = Math.min(460, Math.max(380, width * 0.32));
    return Math.floor(width - panelWidth);
  }
  return Math.floor(width * 0.55);
}

export interface StageLayoutProps {
  initialScreen?: ScreenId;
}

export function StageLayout({ initialScreen }: StageLayoutProps = {}) {
  const { width, height } = useViewport();
  const kind = layoutKind(width);
  const loop = getGameLoopV2();
  const equipQueue = useRef<ReturnType<typeof createEquipQueueV2> | null>(null);
  const wallet = useAccount();
  const [voucher, setVoucher] = useState<RelicVoucher | null>(null);
  const [mintedNonce, setMintedNonce] = useState<string | null>(null);
  const [unreported, setUnreported] = useState<UnreportedMint | null>(loadUnreported);
  const [savingMint, setSavingMint] = useState(false);
  const liveSnapshot = useGameSnapshotV2(loop);
  const liveSyncStatus = useSyncStatusV2(loop);
  const [presentation, presentBoss] = useReducer(bossPresentation, INITIAL_BOSS_PRESENTATION);
  const snapshot = presentation.hold?.snapshot ?? liveSnapshot;
  const syncStatus = presentation.hold?.syncStatus ?? liveSyncStatus;
  const bossRequest = useRef(false);
  const mode = useGameModeV2();
  const state = snapshot.state;
  const classId = state?.cat.classId;

  const [screen, setScreen] = useState<ScreenId>(() => {
    if (initialScreen) return initialScreen;
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#', '') as ScreenId;
      if (SCREEN_REGISTRY.some((s) => s.id === hash)) return hash;
    }
    return state && !classId ? 'class' : 'home';
  });
  const [visited, setVisited] = useState<Set<ScreenId>>(() => new Set<ScreenId>(['home', 'hero']));

  useEffect(() => {
    if (initialScreen) {
      setScreen(initialScreen);
    } else if (state && !state.cat.classId) {
      setScreen((prev) => (prev === 'landing' ? 'landing' : 'class'));
    } else if (state && state.cat.classId && (screen === 'class' || screen === 'landing')) {
      setScreen('home');
    }
  }, [state?.cat.classId, initialScreen]);

  useEffect(() => {
    const onHashChange = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash.replace('#', '') as ScreenId;
      if (SCREEN_REGISTRY.some((s) => s.id === hash)) {
        setScreen(hash);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const phone = kind === 'phone';
  const navRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [chapter, setChapter] = useState<number | null>(null);
  const fight = presentation.fight;
  const actionBusy = presentation.hold ? 'fightBoss' : liveSnapshot.busy;
  const motion = useRef(reducedMotion); motion.current = reducedMotion;

  useEffect(() => {
    if (reducedMotion && presentation.hold) presentBoss({ type: 'release' });
  }, [reducedMotion, presentation.hold]);

  const [gains, setGains] = useState<GainsV2 | null>(null);
  const [away, setAway] = useState(0);
  const [welcome, setWelcome] = useState(false);
  const [notice, setNotice] = useState('');
  const [crafted, setCrafted] = useState<ItemV2 | null>(null);
  const [recentEvents, setRecentEvents] = useState<LoopEventV2[]>([]);
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
      setRecentEvents((prev) => [...prev.slice(-19), event]);
      if (event.type === 'claimed') {
        setGains(event.gains);
        if (awayRef.current >= 60) {
          setAway(awayRef.current);
          setWelcome(true);
          awayRef.current = 0;
        }
      }
      if (event.type === 'error') {
        if (event.message !== 'server_busy' && event.message !== 'offline') {
          setNotice(event.message);
        }
      }
      if (event.type === 'refused') {
        if (event.code !== 'rate_limited' && event.code !== 'server_busy' && event.code !== 'offline') {
          setNotice(getBlockReason(event.code));
        }
      }
    });
    const visibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
        saveVisit();
      } else if (hiddenAt.current !== null) {
        awayRef.current = (Date.now() - hiddenAt.current) / 1000;
        hiddenAt.current = null;
        presentBoss({ type: 'release' });
      }
    };
    document.addEventListener('visibilitychange', visibility);
    void loop.start();
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

  const handleSelectScreen = (newScreen: ScreenId) => {
    const fromArrowNav = typeof window !== 'undefined' && Boolean((window as unknown as { __rail_arrow_nav?: boolean }).__rail_arrow_nav);
    if (typeof window !== 'undefined') {
      (window as unknown as { __rail_arrow_nav?: boolean }).__rail_arrow_nav = false;
    }
    setScreen(newScreen);
    setVisited((prev) => {
      if (prev.has(newScreen)) return prev;
      const next = new Set(prev);
      next.add(newScreen);
      return next;
    });
    if (!fromArrowNav) {
      requestAnimationFrame(() => {
        const panel = document.getElementById(`panel-${newScreen}`);
        if (panel) {
          const focusable = panel.querySelector<HTMLElement>(
            'button:not([disabled]), [href], input:not([type="hidden"]), textarea, [tabindex="0"]'
          );
          if (focusable) focusable.focus();
          else {
            panel.setAttribute('tabindex', '-1');
            panel.focus();
          }
        }
      });
    }
  };

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        const activeTabEl = document.getElementById(`tab-${screen}`);
        activeTabEl?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [screen]);

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

  const stats =
    state && classId
      ? v2.deriveStats(
          { classId, level: state.cat.level },
          state.inventory.filter((i) => i.equipped).map((i) => ({ itemId: i.itemKey, level: i.level, bonusLines: i.bonus }))
        )
      : null;

  const fightBoss = async (selected: number) => {
    if (!state || !stats || bossRequest.current || presentation.hold || (fight && !fight.complete)) return;
    bossRequest.current = true;
    setNotice('');
    const firstClear = !state.bosses.chapters.find((c) => c.chapter === selected)?.cleared;
    presentBoss({ type: 'begin', snapshot: liveSnapshot, syncStatus: liveSyncStatus, chapter: selected, maxHp: stats.hp, firstClear });
    try {
      const result = await loop.fightBoss(selected);
      if (result) presentBoss({ type: 'resolved', result, immediate: motion.current });
      else presentBoss({ type: 'close' });
    } catch {
      presentBoss({ type: 'close' });
      setNotice('The boss request failed. Try again.');
    } finally { bossRequest.current = false; }
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
      handleSelectScreen('bag');
      if (presentation.hold) return;
      upgrades.forEach((u) => equipQueue.current?.equip(u.itemId, u.slot));
    };
  } else if (isBossReady) {
    hintText = 'Boss ready';
    handleHintAction = () => {
      handleSelectScreen('map');
    };
  } else {
    const gated = state?.progress.gated;
    hintText = `Next: ${gated ? 'Equip better gear to keep exploring' : 'Explore the chapter and challenge its boss'}`;
    handleHintAction = () => {
      handleSelectScreen(gated ? 'bag' : 'map');
    };
  }

  const showRail = !['landing', 'class'].includes(screen);
  const stageW = computeStageWidth(width, height);
  const stageH = stageHeight(width, height);
  const zoom = stageZoom(stageW, stageH);
  const isTall = height >= 820 && width >= 1024;
  const isShortLandscape = height < 480 && width > height;

  const relicFooter = (
    <>
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
        (voucher ?? state?.forge.pending) &&
        (voucher ?? state?.forge.pending)!.signature !== null &&
        (voucher ?? state?.forge.pending)!.nonce !== mintedNonce && (
          <MintPanel
            voucher={(voucher ?? state!.forge.pending)! as RelicVoucher}
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
  );

  return (
    <ScreenFrame
      activeScreen={screen}
      onSelectScreen={handleSelectScreen}
      showRail={!phone}
      dataLayout={kind}
      dataTall={isTall ? 'true' : undefined}
      dataShortLandscape={isShortLandscape ? 'true' : undefined}
      style={{ '--stage-h': `${stageH}px` } as CSSProperties}
      hudProps={
        state
          ? {
              state,
              power: stats ? Math.round(v2.powerRating(stats)) : 0,
              syncStatus,
              hintText,
              onHintAction: handleHintAction,
              mode,
            }
          : null
      }
    >
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

      {fight && classId && (
        <div className="v2-fight-result">
          <BossArena
            result={fight.result}
            chapter={fight.chapter}
            classId={classId}
            catMaxHp={fight.maxHp}
            reducedMotion={reducedMotion}
            complete={fight.complete}
            onDone={() => presentBoss({ type: 'release' })}
          />
          {fight.complete && (
            <>
              <p role="status">{fight.result.won ? 'Victory!' : 'Defeat. Your key was kept.'}</p>
              {fight.result.chest ? (
                <ChestReveal
                  chest={fight.result.chest}
                  firstClear={fight.firstClear}
                  chapter={fight.chapter}
                  onDone={() => presentBoss({ type: 'close' })}
                />
              ) : (
                <button onClick={() => presentBoss({ type: 'close' })}>Back to exploring</button>
              )}
            </>
          )}
        </div>
      )}

      {welcome && gains && <WelcomeBack gains={gains} awaySeconds={away} onClose={() => setWelcome(false)} />}

      <div className="shell-panel-container">
        {/* Landing screen */}
        <div
          id="panel-landing"
          role="tabpanel"
          aria-label="Landing"
          className="shell-panel-view screen-landing"
          style={{ display: screen === 'landing' ? 'flex' : 'none' }}
        >
          <LandingHero
            onStart={() => handleSelectScreen('class')}
            onStartGuest={() => handleSelectScreen('class')}
            onHelp={() => handleSelectScreen('help')}
          />
        </div>

        {/* Class picker screen */}
        <div
          id="panel-class"
          role="tabpanel"
          aria-label="Class"
          className="shell-panel-view screen-class"
          style={{ display: screen === 'class' ? 'flex' : 'none' }}
        >
          {state && !classId ? (
            <ClassPicker
              classes={STARTER_CLASSES}
              locked={snapshot.busy !== null}
              busy={snapshot.busy === 'chooseClass'}
              onChoose={(id) => {
                void loop.chooseClass(id);
                handleSelectScreen('home');
              }}
            />
          ) : null}
        </div>

        {/* Home screen (stage) */}
        <div
          id="panel-home"
          role="tabpanel"
          aria-label="Home"
          className="shell-panel-view screen-home"
          style={{ display: screen === 'home' ? 'flex' : 'none' }}
        >
          {state && classId ? (
            <div className="home-dashboard" data-testid="home-dashboard">
              <div className="home-col home-col--left">
                <HeroCard state={state} />
                <NextGoalCard state={state} onNavigate={handleSelectScreen} />
              </div>

              <div className="home-col home-col--center">
                <div role="region" aria-label="Game stage" className="v2-stage home-stage-wrap">
                  <StageCanvas
                    state={state}
                    zoom={zoom}
                    width={stageW}
                    reducedMotion={reducedMotion}
                    onSelectTab={(tabName) => handleSelectScreen(tabNameToScreenId(tabName))}
                  />
                </div>
                <EventLog state={state} events={recentEvents} />
              </div>

              <div className="home-col home-col--right">
                <RecentLootCard state={state} gains={gains && !welcome ? gains : null} />
              </div>
            </div>
          ) : (
            <div role="region" aria-label="Game stage" className="v2-stage">
              <LandingHero
                onStart={() => handleSelectScreen('class')}
                onStartGuest={() => handleSelectScreen('class')}
                onHelp={() => handleSelectScreen('help')}
              />
            </div>
          )}
        </div>

        {/* Hero tab (character sheet) */}
        <div
          id="panel-hero"
          role="tabpanel"
          aria-label="Hero"
          className="shell-panel-view screen-hero"
          style={{ display: screen === 'hero' ? 'flex' : 'none' }}
        >
          <div id="panel-Character" className="v2-tabpanel">
            <h2 className="v2-tabpanel-title">Hero</h2>
            <div className="v2-panel-body-inner">
              {state ? (
                <CharacterPanel state={state} onSelectSlot={() => handleSelectScreen('bag')} />
              ) : (
                <p>Loading your cat…</p>
              )}
            </div>
          </div>
        </div>

        {/* Bag tab */}
        <div
          id="panel-bag"
          role="tabpanel"
          aria-label="Bag"
          className="shell-panel-view screen-bag"
          style={{ display: screen === 'bag' ? 'flex' : 'none' }}
        >
          <div id="panel-Bag" className="v2-tabpanel">
            <h2 className="v2-tabpanel-title">Bag</h2>
            <div className="v2-panel-body-inner">
              {state ? (
                <BagPanel
                  state={state}
                  busy={actionBusy}
                  onEquip={(id, slot: GearSlotId) => {
                    if (!presentation.hold) void equipQueue.current?.equip(id, slot);
                  }}
                  onToggleLock={(id, locked) => {
                    if (!presentation.hold) void loop.setLocked(id, locked);
                  }}
                />
              ) : (
                <p>Loading your cat…</p>
              )}
            </div>
          </div>
        </div>

        {/* Map tab */}
        <div
          id="panel-map"
          role="tabpanel"
          aria-label="Map"
          className="shell-panel-view screen-map"
          style={{ display: screen === 'map' ? 'flex' : 'none' }}
        >
          <div id="panel-Boss" className="v2-tabpanel">
            <h2 className="v2-tabpanel-title">Map</h2>
            <div className="v2-panel-body-inner">
              {state ? (
                <BossGatePanel
                  state={state}
                  chapter={chapter ?? state.progress.chapter}
                  busy={actionBusy === 'fightBoss' || fight !== null}
                  onFight={(selected) => {
                    void fightBoss(selected);
                  }}
                  onSelectChapter={setChapter}
                >
                  <ChapterMap
                    currentChapter={state.progress.chapter}
                    selectedChapter={chapter ?? state.progress.chapter}
                    round={state.progress.round}
                    clearedChapters={state.bosses.chapters.filter((c) => c.cleared).map((c) => c.chapter)}
                    onSelect={setChapter}
                  />
                </BossGatePanel>
              ) : (
                <p>Loading your cat…</p>
              )}
            </div>
          </div>
        </div>

        {/* Forge tab */}
        <div
          id="panel-forge"
          role="tabpanel"
          aria-label="Forge"
          className="shell-panel-view screen-forge"
          style={{ display: screen === 'forge' ? 'flex' : 'none' }}
        >
          <div id="panel-Forge" className="v2-tabpanel">
            <h2 className="v2-tabpanel-title">Forge</h2>
            <div className="v2-panel-body-inner">
              {state ? (
                classId ? (
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
                    busy={actionBusy}
                    onCraft={async (recipe, slot) => {
                      setCrafted(null);
                      const result = await loop.craft(recipe, slot);
                      if (result) {
                        setCrafted(result.item);
                        setNotice(`Crafted: ${rarityLabel(result.item.rarity)} ${itemName(result.item.itemKey)}`);
                      }
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
                    craftResult={
                      crafted ? (
                        <div className="forge-reveal" role="status" data-testid="craft-result">
                          <strong>
                            Crafted: {rarityLabel(crafted.rarity)} {itemName(crafted.itemKey)}
                          </strong>{' '}
                          (level {crafted.level}). It is in your Bag. Gear is not tradable; only Relics from the Relic
                          tab can be listed in the Market.
                        </div>
                      ) : null
                    }
                    relicFooter={relicFooter}
                  />
                ) : (
                  <p>Choose a class to use the forge.</p>
                )
              ) : (
                <p>Loading your cat…</p>
              )}
            </div>
          </div>
        </div>

        {/* Market tab */}
        <div
          id="panel-market"
          role="tabpanel"
          aria-label="Market"
          className="shell-panel-view screen-market"
          style={{ display: screen === 'market' ? 'flex' : 'none' }}
        >
          <div id="panel-Market" className="v2-tabpanel">
            <h2 className="v2-tabpanel-title">Market</h2>
            <div className="v2-panel-body-inner">
              {visited.has('market') ? <MarketTab /> : null}
            </div>
          </div>
        </div>

        {/* Help tab */}
        <div
          id="panel-help"
          role="tabpanel"
          aria-label="Help"
          className="shell-panel-view screen-help"
          style={{ display: screen === 'help' ? 'flex' : 'none' }}
        >
          <div id="panel-Help" className="v2-tabpanel">
            <h2 className="v2-tabpanel-title">Help</h2>
            <div className="v2-panel-body-inner">
              <HelpTab />
            </div>
          </div>
        </div>
      </div>

      {phone && (
        <nav className="v2-nav" aria-label="Game menu" ref={navRef}>
          <div role="tablist" aria-label="Game panel tabs" className="v2-nav-tabs">
            {RAIL_SCREENS.map(({ id, label, icon }) => (
              <button
                key={id}
                role="tab"
                id={`tab-${id}`}
                aria-label={label}
                aria-selected={screen === id}
                aria-controls={`panel-${id}`}
                className="v2-tab"
                onClick={() => handleSelectScreen(id)}
              >
                <span className="v2-tab-icon">
                  {icon === 'help' ? <TabIcon /> : <PixelIcon name={icon as IconName} />}
                </span>
                <span className="v2-tab-label">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}

      <HowToPlay />
    </ScreenFrame>
  );
}
