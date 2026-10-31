// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { ClassPicker, formatClassPassive, formatRole, STARTER_CLASSES } from './ClassPicker';

describe('ClassPicker', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders seven cards from the registry', () => {
    render(<ClassPicker />);

    // Radio group container exists with accessible semantics
    const radiogroup = screen.getByRole('radiogroup', { name: /cat classes/i });
    expect(radiogroup).toBeTruthy();

    // Exactly seven cards rendered with role="radio"
    const radioCards = screen.getAllByRole('radio');
    expect(radioCards).toHaveLength(7);

    // Every class from registry has its name, role, weapon icon, attack speed, and stat leanings
    for (const cls of v2.CLASSES) {
      expect(screen.getByText(cls.name)).toBeTruthy();
      expect(screen.getByTestId(`class-card-${cls.id}`)).toBeTruthy();
      const card = screen.getByTestId(`class-card-${cls.id}`);

      // Weapon icon exists
      const weaponIcon = card.querySelector(`svg[data-icon="${cls.weaponType}"]`);
      expect(weaponIcon).toBeTruthy();

      // Role exists (Melee, Reach, or Ranged)
      const roleText = formatRole(cls.range);
      expect(card.textContent).toContain(roleText);

      // Attack speed exists
      const speedSec = (cls.attackIntervalMs / 1000).toFixed(2);
      expect(card.textContent).toContain(`${speedSec}s`);

      // Stat values exist
      expect(card.textContent).toContain(`${cls.stats.hp}x`);
      expect(card.textContent).toContain(`${cls.stats.atk}x`);
      expect(card.textContent).toContain(`${cls.stats.def}x`);

      // Swatch exists
      const swatch = card.querySelector('.class-card__swatch');
      expect(swatch).toBeTruthy();
    }
  });

  it('passives text is non-empty for every class', () => {
    render(<ClassPicker />);

    for (const cls of v2.CLASSES) {
      const passiveText = formatClassPassive(cls.passive);
      expect(passiveText).toBeTruthy();
      expect(passiveText.trim().length).toBeGreaterThan(10);

      // Plain words passive rendered in the card
      const card = screen.getByTestId(`class-card-${cls.id}`);
      expect(card.textContent).toContain(passiveText);
    }

    // Verify warrior's cleave passive matches the exact plain words format
    const warriorPassive = formatClassPassive(v2.CLASSES.find((c) => c.id === 'warrior')!.passive);
    expect(warriorPassive).toBe('Cleave: every 3rd swing also hits the next monster for 50%');
  });

  it('choosing calls onChoose only after confirm', () => {
    const onChoose = vi.fn();
    render(<ClassPicker selected="warrior" onChoose={onChoose} />);

    // Initially warrior is selected
    const warriorCard = screen.getByTestId('class-card-warrior');
    expect(warriorCard.getAttribute('aria-checked')).toBe('true');

    // Click rogue card to highlight it
    const rogueCard = screen.getByTestId('class-card-rogue');
    fireEvent.click(rogueCard);
    expect(rogueCard.getAttribute('aria-checked')).toBe('true');
    expect(warriorCard.getAttribute('aria-checked')).toBe('false');

    // Confirmation box is not visible yet
    expect(screen.queryByTestId('class-picker-confirm-box')).toBeNull();

    // Click Choose button
    const chooseBtn = screen.getByRole('button', { name: /choose rogue/i });
    fireEvent.click(chooseBtn);

    // onChoose has NOT been called yet
    expect(onChoose).not.toHaveBeenCalled();

    // Confirmation dialog appears inside the page with required prompt text
    const confirmBox = screen.getByTestId('class-picker-confirm-box');
    expect(confirmBox).toBeTruthy();
    expect(screen.getByTestId('class-picker-confirm-text').textContent).toBe(
      'Switch to Rogue? You can switch back any time outside boss fights.',
    );

    // Clicking Cancel closes the confirmation without calling onChoose
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByTestId('class-picker-confirm-box')).toBeNull();
    expect(onChoose).not.toHaveBeenCalled();

    // Click Choose again and confirm
    fireEvent.click(screen.getByRole('button', { name: /choose rogue/i }));
    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    fireEvent.click(confirmBtn);

    // onChoose called with selected classId
    expect(onChoose).toHaveBeenCalledTimes(1);
    expect(onChoose).toHaveBeenCalledWith('rogue');

    // Confirmation box is closed after confirm
    expect(screen.queryByTestId('class-picker-confirm-box')).toBeNull();
  });

  it('locked disables everything', () => {
    const onChoose = vi.fn();
    render(<ClassPicker selected="warrior" locked={true} onChoose={onChoose} />);

    // Visible reason is displayed
    const lockedNotice = screen.getByTestId('class-picker-locked-notice');
    expect(lockedNotice).toBeTruthy();
    expect(lockedNotice.textContent).toContain('locked during a boss fight');

    // Radio group has aria-disabled="true"
    const radiogroup = screen.getByRole('radiogroup', { name: /cat classes/i });
    expect(radiogroup.getAttribute('aria-disabled')).toBe('true');

    // All cards have aria-disabled="true" and cannot be clicked
    const cards = screen.getAllByRole('radio');
    expect(cards).toHaveLength(7);
    for (const card of cards) {
      expect(card.getAttribute('aria-disabled')).toBe('true');
      expect(card.className).toContain('class-card--disabled');
    }

    // Clicking another card does nothing
    const hunterCard = screen.getByTestId('class-card-hunter');
    fireEvent.click(hunterCard);
    expect(hunterCard.getAttribute('aria-checked')).toBe('false');

    // Arrow keys do nothing
    fireEvent.keyDown(cards[0]!, { key: 'ArrowRight' });
    expect(cards[1]!.getAttribute('aria-checked')).toBe('false');

    // Choose button is disabled
    const chooseBtn = screen.getByTestId('class-picker-choose-button');
    expect(chooseBtn.getAttribute('disabled')).toBeDefined();
    expect(chooseBtn.getAttribute('aria-disabled')).toBe('true');

    // Clicking choose button does not open confirmation
    fireEvent.click(chooseBtn);
    expect(screen.queryByTestId('class-picker-confirm-box')).toBeNull();
    expect(onChoose).not.toHaveBeenCalled();
  });

  it('arrow keys move selection', () => {
    render(<ClassPicker selected="warrior" />);

    const cards = screen.getAllByRole('radio');
    expect(cards[0]!.getAttribute('aria-checked')).toBe('true');

    // Press ArrowRight moves from Warrior (index 0) to Guardian (index 1)
    fireEvent.keyDown(cards[0]!, { key: 'ArrowRight' });
    expect(cards[0]!.getAttribute('aria-checked')).toBe('false');
    expect(cards[1]!.getAttribute('aria-checked')).toBe('true');

    // Press ArrowDown moves to Rogue (index 2)
    fireEvent.keyDown(cards[1]!, { key: 'ArrowDown' });
    expect(cards[2]!.getAttribute('aria-checked')).toBe('true');

    // Press ArrowLeft moves back to Guardian (index 1)
    fireEvent.keyDown(cards[2]!, { key: 'ArrowLeft' });
    expect(cards[1]!.getAttribute('aria-checked')).toBe('true');

    // Press ArrowUp moves back to Warrior (index 0)
    fireEvent.keyDown(cards[1]!, { key: 'ArrowUp' });
    expect(cards[0]!.getAttribute('aria-checked')).toBe('true');

    // Press ArrowLeft at first card wraps to last card (Alchemist, index 6)
    fireEvent.keyDown(cards[0]!, { key: 'ArrowLeft' });
    expect(cards[6]!.getAttribute('aria-checked')).toBe('true');

    // Press ArrowRight at last card wraps to first card (Warrior, index 0)
    fireEvent.keyDown(cards[6]!, { key: 'ArrowRight' });
    expect(cards[0]!.getAttribute('aria-checked')).toBe('true');

    // Press End moves to last card
    fireEvent.keyDown(cards[0]!, { key: 'End' });
    expect(cards[6]!.getAttribute('aria-checked')).toBe('true');

    // Press Home moves to first card
    fireEvent.keyDown(cards[6]!, { key: 'Home' });
    expect(cards[0]!.getAttribute('aria-checked')).toBe('true');
  });

  it('supports Enter and Space keys to select a card', () => {
    render(<ClassPicker selected="warrior" />);

    const cards = screen.getAllByRole('radio');
    const witchCard = screen.getByTestId('class-card-witch');

    // Space selects witch
    fireEvent.keyDown(witchCard, { key: ' ' });
    expect(witchCard.getAttribute('aria-checked')).toBe('true');

    // Enter selects archer
    const archerCard = screen.getByTestId('class-card-archer');
    fireEvent.keyDown(archerCard, { key: 'Enter' });
    expect(archerCard.getAttribute('aria-checked')).toBe('true');
  });

  it('renders exactly three starter cards when STARTER_CLASSES is provided', () => {
    const onChoose = vi.fn();
    render(<ClassPicker classes={STARTER_CLASSES} directStart onChoose={onChoose} />);

    const radioCards = screen.getAllByRole('radio');
    expect(radioCards).toHaveLength(3);
    expect(screen.getByTestId('class-card-warrior')).toBeTruthy();
    expect(screen.getByTestId('class-card-guardian')).toBeTruthy();
    expect(screen.getByTestId('class-card-rogue')).toBeTruthy();

    // Button says Start Adventure
    const startBtn = screen.getByTestId('class-picker-choose-button');
    expect(startBtn.textContent).toContain('Start Adventure as Warrior');

    // Clicking Rogue then Start immediately calls onChoose when directStart is true
    fireEvent.click(screen.getByTestId('class-card-rogue'));
    expect(startBtn.textContent).toContain('Start Adventure as Rogue');
    fireEvent.click(startBtn);
    expect(onChoose).toHaveBeenCalledWith('rogue');
  });
});
