// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as reducedMotionModule from '../../motion/reducedMotion';
import { ClassPicker } from '../classpicker/ClassPicker';
import { ForgePanel } from '../forge/ForgePanel';
import { BossGatePanel } from '../boss/BossGatePanel';
import {
  bossGatePanelProps,
  classPickerProps,
  forgePanelProps,
  sampleServerStateV2,
} from './fixtures';

describe('v2 Interactive Panels accessibility & reduced-motion audit', () => {
  beforeEach(() => {
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('ClassPicker', () => {
    it('check 1 & 2: buttons have accessible names and cards use roving tabIndex (no positive tabIndex)', () => {
      const { container } = render(<ClassPicker {...classPickerProps()} />);
      const buttons = container.querySelectorAll<HTMLElement>('button, [role="button"]');
      buttons.forEach((btn) => {
        const name = btn.getAttribute('aria-label') || btn.textContent?.trim();
        expect(name).toBeTruthy();
      });

      const withTabIndex = container.querySelectorAll<HTMLElement>('[tabindex]');
      withTabIndex.forEach((el) => {
        expect(el.tabIndex).toBeLessThanOrEqual(0);
      });

      // Active card has roving tabIndex 0, other cards -1
      const radios = screen.getAllByRole('radio');
      const zeroTabIndex = Array.from(radios).filter((r) => r.tabIndex === 0);
      expect(zeroTabIndex).toHaveLength(1);
    });

    it('check 2 (locked): disabled action explains why in text', () => {
      render(<ClassPicker {...classPickerProps({ locked: true })} />);
      const chooseBtn = screen.getByRole('button', { name: /locked during boss fight/i });
      expect(chooseBtn.hasAttribute('disabled')).toBe(true);
      expect(chooseBtn.getAttribute('aria-disabled')).toBe('true');
      expect(
        screen.getByText(/class switching is locked during a boss fight/i),
      ).toBeTruthy();
    });

    it('check 3: weapon icons and stat tracks are aria-hidden', () => {
      const { container } = render(<ClassPicker {...classPickerProps()} />);
      const weaponIcons = container.querySelectorAll('.class-card__weapon svg');
      weaponIcons.forEach((svg) => {
        expect(svg.getAttribute('aria-hidden')).toBe('true');
      });
      const tracks = container.querySelectorAll('.class-card__stat-track');
      tracks.forEach((track) => {
        expect(track.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('check 4: single top h2 heading and no skipped levels', () => {
      render(<ClassPicker {...classPickerProps()} />);
      const h2 = screen.getByRole('heading', { level: 2, name: 'Choose Your Class' });
      expect(h2).toBeTruthy();
      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(1);
    });

    it('check 6 & 7: selection and locked status are never colour-only and no animation class added for motion', () => {
      vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(true);
      render(<ClassPicker {...classPickerProps({ selected: 'warrior' })} />);

      const warriorCard = screen.getByTestId('class-card-warrior');
      expect(warriorCard.getAttribute('aria-checked')).toBe('true');
      expect(screen.getByRole('button', { name: 'Choose Warrior' })).toBeTruthy();
      expect(warriorCard.className).not.toMatch(/fx-|anim-/);
    });

    it('check 8: numbers (speed and stat multipliers) match props', () => {
      render(<ClassPicker {...classPickerProps()} />);
      expect(screen.getByText('1.00s')).toBeTruthy();
      expect(screen.getByText('1.40s')).toBeTruthy();
      expect(screen.getByText('0.80s')).toBeTruthy();
    });
  });

  describe('ForgePanel', () => {
    it('check 1 & 2: all controls have accessible names and no positive tabIndex', () => {
      const { container } = render(<ForgePanel {...forgePanelProps()} />);
      const controls = container.querySelectorAll<HTMLElement>(
        'button, [role="button"], [role="tab"], input',
      );
      controls.forEach((c) => {
        const name =
          c.getAttribute('aria-label') ||
          c.getAttribute('title') ||
          c.textContent?.trim();
        expect(name).toBeTruthy();
      });

      const withTabIndex = container.querySelectorAll<HTMLElement>('[tabindex]');
      withTabIndex.forEach((el) => {
        expect(el.tabIndex).toBeLessThanOrEqual(0);
      });
    });

    it('check 2 (craft blocked): disabled craft explains missing materials in text', () => {
      render(<ForgePanel {...forgePanelProps({ stacks: { fish: 0, yarn: 0 } })} />);
      const craftBtn = screen.getByTestId('craft-btn');
      expect(craftBtn.hasAttribute('disabled')).toBe(true);
      expect(craftBtn.getAttribute('aria-disabled')).toBe('true');
      expect(screen.getByTestId('craft-block-reason').textContent).toMatch(/needs \d+ more/i);
    });

    it('check 2 (relic blocked): disabled relic button explains refusal reason in text', () => {
      render(
        <ForgePanel
          {...forgePanelProps({
            defaultTab: 'relic',
            relic: { today: null, pending: null, blockedReason: 'daily_limit' },
          })}
        />,
      );
      const relicBtn = screen.getByTestId('relic-forge-btn');
      expect(relicBtn.hasAttribute('disabled')).toBe(true);
      expect(relicBtn.getAttribute('aria-disabled')).toBe('true');
      expect(screen.getByTestId('relic-blocked-reason').textContent).toMatch(/daily limit reached/i);
    });

    it('check 3: selector icons have role img and label while item rows have aria-hidden art', () => {
      const { container } = render(<ForgePanel {...forgePanelProps({ defaultTab: 'salvage' })} />);
      const selectorIcons = container.querySelectorAll('.forge-slot-btn svg');
      selectorIcons.forEach((icon) => {
        expect(icon.getAttribute('role')).toBe('img');
        expect(icon.getAttribute('aria-label')).toBeTruthy();
      });

      const itemArt = container.querySelectorAll('.forge-item-icon-box svg');
      itemArt.forEach((svg) => {
        expect(svg.getAttribute('aria-hidden')).toBe('true');
      });
    });

    it('check 4: craft tab has top h3 followed by h4 without skipped levels', () => {
      render(<ForgePanel {...forgePanelProps({ defaultTab: 'craft' })} />);
      const h3 = screen.getByRole('heading', { level: 3 });
      expect(h3.className).toContain('forge-preview-name');
      const h4 = screen.getByRole('heading', { level: 4, name: 'Recipe Cost & Balance' });
      expect(h4).toBeTruthy();
    });

    it('check 7: rarity and status are never colour-only', () => {
      render(<ForgePanel {...forgePanelProps({ defaultTab: 'salvage' })} />);
      expect(screen.getByTestId('disabled-reason-10000000-0000-0000-0000-000000000003').textContent).toBe('Locked');
      expect(screen.getByTestId('disabled-reason-10000000-0000-0000-0000-000000000004').textContent).toBe('Equipped');
    });

    it('check 8: material quantities and cost ratios match props', () => {
      render(<ForgePanel {...forgePanelProps({ defaultTab: 'craft' })} />);
      const yarnCost = screen.getByTestId('cost-yarn');
      expect(yarnCost.textContent).toContain('50 / 10');
      const fishCost = screen.getByTestId('cost-fish');
      expect(fishCost.textContent).toContain('1000 / 50');
    });

    it('empty inventory edge case: salvage tab renders empty notice', () => {
      render(<ForgePanel {...forgePanelProps({ defaultTab: 'salvage', items: [] })} />);
      expect(screen.getByText('No items in inventory.')).toBeTruthy();
    });
  });

  describe('BossGatePanel', () => {
    it('check 1 & 2: chapter switcher and fight button have accessible names and no positive tabIndex', () => {
      const { container } = render(<BossGatePanel {...bossGatePanelProps()} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        const name = btn.getAttribute('aria-label') || btn.textContent?.trim();
        expect(name).toBeTruthy();
      });

      const withTabIndex = container.querySelectorAll<HTMLElement>('[tabindex]');
      withTabIndex.forEach((el) => {
        expect(el.tabIndex).toBeLessThanOrEqual(0);
      });
    });

    it('check 2 (disabled): cooldown, no key, not reached, and no class explain why in visible text', () => {
      const { rerender } = render(
        <BossGatePanel
          {...bossGatePanelProps({
            state: sampleServerStateV2({ cooldownUntil: 1042 }),
            nowS: 1000,
          })}
        />,
      );
      expect(screen.getByRole('button', { name: 'Fight' }).hasAttribute('disabled')).toBe(true);
      expect(screen.getByText('Catnap: 0:42')).toBeTruthy();

      rerender(
        <BossGatePanel
          {...bossGatePanelProps({
            state: sampleServerStateV2({ keys: 0 }),
          })}
        />,
      );
      expect(screen.getByRole('button', { name: 'Fight' }).hasAttribute('disabled')).toBe(true);
      expect(screen.getByText(/you need a cat key/i)).toBeTruthy();

      rerender(
        <BossGatePanel
          {...bossGatePanelProps({
            state: sampleServerStateV2({ round: 5, kills: 2 }),
          })}
        />,
      );
      expect(screen.getByRole('button', { name: 'Fight' }).hasAttribute('disabled')).toBe(true);
      expect(screen.getByText(/clear \d+ more rounds/i)).toBeTruthy();

      rerender(
        <BossGatePanel
          {...bossGatePanelProps({
            state: sampleServerStateV2({ classId: null }),
          })}
        />,
      );
      expect(screen.getByRole('button', { name: 'Fight' }).hasAttribute('disabled')).toBe(true);
      expect(screen.getByText('Pick a class first.')).toBeTruthy();
    });

    it('check 3: boss portrait and key icon have role img and label', () => {
      const { container } = render(<BossGatePanel {...bossGatePanelProps()} />);
      const portrait = container.querySelector('.boss-portrait-container svg');
      expect(portrait?.getAttribute('role')).toBe('img');
      expect(portrait?.getAttribute('aria-label')).toBe('Yarn Giant');

      const keyIcon = container.querySelector('.boss-gate-keys svg');
      expect(keyIcon?.getAttribute('role')).toBe('img');
      expect(keyIcon?.getAttribute('aria-label')).toBe('Cat Key');
    });

    it('check 4: single top h2 heading and no skipped levels', () => {
      render(<BossGatePanel {...bossGatePanelProps()} />);
      const h2 = screen.getByRole('heading', { level: 2, name: 'Yarn Giant' });
      expect(h2).toBeTruthy();
      expect(screen.getAllByRole('heading')).toHaveLength(1);
    });

    it('check 7 & 8: status is never colour-only and numbers match props', () => {
      render(
        <BossGatePanel
          {...bossGatePanelProps({
            state: sampleServerStateV2({ keys: 5, cooldownUntil: 1125 }),
            nowS: 1000,
          })}
        />,
      );
      expect(screen.getByText('Keys: 5')).toBeTruthy();
      expect(screen.getByText('Catnap: 2:05')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Chapter 1' }).getAttribute('aria-current')).toBe('true');
    });

    it('busy fight edge case: sets aria-busy and disables fight button', () => {
      render(<BossGatePanel {...bossGatePanelProps({ busy: true })} />);
      const btn = screen.getByRole('button', { name: 'Fighting...' });
      expect(btn.hasAttribute('disabled')).toBe(true);
      expect(btn.getAttribute('aria-busy')).toBe('true');
    });
  });
});
