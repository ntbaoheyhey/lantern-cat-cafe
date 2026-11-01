// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import { withConfigV2 } from '../../../../packages/game-rules/src/v2/sim/config';
import { HelpTab } from './HelpTab';

describe('HelpTab key sources', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_GAME_V2', '1');
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
  });

  it('lists daily and rare-drop sources from config', () => {
    render(<HelpTab />);
    const items = within(screen.getByTestId('help-key-sources')).getAllByRole('listitem', { hidden: true });
    expect(items.map((li) => li.getAttribute('data-source'))).toEqual(['daily', 'drop']);
    expect(items[0]!.textContent).toContain(`${v2.V2_CONFIG.idle.dailyKeys} Cat Key`);
    expect(items[1]!.textContent).toContain(`1 in ${Math.round(1 / v2.V2_CONFIG.idle.clearedChapterKeyChance)}`);
  });

  it('first-clear line is hidden by default and shown when boss.firstClearKeys > 0', () => {
    const { unmount } = render(<HelpTab />);
    expect(screen.queryByText(/First-clear boss chests also award/)).toBeNull();
    unmount();
    withConfigV2({ boss: { firstClearKeys: 1 } }, () => {
      render(<HelpTab />);
      expect(screen.getByText(/First-clear boss chests also award 1 Cat Key/)).toBeTruthy();
    });
  });
});
