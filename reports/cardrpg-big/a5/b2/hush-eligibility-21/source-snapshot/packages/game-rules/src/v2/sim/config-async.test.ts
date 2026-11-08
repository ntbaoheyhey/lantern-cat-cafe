import { expect, it } from 'vitest';
import { V2_CONFIG } from '../config';
import { withConfigV2 } from './config';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
};

it('holds overrides and excludes overlapping transactions until async resolution', async () => {
  const before = JSON.stringify(V2_CONFIG);
  const gate = deferred();
  const pending = withConfigV2({ boss: { firstClearKeys: 1 } }, async () => {
    await gate.promise;
    await Promise.resolve();
    expect(V2_CONFIG.boss.firstClearKeys).toBe(1);
    return 'settled';
  });
  expect(V2_CONFIG.boss.firstClearKeys).toBe(1);
  expect(() => withConfigV2({}, () => null)).toThrow('nested');
  gate.resolve();
  expect(await pending).toBe('settled');
  expect(JSON.stringify(V2_CONFIG)).toBe(before);
  expect(withConfigV2({}, () => 'unlocked')).toBe('unlocked');
});

it('restores all overrides and releases the lock after async rejection', async () => {
  const before = JSON.stringify(V2_CONFIG);
  const gate = deferred();
  const failure = new Error('async callback failed');
  const pending = withConfigV2({ boss: { firstClearKeys: 1, chapterHpMul: [14] } }, async () => {
    await gate.promise;
    expect(V2_CONFIG.boss.firstClearKeys).toBe(1);
    expect(V2_CONFIG.boss.chapterHpMul[0]).toBe(14);
    throw failure;
  });
  const rejected = expect(pending).rejects.toBe(failure);
  gate.resolve();
  await rejected;
  expect(JSON.stringify(V2_CONFIG)).toBe(before);
  expect(withConfigV2({}, () => 'unlocked')).toBe('unlocked');
});

it('preserves synchronous return identity and restores if then access throws', () => {
  const value = { answer: 42 };
  expect(withConfigV2({}, () => value)).toBe(value);
  const before = JSON.stringify(V2_CONFIG);
  expect(() => withConfigV2({ boss: { firstClearKeys: 1 } }, () => ({
    get then(): never { throw new Error('bad then'); },
  }))).toThrow('bad then');
  expect(JSON.stringify(V2_CONFIG)).toBe(before);
});

it('assimilates PromiseLike results before restoring', async () => {
  const before = JSON.stringify(V2_CONFIG);
  const value = withConfigV2({ boss: { firstClearKeys: 1 } }, () => ({
    then(resolve: (value: string) => void) {
      expect(V2_CONFIG.boss.firstClearKeys).toBe(1);
      resolve('thenable');
    },
  }));
  expect(await value).toBe('thenable');
  expect(JSON.stringify(V2_CONFIG)).toBe(before);
});
