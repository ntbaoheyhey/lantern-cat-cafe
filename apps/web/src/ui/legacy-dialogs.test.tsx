import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { HowToPlay } from '../onboarding/HowToPlay';
import { resetHelpForTests } from '../onboarding/helpStore';
import { ChestReveal } from '../layout/loot/ChestReveal';
import { WelcomeBack } from '../layout/loot/WelcomeBack';
import type { GainsV2, LootV2 } from '../api/GameApiV2';

const loot: LootV2 = { fish: 3, yarn: 2, keys: 0, materials: {}, items: [], autoSalvaged: [] };
const gains: GainsV2 = { ...loot, xp: 4, levelsGained: 0 };
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); });

it('all migrated dialogs share one stack; Escape closes only the top and restores access in order', () => {
  vi.useFakeTimers();
  localStorage.removeItem('taskbar-hero.howToPlaySeen'); act(() => resetHelpForTests());
  const page = document.createElement('button'); page.textContent = 'Page'; document.body.append(page); page.focus();
  const chestDone = vi.fn(), welcomeDone = vi.fn();
  function Stack() {
    const [welcome, setWelcome] = useState(true), [chest, setChest] = useState(true);
    return <><HowToPlay />
      {welcome && <WelcomeBack gains={gains} awaySeconds={3600} onClose={() => { welcomeDone(); setWelcome(false); }} />}
      {chest && <ChestReveal chest={loot} firstClear={false} onDone={() => { chestDone(); setChest(false); }} />}
    </>;
  }
  const view = render(<Stack />);
  try {
    expect(screen.getAllByRole('dialog', { hidden: true })).toHaveLength(3);
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'Boss chest' }).closest('.ui-modal-backdrop')).not.toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Skip' }));
    expect(page.hasAttribute('inert')).toBe(true);
    page.focus(); expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
    fireEvent.click(document.querySelectorAll('.loot-backdrop')[1]!);
    expect(chestDone).not.toHaveBeenCalled();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(chestDone).toHaveBeenCalledTimes(1); expect(welcomeDone).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'OK' }));
    expect(page.hasAttribute('inert')).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(welcomeDone).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog', { name: 'How to play' }).contains(document.activeElement)).toBe(true);
    expect(page.hasAttribute('inert')).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(page.hasAttribute('inert')).toBe(false); expect(page.hasAttribute('aria-hidden')).toBe(false);
    expect(document.activeElement).toBe(page);
    act(() => vi.advanceTimersByTime(5000)); expect(chestDone).toHaveBeenCalledTimes(1);
  } finally { view.unmount(); page.remove(); }
});

it('hiding an older loot dialog keeps the newer one active and preserves original background attributes', () => {
  const page = document.createElement('button'); document.body.append(page); page.focus();
  const prior = document.createElement('div'); prior.setAttribute('inert', ''); prior.setAttribute('aria-hidden', 'true'); document.body.append(prior);
  const view = (welcome: boolean, chest: boolean) => <>
    {welcome && <WelcomeBack gains={gains} awaySeconds={3600} onClose={() => {}} />}
    {chest && <ChestReveal chest={loot} firstClear onDone={() => {}} />}
  </>;
  const mounted = render(view(true, false));
  try {
    mounted.rerender(view(true, true)); mounted.rerender(view(false, true));
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByRole('dialog', { name: 'First clear chest!' }).contains(document.activeElement)).toBe(true);
    expect(page.hasAttribute('inert')).toBe(true);
    mounted.rerender(view(false, false));
    expect(document.activeElement).toBe(page); expect(page.hasAttribute('inert')).toBe(false);
    expect(prior.hasAttribute('inert')).toBe(true); expect(prior.getAttribute('aria-hidden')).toBe('true');
  } finally { mounted.unmount(); page.remove(); prior.remove(); }
});
