// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { sampleStateV2 } from '../sampleState';
import { CharacterPanel } from './CharacterPanel';

afterEach(cleanup);

function atLevel(level: number): ServerStateV2 {
  const base = sampleStateV2();
  return {
    ...base,
    cat: { ...base.cat, level },
    unlockedSlots: v2.GEAR_SLOTS.filter((s) => s.unlockLevel <= level).map((s) => s.id),
  };
}

describe('CharacterPanel', () => {
  it('renders the nine gear slots in display order, with the worn item named', () => {
    render(<CharacterPanel state={sampleStateV2()} />);
    const panel = screen.getByRole('region', { name: 'Character' });
    const slots = within(panel).getAllByRole('button');
    expect(slots).toHaveLength(9);
    expect(slots.map((b) => b.getAttribute('aria-label')?.split(':')[0])).toEqual([
      'Weapon',
      'Helmet',
      'Armor',
      'Gloves',
      'Boots',
      'Collar',
      'Earring',
      'Ring',
      'Charm',
    ]);
    expect(screen.getByRole('button', { name: 'Weapon: Twig Sword, Common' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ring: empty' })).toBeTruthy();
  });

  it('shows the class, level and an XP progress bar', () => {
    const state = sampleStateV2();
    render(<CharacterPanel state={state} />);
    expect(screen.getByText('Warrior')).toBeTruthy();
    expect(screen.getByText('Lv 12')).toBeTruthy();
    const bar = screen.getByRole('progressbar', { name: 'Experience' });
    expect(bar.getAttribute('aria-valuenow')).toBe(String(state.cat.xp));
    expect(bar.getAttribute('aria-valuemax')).toBe(String(state.cat.xpToNext));
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
  });

  it('disables locked accessory slots and shows the level they unlock at', () => {
    render(<CharacterPanel state={atLevel(3)} />);
    for (const [name, level] of [
      ['Earring', 5],
      ['Ring', 10],
      ['Charm', 20],
    ] as const) {
      const slot = screen.getByRole('button', { name: `${name}: locked until level ${level}` }) as HTMLButtonElement;
      expect(slot.disabled).toBe(true);
      expect(slot.textContent).toContain(`Lv ${level}`);
    }
    expect((screen.getByRole('button', { name: /^Collar:/ }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('shows the derived stats and a numeric power', () => {
    render(<CharacterPanel state={sampleStateV2()} />);
    expect(screen.getByTestId('character-power').textContent).toMatch(/^\d+$/);
    expect(screen.getByText('Attack speed')).toBeTruthy();
    expect(screen.getByText('Crit damage')).toBeTruthy();
    expect(document.querySelector('dl.stats')).not.toBeNull();
  });

  it('hides the stats and asks for a class when the cat has none', () => {
    const base = sampleStateV2();
    render(<CharacterPanel state={{ ...base, cat: { ...base.cat, classId: null } }} />);
    expect(screen.getByText('No class yet')).toBeTruthy();
    expect(screen.getByText('Choose a class to see stats.')).toBeTruthy();
    expect(screen.queryByTestId('character-power')).toBeNull();
    expect(document.querySelector('dl.stats')).toBeNull();
    expect(within(screen.getByRole('region', { name: 'Character' })).getAllByRole('button')).toHaveLength(9);
  });
});
