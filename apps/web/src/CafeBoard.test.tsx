// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CafeBoard } from './CafeBoard';
import type { GameSnapshot } from './game/gameState';
import { getGameLoop } from './game/store';
import { LABELS } from './theme/labels';
import type { ServerState } from './api/GameApi';

beforeEach(async () => {
  localStorage.setItem('taskbar-hero.howToPlaySeen', '1');
  await act(async () => {
    await getGameLoop().start(document);
  });
});

afterEach(() => {
  getGameLoop().stop();
  cleanup();
});

const mockServerState: ServerState = {
  gold: 100,
  shards: 50,
  gear: [],
  inventory: [],
  bossLevel: 3,
  bossKeys: 2,
  boss: {
    level: 3,
    attemptsToday: 2,
    attemptsLeft: 3,
    keyEarnedToday: false,
  },
  forge: {
    blockedBy: null,
    forgedToday: false,
    pending: null,
    today: null,
  },
  power: 125,
  goldPerSecond: 10,
  serverTime: 1700000000,
};

const mockSnapshot: GameSnapshot = {
  gold: 100,
  shards: 50,
  power: 125,
  goldPerSecond: 10,
  paused: false,
  loadFailed: false,
  server: mockServerState,
};

describe('CafeBoard', () => {
  it('renders all three cards on the Cafe board with PixelIcon headings', () => {
    const handleGo = vi.fn();
    render(<CafeBoard onGo={handleGo} snapshot={mockSnapshot} />);

    // Board container
    expect(screen.getByRole('region', { name: 'Café board' })).toBeTruthy();

    // 1. Mochi card
    const catCard = screen.getByRole('region', { name: 'Mochi the cat' });
    expect(catCard.classList.contains('pixel-card')).toBe(true);
    expect(screen.getByRole('heading', { level: 2, name: 'Mochi the cat' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Portrait of Mochi the cat' })).toBeTruthy();
    expect(screen.getByTestId('cat-card-power').textContent).toBe('125');
    expect(screen.getByTestId('cat-card-boss-level').textContent).toBe('3');

    // 2. Today's Quest card
    const questCard = screen.getByRole('region', { name: "Today's quest" });
    expect(questCard.classList.contains('pixel-card')).toBe(true);
    expect(screen.getByRole('heading', { level: 2, name: "Today's Quest" })).toBeTruthy();
    expect(screen.getByTestId('next-hint')).toBeTruthy();

    // Boss progress bar
    const bossProgress = screen.getByTestId('cafe-boss-progress');
    expect(bossProgress).toBeTruthy();
    expect(bossProgress.textContent).toContain('2 / 5');
    const progressBar = screen.getByRole('progressbar', { name: 'Boss fights used today' });
    expect(progressBar.getAttribute('aria-valuenow')).toBe('2');
    expect(progressBar.getAttribute('aria-valuemax')).toBe('5');

    // 3. Relic shelf card
    const relicCard = screen.getByRole('region', { name: 'Relic shelf' });
    expect(relicCard.classList.contains('pixel-card')).toBe(true);
    expect(screen.getByRole('heading', { level: 2, name: 'Relic Shelf' })).toBeTruthy();
    expect(screen.getByTestId('relic-shelf-slot')).toBeTruthy();
  });

  it('shows an empty slot with next target name when no relic is forged today', () => {
    const handleGo = vi.fn();
    render(<CafeBoard onGo={handleGo} snapshot={mockSnapshot} />);

    const slot = screen.getByTestId('relic-shelf-slot');
    expect(slot.classList.contains('empty')).toBe(true);
    expect(slot.textContent).toContain('Empty Slot');
    expect(slot.textContent).toContain(`Next target: ${LABELS.relics.common}`);
  });

  it('shows today\'s relic when a relic has been forged today', () => {
    const handleGo = vi.fn();
    const forgedSnapshot: GameSnapshot = {
      ...mockSnapshot,
      server: {
        ...mockServerState,
        forge: {
          blockedBy: 'daily_limit',
          forgedToday: true,
          pending: null,
          today: {
            relicId: '1',
            rarityName: 'rare',
            minted: true,
            txHash: '0x123',
          },
        },
      },
    };

    render(<CafeBoard onGo={handleGo} snapshot={forgedSnapshot} />);

    const slot = screen.getByTestId('relic-shelf-slot');
    expect(slot.classList.contains('filled')).toBe(true);
    expect(slot.textContent).toContain(LABELS.relics.rare);
    expect(slot.textContent).toContain(LABELS.rarities.rare);
    expect(slot.textContent).toContain('Minted');
  });

  it('shows pending voucher as today\'s relic when minted is false', () => {
    const handleGo = vi.fn();
    const pendingSnapshot: GameSnapshot = {
      ...mockSnapshot,
      server: {
        ...mockServerState,
        forge: {
          blockedBy: 'daily_limit',
          forgedToday: true,
          pending: {
            player: '0x1234567890123456789012345678901234567890',
            relicId: '2',
            rarity: 2,
            rarityName: 'epic',
            nonce: '1',
            expiry: 1700003600,
            signature: '0xabc',
          },
          today: null,
        },
      },
    };

    render(<CafeBoard onGo={handleGo} snapshot={pendingSnapshot} />);

    const slot = screen.getByTestId('relic-shelf-slot');
    expect(slot.classList.contains('filled')).toBe(true);
    expect(slot.textContent).toContain(LABELS.relics.epic);
    expect(slot.textContent).toContain(LABELS.rarities.epic);
    expect(slot.textContent).toContain('Forged (ready to mint)');
  });

  it('omits boss progress bar when boss data is not available in snapshot', () => {
    getGameLoop().stop();
    const handleGo = vi.fn();
    const noServerSnapshot: GameSnapshot = {
      gold: 0,
      shards: 0,
      power: 0,
      goldPerSecond: 0,
      paused: true,
      loadFailed: false,
      server: null,
    };

    render(<CafeBoard onGo={handleGo} snapshot={noServerSnapshot} />);
    expect(screen.queryByTestId('cafe-boss-progress')).toBeNull();
    // Default boss level is 1
    expect(screen.getByTestId('cat-card-boss-level').textContent).toBe('1');
    // Relic shelf still shows empty slot with target
    expect(screen.getByTestId('relic-shelf-slot').textContent).toContain(LABELS.relics.common);
  });
});
