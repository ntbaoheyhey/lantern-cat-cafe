// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ServerStateV2 } from '../../api/GameApiV2';
import { BossGatePanel } from './BossGatePanel';

function makeState(overrides: Partial<{
  classId: ServerStateV2['cat']['classId'];
  chapter: number;
  round: number;
  kills: number;
  keys: number;
  cooldownUntil: number | null;
  clearedChapters: number[];
}> = {}): ServerStateV2 {
  const currentChapter = overrides.chapter ?? 1;
  const cleared = (overrides.clearedChapters ?? []).map((ch) => ({
    chapter: ch,
    cleared: true,
    wins: 1,
  }));

  return {
    cat: {
      classId: overrides.classId !== undefined ? overrides.classId : 'warrior',
      level: 10,
      xp: 0,
      xpToNext: 100,
    },
    progress: {
      chapter: currentChapter,
      round: overrides.round ?? 10,
      kills: overrides.kills ?? 6,
      killsPerRound: 6,
      gated: false,
      neededPower: 0,
    },
    currencies: {
      fish: 100,
      yarn: 50,
      keys: overrides.keys !== undefined ? overrides.keys : 1,
    },
    materials: {},
    inventory: [],
    bagLimit: 200,
    equipped: {
      weapon: null,
      helmet: null,
      armor: null,
      gloves: null,
      boots: null,
      collar: null,
      earring: null,
      ring: null,
      charm: null,
    },
    unlockedSlots: ['weapon'],
    bosses: {
      chapters: cleared,
      cooldownUntil: overrides.cooldownUntil !== undefined ? overrides.cooldownUntil : null,
    },
    forge: {
      blockedBy: null,
      forgedToday: false,
      pending: null,
      today: null,
    },
    founder: false,
    serverTime: 1000,
  };
}

describe('BossGatePanel', () => {
  afterEach(cleanup);

  it('renders ready status with enabled Fight button', () => {
    const state = makeState({ chapter: 1, round: 10, kills: 6, keys: 1 });
    render(
      <BossGatePanel
        state={state}
        chapter={1}
        nowS={1000}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Fight' });
    expect(button).toBeTruthy();
    expect(button.getAttribute('disabled')).toBeNull();
    expect(screen.getByText('Yarn Giant')).toBeTruthy();
    expect(screen.getByText('Chapter 1: Living Room')).toBeTruthy();
    expect(screen.getByText('Keys: 1')).toBeTruthy();
  });

  it('renders rematch ready status with enabled Rematch button', () => {
    const state = makeState({
      chapter: 2,
      round: 1,
      kills: 0,
      clearedChapters: [1],
      keys: 2,
    });
    render(
      <BossGatePanel
        state={state}
        chapter={1}
        nowS={1000}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Rematch' });
    expect(button).toBeTruthy();
    expect(button.getAttribute('disabled')).toBeNull();
  });

  it('renders cooldown status with disabled button and countdown text', () => {
    const state = makeState({ cooldownUntil: 1042 });
    render(
      <BossGatePanel
        state={state}
        chapter={1}
        nowS={1000}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Fight' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Catnap: 0:42')).toBeTruthy();
  });

  it('renders not_reached status for current chapter with rounds and monsters remaining', () => {
    // Chapter 1 has 10 rounds and 6 killsPerRound
    const state = makeState({ chapter: 1, round: 7, kills: 2 });
    render(
      <BossGatePanel
        state={state}
        chapter={1}
        nowS={1000}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Fight' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Clear 3 more rounds and 4 more monsters to reach the boss.')).toBeTruthy();
  });

  it('renders not_reached status for current chapter with only monsters remaining when round 10', () => {
    const state = makeState({ chapter: 1, round: 10, kills: 4 });
    render(
      <BossGatePanel
        state={state}
        chapter={1}
        nowS={1000}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    expect(screen.getByText('Clear 2 more monsters to reach the boss.')).toBeTruthy();
  });

  it('renders not_reached status for later chapter with beat previous boss first text', () => {
    const state = makeState({ chapter: 2, round: 5, kills: 0 });
    render(
      <BossGatePanel
        state={state}
        chapter={3}
        nowS={1000}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Fight' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Beat the chapter 2 boss first.')).toBeTruthy();
  });

  it('renders no_key status with disabled button and key requirement message', () => {
    const state = makeState({ chapter: 1, round: 10, kills: 6, keys: 0 });
    render(
      <BossGatePanel
        state={state}
        chapter={1}
        nowS={1000}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Fight' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(
      screen.getByText(
        'You need a Cat Key. You get one each day from your first claim, and sometimes from monsters in cleared chapters.',
      ),
    ).toBeTruthy();
  });

  it('renders no_class status with disabled button and class prompt', () => {
    const state = makeState({ classId: null });
    render(
      <BossGatePanel
        state={state}
        chapter={1}
        nowS={1000}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Fight' });
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('Pick a class first.')).toBeTruthy();
  });

  it('calls onFight(chapter) once on Fight click and does not fire when busy or double clicked', () => {
    const onFight = vi.fn();
    const state = makeState({ chapter: 1, round: 10, kills: 6, keys: 1 });

    const { rerender } = render(
      <BossGatePanel
        state={state}
        chapter={1}
        nowS={1000}
        busy={false}
        onFight={onFight}
        onSelectChapter={vi.fn()}
      />,
    );

    const button = screen.getByRole('button', { name: 'Fight' });
    fireEvent.click(button);
    expect(onFight).toHaveBeenCalledTimes(1);
    expect(onFight).toHaveBeenCalledWith(1);

    // When busy becomes true, clicking does nothing
    rerender(
      <BossGatePanel
        state={state}
        chapter={1}
        nowS={1000}
        busy={true}
        onFight={onFight}
        onSelectChapter={vi.fn()}
      />,
    );

    const busyButton = screen.getByRole('button', { name: 'Fighting...' });
    expect(busyButton.hasAttribute('disabled')).toBe(true);
    expect(busyButton.getAttribute('aria-busy')).toBe('true');

    fireEvent.click(busyButton);
    fireEvent.click(busyButton);
    expect(onFight).toHaveBeenCalledTimes(1);
  });

  it('chapter switcher calls onSelectChapter(2)', () => {
    const onSelectChapter = vi.fn();
    const state = makeState({
      chapter: 2,
      clearedChapters: [1],
    });

    render(
      <BossGatePanel
        state={state}
        chapter={1}
        nowS={1000}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={onSelectChapter}
      />,
    );

    const chapter2Btn = screen.getByRole('button', { name: 'Chapter 2' });
    fireEvent.click(chapter2Btn);
    expect(onSelectChapter).toHaveBeenCalledWith(2);

    // Current chapter 1 button has aria-current="true"
    const chapter1Btn = screen.getByRole('button', { name: 'Chapter 1' });
    expect(chapter1Btn.getAttribute('aria-current')).toBe('true');
  });

  it('the live region text changes when the kind changes but not between two cooldown seconds', () => {
    const stateCooldown = makeState({ cooldownUntil: 1042 });
    const { container, rerender } = render(
      <BossGatePanel
        state={stateCooldown}
        chapter={1}
        nowS={1000}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    const liveRegion = container.querySelector('[aria-live="polite"]')!;
    expect(liveRegion).toBeTruthy();
    const textSecond1 = liveRegion.textContent;

    // Rerender at nowS = 1001 (secondsLeft changes from 42 to 41)
    rerender(
      <BossGatePanel
        state={stateCooldown}
        chapter={1}
        nowS={1001}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    const textSecond2 = liveRegion.textContent;
    // Live region text must NOT change between two cooldown seconds
    expect(textSecond2).toBe(textSecond1);

    // Visible text DOES change
    expect(screen.getByText('Catnap: 0:41')).toBeTruthy();

    // Rerender when cooldown finishes and status becomes ready
    rerender(
      <BossGatePanel
        state={stateCooldown}
        chapter={1}
        nowS={1050}
        busy={false}
        onFight={vi.fn()}
        onSelectChapter={vi.fn()}
      />,
    );

    const textReady = liveRegion.textContent;
    // Live region text DOES change when kind changes
    expect(textReady).not.toBe(textSecond1);
  });
});
