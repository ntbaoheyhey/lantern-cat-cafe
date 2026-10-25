// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PowerChip } from './PowerChip';

describe('PowerChip', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders power formatted amount', () => {
    render(<PowerChip power={1234} gated={false} neededPower={0} />);

    expect(screen.getByText('Power 1,234')).toBeTruthy();
  });

  it('gated true -> hint text with formatted neededPower and role="status"', () => {
    render(<PowerChip power={800} gated={true} neededPower={1500} />);

    expect(screen.getByText('Power 800')).toBeTruthy();

    const hint = screen.getByRole('status');
    expect(hint).toBeTruthy();
    expect(hint.textContent).toBe('Needs about 1,500 power: upgrade your weapon');
    expect(screen.getByText('Needs about 1,500 power: upgrade your weapon')).toBeTruthy();
  });

  it('gated false -> no hint in the DOM (queryByText and queryByRole return null)', () => {
    render(<PowerChip power={1234} gated={false} neededPower={1500} />);

    expect(screen.getByText('Power 1,234')).toBeTruthy();
    expect(screen.queryByText(/Needs about/)).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
