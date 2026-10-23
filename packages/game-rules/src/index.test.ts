import { describe, expect, it } from 'vitest';
import { GAME_VERSION } from './index';

describe('game-rules', () => {
  it('exposes a version', () => {
    expect(GAME_VERSION).toBe('0.0.0');
  });
});
