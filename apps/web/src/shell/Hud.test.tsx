// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Hud } from './Hud';
import { sampleServerStateV2 } from '../layout/a11y/fixtures';

afterEach(cleanup);

vi.mock('../wallet/WalletButton', () => ({
  WalletButton: () => <button data-testid="wallet-btn-mock">Wallet</button>,
}));

describe('Hud component', () => {
  it('renders root hud and all contract chips', () => {
    const state = sampleServerStateV2({ level: 14, keys: 3 });
    state.currencies.fish = 4250;
    state.currencies.yarn = 120;

    render(
      <Hud
        state={state}
        power={942}
        hintText="Equip better gear"
        onHintAction={vi.fn()}
      />
    );

    expect(screen.getByTestId('hud')).toBeTruthy();
    expect(screen.getByTestId('hud-gold')).toBeTruthy();
    expect(screen.getByTestId('hud-shards')).toBeTruthy();
    expect(screen.getByTestId('hud-keys')).toBeTruthy();
    expect(screen.getByTestId('hud-level')).toBeTruthy();
    expect(screen.getByTestId('hud-power')).toBeTruthy();
    expect(screen.getByTestId('hud-wallet')).toBeTruthy();
  });

  it('renders live values without hard-coding (T3)', () => {
    const state = sampleServerStateV2({ level: 27, keys: 4 });
    state.currencies.fish = 9876;
    state.currencies.yarn = 543;

    render(
      <Hud
        state={state}
        power={1850}
        hintText="Defeat chapter boss"
      />
    );

    expect(screen.getByTestId('hud-gold').textContent).toContain('9,876');
    expect(screen.getByTestId('hud-shards').textContent).toContain('543');
    expect(screen.getByTestId('hud-keys').textContent).toContain('4/5');
    expect(screen.getByTestId('hud-level').textContent).toContain('Lv 27');
    expect(screen.getByTestId('hud-power').textContent).toContain('1,850');
    expect(screen.getByTestId('next-hint').textContent).toContain('Defeat chapter boss');
  });

  it('triggers onHintAction when next-hint is clicked', () => {
    const onHintAction = vi.fn();
    const state = sampleServerStateV2();

    render(
      <Hud
        state={state}
        power={100}
        hintText="Equip best (+3)"
        onHintAction={onHintAction}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Equip best/ }));
    expect(onHintAction).toHaveBeenCalledTimes(1);
  });
});
