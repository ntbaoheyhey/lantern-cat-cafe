// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { v2 } from '@taskbar-hero/game-rules';
import * as reducedMotionModule from '../../motion/reducedMotion';
import { HudBar } from '../hud/HudBar';
import { ProgressChip } from '../hud/ProgressChip';
import { StacksBar } from '../hud/StacksBar';
import { BossGatePanel } from '../boss/BossGatePanel';
import { bossGateStatus } from '../boss/bossGate';
import { sampleServerStateV2 } from './fixtures';
import {
  bossGateCooldownProps,
  bossGateGatedProps,
  bossGateNoKeyProps,
  bossGateNotReachedProps,
  bossGateReadyProps,
  bossGateRematchProps,
  createBossGateProps,
  createHudServerState,
  hudGatedState,
  hudMaxKeysState,
  hudNormalState,
  hudZeroCurrenciesState,
} from './hudBossFixtures';

describe('A25a / V27f Accessibility Prep: HUD + Boss Gate States', () => {
  beforeEach(() => {
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('test 1: HudBar + BossGatePanel together - tab order reaches only real controls, no tabIndex > 0, icons aria-hidden, every button named', () => {
    const { container } = render(
      <div>
        <HudBar state={hudNormalState} power={1200} />
        <BossGatePanel {...bossGateReadyProps} />
      </div>,
    );

    // Tab order reaches only real interactive controls
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusable.length).toBeGreaterThan(0);
    focusable.forEach((el) => {
      expect(['button', 'input', 'select', 'textarea', 'a']).toContain(el.tagName.toLowerCase());
    });

    // No element has positive tabIndex
    const elementsWithTabIndex = container.querySelectorAll<HTMLElement>('[tabindex]');
    elementsWithTabIndex.forEach((el) => {
      expect(el.tabIndex).toBeLessThanOrEqual(0);
    });

    // All decorative icons in HudBar are aria-hidden
    const hudSvgs = container.querySelectorAll('.hud-bar svg');
    expect(hudSvgs.length).toBeGreaterThan(0);
    hudSvgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });

    // Boss portrait has role="img" and accessible name
    const portraitSvg = container.querySelector('.boss-portrait-svg');
    if (portraitSvg) {
      expect(portraitSvg.getAttribute('role')).toBe('img');
      expect(portraitSvg.getAttribute('aria-label')).toBeTruthy();
    }

    // Every button has an accessible name
    const buttons = container.querySelectorAll<HTMLButtonElement>('button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((btn) => {
      const accessibleName = btn.getAttribute('aria-label') || btn.textContent?.trim();
      expect(accessibleName).toBeTruthy();
    });
  });

  it('test 2: per gate state (gated, no key, cooldown, not reached, rematch, ready) - disabled Fight has a non-empty reason via aria-describedby; ready = enabled, no stale describedby', () => {
    const disabledStates = [
      { name: 'gated', props: bossGateGatedProps, expectedSnippet: 'power' },
      { name: 'no key', props: bossGateNoKeyProps, expectedSnippet: 'Cat Key' },
      { name: 'cooldown', props: bossGateCooldownProps, expectedSnippet: 'Catnap:' },
      { name: 'not reached', props: bossGateNotReachedProps, expectedSnippet: 'boss' },
    ];

    for (const { name, props, expectedSnippet } of disabledStates) {
      const { unmount } = render(<BossGatePanel {...props} />);
      const fightBtn = screen.getByRole('button', { name: /fight/i });

      expect(fightBtn.hasAttribute('disabled'), `${name} button should be disabled`).toBe(true);

      const describedById = fightBtn.getAttribute('aria-describedby');
      expect(describedById, `${name} should have aria-describedby`).toBeTruthy();

      const reasonEl = document.getElementById(describedById!);
      expect(reasonEl, `${name} reason element should exist in DOM`).toBeTruthy();
      expect(reasonEl?.textContent?.trim().length).toBeGreaterThan(0);
      expect(reasonEl?.textContent).toContain(expectedSnippet);

      unmount();
    }

    // Rematch ready state: enabled, button text Rematch, no stale describedby
    {
      const { unmount } = render(<BossGatePanel {...bossGateRematchProps} />);
      const rematchBtn = screen.getByRole('button', { name: /rematch/i });
      expect(rematchBtn.hasAttribute('disabled')).toBe(false);
      expect(rematchBtn.getAttribute('aria-describedby')).toBeNull();
      unmount();
    }

    // Ready (first clear) state: enabled, button text Fight, no stale describedby
    {
      const { unmount } = render(<BossGatePanel {...bossGateReadyProps} />);
      const fightBtn = screen.getByRole('button', { name: /fight/i });
      expect(fightBtn.hasAttribute('disabled')).toBe(false);
      expect(fightBtn.getAttribute('aria-describedby')).toBeNull();
      unmount();
    }
  });

  it('test 3: cooldown at nowMs = cooldownUntil*1000 - 61000 and - 1000 announced through one polite live region/status per render (no duplicates across HUD + panel)', () => {
    const cooldownUntil = 1000;
    const cooldownState = sampleServerStateV2({
      chapter: 1,
      round: 10,
      kills: 10,
      keys: 1,
      cooldownUntil,
    });

    // 1. Check at nowMs = cooldownUntil * 1000 - 61000 (nowS = 939 -> 61s remaining -> 1:01)
    const nowMs61 = cooldownUntil * 1000 - 61000;
    const nowS61 = nowMs61 / 1000;
    {
      const { container, unmount } = render(
        <div>
          <HudBar state={cooldownState} power={1200} />
          <BossGatePanel
            state={cooldownState}
            chapter={1}
            nowS={nowS61}
            busy={false}
            onFight={vi.fn()}
            onSelectChapter={vi.fn()}
          />
        </div>,
      );

      // Verify visible countdown format m:ss (61s -> 1:01)
      const countdownText = container.querySelector('.boss-gate-status-text');
      expect(countdownText?.textContent).toBe('Catnap: 1:01');

      // Exactly one polite live region or status announcement across HUD + panel
      const politeLive = container.querySelectorAll('[aria-live="polite"], [role="status"]');
      expect(politeLive.length).toBe(1);
      expect(politeLive[0]?.textContent).toBe('Catnap cooldown');

      unmount();
    }

    // 2. Check at nowMs = cooldownUntil * 1000 - 1000 (nowS = 999 -> 1s remaining -> 0:01)
    const nowMs1 = cooldownUntil * 1000 - 1000;
    const nowS1 = nowMs1 / 1000;
    {
      const { container, unmount } = render(
        <div>
          <HudBar state={cooldownState} power={1200} />
          <BossGatePanel
            state={cooldownState}
            chapter={1}
            nowS={nowS1}
            busy={false}
            onFight={vi.fn()}
            onSelectChapter={vi.fn()}
          />
        </div>,
      );

      const countdownText = container.querySelector('.boss-gate-status-text');
      expect(countdownText?.textContent).toBe('Catnap: 0:01');

      const politeLive = container.querySelectorAll('[aria-live="polite"], [role="status"]');
      expect(politeLive.length).toBe(1);
      expect(politeLive[0]?.textContent).toBe('Catnap cooldown');

      unmount();
    }
  });

  it('test 4: PowerChip gated hint and panel gated reason do not use role="alert" (assert roles)', () => {
    const { container } = render(
      <div>
        <HudBar state={hudGatedState} power={1200} />
        <BossGatePanel {...bossGateGatedProps} />
      </div>,
    );

    // Assert no role="alert" in either component
    const alerts = container.querySelectorAll('[role="alert"]');
    expect(alerts.length).toBe(0);
    expect(screen.queryByRole('alert')).toBeNull();

    // PowerChip uses role="status"
    const powerHint = container.querySelector('.hud-power-hint');
    expect(powerHint).toBeTruthy();
    expect(powerHint?.getAttribute('role')).toBe('status');

    // BossGatePanel uses polite aria-live, not assertive/alert
    const bossLive = container.querySelector('.boss-gate-live');
    expect(bossLive).toBeTruthy();
    expect(bossLive?.getAttribute('aria-live')).toBe('polite');
    expect(bossLive?.getAttribute('role')).toBeNull();
  });

  it('test 5: reduced motion (spy usePrefersReducedMotion -> true): no animation/transition class or inline transition', () => {
    vi.spyOn(reducedMotionModule, 'usePrefersReducedMotion').mockReturnValue(true);

    const { container } = render(
      <div>
        <HudBar state={hudNormalState} power={1200} />
        <BossGatePanel {...bossGateReadyProps} />
      </div>,
    );

    // LevelXpBar fill has reduced-motion class and inline transition: none
    const fill = container.querySelector('.hud-xp-fill') as HTMLElement;
    expect(fill).toBeTruthy();
    expect(fill.classList.contains('hud-xp-fill--animated')).toBe(false);
    expect(fill.classList.contains('hud-xp-fill--reduced-motion')).toBe(true);
    expect(fill.style.transition).toBe('none');

    // No element in either component has an active transition class or animated inline transition
    const animatedElements = container.querySelectorAll<HTMLElement>('.hud-xp-fill--animated');
    expect(animatedElements.length).toBe(0);
  });

  it('test 6: progress chip name contains "Chapter", "round", "of"; keys read "of 5" with 5 from v2.MATERIALS catKey maxStack (never the literal)', () => {
    // 1. Progress chip accessible name
    render(
      <ProgressChip chapter={2} round={4} kills={3} killsPerRound={10} />,
    );
    const progressGroup = screen.getByRole('group');
    const accessibleName = progressGroup.getAttribute('aria-label') ?? '';

    expect(accessibleName).toContain('Chapter');
    expect(accessibleName).toContain('round');
    expect(accessibleName).toContain('of');

    cleanup();

    // 2. Keys read "of 5" from v2.MATERIALS catKey maxStack
    const catKeyDef = v2.MATERIALS.find((m) => m.id === 'catKey');
    expect(catKeyDef).toBeDefined();
    const dynamicMaxKeys = catKeyDef!.maxStack;
    expect(dynamicMaxKeys).toBeGreaterThan(0);

    render(<StacksBar fish={100} yarn={20} keys={3} />);
    const keysItem = screen.getByRole('listitem', { name: new RegExp(`Cat Keys 3 of ${dynamicMaxKeys}`) });
    expect(keysItem).toBeTruthy();
    expect(keysItem.getAttribute('aria-label')).toBe(`Cat Keys 3 of ${dynamicMaxKeys}`);
    expect(keysItem.textContent).toContain(`3/${dynamicMaxKeys}`);
  });

  it('test 7: every fixture builder type-checks against the props and differs in its defining field', () => {
    // HUD fixtures test
    expect(hudNormalState.progress.gated).toBe(false);
    expect(hudNormalState.currencies.keys).toBe(1);

    expect(hudGatedState.progress.gated).toBe(true);
    expect(hudGatedState.progress.neededPower).toBe(1500);

    expect(hudMaxKeysState.currencies.keys).toBe(5);

    expect(hudZeroCurrenciesState.currencies.fish).toBe(0);
    expect(hudZeroCurrenciesState.currencies.yarn).toBe(0);
    expect(hudZeroCurrenciesState.currencies.keys).toBe(0);

    const customHud = createHudServerState({ level: 99 });
    expect(customHud.cat.level).toBe(99);

    // BossGate fixtures status tests
    const gatedStatus = bossGateStatus(
      bossGateGatedProps.state,
      bossGateGatedProps.chapter,
      bossGateGatedProps.nowS,
    );
    expect(gatedStatus.kind).toBe('gated');

    const noKeyStatus = bossGateStatus(
      bossGateNoKeyProps.state,
      bossGateNoKeyProps.chapter,
      bossGateNoKeyProps.nowS,
    );
    expect(noKeyStatus.kind).toBe('no_key');

    const cooldownStatus = bossGateStatus(
      bossGateCooldownProps.state,
      bossGateCooldownProps.chapter,
      bossGateCooldownProps.nowS,
    );
    expect(cooldownStatus.kind).toBe('cooldown');

    const notReachedStatus = bossGateStatus(
      bossGateNotReachedProps.state,
      bossGateNotReachedProps.chapter,
      bossGateNotReachedProps.nowS,
    );
    expect(notReachedStatus.kind).toBe('not_reached');

    const rematchStatus = bossGateStatus(
      bossGateRematchProps.state,
      bossGateRematchProps.chapter,
      bossGateRematchProps.nowS,
    );
    expect(rematchStatus.kind).toBe('ready');
    if (rematchStatus.kind === 'ready') {
      expect(rematchStatus.rematch).toBe(true);
    }

    const readyStatus = bossGateStatus(
      bossGateReadyProps.state,
      bossGateReadyProps.chapter,
      bossGateReadyProps.nowS,
    );
    expect(readyStatus.kind).toBe('ready');
    if (readyStatus.kind === 'ready') {
      expect(readyStatus.rematch).toBe(false);
    }

    // createBossGateProps builder test
    const customGated = createBossGateProps('gated', { busy: true });
    expect(customGated.busy).toBe(true);
    expect(
      bossGateStatus(customGated.state, customGated.chapter, customGated.nowS).kind,
    ).toBe('gated');
  });
});
