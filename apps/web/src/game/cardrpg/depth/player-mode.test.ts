import { describe, expect, it } from 'vitest';
import { showReviewTools } from './player-mode';

describe('Gameplay v4 review tools', () => {
  it('requires an explicit dev=1 on the player path', () => {
    for (const search of ['', '?dev=0', '?dev=true', '?review=1']) expect(showReviewTools(true, search)).toBe(false);
    expect(showReviewTools(true, '?dev=1')).toBe(true);
    expect(showReviewTools(true, '?theme=classic&dev=1')).toBe(true);
  });
  it('requires explicit opt-in in the historical shell too', () => {
    expect(showReviewTools(false, '')).toBe(false);
    expect(showReviewTools(false, '?dev=0')).toBe(false);
    expect(showReviewTools(false, '?dev=1')).toBe(true);
  });
});
