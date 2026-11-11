import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {retainedDecode} from './local-source-state.mjs';

test('export timeout retains the raw decode before considering another inference', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cardrpg-v5full-source-state-'));
  try {
    await writeFile(join(dir, 'clover.raw.npz'), 'retained raw checkpoint');
    await writeFile(join(dir, 'clover.decoded.npz'), 'simplified checkpoint');
    assert.equal(await retainedDecode(dir, 'clover', {status:'INTERRUPTED'}), join(dir, 'clover.raw.npz'));
    assert.equal(await retainedDecode(dir, 'clover', {status:'GENERATED_NOT_REVIEWED'}), null);
  } finally { await rm(dir, {recursive:true}); }
});

test('a failed sampler without a usable checkpoint remains eligible for bounded retry', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'cardrpg-v5full-source-state-'));
  try {
    assert.equal(await retainedDecode(dir, 'clover', {status:'FAILED'}), null);
    await writeFile(join(dir, 'clover.raw.npz'), '');
    assert.equal(await retainedDecode(dir, 'clover', {status:'FAILED'}), null);
    await writeFile(join(dir, 'clover.decoded.npz'), 'older decoded checkpoint');
    assert.equal(await retainedDecode(dir, 'clover', {status:'FAILED'}), join(dir, 'clover.decoded.npz'));
  } finally { await rm(dir, {recursive:true}); }
});
