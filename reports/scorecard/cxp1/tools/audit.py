"""Scope, assertion retention and masked secret checks; never print matching data."""
import collections
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[4]
BASE = '7a66b14f4e1bb9816235ee3195a2f15745180031'

def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True)

paths = sorted(set(git('diff', '--name-only', 'origin/main').splitlines() + git('ls-files', '--others', '--exclude-standard').splitlines()))
rows = []
for path in paths:
    if path.startswith(('apps/web/src/pets/', 'packages/game-rules/src/v2/meta/pets/', 'reports/cxp1', 'reports/scorecard/cxp1/')):
        tier, why = '1', 'CXP1 implementation, tests, documentation or evidence'
    elif path == 'apps/web/src/game/v2/storeV2.ts':
        tier, why = '2', 'Inherited two-line read-only observer mount; unchanged in this continuation'
    elif path == 'apps/web/e2e/v2/pets-preview.spec.ts':
        tier, why = '2', 'Built-app local persistence and exact acknowledged kill-count coverage'
    elif path in ['docs/decisions/pets-preview.md', 'docs/design/decisions.md']:
        tier, why = '2', 'Explicitly authorized preview-number decision and index'
    elif path.startswith('supabase/functions/') and path.endswith('/deno.json'):
        diff = git('diff', 'origin/main', '--', path)
        added = [line for line in diff.splitlines() if line.startswith('+') and not line.startswith('+++')]
        removed = [line for line in diff.splitlines() if line.startswith('-') and not line.startswith('---')]
        assert len(added) == 1 and 'meta/pets' in added[0] and not removed, path
        assert (ROOT / path).read_text() == git('show', f'{BASE}:{path}'), path
        tier, why = '2', 'Inherited generator-required preview directory alias only; no new drift or runtime import'
    else:
        raise AssertionError(f'Unclassified path: {path}')
    rows.append(f'{path}\t{tier}\t{why}')
scope = ROOT / 'reports/scorecard/cxp1/scope.tsv'
scope.write_text('path\ttier\treason\n' + '\n'.join(rows) + '\n')
print(f'Scope: {len(rows)} paths classified; no Tier 3 path')

for path in ['apps/web/src/pets/state.test.ts', 'apps/web/src/pets/isolation.test.ts',
             'packages/game-rules/src/v2/meta/pets/pets.test.ts', 'apps/web/e2e/v2/pets-preview.spec.ts']:
    old = git('show', f'{BASE}:{path}')
    new = (ROOT / path).read_text()
    old_assertions = collections.Counter(line.strip() for line in old.splitlines() if 'expect(' in line or 'expect.poll(' in line)
    new_lines = collections.Counter(line.strip() for line in new.splitlines())
    assert not (old_assertions - new_lines), path
    print(f'Original assertion lines retained: {path}: {sum(old_assertions.values())}')

suspicious = re.compile(r'\b(?:test|it|describe)\.(?:skip|only|fixme|todo)\b|retries\s*:|test\.retry|timeout\s*:|eslint-disable|@ts-(?:ignore|expect-error)|\bas any\b|console\.log')
hits = []
for path in paths:
    if not path.endswith(('.ts', '.tsx')) or not path.startswith(('apps/', 'packages/')):
        continue
    for number, line in enumerate((ROOT / path).read_text().splitlines(), 1):
        if suspicious.search(line):
            hits.append(f'{path}:{number}')
assert not hits, hits
print('Integrity patterns: no skips/only/fixme/todo, timeouts/retries, suppressions, any casts or debug console.log in CXP1 source/tests')
for path in ['packages/game-rules/src/v2/meta/pets/index.ts', 'apps/web/src/game/v2/storeV2.ts',
             'apps/web/src/pets/isolation.test.ts', 'packages/game-rules/src/v2/meta/pets/pets.test.ts']:
    assert (ROOT / path).read_text() == git('show', f'{BASE}:{path}'), path
print('Registry, original rule/isolation assertions and observer mount unchanged from assigned base')

patterns = [
    re.compile(r'eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'),
    re.compile(r'postgres(?:ql)?://[^\s]+'),
    re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'),
    re.compile(r'\b(?:sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,})'),
    re.compile(r'''(?i)\b(?:password|private_key|secret_key|api_key)\s*[:=]\s*['"][^'"\s]{16,}['"]'''),
]
findings = []
for name in paths:
    path = ROOT / name
    if not path.is_file() or path.suffix in ['.png', '.jpg']:
        continue
    for number, line in enumerate(path.read_text().splitlines(), 1):
        if any(pattern.search(line) for pattern in patterns):
            findings.append(f'{name}:{number}')
if findings:
    print('Potential secret locations (content withheld):', findings)
    raise SystemExit(1)
print(f'Masked secret-pattern scan: no findings across {len(paths)} changed files, including historical reports/logs')
images = list((ROOT / 'reports/scorecard/cxp1').glob('*.png'))
assert len(images) <= 16
for path in images:
    assert path.stat().st_size < 200_000, path.name
print('Current screenshots:', {path.name: path.stat().st_size for path in images})
print('No scratch directories remain:', not any(ROOT.glob('.cxp1-*')))
assert not any(ROOT.glob('.cxp1-*'))
