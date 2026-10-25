// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { ProgressChip } from './ProgressChip';

describe('ProgressChip', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders chapter, round, kills text and chapter name as title', () => {
    render(<ProgressChip chapter={2} round={3} kills={4} killsPerRound={10} />);

    expect(screen.getByText('Chapter 2 · Round 3 · 4/10')).toBeTruthy();

    const chapterDef = v2.CHAPTERS.find((c) => c.index === 2);
    expect(chapterDef?.name).toBe('Kitchen');

    const chip = screen.getByRole('group');
    expect(chip.getAttribute('title')).toBe('Kitchen');
  });

  it('has an accessible name that reads in words', () => {
    render(<ProgressChip chapter={2} round={3} kills={4} killsPerRound={10} />);

    const chip = screen.getByRole('group', {
      name: 'Chapter 2 Kitchen, round 3 of 10, 4 of 10 monsters',
    });
    expect(chip).toBeTruthy();
  });

  it('renders correctly for chapter 1 with distinct killsPerRound', () => {
    render(<ProgressChip chapter={1} round={1} kills={3} killsPerRound={6} />);

    expect(screen.getByText('Chapter 1 · Round 1 · 3/6')).toBeTruthy();

    const chip = screen.getByRole('group', {
      name: 'Chapter 1 Living Room, round 1 of 10, 3 of 6 monsters',
    });
    expect(chip).toBeTruthy();
    expect(chip.getAttribute('title')).toBe('Living Room');
  });
});
