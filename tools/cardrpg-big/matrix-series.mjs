import { spawn } from 'node:child_process';
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import assert from 'node:assert/strict';

const output = resolve(process.env.BIG_SKILL_OUT || 'reports/cardrpg-big/invitations/skills');
const artifact = resolve(process.env.BIG_ARTIFACT || 'docs/cardrpg3/index.html');
const label = process.env.BIG_MATRIX_LABEL || 'A-skill-matrix';
const resume = process.argv.includes('--resume');
const configurations = [
  [1280, 720, 1, 1, 'medium'], [1280, 720, 2, 1, 'medium'],
  [1440, 900, 1, 1, 'medium'], [1440, 900, 2, 1, 'medium'],
  [1280, 720, 1, 4, 'medium'], [1280, 720, 2, 4, 'medium'],
  [1440, 900, 1, 4, 'medium'], [1440, 900, 2, 4, 'medium'],
  [1280, 720, 1, 1, 'low'], [2560, 1440, 1, 1, 'medium'],
];
const lock = fileURLToPath(new URL('./with-timing-lock.mjs', import.meta.url));
const measure = fileURLToPath(new URL('./skill-measure.mjs', import.meta.url));
const report = fileURLToPath(new URL('./skill-report.mjs', import.meta.url));

async function run(args, environment = {}) {
  const exit = await new Promise((resolveExit, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: 'inherit', env: { ...process.env, ...environment },
    });
    child.once('error', reject);
    child.once('close', resolveExit);
  });
  assert.equal(exit, 0, `Matrix command failed with exit ${exit}`);
}

if (process.argv.includes('--plan')) {
  console.log(JSON.stringify({ artifact, output, label, configurations, lock }, null, 2));
} else {
  assert(!process.env.BIG_SKILL_IDS && !process.env.BIG_SKILL_LIMIT,
    'The full series requires every gallery action');
  const sha256 = createHash('sha256').update(await readFile(artifact)).digest('hex');
  const combined = { artifact, sha256, started: new Date().toISOString(), rows: [], actions: [] };
  await mkdir(output, { recursive: true });

  for (const configuration of configurations) {
    const key = configuration.join('-');
    const directory = resolve(output, 'configurations', key);
    let completed = false;
    if (resume) {
      try {
        const saved = JSON.parse(await readFile(`${directory}/summary.json`, 'utf8'));
        assert(saved.ended, `Existing configuration ${key} is incomplete. Preserve and inspect it before rerunning.`);
        assert.equal(saved.sha256, sha256, 'A resumed configuration used a different artifact');
        completed = true;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }
    if (!completed) {
      await run([lock, `${label}-${key}`, process.execPath, measure], {
        BIG_ARTIFACT: artifact,
        BIG_SKILL_OUT: directory,
        BIG_SKILL_CONFIGS: JSON.stringify([configuration]),
      });
    }
    const receipt = JSON.parse(await readFile(`${directory}/summary.json`, 'utf8'));
    assert.equal(receipt.sha256, sha256, 'A configuration used a different artifact');
    assert(receipt.ended && receipt.actions.length > 0, 'Configuration receipt is incomplete');
    assert.equal(receipt.rows.length, receipt.actions.length, 'Every gallery action is required');
    assert.deepEqual(receipt.rows.map(row => row.action.id).sort(),
      receipt.actions.map(action => action.id).sort(), 'Gallery coverage differs');
    assert(receipt.rows.every(row => row.errors.length === 0), 'A measured page reported errors');
    if (combined.actions.length) assert.deepEqual(receipt.actions, combined.actions);
    else combined.actions = receipt.actions;
    for (const name of await readdir(directory)) {
      if (name !== 'summary.json') await rename(resolve(directory, name), resolve(output, name));
    }
    receipt.rawDirectory = '../..';
    await writeFile(`${directory}/summary.json`, JSON.stringify(receipt, null, 2));
    combined.rows.push(...receipt.rows);
    await writeFile(`${output}/summary.json`, JSON.stringify(combined, null, 2));
    console.log(JSON.stringify({ configuration, completed: combined.rows.length, sha256 }));
    // Let an existing waiter take the shared timing lock between configurations.
    await delay(6500);
  }
  assert.equal(new Set(combined.rows.map(row => row.name)).size, combined.rows.length);
  combined.ended = new Date().toISOString();
  await writeFile(`${output}/summary.json`, JSON.stringify(combined, null, 2));
  await run([report, output]);
  const ranked = JSON.parse(await readFile(`${output}/ranked.json`, 'utf8'));
  assert(ranked.complete && ranked.errors.length === 0, 'Full matrix coverage failed');
}
