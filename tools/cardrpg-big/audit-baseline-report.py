"""REFERENCE: reports/cardrpg-big/memory/PROMPT.md F7, ADDENDUM LOOK.
Audit retained evidence without rerunning browsers or changing old receipts.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[2]
os.chdir(ROOT)
OUT = Path('reports/cardrpg-big/integration/delivery')
EXPECTED = '9a5f6ebbb04af56c19f11cf43cf2763b35df2bde3b7a8dcd943060e878d793d3'

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def read(path):
    return json.loads(Path(path).read_text())

def verify(path, expected):
    assert sha(path) == expected, str(path)

for path in ['docs/cardrpg3/index.html', 'docs/cardrpg3/baseline-v1.html']:
    verify(path, EXPECTED)
    assert Path(path).stat().st_size == 23937000
runtime_delta = subprocess.check_output([
    'git', 'diff', '--name-only', 'a106dfcac755d42f91b2467adf6d888ca0b41a9c', '--',
    'apps', 'packages', 'assets', 'tools/cardrpg-big/build.mjs',
    'tools/cardrpg-big/offline.tsx', 'tools/cardrpg-big/offline-loader.js',
    'tools/cardrpg-big/offline-performance.js', 'tools/cardrpg-big/demo-tools.css',
    'package.json', 'pnpm-lock.yaml', 'docs/cardrpg3/index.html',
]).decode().splitlines()
assert runtime_delta == [], runtime_delta

functional = read(OUT / 'functional-audit.json')
assert functional['artifactSha256'] == EXPECTED
assert functional['functionalComplete'] and not functional['pending']
shots = 0
for receipt in functional['receipts']:
    verify(receipt['path'], receipt['sha256'])
    for shot in receipt['screenshots']:
        verify(shot['path'], shot['sha256'])
        shots += 1
assert len(functional['receipts']) == 10 and shots == 204
for gate in functional['sourceGates']:
    assert gate['exit'] == 0
    verify(gate['log'], gate['sha256'])
assert len(functional['sourceGates']) == 5

videos = Path('reports/cardrpg-big/video/delivery')
audit = read(videos / 'audit.json')
captures = read(videos / 'captures.json')
review = read(videos / 'review/observations.json')
assert audit['artifactSha256'] == captures['sha256'] == review['artifactSha256'] == EXPECTED
assert audit['complete'] and len(captures['rows']) == len(review['rows']) == 14
sheets = 0
for row in audit['rows']:
    verify(videos / (row['name'] + '.webm'), row['clipSha256'])
    recorded = next(c for c in captures['rows'] if c['name'] == row['name'])
    observed = next(c for c in review['rows'] if c['name'] == row['name'])
    assert recorded['sha256'] == observed['clipSha256'] == row['clipSha256']
    assert observed['samplesViewed'] == row['samplesViewed']
    for path, digest in row['sheetHashes'].items():
        verify(path, digest)
        sheets += 1
assert sheets == 57
assert sum(r['decodedFrames'] for r in audit['rows']) == 12385
assert sum(r['samplesViewed'] for r in audit['rows']) == 991

cold_dir = Path('reports/cardrpg-big2/integration/cold')
cold = read(OUT / 'baseline-cold-audit.json')
assert cold['artifactSha256'] == EXPECTED
for row in cold['rows']:
    path = cold_dir / (row['name'] + '.json')
    verify(path, row['sha256'])
    raw = read(path)
    frames = [r['ms'] for r in raw['frames']]
    assert raw['errors'] == []
    assert (len(frames), max(frames), sum(v > 25 for v in frames), sum(v > 50 for v in frames)) == (
        row['frames'], row['max'], row['above25'], row['above50'])
assert sum(r['frames'] for r in cold['rows']) == cold['frames'] == 13125
assert sum(r['above25'] for r in cold['rows']) == cold['above25'] == 101
assert sum(r['above50'] for r in cold['rows']) == cold['above50'] == 17

tracked = set(subprocess.check_output(['git', 'ls-files', '-z']).decode().split('\0'))
docs = ['CARDRPG-BIG-REPORT.md', 'COVERAGE.md', 'DRAFT-PRS.md', 'integration/F7-GATES.md']
document_rows = []
for name in docs:
    path = Path('reports/cardrpg-big') / name
    text = path.read_text()
    links = []
    for url in re.findall(r'\]\(([^)]+)\)', text):
        evidence_prefix = 'https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-big-delivery-2026-11-07/'
        if url.startswith(evidence_prefix):
            target = Path(url[len(evidence_prefix):].split('#')[0])
        elif '://' in url or url.startswith('#'):
            continue
        else:
            target = Path(os.path.normpath(path.parent / url.split('#')[0]))
        in_git = str(target) in tracked or any(t.startswith(str(target).rstrip('/') + '/') for t in tracked)
        assert target.exists() or in_git, (str(path), url)
        links.append({'target': str(target), 'availableLocally': target.exists(), 'tracked': in_git})
    lines = text.splitlines()
    for index, line in enumerate(lines):
        if line.startswith('#'):
            assert lines[index + 1].startswith('REFERENCE:'), (name, line)
    document_rows.append({'path': str(path), 'sha256': sha(path), 'lines': len(lines), 'localLinks': links})
report = (Path('reports/cardrpg-big') / docs[0]).read_text()
assert len(report.splitlines()) <= 150
summary = report.split('## ', 1)[0].strip().splitlines()[3:]
assert len(summary) == 9
assert len(re.findall(r'^\d\. ', report, re.M)) == 6

result = {
    'at': datetime.now(timezone.utc).isoformat(), 'artifactSha256': EXPECTED,
    'method': 'Reverify saved files, raw arrays and source log hashes. No new browser, video decode, test-suite or matrix run.',
    'runtimeDelta': runtime_delta, 'gateLogsVerified': 5, 'functionalGroups': 10,
    'screenshotHashesVerified': shots, 'videoHashesVerified': 14, 'sheetHashesVerified': sheets,
    'previousFullDecodeFrames': 12385, 'reviewedSamplesRecorded': 991,
    'coldFrames': 13125, 'above25': 101, 'above50': 17,
    'reportVietnameseSummaryLines': len(summary), 'reportClickRoutes': 6, 'documents': document_rows,
    'remaining': ['LOOK visual improvements and before/after', '9/11 self-grades below 8.5',
                  'CPU4 opening MAX116.7ms >100ms', 'final lookV2 matrix by LOOK B only'],
}
(OUT / 'baseline-report-audit.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: v for k, v in result.items() if k != 'documents'}, indent=2))
