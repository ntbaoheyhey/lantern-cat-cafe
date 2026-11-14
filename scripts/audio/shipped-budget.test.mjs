import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {shippedAudioBytes, withinAudioBudget} from './shipped-budget.mjs';

test('decimal 16 MB boundary accepts exactly the budget and rejects one extra byte', () => {
  assert.equal(withinAudioBudget(16_000_000), true);
  assert.equal(withinAudioBudget(16_000_001), false);
  assert.equal(withinAudioBudget(16_380_501), false);
  assert.equal(withinAudioBudget(16 * 1024 * 1024), false);
});

test('both fallback formats and nested audio count; metadata does not', () => {
  const dir = mkdtempSync(join(tmpdir(), 'v3-audio-budget-'));
  try {
    mkdirSync(join(dir, 'voices'));
    writeFileSync(join(dir, 'score.webm'), Buffer.alloc(12));
    writeFileSync(join(dir, 'score.mp3'), Buffer.alloc(18));
    writeFileSync(join(dir, 'voices', 'cat.WAV'), Buffer.alloc(7));
    writeFileSync(join(dir, 'manifest.json'), '{}');
    assert.equal(shippedAudioBytes(dir), 37);
  } finally { rmSync(dir, {recursive: true}); }
});
