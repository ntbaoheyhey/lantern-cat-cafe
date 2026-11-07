import { cpSync, mkdirSync, readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = process.cwd();
const scratch = resolve(root, 'test-results/cxu4-mutations');
const web = resolve(scratch, 'apps/web');
rmSync(scratch, { recursive: true, force: true });
mkdirSync(web, { recursive: true });
cpSync(resolve(root, 'tsconfig.base.json'), resolve(scratch, 'tsconfig.base.json'));
cpSync(resolve(root, 'apps/web/src'), resolve(web, 'src'), { recursive: true });
for (const file of ['package.json', 'vite.config.ts', 'tsconfig.json']) cpSync(resolve(root, 'apps/web', file), resolve(web, file));
symlinkSync(resolve(root, 'apps/web/node_modules'), resolve(web, 'node_modules'), 'dir');
for (const name of ['packages', 'reports']) symlinkSync(resolve(root, name), resolve(scratch, name), 'dir');
const run = name => {
  const result = spawnSync('pnpm', ['exec', 'vitest', 'run', 'src/ui', 'src/layout/character/HeroScreen.test.tsx', 'src/layout/HelpTab.search.test.tsx'], { cwd: web, encoding: 'utf8' });
  const output = result.stdout + result.stderr;
  writeFileSync(resolve(root, 'reports/scorecard/cxu4/logs', name + '.log'), output);
  return { exit: result.status, assertionsFailed: /AssertionError|TestingLibraryElementError/.test(output) };
};
const clean = run('mutation-control');
if (clean.exit !== 0) throw new Error('Scratch control failed; mutation evidence invalid');
const mutations = [
  ['modal-escape', 'ui/Modal.tsx', "event.key === 'Escape'", "event.key === 'BrokenEscape'"],
  ['modal-focus-return', 'ui/Modal.tsx', 'if (opener?.isConnected) opener.focus();', 'if (opener?.isConnected) node.focus();'],
  ['failure-toast-duration', 'ui/Toast.tsx', "toast.tone === 'error' || hovered", "toast.tone === 'warning' || hovered"],
  ['help-answer-search', 'layout/HelpTab.tsx', 'searchable(topic.content).toLocaleLowerCase()', 'topic.title.toLocaleLowerCase()'],
  ['power-bonus', 'layout/character/CharacterPanel.tsx', 'bonus: power - withoutBonus', 'bonus: 0'],
  ['class-success', 'layout/character/HeroScreen.tsx', 'if (success) setOpen(false);', 'if (!success) setOpen(false);'],
  ['tab-keyboard', 'ui/Tabs.tsx', "event.key === 'ArrowRight' ? 1", "event.key === 'ArrowRight' ? 0"],
];
const results = [];
for (const [name, file, before, after] of mutations) {
  const target = resolve(web, 'src', file), original = readFileSync(target, 'utf8');
  if (!original.includes(before)) throw new Error('Mutation target missing: ' + name);
  try {
    writeFileSync(target, original.replace(before, after));
    const result = run('mutant-' + name);
    results.push({ name, file, before, after, ...result, killed: result.exit !== 0 && result.assertionsFailed });
    console.log(JSON.stringify(results.at(-1)));
  } finally { writeFileSync(target, original); }
}
const restored = run('mutation-restored');
writeFileSync(resolve(root, 'reports/scorecard/cxu4/mutations.json'), JSON.stringify({ clean, results, restored }, null, 2) + '\n');
if (restored.exit !== 0 || results.some(result => !result.killed)) process.exitCode = 1;
