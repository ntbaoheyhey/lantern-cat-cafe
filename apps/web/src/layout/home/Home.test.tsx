// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { sampleServerStateV2 } from '../a11y/fixtures';
import { HeroCard } from './HeroCard';
import { NextGoalCard } from './NextGoalCard';
import { RecentLootCard } from './RecentLootCard';
import { EventLog } from './EventLog';
import { LandingHero } from '../LandingHero';

vi.mock('../../wallet/WalletButton', () => ({
  WalletButton: () => <button data-testid="wallet-btn-mock">Wallet</button>,
}));
vi.mock('../wallet/WalletButton', () => ({
  WalletButton: () => <button data-testid="wallet-btn-mock">Wallet</button>,
}));

describe('Home and Landing Components (AGR1)', () => {
  afterEach(() => {
    cleanup();
  });

  describe('HeroCard', () => {
    it('renders hero cat name, class, level and derived core stats', () => {
      const state = sampleServerStateV2({ classId: 'warrior', level: 12 });
      render(<HeroCard state={state} />);

      expect(screen.getByTestId('hero-card-name').textContent).toBe('Mochi');
      expect(screen.getByText('Warrior')).toBeTruthy();
      expect(screen.getByText('Lv. 12')).toBeTruthy();
      expect(screen.getByTestId('hero-card-hp')).toBeTruthy();
      expect(screen.getByTestId('hero-card-atk')).toBeTruthy();
      expect(screen.getByTestId('hero-card-crit')).toBeTruthy();
      expect(screen.getByTestId('hero-card-def')).toBeTruthy();
      expect(screen.getByTestId('hero-card-power')).toBeTruthy();
    });
  });

  describe('NextGoalCard', () => {
    it('renders chapter and round progress, and navigates to map on click', () => {
      const state = sampleServerStateV2();
      const onNavigate = vi.fn();
      render(<NextGoalCard state={state} onNavigate={onNavigate} />);

      expect(screen.getByRole('heading', { name: 'Next Goal' })).toBeTruthy();
      const mapBtn = screen.getByTestId('home-goal-map');
      expect(mapBtn.textContent).toBe('Go to map');

      fireEvent.click(mapBtn);
      expect(onNavigate).toHaveBeenCalledWith('map');
    });
  });

  describe('RecentLootCard', () => {
    it('renders heading "Recent loot" and currency totals', () => {
      const state = sampleServerStateV2();
      render(<RecentLootCard state={state} />);

      expect(screen.getByRole('heading', { name: 'Recent loot' })).toBeTruthy();
      expect(screen.getByText('Fish')).toBeTruthy();
      expect(screen.getByText('Yarn')).toBeTruthy();
      expect(screen.getByText('Keys')).toBeTruthy();
    });

    it('renders "Recent finds" heading when gains are present', () => {
      const state = sampleServerStateV2();
      const gains = { fish: 10, yarn: 5, keys: 0, materials: {}, items: [], autoSalvaged: [], xp: 20, levelsGained: 0 };
      render(<RecentLootCard state={state} gains={gains} />);

      expect(screen.getByRole('heading', { name: 'Recent finds' })).toBeTruthy();
    });
  });

  describe('EventLog', () => {
    it('renders battle log region and default lines', () => {
      const state = sampleServerStateV2();
      render(<EventLog state={state} />);

      expect(screen.getByTestId('home-event-log')).toBeTruthy();
      expect(screen.getByText(/entered Chapter/i)).toBeTruthy();
      expect(screen.getByText(/Auto-battle active/i)).toBeTruthy();
    });

    it('formats combat and levelUp events', () => {
      const state = sampleServerStateV2();
      const events = [
        {
          type: 'claimed' as const,
          gains: { fish: 50, yarn: 20, keys: 1, materials: {}, items: [], autoSalvaged: [], xp: 100, levelsGained: 0 },
          at: Date.now(),
        },
        {
          type: 'levelUp' as const,
          from: 5,
          to: 6,
          at: Date.now(),
        },
      ];
      render(<EventLog state={state} events={events} />);

      expect(screen.getByText(/Mochi gathered 50 Fish and 20 Yarn/i)).toBeTruthy();
      expect(screen.getByText(/leveled up to Lv\. 6/i)).toBeTruthy();
    });
  });

  describe('LandingHero', () => {
    it('renders network pill, promise, guest CTA and proof strip links', () => {
      const onStartGuest = vi.fn();
      const onHelp = vi.fn();
      render(<LandingHero onStartGuest={onStartGuest} onHelp={onHelp} />);

      expect(screen.getByTestId('landing-hero')).toBeTruthy();
      expect(screen.getByTestId('landing-network-pill').textContent).toContain('Live on Avalanche Fuji');
      expect(screen.getByText(/Taskbar/i)).toBeTruthy();
      expect(screen.getByText(/A cozy idle RPG that lives in a strip of your browser/i)).toBeTruthy();
      expect(screen.getByText(/No token\. No fees to play/i)).toBeTruthy();

      // Primary CTA
      const guestBtn = screen.getByTestId('landing-start');
      expect(guestBtn.textContent).toBe('Play as guest');
      fireEvent.click(guestBtn);
      expect(onStartGuest).toHaveBeenCalledTimes(1);

      // Proof strip items
      expect(screen.getByText('ERC-721')).toBeTruthy();
      expect(screen.getByText('Relic NFT')).toBeTruthy();
      expect(screen.getByText(/Verified on Routescan/i)).toBeTruthy();
      expect(screen.getByText(/Server-checked fights/i)).toBeTruthy();
      expect(screen.getByText(/Open source/i)).toBeTruthy();

      // Help link
      const helpBtn = screen.getByTestId('landing-help-link');
      fireEvent.click(helpBtn);
      expect(onHelp).toHaveBeenCalledTimes(1);
    });
  });
});
