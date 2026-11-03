#!/usr/bin/env python3
"""Read-only scope, original-art and provenance verification for a frozen UI head."""
import argparse
import datetime
import json
import re
import subprocess
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('root', type=Path)
p.add_argument('output', type=Path)
a = p.parse_args()

def git(*args):
    return subprocess.check_output(['git', *args], cwd=a.root, text=True)

base, head = git('rev-parse', 'origin/main').strip(), git('rev-parse', 'HEAD').strip()
paths = git('diff', '--name-only', 'origin/main...HEAD').splitlines()
prefixes = ('apps/web/e2e/', 'apps/web/public/', 'docs/ui/', 'reports/ui/',
            'reports/ui-redesign/', 'reports/art/', 'screenshots/ui/', 'tools/art/')
folders = ('shell', 'layout', 'nav', 'map', 'boss', 'inventory', 'onboarding', 'theme',
           'ui', 'forge', 'market', 'chain-proof', 'pets', 'runes', 'art', 'motion', 'game')
single = {'apps/web/src/' + name for name in ('main.tsx', 'styles.css', 'theme.css',
          'cafe.css', 'motion.css', 'Panel.tsx', 'GameCanvas.tsx', 'CatPortrait.tsx')}
single |= {'tools/ui-audit.mjs', 'tools/effects-test.mjs', 'reports/asset-provenance.md'}

def owned(path):
    return path.startswith(prefixes) or path in single or any(
        path.startswith('apps/web/src/' + folder + '/') for folder in folders) or bool(
        re.match(r'^apps/web/src/(App|HeroTab|CafeBoard)[^/]*$', path))

def tree(ref):
    rows = {}
    for row in git('ls-tree', '-r', ref).splitlines():
        metadata, path = row.split('\t', 1)
        rows[path] = metadata.split()[2]
    return rows

before, after = tree(base), tree(head)
images = {path: sha for path, sha in before.items() if re.search(r'\.(png|svg|webp|gif|jpe?g|avif|ico)$', path, re.I)}
changed_images = [path for path, sha in images.items() if after.get(path) != sha]
changed_public = [path for path, sha in before.items() if path.startswith('apps/web/public/') and after.get(path) != sha]
provenance = 'reports/asset-provenance.md'
append_only = git('show', head + ':' + provenance).startswith(git('show', base + ':' + provenance))
source_changes = git('status', '--porcelain', '--untracked-files=no').splitlines()
result = {'head': head, 'base': base, 'reviewedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'paths': paths, 'violations': [path for path in paths if not owned(path)],
          'existingImagesUnchanged': len(images) - len(changed_images), 'changedExistingImages': changed_images,
          'changedExistingPublicFiles': changed_public, 'provenanceAppendOnly': append_only,
          'trackedWorkingChanges': source_changes}
a.output.parent.mkdir(parents=True, exist_ok=True)
a.output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({key: value for key, value in result.items() if key != 'paths'}))
assert not result['violations'] and not changed_images and not changed_public and append_only and not source_changes
