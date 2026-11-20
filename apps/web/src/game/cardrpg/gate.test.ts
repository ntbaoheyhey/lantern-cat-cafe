import { expect, it } from 'vitest';
import { gameplayA6 } from './gate';

it('defaults gameplayA6 OFF and requires an explicit a6=1 opt-in', () => {
  expect(gameplayA6()).toBe(false);
  expect(gameplayA6('')).toBe(false);
  expect(gameplayA6('?cardrpg2=1&ui=v3')).toBe(false);
  expect(gameplayA6('?a6=0')).toBe(false);
  expect(gameplayA6('?a6=true')).toBe(false);
  expect(gameplayA6('?a6=1')).toBe(true);
});
