/** Development-only CLI. Uses the existing web Vite dependency to load the TypeScript rules. */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const require = createRequire(new URL('../../../../../apps/web/package.json', import.meta.url));
const { createServer } = await import(require.resolve('vite'));
const server = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom' });
try {
  const load = name => server.ssrLoadModule(fileURLToPath(new URL(name, import.meta.url)));
  const { CLASS_IDS } = await load('../content/index.ts');
  const { V2_CONFIG } = await load('../config.ts');
  const { simulateV2 } = await load('./simulate.ts');
  const { PROPOSED_V2_OVERRIDES } = await load('./proposal.ts');
  const { renderBandsV2 } = await load('./report.ts');
  const output = process.env.T2_BANDS_OUT ?? '/tmp/t2-bands';
  writeFileSync(`${output}-config.json`, JSON.stringify({ current: V2_CONFIG, proposed: PROPOSED_V2_OVERRIDES }));
  const scenarios = process.env.T2_METADATA_ONLY ? [] : process.env.T2_SCENARIO === 'content' ? [
    ['content', { ...PROPOSED_V2_OVERRIDES, chapters: { killsPerRound: JSON.parse(process.env.T2_KILLS ?? '[18,36,65,110,180]') } }],
  ] : [['current', {}], ['proposal', PROPOSED_V2_OVERRIDES]];
  const before = JSON.stringify(V2_CONFIG);
  for (const [name, overrides] of scenarios) for (const stepMinutes of [1, 2]) {
    const runs = [];
    for (const classId of CLASS_IDS) for (let seed = 1; seed <= 10; seed++) runs.push(simulateV2({ classId, seed, stepMinutes, overrides }));
    if (JSON.stringify(V2_CONFIG) !== before) throw new Error('config drift');
    writeFileSync(`${output}-${name}-${stepMinutes}.json`, JSON.stringify(runs));
    writeFileSync(`${output}-${name}-${stepMinutes}.md`, renderBandsV2(runs, overrides));
    console.log(`${name} step ${stepMinutes}: ${runs.length} runs, ${runs.filter(r => r.minutesToChapterBossWin[5] !== null).length} completed all chapters; config restored`);
  }
} finally { await server.close(); }
