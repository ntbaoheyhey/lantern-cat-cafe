import { chromium } from '../../apps/web/node_modules/@playwright/test/index.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { loadRules } from '../cardrpg-sim/load.mjs';

const out = 'reports/cardrpg-depth/baseline';
await mkdir(out, { recursive: true });
const artifact = await readFile('docs/cardrpg/index.html');
const browser = await chromium.launch({ channel: 'chromium', args: ['--use-angle=metal'] });
const captures = [], errors = [];
try {
  for (const [width, height] of [[1024, 600], [1280, 720], [1440, 900]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(pathToFileURL(resolve('docs/cardrpg/index.html')).href);
    await page.getByRole('heading', { name: 'A small light. A brave little team.' }).waitFor();
    for (const [screen, label] of [['hub', 'Cafe'], ['collection', 'Companions'], ['gacha', 'Invitations'], ['codex', 'Field guide']]) {
      await page.getByRole('button', { name: label, exact: true }).click();
      const path = `${out}/${width}-${screen}.png`;
      const bytes = await page.screenshot({ path });
      captures.push({ width, height, screen, path, sha256: createHash('sha256').update(bytes).digest('hex') });
    }
    await page.getByRole('button', { name: 'Cafe', exact: true }).click();
    await page.getByRole('button', { name: /Prepare patrol/ }).click();
    await page.getByRole('button', { name: /Begin patrol/ }).click();
    await page.waitForFunction(() => window.__turn3dReview?.scene?.ready && window.__turn3dReview.controller.canChoose);
    await page.screenshot({ path: `${out}/${width}-battle.png` });
    await page.close();
  }
} finally { await browser.close(); }

const { rules: R, load, vite } = await loadRules();
const E = await load('packages/game-rules/src/squad/turn/engine.ts');
const { choosePolicyLoot } = await load('packages/game-rules/src/squad/gear/run.ts');
const { Rng } = await load('packages/game-rules/src/rng.ts');
const runs = [];
try {
  for (const policy of ['random', 'auto', 'active']) for (let seed = 1; seed <= 100; seed++) {
    const b = E.createTurnBattle(R.toBattleOptions(R.createStarterAccount(seed), seed));
    const random = new Rng(seed + 10000);
    E.beginRun(b);
    let decisions = 0, choices = 0;
    while (!b.result && b.turn < 650) {
      if (b.run.stage === 'loot') { E.chooseLoot(b, choosePolicyLoot(b, policy === 'active' ? 'active' : 'auto')); continue; }
      if (b.run.stage === 'rest') { E.autoEquipGear(b); E.continueRun(b); continue; }
      E.startTurn(b);
      if (b.phase === 'choose') {
        let action = E.getAutoAction(b, policy === 'active' ? 'active' : 'auto');
        if (b.actors.find(a => a.id === b.activeId)?.side === 'party') {
          const legal = E.getLegalActions(b).filter(a => a.legal);
          choices++;
          if (legal.length > 1) decisions++;
          if (policy === 'random') {
            const skill = legal[random.int(0, legal.length - 1)].skill;
            const targets = E.getLegalTargets(b, skill.id).filter(t => t.legal);
            action = { actorId: b.activeId, skillId: skill.id, targetId: targets[random.int(0, targets.length - 1)].actorId };
          }
        }
        if (!action || !E.chooseAction(b, action)) throw Error('Invalid baseline policy');
        E.resolveAction(b);
      }
      E.endTurn(b);
    }
    runs.push({ seed, policy, decisions, choices, ...b.result });
  }
  const census = {
    cats: R.CARDS.length, distinctKits: new Set(R.CARDS.map(c => c.skills.map(s => s.id).join(','))).size,
    skills: new Set(R.CARDS.flatMap(c => c.skills.map(s => s.id))).size,
    enemiesDesigned: R.ENEMIES.length, enemiesPlayable: R.ENEMIES.filter(e => e.implemented).length,
    items: R.ITEMS.length, affixStats: new Set(R.ITEMS.flatMap(i => i.affixes.map(a => a.stat))).size,
    sets: new Set(R.SET_BONUSES.map(s => s.id)).size, chapters: R.CHAPTERS.filter(c => c.implemented).length,
    nodeTypes: ['battle', 'loot', 'rest', 'boss'], screens: 12,
  };
  await writeFile(`${out}/audit.json`, JSON.stringify({ base: '7ff71ff69bd271c554ec4f407e1cb7fefbef8099', artifactSha256: createHash('sha256').update(artifact).digest('hex'), census, captures, errors, runs, method: '100 identical seeds per policy. Decisions counts legal alternatives, an upper bound on non-obvious choices. Random picks legal skills and targets. Auto and active use existing policies.' }, null, 2));
  console.log(JSON.stringify({ census, errors, policies: ['random', 'auto', 'active'].map(policy => { const rows = runs.filter(r => r.policy === policy); return { policy, wins: rows.filter(r => r.winner === 'party').length, meanChoices: rows.reduce((n,r) => n+r.choices,0)/rows.length, meanAlternatives: rows.reduce((n,r) => n+r.decisions,0)/rows.length }; }) }));
} finally { await vite.close(); }
