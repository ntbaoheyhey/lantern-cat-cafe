"""Inspect the staged CXL1 delivery without printing potential secret values."""
import json
import pathlib
import re
import subprocess
root = pathlib.Path(__file__).resolve().parents[3]

def git(*args):
    return subprocess.check_output(['git', *args], cwd=root, text=True)

changed = git('diff', '--cached', '--name-only').splitlines()
assert changed, 'Stage the delivery before auditing'
allowed = lambda p: p.startswith('packages/game-rules/src/v2/codex/') or p in {
    'packages/game-rules/src/v2/index.ts', 'scripts/gen-codex-json.mjs',
    'docs/compendium-adapter.md', 'reports/cxl1.md',
} or p.startswith('reports/scorecard/CXL1/') or (p.startswith('supabase/functions/') and p.endswith('/deno.json'))
for path in changed:
    assert allowed(path), f'Out of scope: {path}'
    assert not path.startswith('.github/') and '/.env' not in path
    if path.endswith('.json'):
        assert (root / path).stat().st_size <= 200_000, f'Large JSON: {path}'
    kind = 'Tier 2 (generated map)' if path.startswith('supabase/') else 'Tier 1'
    print(f'{kind}: {path}')
for line in git('diff', '--cached', '--numstat').splitlines():
    added, deleted, path = line.split('\t')
    assert deleted == '0', f'Existing lines removed: {path}'
    assert not (path.endswith(('.test.ts', '.test.tsx', '.test.mjs')) and not path.startswith('packages/game-rules/src/v2/codex/'))
assert git('diff', '--cached', '--', 'packages/game-rules/src/v2/index.ts').count("+export * from './codex';") == 1
suspicious = re.compile(r'(?:test|describe|it)\.(?:skip|only|fixme|todo)|@ts-ignore|@ts-expect-error|eslint-disable|\bas any\b|console\.log|retries\s*:|test\.retry')
for path in changed:
    if path.startswith('packages/game-rules/src/v2/codex/'):
        assert not suspicious.search((root / path).read_text()), f'Integrity pattern: {path}'
secret_patterns = [
    re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(r'\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{8,}\b'),
    re.compile(r'(?:postgres(?:ql)?://[^\s]+|sk_live_[A-Za-z0-9]{12,}|sb_secret_[A-Za-z0-9]{12,}|gh[pousr]_[A-Za-z0-9]{20,})'),
    re.compile(r'(?i)(?:password|private_key|secret_key)\s*[:=]\s*[\"\'][^\"\'\s]{8,}[\"\']'),
]
for path in changed:
    content = (root / path).read_text()
    for pattern in secret_patterns:
        if pattern.search(content):
            raise AssertionError(f'Potential secret in {path}; value withheld')
for path in changed:
    if not path.startswith('supabase/functions/'):
        continue
    before = json.loads(git('show', f'HEAD:{path}'))['imports']
    after = json.loads((root / path).read_text())['imports']
    assert all(after.get(key) == value for key, value in before.items())
    added = set(after) - set(before)
    assert len(added) == 5 and all('/v2/codex' in key for key in added)
print('Scope: exact allowlist; existing source/tests/assertions preserved; only five codex mappings added per changed Deno map.')
print('Integrity: no skip/only/fixme/todo, suppression, any cast, retry or src console logging in new codex files.')
print('Secret scan: no matching credentials, private keys, JWTs or database URLs in staged changed files/logs.')
print('No committed JSON exceeds 200 KB. Audit is targeted evidence, not a full repository security or merge gate.')
