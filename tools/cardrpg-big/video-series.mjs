// REFERENCE: reports/cardrpg-big/memory/PROMPT.md F7; video-capture.mjs
import { spawn } from 'node:child_process';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';

const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const output = resolve(process.env.BIG_VIDEO_OUT || 'reports/cardrpg-big/video/integrated');
const names = ['mochi', 'soot', 'clover', 'panko', 'mallow', 'sorrel', 'biscuit',
  'inkcap', 'cinnamon', 'brioche', 'velvet', 'marigold', 'clover-ultimate', 'boss'];
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sha256 = hash(await readFile(artifact));
if (process.argv.includes('--plan')) {
  console.log(JSON.stringify({ artifact, sha256, output, names, handoffMs: 7000 }, null, 2));
} else {
  await mkdir(output, { recursive: true });
  const completed = [];
  for (const name of names) {
    assert.equal(hash(await readFile(artifact)), sha256, 'The video series artifact changed');
    const exit = await new Promise((done, reject) => {
      const child = spawn(process.execPath, ['tools/cardrpg-big/with-timing-lock.mjs',
        `integrated-video-${name}`, process.execPath, 'tools/cardrpg-big/video-capture.mjs'], {
        stdio: 'inherit', env: { ...process.env, BIG_ARTIFACT: artifact,
          BIG_VIDEO_OUT: output, BIG_VIDEO_NAMES: name, BIG_VIDEO_RESUME: '1' },
      });
      child.once('error', reject);
      child.once('close', done);
    });
    assert.equal(exit, 0, `${name} recording failed; retain its log before retrying`);
    assert.equal(hash(await readFile(artifact)), sha256, 'The video series artifact changed');
    const receipt = JSON.parse(await readFile(`${output}/captures.json`, 'utf8'));
    assert.equal(receipt.sha256, sha256);
    const clip = receipt.rows.find(row => row.name === name);
    assert(clip, `Missing ${name} recording receipt`);
    assert.deepEqual(clip.errors, []);
    assert.equal(hash(await readFile(resolve(clip.path))), clip.sha256);
    completed.push(name);
    await writeFile(`${output}/series.json`, JSON.stringify({ artifact, sha256,
      expected: names, completed, complete: completed.length === names.length }, null, 2));
    // Each clip releases the shared lock so the other lane can make progress.
    if (completed.length < names.length) await delay(7000);
  }
}
