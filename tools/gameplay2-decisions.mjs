import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { root, sampleData } from './gameplay2-support.mjs';
const { C } = await sampleData();
const reasons = {
  hero: 'Bounded starter survival with a timed active damage option.',
  gear: 'Legible affixes, chapter growth and three safe upgrade levels.',
  sets: 'Two viable combat builds plus a gathering build; discrete 2/3/4-piece choices.',
  forge: 'Chosen set/slot and disclosed, non-destructive upgrade risk with item-bound pity.',
  boss: 'Readable three-phase cadence, capped encounters and a meaningful chapter-two wall.',
  tiers: 'Opt-in pressure; quality premium applies only to first-clear boss loot.',
  assist: 'Transparent, opt-out help after repeated losses.',
  mastery: 'Small capped permanent perks with free respec.',
  tour: 'Previewed optional reset; bounded bonus and retained collections.',
  away: 'Honest local-only catch-up, no offline fights or tradable rewards.',
  quests: 'Persistent short goals without calendar pressure; each reward pays once.',
  encounters: 'Different safe/study/risk trades for named encounters.',
  debug: 'Explicit development-only reviewer controls, absent from production.',
};
const rows = [];
function walk(value, path = []) { for (const [key, v] of Object.entries(value)) { const p = [...path, key]; if (typeof v === 'number') rows.push(['cafe.' + p.join('.'), 'absent (new Sample)', String(v), reasons[p[0]] ?? 'Bounded Sample pacing, storage or resource progression; no server grant changes.']); else if (v && typeof v === 'object') walk(v, p); } }
walk(C);
const changes = [
  ['gameplay.claimIntervalMs', '30000', '18000', 'Close the 30-second empty gap. Anchor the timer after the 10000ms first claim to respect the server minimum.'],
  ['features.cafeAdventure', 'absent', 'false', 'Explicit guest opt-in; no new verified rules are enabled by default.'], ...rows,
];
const doc = `# Gameplay decisions — 2026-11-05\n\nCandidate build, not live. Base: PR282 / 7eb1ee7. The only existing gameplay tunable changed is claim cadence. The 10000ms first claim and all server reward, Relic, market and replay rules are unchanged. All new values below belong to the isolated, default-off Sample. Units: seconds unless a key ends in Ms; chances/reductions are fractions; quality is percentage-point probability as a fraction.\n\nInitial Sample tuning (never shipped): room-two boss HP 850 → 2200 after equal-kit and natural progression runs made it too short. Final natural min-max clears take 25–31s over five seeds. Moss retains a hands-free survival route with a prepared kit; Ember rewards counter/Pounce timing. Full records are in the ledger balance.json. Tier quality was corrected to first-clear loot only, closing a free higher-quality craft exploit. Return persistence retains the first hide timestamp across duplicate browser events.\n\n| Config path | Before | After | Reason |\n|---|---|---|---|\n${changes.map(r => '| ' + r.join(' | ') + ' |').join('\n')}\n\nPresentation reuses CONFIG.gameplay.juice limits (no change). The 4s breathe animation, CSS layout dimensions, symbols, room counts and array indices are presentation/structure, not reward or combat tunables. No backend, contract, DB or migration changes. All authority remains in the existing server path.\n`;
writeFileSync(resolve(root, 'docs/decisions/gameplay-2026-11-05.md'), doc);
const manifest = JSON.parse(readFileSync(resolve(root, 'tools/art/gameplay2-manifest.json')));
writeFileSync(resolve(root, 'reports/gameplay2/asset-provenance.md'), `# Original art provenance — gameplay pass 2\n\n2026-11-05. Extends [prior provenance](../gameplay/asset-provenance.md). Followed the existing ART-BIBLE (Evening Atelier palette, native pixels, upper-left light). No reference-game image was downloaded, traced, copied, or fed to a generator.\n\nTool: Python3; script: tools/art/gameplay2.py. Exact command: \`python3 -B tools/art/gameplay2.py\`; verification: add \`--check\`. Exact prompt: **none** (procedural geometry, no image model). Shared Canvas primitives from the previous original art pass; zero image inputs. All parameters and geometry are versioned in the script and manifest. Runtime images total ${manifest.files.filter(f => f.file.startsWith('apps/web/public/')).reduce((n,f) => n+f.bytes,0)} bytes. Documentation screenshots are render captures, not new runtime art.\n\n| File | Bytes | Native pixels / seed / scale | SHA256 |\n|---|---:|---|---|\n${manifest.files.map(f => `| ${f.file} | ${f.bytes} | ${(f.parameters.size ?? ['contact sheet']).join('×')} / ${f.parameters.seed ?? 'n/a'} / ${f.parameters.scale} | ${f.sha256} |`).join('\n')}\n\nReused unchanged original rooms, Mochi, household bosses, gear, hearth and Relic assets retain the prior provenance. This pass does not modify Relic metadata or /relics/{id}.json resolution.\n`);
writeFileSync(resolve(root, 'reports/gameplay2/decisions.json'), '[\n' + changes.map(row => '  ' + JSON.stringify(row)).join(',\n') + '\n]\n');
console.log(`${changes.length} exact config decisions; ${manifest.files.length} original image records`);
