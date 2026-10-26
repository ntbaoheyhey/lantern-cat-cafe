// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { withConfigV2 } from '../../../../../packages/game-rules/src/v2/sim/config';
import { sampleServerStateV2 } from '../a11y/fixtures';
import { BossGatePanel } from './BossGatePanel';

function renderPanel(keys: number) {
  const base = sampleServerStateV2();
  const state = {
    ...base,
    currencies: { ...base.currencies, keys },
    cooldownUntil: 0,
    progress: { ...base.progress, chapter: 1, round: 10, kills: 6, gated: false },
  } as typeof base;
  return render(
    <BossGatePanel state={state} chapter={1} nowS={1000} busy={false} onFight={vi.fn()} onSelectChapter={vi.fn()} />,
  );
}

const max = v2.MATERIALS.find((m) => m.id === 'catKey')!.maxStack;

describe('BossKeyHint', () => {
  afterEach(cleanup);

  it('no_key shows the key count against the cap', () => {
    renderPanel(0);
    expect(screen.getByTestId('boss-key-hint-count').textContent).toBe(`Cat Keys: 0 / ${max}`);
  });

  it('lists daily and rare-drop sources from config; first-clear hidden by default', () => {
    renderPanel(0);
    const list = screen.getByTestId('boss-key-hint-sources');
    const items = within(list).getAllByRole('listitem');
    expect(items.map((li) => li.getAttribute('data-source'))).toEqual(['daily', 'drop']);
    expect(items[0]!.textContent).toContain(`${v2.V2_CONFIG.idle.dailyKeys} Cat Key`);
    expect(items[1]!.textContent).toContain(`1 in ${Math.round(1 / v2.V2_CONFIG.idle.clearedChapterKeyChance)}`);
    expect(list.textContent).not.toMatch(/First clear/);
  });

  it('shows the first-clear line when boss.firstClearKeys > 0', () => {
    withConfigV2({ boss: { firstClearKeys: 1 } }, () => {
      renderPanel(0);
      const items = within(screen.getByTestId('boss-key-hint-sources')).getAllByRole('listitem');
      expect(items.map((li) => li.getAttribute('data-source'))).toEqual(['daily', 'drop', 'firstClear']);
      expect(items[2]!.textContent).toBe('First clear: a boss chest gives 1 Cat Key.');
    });
  });

  it('is not shown when the player holds a key', () => {
    renderPanel(1);
    expect(screen.queryByTestId('boss-key-hint')).toBeNull();
  });
});
