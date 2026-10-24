import { describe, expect, it } from 'vitest';
import { V2_CONFIG } from './config';

describe('V2_CONFIG boss keys', () => {
  it('boss keyCost and lossCooldownSeconds match the approved docs', () => {
    expect(V2_CONFIG.boss.keyCost).toBe(1);
    expect(V2_CONFIG.boss.lossCooldownSeconds).toBe(60);
  });
});
