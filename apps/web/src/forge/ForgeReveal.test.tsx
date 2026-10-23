// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ForgeReveal } from './ForgeReveal';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const stage = () => screen.getByTestId('forge-reveal').getAttribute('data-stage');
const show = (onSkip = vi.fn()) => {
  render(<ForgeReveal relicId="3" rarityName="epic" revealMs={1000} onSkip={onSkip} />);
  return onSkip;
};

it('goes charge, flash, rise, banner at fractions of the reveal time', () => {
  show();
  expect(stage()).toBe('charge');
  expect(screen.getByText('Forging…')).toBeTruthy();
  expect(document.querySelector('.relic-tile')).toBeNull();

  act(() => void vi.advanceTimersByTime(370));
  expect(stage()).toBe('flash');

  act(() => void vi.advanceTimersByTime(80));
  expect(stage()).toBe('rise');
  expect(document.querySelector('.relic-tile img')!.getAttribute('src')).toBe('/relics/3.svg');
  expect(document.querySelectorAll('.fz-spark')).toHaveLength(3);

  act(() => void vi.advanceTimersByTime(360));
  expect(stage()).toBe('banner');
  expect(screen.getByText('Moon Collar')).toBeTruthy();
  expect(screen.getByText('Epic')).toBeTruthy();
});

it('the Skip button and Escape each call onSkip', () => {
  const onSkip = show();
  fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
  expect(onSkip).toHaveBeenCalledTimes(1);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onSkip).toHaveBeenCalledTimes(2);
  fireEvent.keyDown(document, { key: 'Enter' });
  expect(onSkip).toHaveBeenCalledTimes(2);
});

it('stops listening for Escape once it is gone', () => {
  const onSkip = show();
  cleanup();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(onSkip).not.toHaveBeenCalled();
});
