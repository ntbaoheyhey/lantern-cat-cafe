"""Run genuine implementation mutants in disposable copies inside this assigned worktree."""
import hashlib
import pathlib
import shutil
import subprocess
import tempfile

root = pathlib.Path(__file__).resolve().parents[3]
zone = root / 'packages/game-rules/src/v2/codex'
logs = root / 'reports/scorecard/CXL1/logs'
mutants = [
    ('M1-name', 'entries.ts', 'base(item.id, item.name,', 'base(item.id, item.id,', 'retains every original name'),
    ('M2-starter-link', 'entries.ts', "connect(cls.id, cls.starterWeaponId, 'starter weapon', 'starter for');", '', 'maps starter weapons'),
    ('M3-gear-stats', 'entries.ts', 'statMultiplier: rarity.statMultiplier,', 'statMultiplier: 1,', 'retains gear base stats'),
    ('M4-weight-total', 'odds.ts', 'const probability = weight / totalWeight;', 'const probability = weight / 100;', 'normalizes actual weights'),
    ('M5-chance-gate', 'odds.ts', 'exactOdds(line.chance * probability)', 'exactOdds(probability)', 'pins independently calculated'),
    ('M6-reciprocal', 'odds.ts', 'null : 1 / probability', 'null : probability', 'normalizes actual weights'),
    ('M7-material-source', 'entries.ts', 'row.dropChance * 100)', 'null)', 'resolves acquisition references'),
    ('M8-readonly', 'types.ts', 'Object.freeze(part);', '', 'returns deterministic deeply frozen copies'),
    ('M9-aggregate-odds', 'odds.ts', 'p + (1 - p) * roll.rarities', 'p + roll.rarities', 'agrees with the existing analytic loot engine'),
]

def digest():
    return {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in zone.iterdir() if p.is_file()}

before = digest()
command = ['pnpm', 'exec', 'vitest', 'run', 'src/v2/codex/entries.test.ts', 'src/v2/codex/odds.test.ts']
for name, filename, old, new, failure in [('control', '', '', '', ''), *mutants]:
    with tempfile.TemporaryDirectory(prefix='mutant-', dir=root / 'reports/scorecard/CXL1') as scratch_dir:
        scratch = pathlib.Path(scratch_dir)
        package = scratch / 'packages/game-rules'
        shutil.copytree(root / 'packages/game-rules/src', package / 'src')
        shutil.copy(root / 'packages/game-rules/package.json', package)
        shutil.copy(root / 'packages/game-rules/tsconfig.json', package)
        shutil.copy(root / 'tsconfig.base.json', scratch)
        (package / 'node_modules').symlink_to(root / 'packages/game-rules/node_modules', target_is_directory=True)
        if filename:
            target = package / 'src/v2/codex' / filename
            text = target.read_text()
            assert text.count(old) == 1, (name, text.count(old))
            target.write_text(text.replace(old, new))
        result = subprocess.run(command, cwd=package, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        evidence = f'MUTANT: {name}\nFILE: {filename or "unchanged scratch control"}\nOLD: {old or "<empty>"}\nNEW: {new or "<empty>"}\n$ {" ".join(command)}\n{result.stdout}\nEXIT: {result.returncode}\n'
        (logs / f'mutation-{name}.log').write_text(evidence)
        if filename:
            assert result.returncode == 1 and failure in result.stdout, evidence
            print(f'{name}: killed by {failure}; exit 1')
        else:
            assert result.returncode == 0, evidence
            print('control: unchanged scratch tests pass; exit 0')
assert digest() == before, 'Assigned source changed during mutations'
print(f'{len(mutants)} behavioral mutants killed; scratch directories removed; source SHA-256 hashes unchanged.')
