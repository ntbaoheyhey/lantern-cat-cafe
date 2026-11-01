"""Behavioral mutants in a disposable directory inside the assigned worktree."""
import hashlib
import json
import pathlib
import shutil
import subprocess
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[4]
LOGS = ROOT / 'reports/scorecard/cxp1/logs'
RULES = 'packages/game-rules/src/v2/meta/pets/index.ts'
STORE = 'apps/web/src/pets/state.ts'
POWER = 'packages/game-rules/src/v2/combat/stats.ts'
commands = {
    'rules': ('packages/game-rules', ['pnpm', 'exec', 'vitest', 'run', 'src/v2/meta/pets/pets.test.ts']),
    'store': ('apps/web', ['pnpm', 'exec', 'vitest', 'run', 'src/pets/state.test.ts', 'src/pets/isolation.test.ts']),
}
mutants = [
    ('unlock-round-up', RULES, 'Math.floor(count / def.unlock.count)', 'Math.ceil(count / def.unlock.count)', 'rules'),
    ('equip-third', RULES, 'maxEquipped: 2', 'maxEquipped: 3', 'rules'),
    ('equip-duplicate', RULES, 'if (equipped.includes(id))', 'if (false && equipped.includes(id))', 'rules'),
    ('migration-disabled', STORE, 'data.version === 0', 'data.version === -1', 'store'),
    ('corrupt-grants-selection', STORE, 'catch { return empty(); }', "catch { return Object.freeze({ ...empty(), equipped: Object.freeze(['pet.hemwhisk']) }); }", 'store'),
    ('persistence-dropped', STORE, 'this.state = Object.freeze(state);\n    this.persist();', 'this.state = Object.freeze(state);', 'store'),
    ('refresh-delta-retained', STORE, 'if (revision === adopted) pending = 0;', 'if (revision === adopted) revision += 0;', 'store'),
    ('retired-cleanup-repeats', STORE, 'if (disposed) return;', '/* mutant: retired cleanup runs again */', 'store'),
    ('hook-never-subscribes', STORE, 'useSyncExternalStore(store.subscribe,', 'useSyncExternalStore(() => () => {},', 'store'),
    ('preview-changes-power', POWER, 'export function powerRating(stats: CatStats): number {',
     "import { PET_DEFS } from '../meta/pets';\nexport function powerRating(stats: CatStats): number {\n  stats = { ...stats, atk: stats.atk * (1 + PET_DEFS[0]!.perLevel[0]!) };", 'store'),
]

def run(scratch, name, suite):
    cwd, argv = commands[suite]
    result = subprocess.run(argv, cwd=scratch / cwd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    (LOGS / f'mutation-{name}.log').write_text(
        f'CWD: {scratch / cwd}\n$ {" ".join(argv)}\n{result.stdout}\nEXIT: {result.returncode}\n'
    )
    return result

originals = {path: (ROOT / path).read_bytes() for path in [RULES, STORE, POWER]}
summary = []
with tempfile.TemporaryDirectory(prefix='.cxp1-mutants-', dir=ROOT) as temporary:
    scratch = pathlib.Path(temporary)
    ignore = shutil.ignore_patterns('node_modules', '.env*', 'dist*', 'test-results', '*.tsbuildinfo')
    for folder in ['packages', 'apps/web/src', 'supabase/functions']:
        shutil.copytree(ROOT / folder, scratch / folder, ignore=ignore)
    for path in ['package.json', 'pnpm-workspace.yaml', 'tsconfig.base.json', 'apps/web/package.json', 'apps/web/vite.config.ts', 'apps/web/tsconfig.json']:
        shutil.copy2(ROOT / path, scratch / path)
    for path in ['node_modules', 'apps/web/node_modules', *[str(p.relative_to(ROOT)) for p in (ROOT / 'packages').glob('*/node_modules')]]:
        (scratch / path).symlink_to(ROOT / path, target_is_directory=True)
    for suite in commands:
        baseline = run(scratch, f'baseline-{suite}', suite)
        assert baseline.returncode == 0, f'Scratch baseline failed: {suite}'
    for name, file, before, after, suite in mutants:
        path = scratch / file
        source = originals[file].decode()
        assert source.count(before) == 1, name
        path.write_text(source.replace(before, after))
        try:
            result = run(scratch, name, suite)
            killed = result.returncode != 0 and 'AssertionError' in result.stdout
            summary.append({'id': name, 'path': file, 'before': before, 'after': after, 'exit': result.returncode, 'assertion_failure': killed})
            print(f'{name}: exit={result.returncode}, assertion_failure={killed}', flush=True)
        finally:
            path.write_bytes(originals[file])
    for suite in commands:
        restored = run(scratch, f'restored-{suite}', suite)
        assert restored.returncode == 0, f'Restored scratch failed: {suite}'
for path, original in originals.items():
    assert (ROOT / path).read_bytes() == original, f'Original was modified: {path}'
print('Scratch removed; original source hashes preserved:', {path: hashlib.sha256(data).hexdigest() for path, data in originals.items()})
(LOGS / 'mutation-summary.json').write_text(json.dumps(summary, indent=2) + '\n')
assert all(row['assertion_failure'] for row in summary), 'One or more mutants survived or failed outside assertions'
