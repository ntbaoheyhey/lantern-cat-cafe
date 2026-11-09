"""Incremental original-formula comparison; never substitutes for fresh captures."""
import hashlib
import json
from pathlib import Path
import sys
import numpy as np

root = Path(__file__).resolve().parents[3]
pilot = root / sys.argv[1]
base = root / 'reports/cardrpg-look/validation/l4/captures'
original = root / 'reports/cardrpg-look/rounds/effects/before-all'
receipts = [original / 'uniqueness.json', base / 'uniqueness.json', pilot / 'uniqueness.json']
old, published, fresh = [json.loads(p.read_text()) for p in receipts]
features = np.load(base / 'features.npz')
replacement = np.load(pilot / 'features.npz')
changed = {'clover-4'}
assert changed <= {r['id'] for r in fresh['rows']}
old_pairs = {tuple(sorted([r['left'], r['right']])): r['distance'] for r in old['pairs']}
rows = []
for pair in published['pairs']:
    ids = [pair['left'], pair['right']]
    value = pair['distance']
    if changed.intersection(ids):
        value = 0
        for suffix, weight in [('silhouette', .5), ('edge', .3), ('motion', .2)]:
            a, b = [(replacement if unit in changed else features)[unit + '/' + suffix] for unit in ids]
            union = np.count_nonzero(a | b)
            value += weight * np.count_nonzero(a ^ b) / union if union else 0
    baseline = old_pairs[tuple(sorted(ids))]
    rows.append(dict(left=ids[0], right=ids[1], original=baseline, published=pair['distance'],
                     candidate=value, deltaPublished=value - pair['distance'], deltaOriginal=value - baseline))
result = dict(method='Only Clover4 canonical row replaced. Other 66 rows reuse retained L4 features; geometry reference audit finds greenhouse only in Clover4. Original 50/30/20 XOR/union and 1e-6 comparison threshold. This is an incremental comparison, not a fresh 67-effect capture.',
              inputs={str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in receipts + [base / 'features.npz', pilot / 'features.npz']},
              pairs=rows, changed='clover-4', publishedRegressions=sum(r['deltaPublished'] < -1e-6 for r in rows),
              improvedPairs=sum(r['deltaPublished'] > 1e-6 for r in rows), originalRegressions=sum(r['deltaOriginal'] < -1e-6 for r in rows),
              worstPublishedDelta=min(r['deltaPublished'] for r in rows), worstOriginalDelta=min(r['deltaOriginal'] for r in rows))
(pilot / 'incremental-pairs.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if k not in ['pairs', 'inputs', 'method']}))
