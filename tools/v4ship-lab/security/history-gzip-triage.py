"""Review exact expanded gzip findings against immutable public-source evidence.

LEARN: reports/v4-ship/LEARN/S11-history-gzip.md. No field-name-only exceptions;
unmatched source hashes remain unresolved. Raw detector values stay in memory.
"""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import os
import re
import subprocess
import sys
import time

root = Path(__file__).resolve().parents[3]
scan_attempt, review_attempt = sys.argv[1:]
assert scan_attempt.isdecimal() and review_attempt.isdecimal()
assert not (root / 'STOP-V4SHIP').exists()
folder = root / 'reports/v4-ship/S11' / ('history-gzip-' + scan_attempt)
output = root / 'reports/v4-ship/S11' / ('history-gzip-review-' + review_attempt + '.json.gz')
snapshot = output.with_name(output.name.replace('.json.gz', '.checkpoint.json.gz'))
assert not output.exists() and not snapshot.exists()
sha = lambda data: hashlib.sha256(data).hexdigest()
checkpoint_bytes = (folder / 'check.json.gz').read_bytes()
snapshot.write_bytes(checkpoint_bytes)
state = json.loads(gzip.decompress(checkpoint_bytes))
inventory = {row['oid']: row for row in json.loads(gzip.decompress((folder / 'inventory.json.gz').read_bytes()))}
binding = json.loads((folder / 'binding.json').read_text())
assert state['bindingSha256'] == sha((folder / 'binding.json').read_bytes())
assert subprocess.check_output(['gitleaks', 'version'], text=True).strip() == binding['scanner']
head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
source_cache, detector_cache = {}, {}


def source_hash(commit, path):
    key = (commit, path)
    if key not in source_cache:
        result = subprocess.run(['git', 'show', commit + ':' + path], cwd=root, capture_output=True)
        source_cache[key] = sha(result.stdout) if result.returncode == 0 else None
    return source_cache[key]


started = time.monotonic()
rows = []
for scanned in state['rows']:
    if not scanned['findings']:
        continue
    assert not (root / 'STOP-V4SHIP').exists()
    entry = inventory[scanned['oid']]
    packed = subprocess.check_output(['git', 'cat-file', 'blob', scanned['oid']], cwd=root)
    assert sha(packed) == scanned['compressedSha256']
    expanded = gzip.decompress(packed)
    assert sha(expanded) == scanned['expandedSha256']
    if scanned['expandedSha256'] not in detector_cache:
        command = [part if part != '--redact=100' else '--redact=0' for part in binding['command']]
        result = subprocess.run(command, input=expanded, capture_output=True,
                                env={**os.environ, 'GOMAXPROCS': '1'}, cwd=root)
        if result.returncode not in (0, 1):
            raise RuntimeError('Detector error; raw diagnostics suppressed')
        detector_cache[scanned['expandedSha256']] = json.loads(result.stdout or b'[]')
    matches = detector_cache[scanned['expandedSha256']]
    try:
        document = json.loads(expanded)
    except (ValueError, UnicodeDecodeError):
        document = None
    text_lines = expanded.decode('utf-8', errors='replace').splitlines()
    for finding in scanned['findings']:
        exact = [m for m in matches if m['RuleID'] == finding['type']
                 and m['StartLine'] == finding['line'] and m['EndLine'] == finding['endLine']]
        reason, evidence = None, {}
        if len(exact) == 1 and finding['type'] == 'generic-api-key':
            value = exact[0].get('Secret', '')
            if isinstance(document, dict) and re.fullmatch('[a-f0-9]{64}', value):
                declared = document.get('head')
                commits = [c for c in [declared, entry['exemplar']['commit'], head]
                           if isinstance(c, str) and re.fullmatch('[a-f0-9]{40}', c)]
                for field in ['sourceHashes', 'sourceAssetHashes']:
                    mapping = document.get(field, {})
                    if not isinstance(mapping, dict):
                        continue
                    for path, digest in mapping.items():
                        if digest != value:
                            continue
                        for commit in dict.fromkeys(commits):
                            if source_hash(commit, path) == value:
                                reason = 'Source-manifest SHA-256 exactly recomputed from the referenced public source blob.'
                                evidence = {'field': field, 'source': {'commit': commit, 'path': path,
                                                                     'sha256': source_cache[(commit, path)]}}
                                break
                        if reason:
                            break
                    if reason:
                        break
            if scanned['oid'] == '9da0430a4af70d482cd13a4af07dfba2cf8cd762' and finding['line'] == 224:
                checkout = []
                for i, line in enumerate(text_lines[:-1]):
                    if '[command]/usr/bin/git log -1 --format=%H' in line:
                        candidate = text_lines[i + 1].split(' ', 1)[-1].strip()
                        if re.fullmatch('[a-f0-9]{40}', candidate):
                            checkout.append(candidate)
                if any(value == 'contracts-' + commit for commit in checkout) and 'cache-key:' in text_lines[223]:
                    reason = 'Foundry CI cache identifier equals the contracts namespace plus the exact checkout revision printed by git in the same immutable job log.'
                    evidence = {'cacheInput': 'cache-key', 'namespace': 'contracts-',
                                'matchesLoggedCheckoutRevision': True, 'checkoutObjectAvailableLocally': False,
                                'limitation': 'The old checkout object is absent locally; this classification uses the exact CI log derivation, not a source-tree verification.'}
        rows.append({'oid': scanned['oid'], 'source': entry['exemplar'], **finding,
                     'classification': 'false-positive' if reason else 'unresolved',
                     'reason': reason or 'Exact contextual review still required',
                     'expandedSha256': scanned['expandedSha256'], 'evidence': evidence})
    print(json.dumps({'reviewedBlobs': len(detector_cache), 'reviewedFindings': len(rows),
                      'unresolved': sum(row['classification'] == 'unresolved' for row in rows)}), flush=True)
unresolved = sum(row['classification'] == 'unresolved' for row in rows)
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
          'checkpoint': {'path': str(snapshot.relative_to(root)), 'sha256': sha(checkpoint_bytes),
                         'scannedBlobs': state['scannedBlobs'], 'totalBlobs': state['totalBlobs']},
          'harness': {'path': str(Path(__file__).relative_to(root)), 'sha256': sha(Path(__file__).read_bytes())},
          'scanner': binding['scanner'], 'seconds': round(time.monotonic() - started, 3),
          'rescannedExpandedBlobs': len(detector_cache), 'sourceBlobLookups': len(source_cache),
          'findings': rows, 'reviewed': len(rows), 'unresolved': unresolved,
          'reviewedFindingsPass': unresolved == 0, 'fullHistoryPass': False,
          'scope': 'Only the exact frozen expanded-content findings in this review; no future, textual-history, nested archive or arbitrary binary clearance.'}
output.write_bytes(gzip.compress(json.dumps(report, separators=(',', ':')).encode(), mtime=0))
print(json.dumps({k: report[k] for k in ['reviewed', 'unresolved', 'seconds', 'reviewedFindingsPass', 'fullHistoryPass']}))
