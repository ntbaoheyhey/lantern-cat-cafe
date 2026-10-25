// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CONFIG } from '@taskbar-hero/game-rules';
import type { GainsV2 } from '../../api/GameApiV2';
import { WelcomeBack } from './WelcomeBack';

const EMPTY_GAINS: GainsV2 = {
  fish: 0,
  yarn: 0,
  keys: 0,
  materials: {},
  items: [],
  autoSalvaged: [],
  xp: 0,
  levelsGained: 0,
};

const VALID_GAINS: GainsV2 = {
  fish: 250,
  yarn: 10,
  keys: 0,
  materials: { fluffTuft: 2 },
  items: [],
  autoSalvaged: [],
  xp: 150,
  levelsGained: 0,
};

describe('WelcomeBack', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when awaySeconds is under 300 (e.g. 120)', () => {
    const onClose = vi.fn();
    const { container } = render(
      <WelcomeBack gains={VALID_GAINS} awaySeconds={120} onClose={onClose} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for empty gains', () => {
    const onClose = vi.fn();
    const { container } = render(
      <WelcomeBack gains={EMPTY_GAINS} awaySeconds={3600} onClose={onClose} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('formats duration as "2 h 15 min" for 8100 s', () => {
    const onClose = vi.fn();
    render(<WelcomeBack gains={VALID_GAINS} awaySeconds={8100} onClose={onClose} />);

    expect(
      screen.getByText('Your cat kept going for 2 h 15 min.'),
    ).toBeTruthy();
    expect(screen.getByText('Welcome back!')).toBeTruthy();
    expect(screen.getByText('+250 Fish')).toBeTruthy();
  });

  it('formats duration with cap text at offlineCapSeconds + 1', () => {
    const onClose = vi.fn();
    const capSeconds = CONFIG.idle.offlineCapSeconds;
    const capHours = Math.round(capSeconds / 3600);

    render(
      <WelcomeBack
        gains={VALID_GAINS}
        awaySeconds={capSeconds + 1}
        onClose={onClose}
      />,
    );

    expect(
      screen.getByText(
        `Your cat kept going for ${capHours} h (the most a claim counts).`,
      ),
    ).toBeTruthy();
  });

  it('formats duration as "N min" when under 1 hour', () => {
    const onClose = vi.fn();
    render(<WelcomeBack gains={VALID_GAINS} awaySeconds={600} onClose={onClose} />);

    expect(screen.getByText('Your cat kept going for 10 min.')).toBeTruthy();
  });

  it('calls onClose when OK is clicked and when Escape is pressed', () => {
    const onCloseClick = vi.fn();
    render(<WelcomeBack gains={VALID_GAINS} awaySeconds={3600} onClose={onCloseClick} />);

    const okButton = screen.getByRole('button', { name: 'OK' });
    fireEvent.click(okButton);
    expect(onCloseClick).toHaveBeenCalledTimes(1);

    cleanup();

    const onCloseEscape = vi.fn();
    render(<WelcomeBack gains={VALID_GAINS} awaySeconds={3600} onClose={onCloseEscape} />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseEscape).toHaveBeenCalledTimes(1);
  });
});
