// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { HeroTab } from './HeroTab';
import { LABELS } from './theme/labels';

afterEach(cleanup);

it('renders cat stats using LABELS and preserves data-testid values', () => {
  render(<HeroTab />);

  expect(screen.getByText(LABELS.gold)).toBeTruthy();
  expect(screen.getByText(LABELS.shards)).toBeTruthy();
  expect(screen.getByText(`${LABELS.gold}/sec`)).toBeTruthy();
  expect(screen.getByText(LABELS.power)).toBeTruthy();

  expect(screen.getByTestId('hero-gold')).toBeTruthy();
  expect(screen.getByTestId('hero-shards')).toBeTruthy();
  expect(screen.getByTestId('hero-gps')).toBeTruthy();
  expect(screen.getByTestId('hero-power')).toBeTruthy();
});
