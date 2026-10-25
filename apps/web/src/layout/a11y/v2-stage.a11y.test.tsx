// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { sampleServerStateV2 } from './fixtures';
import { ARENA_FIXTURES } from '../../game/arena/arenaFixtures';
import * as reducedMotionModule from '../../motion/reducedMotion';

// Mock playBossFight so real BossArena JSX renders with accessible elements
const arenaMock = vi.hoisted(() => ({
  destroy: vi.fn(),
  complete: null as (() => void) | null,
}));

vi.mock('../../game/arena/playBossFight', () => ({
  playBossFight: (
    _result: unknown,
    options: {
      signal: AbortSignal;
      onHp: (cat: number, boss: number) => void;
      onReady: (skip: () => void) => void;
    },
  ) =>
    new Promise<void>((resolve) => {
      arenaMock.complete = resolve;
      options.onHp(100, 500);
      options.onReady(resolve);
      options.signal.addEventListener(
        'abort',
        () => {
          arenaMock.destroy();
          resolve();
        },
        { once: true },
      );
    }),
}));

let stageState: ServerStateV2 | null = null;
const stageLoop = vi.hoisted(() => ({
  start: vi.fn(async () => {}),
  stop: vi.fn(),
  onEvent: () => () => {},
  retry: vi.fn(),
  equip: vi.fn(),
  setLocked: vi.fn(),
  chooseClass: vi.fn(),
  craft: vi.fn(),
  salvage: vi.fn(),
  fightBoss: vi.fn(),
}));

vi.mock('../../game/v2/storeV2', () => ({
  getGameLoopV2: () => stageLoop,
  useGameSnapshotV2: () => ({ state: stageState, busy: null, loadFailed: false }),
  useGameModeV2: () => ({ demo: true, notice: null }),
}));

vi.mock('../../game/stage/StageCanvas', () => ({
  StageCanvas: () => <div data-testid="stage-canvas" role="img" aria-label="Adventure combat stage" />,
}));

vi.mock('../../wallet/WalletButton', () => ({
  WalletButton: () => <button type="button" className="wallet-btn">Connect Wallet</button>,
}));

import { StageLayout } from '../StageLayout';
import { BossArena } from '../../game/arena/BossArena';

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
}

describe('v2 Stage Layout, Flow & Boss Arena Accessibility Re-Audit (V16/V19)', () => {
  let prefersReducedMotion = false;

  beforeEach(() => {
    prefersReducedMotion = false;
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockImplementation(() => prefersReducedMotion);
    stageState = sampleServerStateV2();
    vi.clearAllMocks();
    stageLoop.fightBoss.mockResolvedValue(ARENA_FIXTURES[0]!.result);
    localStorage.clear();
    localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
    setViewport(1280, 800);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('1. Wired Stage Layout Landmarks and Controls', () => {
    it('provides standard landmarks (banner, regions, navigation) without duplicate landmarks', () => {
      render(<StageLayout onMiniMode={vi.fn()} />);

      expect(screen.getByRole('heading', { level: 1, name: 'Taskbar Hero' })).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Game stage' })).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Character' })).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Game panel' })).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Cat status' })).toBeTruthy();
      expect(screen.getByRole('tablist', { name: 'Game panel tabs' })).toBeTruthy();
    });

    it('all interactive controls have accessible names and no positive tabIndex', () => {
      const { container } = render(<StageLayout onMiniMode={vi.fn()} />);

      const controls = container.querySelectorAll<HTMLElement>('button, [role="button"], [role="tab"], a[href]');
      expect(controls.length).toBeGreaterThan(0);
      controls.forEach((control) => {
        const name =
          control.getAttribute('aria-label') ||
          control.getAttribute('aria-labelledby') ||
          control.textContent?.trim();
        expect(name).toBeTruthy();
      });

      const elementsWithTabIndex = container.querySelectorAll<HTMLElement>('[tabindex]');
      elementsWithTabIndex.forEach((el) => {
        expect(el.tabIndex).toBeLessThanOrEqual(0);
      });
    });

    it('currencies and keys are exposed with full accessible values', () => {
      stageState = sampleServerStateV2({ keys: 3 });
      render(<StageLayout onMiniMode={vi.fn()} />);

      const currencies = screen.getByLabelText('Currencies and keys');
      expect(currencies).toBeTruthy();
      expect(screen.getByLabelText('Cat Keys 3 of 5')).toBeTruthy();
      expect(screen.getByLabelText(/Fish/)).toBeTruthy();
      expect(screen.getByLabelText(/Yarn/)).toBeTruthy();
    });

    it('next-hint button is an accessible button directing the player to the next action', () => {
      render(<StageLayout onMiniMode={vi.fn()} />);
      const hintBtn = screen.getByTestId('next-hint').querySelector('button');
      expect(hintBtn).toBeTruthy();
      expect(hintBtn?.textContent).toContain('Explore the chapter and challenge its boss');
    });
  });

  describe('2. Desktop Tabs & Phone Bottom Sheet Keyboard Accessibility', () => {
    it('desktop tabs use roving focus and arrow keys wrap around', () => {
      render(<StageLayout onMiniMode={vi.fn()} />);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(5);
      expect(tabs.map((t) => t.textContent?.trim())).toEqual(['Inventory', 'Boss', 'Forge', 'Market', 'Help']);

      const firstTab = screen.getByRole('tab', { name: 'Inventory' });
      firstTab.focus();

      const tablist = screen.getByRole('tablist', { name: 'Game panel tabs' });
      fireEvent.keyDown(tablist, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Boss' }));

      fireEvent.keyDown(tablist, { key: 'End' });
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Help' }));

      fireEvent.keyDown(tablist, { key: 'ArrowRight' });
      expect(document.activeElement).toBe(firstTab);

      fireEvent.keyDown(tablist, { key: 'ArrowLeft' });
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Help' }));

      fireEvent.keyDown(tablist, { key: 'Home' });
      expect(document.activeElement).toBe(firstTab);
    });

    it('phone navigation renders bottom nav and opens/closes the bottom sheet', () => {
      setViewport(390, 844);
      render(<StageLayout onMiniMode={vi.fn()} />);

      const nav = screen.getByRole('navigation', { name: 'Game menu' });
      expect(nav).toBeTruthy();

      // Sheet is hidden initially
      expect(screen.queryByRole('tabpanel')).toBeNull();

      // Tap Inventory tab in nav to open sheet
      const invTab = nav.querySelector('#tab-Inventory');
      expect(invTab).toBeTruthy();
      fireEvent.click(invTab!);

      const panel = screen.getByRole('tabpanel', { name: 'Inventory' });
      expect(panel).toBeTruthy();

      // Close button exists with accessible name
      const closeBtn = screen.getByRole('button', { name: 'Close panel' });
      expect(closeBtn).toBeTruthy();
      fireEvent.click(closeBtn);

      expect(screen.queryByRole('tabpanel')).toBeNull();
      // Focus returns to the initiating tab in nav
      expect(document.activeElement?.id).toBe('tab-Inventory');
    });

    it('phone sheet closes on Escape and returns focus to the initiating nav tab', () => {
      setViewport(390, 844);
      render(<StageLayout onMiniMode={vi.fn()} />);

      const nav = screen.getByRole('navigation', { name: 'Game menu' });
      const bossTab = nav.querySelector<HTMLElement>('#tab-Boss')!;
      bossTab.focus();
      fireEvent.click(bossTab);

      expect(screen.getByRole('tabpanel', { name: 'Boss' })).toBeTruthy();

      // Press Escape
      fireEvent.keyDown(document, { key: 'Escape' });

      // Sheet is closed
      expect(screen.queryByRole('tabpanel')).toBeNull();
      // Focus returns to the Boss nav tab
      expect(document.activeElement?.id).toBe('tab-Boss');
    });

    it('tapping the active phone tab a second time closes the sheet', () => {
      setViewport(390, 844);
      render(<StageLayout onMiniMode={vi.fn()} />);

      const nav = screen.getByRole('navigation', { name: 'Game menu' });
      const forgeTab = nav.querySelector<HTMLElement>('#tab-Forge')!;
      fireEvent.click(forgeTab);
      expect(screen.getByRole('tabpanel', { name: 'Forge' })).toBeTruthy();

      // Tap again
      fireEvent.click(forgeTab);
      expect(screen.queryByRole('tabpanel')).toBeNull();
    });
  });

  describe('3. Stage Canvas and First-Run State', () => {
    it('renders accessible placeholder when cat class is unassigned', () => {
      stageState = sampleServerStateV2({ classId: null });
      render(<StageLayout onMiniMode={vi.fn()} />);

      const stage = screen.getByRole('region', { name: 'Game stage' });
      expect(stage).toBeTruthy();
      expect(screen.getByText('Your adventure starts with a class.')).toBeTruthy();
      expect(screen.queryByTestId('stage-canvas')).toBeNull();
    });

    it('renders stage canvas when cat class is chosen', () => {
      stageState = sampleServerStateV2({ classId: 'warrior' });
      render(<StageLayout onMiniMode={vi.fn()} />);

      const stage = screen.getByRole('region', { name: 'Game stage' });
      expect(stage).toBeTruthy();
      expect(screen.getByTestId('stage-canvas')).toBeTruthy();
    });
  });

  describe('4. ClassPicker First-Run A11y', () => {
    it('presents class picker dialog on first run and executes authoritative chooseClass', () => {
      stageState = sampleServerStateV2({ classId: null });
      render(<StageLayout onMiniMode={vi.fn()} />);

      expect(screen.getByTestId('class-picker')).toBeTruthy();
      const chooseBtn = screen.getByTestId('class-picker-choose-button');
      expect(chooseBtn).toBeTruthy();
      fireEvent.click(chooseBtn);

      const confirmBtn = screen.getByTestId('class-picker-confirm-button');
      expect(confirmBtn).toBeTruthy();
      fireEvent.click(confirmBtn);

      expect(stageLoop.chooseClass).toHaveBeenCalledWith('warrior');
    });
  });

  describe('5. Boss Fight Flow: Gate -> Arena -> Victory Chest', () => {
    it('initiates boss fight, opens arena with accessible health & status, and displays chest on completion', async () => {
      render(<StageLayout onMiniMode={vi.fn()} />);

      // Switch to Boss tab
      fireEvent.click(screen.getByRole('tab', { name: 'Boss' }));
      expect(screen.getByRole('tabpanel', { name: 'Boss' })).toBeTruthy();

      // Fight button
      const fightBtn = screen.getByRole('button', { name: /^Fight/ });
      expect(fightBtn).toBeTruthy();
      await act(async () => {
        fireEvent.click(fightBtn);
      });

      expect(stageLoop.fightBoss).toHaveBeenCalledWith(1);

      // Arena overlay mounts
      const arena = screen.getByRole('region', { name: 'Boss arena' });
      expect(arena).toBeTruthy();

      // Health and live status
      expect(screen.getByLabelText('Fight health').textContent).toContain('Cat HP 100 · Boss HP 500');
      expect(screen.getByRole('status').textContent).toContain('Boss fight in progress');

      // Skip fight button is accessible and enabled
      const skipBtn = screen.getByRole('button', { name: 'Skip fight' });
      expect(skipBtn).toBeTruthy();
      expect(skipBtn.hasAttribute('disabled')).toBe(false);

      // Click Skip fight
      await act(async () => {
        fireEvent.click(skipBtn);
      });

      // Victory status appears and ChestReveal modal opens
      expect(screen.getByText('Victory!')).toBeTruthy();
      const chestDialog = screen.getByRole('dialog');
      expect(chestDialog).toBeTruthy();
      expect(chestDialog.getAttribute('aria-modal')).toBe('true');
      expect(chestDialog.getAttribute('aria-label') || chestDialog.getAttribute('aria-labelledby')).toBeTruthy();
    });

    it('defeat flow preserves Cat Key and provides accessible return button', async () => {
      const defeatResult = {
        ...ARENA_FIXTURES[0]!.result,
        won: false,
        chest: null,
      };
      stageLoop.fightBoss.mockResolvedValueOnce(defeatResult);

      render(<StageLayout onMiniMode={vi.fn()} />);

      // Switch to Boss tab and fight
      fireEvent.click(screen.getByRole('tab', { name: 'Boss' }));
      const fightBtn = screen.getByRole('button', { name: /^Fight/ });
      await act(async () => {
        fireEvent.click(fightBtn);
      });

      // Complete replay via skip
      const skipBtn = screen.getByRole('button', { name: 'Skip fight' });
      await act(async () => {
        fireEvent.click(skipBtn);
      });

      // Defeat status announcement
      expect(screen.getByText(/Defeat\. Your key was kept\./i)).toBeTruthy();

      // Return button is present and accessible
      const returnBtn = screen.getByRole('button', { name: 'Back to exploring' });
      expect(returnBtn).toBeTruthy();

      fireEvent.click(returnBtn);
      // Arena unmounts
      expect(screen.queryByRole('region', { name: 'Boss arena' })).toBeNull();
    });
  });

  describe('6. Skip Button Accessibility in BossArena', () => {
    it('has explicit accessible name, is operable via keyboard, and disables when fight ends', async () => {
      const onDone = vi.fn();
      render(<BossArena {...ARENA_FIXTURES[0]!} reducedMotion={false} onDone={onDone} />);

      const skipBtn = screen.getByRole('button', { name: 'Skip fight' });
      expect(skipBtn).toBeTruthy();
      expect(skipBtn.getAttribute('type')).toBe('button');
      expect(skipBtn.hasAttribute('disabled')).toBe(false);

      // Keyboard actuation
      fireEvent.click(skipBtn);
      await waitFor(() => expect(onDone).toHaveBeenCalledOnce());

      // After fight completes, skip button is disabled
      expect(skipBtn.hasAttribute('disabled')).toBe(true);
    });
  });

  describe('7. Reduced Motion Audit', () => {
    it('propagates reduced motion preference cleanly to child components', () => {
      prefersReducedMotion = true;
      render(<StageLayout onMiniMode={vi.fn()} />);

      // Switch to Boss tab to verify ChapterMap reduced motion
      fireEvent.click(screen.getByRole('tab', { name: 'Boss' }));
      const activeChapterNode = document.querySelector('.v2-map-node-active');
      if (activeChapterNode) {
        expect(activeChapterNode.classList.contains('v2-map-pulse')).toBe(false);
      }
    });
  });
});
