// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { App } from './App';

it('renders a 64px strip fixed to the bottom', () => {
  render(<App />);
  const strip = screen.getByText('Taskbar Hero');
  expect(strip.style.position).toBe('fixed');
  expect(strip.style.bottom).toBe('0px');
  expect(strip.style.height).toBe('64px');
});
