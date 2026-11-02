import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const out = 'reports/scorecard/cxu5/logs';
mkdirSync(out, { recursive: true });
const checks = [
 ['typecheck', 'npx -y pnpm@10.28.0 typecheck'],
 ['lint', 'npx -y pnpm@10.28.0 lint'],
 ['test', 'npx -y pnpm@10.28.0 test'],
 ['build', 'VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 build'],
 ['classic-build', 'VITE_GAME_V2=0 VITE_SUPABASE_URL= VITE_SUPABASE_ANON_KEY= npx -y pnpm@10.28.0 --filter @taskbar-hero/web build'],
 ['deno-generation', 'npx -y pnpm@10.28.0 gen:deno && git diff --exit-code -- supabase/functions'],
 ['deno-imports', 'node scripts/check-deno-imports.mjs'],
 ['links', 'node scripts/check-links.mjs'],
 ['bundle', 'node scripts/check-bundle.mjs'],
];
const results = [];
for (const [name, command] of checks) {
 const result = spawnSync('/bin/zsh', ['-c', command], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
 writeFileSync(`${out}/${name}.log`, `${new Date().toISOString()}\nHEAD ${spawnSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout}Working tree implementation; command: ${command}\n${result.stdout}${result.stderr}\nEXIT ${result.status}\n`);
 results.push({ name, command, exit: result.status });
 console.log(name, result.status);
 writeFileSync(`${out}/checks.json`, JSON.stringify(results, null, 2));
}
