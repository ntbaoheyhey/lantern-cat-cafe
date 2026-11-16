"""Review an immutable history checkpoint; raw detector values stay in memory.

Only exact contextual checks below can resolve a finding. Unknown findings remain
open. This does not clear unscanned commits, binary payloads, or future findings.
"""
from pathlib import Path
import collections, datetime, gzip, hashlib, json, os, re, subprocess, sys, time

root = Path(__file__).resolve().parents[3]
scan_attempt, review_attempt = sys.argv[1:]
assert scan_attempt.isdecimal() and review_attempt.isdecimal()
assert not (root / 'STOP-V4SHIP').exists()
assert subprocess.check_output(['git', 'branch', '--show-current'], cwd=root, text=True).strip() == 'codex/v4-ship-2026-11-16'
folder = root / 'reports/v4-ship/S11' / ('history-batches-' + scan_attempt)
output = root / 'reports/v4-ship/S11' / ('history-triage-' + review_attempt + '.json.gz')
assert not output.exists(), 'Preserve previous review'
sha = lambda data: hashlib.sha256(data).hexdigest()
checkpoint_bytes = (folder / 'check.json.gz').read_bytes()
checkpoint = json.loads(gzip.decompress(checkpoint_bytes))
scope_bytes = (folder / 'scope.json').read_bytes()
scope = json.loads(scope_bytes)
assert checkpoint['scopeSha256'] == sha(scope_bytes)
assert subprocess.check_output(['gitleaks', 'version'], text=True).strip() == scope['scanner']
findings = [finding for batch in checkpoint['rows'] for finding in batch['findings']]
assert len(findings) == checkpoint['findings']
review_path = root / 'reports/v4-ship/S11/history-triage-2.json'
review = json.loads(review_path.read_text())
identity = lambda row: (row['commit'], row['file'], row['line'], row['endLine'], row['type'])
reviewed = {identity(row): row for row in review['findings'] if row['classification'] == 'false-positive'}
cache = {}

def blob(commit, name):
    result = subprocess.run(['git', 'show', commit + ':' + name], cwd=root, capture_output=True)
    return result.stdout if result.returncode == 0 else None

def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for item in value.values():
            yield from strings(item)
    elif isinstance(value, list):
        for item in value:
            yield from strings(item)

def reference(commit, name):
    data = blob(commit, name)
    return data, {'path': name, 'commit': commit, 'sha256': sha(data)} if data is not None else None

started = time.monotonic()
rows, counts = [], collections.Counter()
for finding in findings:
    if (root / 'STOP-V4SHIP').exists():
        raise RuntimeError('STOP-V4SHIP; review incomplete')
    data = blob(finding['commit'], finding['file'])
    if data is None:
        rows.append({**finding, 'reason': 'Exact historical blob unavailable; requires contextual review'})
        continue
    digest = sha(data)
    old = reviewed.get(identity(finding))
    if old and old['blobSha256'] == digest:
        rows.append({**old, 'reusedReview': {'path': str(review_path.relative_to(root)), 'sha256': sha(review_path.read_bytes())}})
        counts['exact-reviewed-finding'] += 1
        continue
    if digest not in cache:
        process = subprocess.run(['gitleaks', 'stdin', '--no-banner', '--no-color', '--redact=0', '--log-level=fatal', '--report-format=json', '--report-path=-', '--ignore-gitleaks-allow'], input=data, capture_output=True, env={**os.environ, 'GOMAXPROCS': '1'})
        if process.returncode not in (0, 1):
            raise RuntimeError('Historical blob scanner failed; raw diagnostics suppressed')
        try:
            cache[digest] = json.loads(process.stdout or b'[]')
        except Exception:
            raise RuntimeError('Invalid detector JSON; raw diagnostics suppressed') from None
    matches = [row for row in cache[digest] if row['RuleID'] == finding['type'] and row['StartLine'] == finding['line'] and row['EndLine'] == finding['endLine']]
    reason, evidence = None, {'method': 'Exact historical blob stdin rescan; same rule and full line range required. Raw values remain only in process memory.'}
    if len(matches) == 1 and finding['type'] == 'generic-api-key':
        value = matches[0].get('Secret', '')
        commit, name = finding['commit'], finding['file']
        if re.fullmatch(r'0x[0-9a-fA-F]{40}', value):
            for chain in ['43113', '31337']:
                registry, ref = reference(commit, 'packages/chain/deployments/' + chain + '.json')
                if registry is not None and value.lower() in {item.lower() for item in strings(json.loads(registry)) if re.fullmatch(r'0x[0-9a-fA-F]{40}', item)}:
                    reason = 'Public EVM contract address exactly matches the deployment registry in the same commit.'
                    evidence['registry'] = ref
                    break
            if reason is None and name == 'packages/chain/src/index.test.ts':
                line = data.decode().splitlines()[finding['line'] - 1]
                if re.match(r'\s*YarnToken\s*:', line):
                    reason = 'Forty-hex-digit EVM address assigned to the public YarnToken deployment field in the chain parsing test fixture.'
            if reason is None and name == 'reports/v3-shell/b2/tests/q8-final-unit.log':
                fixture, ref = reference(commit, 'packages/chain/src/index.test.ts')
                if fixture is not None and re.search(rb'YarnToken\s*:\s*[\x22\x27]' + re.escape(value.encode()) + rb'[\x22\x27]', fixture):
                    reason = 'Test-log EVM deployment address exactly matches the public YarnToken field in the same-commit test fixture.'
                    evidence['fixture'] = ref
            if reason is None and name in ['reports/chain/COSMETIC-PILOT-LOCAL-INPUT.json', 'reports/chain/COSMETIC-PILOT-LOCAL-AUDIT.json', 'reports/chain/COSMETIC-PILOT-LOCAL.json']:
                pilot, ref = reference(commit, 'reports/chain/COSMETIC-PILOT-LOCAL-INPUT.json')
                if pilot is not None:
                    parsed = json.loads(pilot)
                    if parsed.get('token') == value and parsed.get('chainId') == 43113 and re.search(rb'anvil', pilot, re.I):
                        reason = 'EVM token contract address in the explicit Anvil pilot input, exactly matching the same-commit audited input; not private signing material.'
                        evidence['pilotInput'] = ref
        elif value == 'RelicMarketV2' and name in ['packages/chain/src/index.ts', 'contracts/script/DeployChainV2.s.sol', 'contracts/test/DeployChainV2.t.sol', 'contracts/script/DeployRelicForge.s.sol']:
            declaration, ref = reference(commit, 'contracts/src/RelicMarketV2.sol')
            if declaration is not None and re.search(rb'contract\s+RelicMarketV2\b', declaration):
                reason = 'Public Solidity contract type identifier, verified against its declaration in the same commit.'
                evidence['declaration'] = ref
        elif value == 'key.voicePhase===' and name == 'apps/web/src/game/cardrpg/battle-v3/audio-timeline.test.ts':
            source, ref = reference(commit, 'apps/web/src/game/cardrpg/battle-v3/audio-timeline.ts')
            if source is not None and b'voicePhase' in source and b'.find(key=>key.voicePhase===' in data:
                reason = 'TypeScript predicate property access and equality operators, not a string credential; voicePhase exists in the same-commit timeline implementation.'
                evidence['implementation'] = ref
        elif value == 'primary/secondary' and name == 'reports/v3-shell/b2/UI-ART-NOTES.md':
            reason = 'UI button category prose in the previously identified design-notes document.'
        elif name == 'reports/v3-shell/b2/ECONOMY-LEVER-INVENTORY.json' and re.fullmatch(r'[A-Za-z][\w]*(?:\.[A-Za-z][\w]*)+', value):
            inventory = json.loads(data)
            for item in inventory.get('rows', []):
                if item.get('key') != value or not isinstance(item.get('line'), int) or not item.get('path'):
                    continue
                source, ref = reference(commit, item['path'])
                if source is not None and 1 <= item['line'] <= len(source.splitlines()):
                    reason = 'JSON economy configuration property path with an existing source-file and line reference in the same commit.'
                    evidence['source'] = {**ref, 'line': item['line']}
                    break
        elif name == 'docs/chain/supply-study.json' and re.fullmatch(r'[a-f0-9]{64}', value):
            for source_path, source_hash in json.loads(data).get('sourceHashes', {}).items():
                if source_hash != value:
                    continue
                source, ref = reference(commit, source_path)
                if source is not None and sha(source) == value:
                    reason = 'Public source-manifest SHA-256, recomputed from the exact source blob in the same commit.'
                    evidence['source'] = ref
                    break
    if len(matches) != 1:
        evidence['exactMatchCount'] = len(matches)
    rows.append({**finding, 'classification': 'false-positive' if reason else 'unresolved', 'reason': reason or 'requires exact contextual review', 'blobSha256': digest, 'evidence': evidence})
    counts[reason or 'unresolved'] += 1
unresolved = sum(row['classification'] == 'unresolved' for row in rows)
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'scope': 'Only completed findings in this immutable history checkpoint; no future findings or binary payloads cleared.', 'checkpoint': {'path': str((folder / 'check.json.gz').relative_to(root)), 'sha256': sha(checkpoint_bytes), 'scannedCommits': checkpoint['scannedCommits'], 'totalCommits': checkpoint['totalCommits']}, 'harness': {'path': str(Path(__file__).relative_to(root)), 'sha256': sha(Path(__file__).read_bytes())}, 'scanner': scope['scanner'], 'seconds': round(time.monotonic() - started, 3), 'rescannedUniqueBlobs': len(cache), 'findings': rows, 'counts': dict(counts), 'reviewed': len(rows), 'unresolved': unresolved, 'reviewedFindingsPass': unresolved == 0, 'fullHistoryPass': False, 'learn': ['reports/v4-ship/LEARN/S11-history.md', 'reports/v4-ship/LEARN/S11-repo.md']}
output.write_bytes(gzip.compress(json.dumps(report, separators=(',', ':')).encode(), mtime=0))
print(json.dumps({key: report[key] for key in ['seconds', 'rescannedUniqueBlobs', 'reviewed', 'unresolved', 'reviewedFindingsPass', 'fullHistoryPass']}))
