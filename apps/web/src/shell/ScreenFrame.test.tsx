// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScreenFrame } from './ScreenFrame';
import { sampleServerStateV2 } from '../layout/a11y/fixtures';

afterEach(cleanup);

vi.mock('../wallet/WalletButton', () => ({
  WalletButton: () => <button data-testid="wallet-btn-mock">Wallet</button>,
}));

describe('ScreenFrame component', () => {
  it('renders content root data-testid="screen"', () => {
    render(
      <ScreenFrame activeScreen="home" onSelectScreen={vi.fn()}>
        <div data-testid="inner-content">Content</div>
      </ScreenFrame>
    );

    expect(screen.getByTestId('screen')).toBeTruthy();
    expect(screen.getByTestId('inner-content')).toBeTruthy();
  });

  it('renders rail and hud on home, bag, map, forge, market, hero, help', () => {
    const state = sampleServerStateV2();
    render(
      <ScreenFrame
        activeScreen="home"
        onSelectScreen={vi.fn()}
        hudProps={{ state, power: 100 }}
      >
        <div>Content</div>
      </ScreenFrame>
    );

    expect(screen.getByTestId('rail')).toBeTruthy();
    expect(screen.getByTestId('hud')).toBeTruthy();
  });

  it('landing and class screens have NO rail (T4)', () => {
    const state = sampleServerStateV2();

    const { rerender } = render(
      <ScreenFrame
        activeScreen="landing"
        onSelectScreen={vi.fn()}
        hudProps={{ state, power: 100 }}
      >
        <div>Landing Page</div>
      </ScreenFrame>
    );

    expect(screen.queryByTestId('rail')).toBeNull();
    expect(screen.queryByTestId('hud')).toBeNull();

    rerender(
      <ScreenFrame
        activeScreen="class"
        onSelectScreen={vi.fn()}
        hudProps={{ state, power: 100 }}
      >
        <div>Class Picker</div>
      </ScreenFrame>
    );

    expect(screen.queryByTestId('rail')).toBeNull();
    expect(screen.queryByTestId('hud')).toBeNull();
  });

  it('supports showRail override', () => {
    render(
      <ScreenFrame
        activeScreen="home"
        onSelectScreen={vi.fn()}
        showRail={false}
      >
        <div>Content</div>
      </ScreenFrame>
    );

    expect(screen.queryByTestId('rail')).toBeNull();
  });
});
