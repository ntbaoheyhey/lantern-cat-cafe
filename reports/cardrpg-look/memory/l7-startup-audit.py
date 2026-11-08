"""Recompute the retained startup metadata delta without rebuilding the app."""
import hashlib
import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[3]
base = root / 'reports/cardrpg-look/validation'
diagnosis = json.loads((base / 'l7/flag-off/startup-diagnosis.json').read_text())
normalize = lambda text: re.sub(r'-[A-Za-z0-9_-]{8}\.(js|css)', r'-HASH.\1', text)
bodies, entries = [], []
for label, checks_path in [('baseline', base / 'flag-off/checks.json'),
                           ('l7', base / 'l7/flag-off/checks.json')]:
    checks = json.loads(checks_path.read_text())
    entry = checks['chunks'][0]
    data = (base / f'l7/flag-off/startup-diagnosis/{label}-entry.txt').read_bytes()
    assert len(data) == entry['bytes']
    assert hashlib.sha256(data).hexdigest() == entry['sha256']
    header, body = data.decode().split('\n', 1)
    files = json.loads(re.search(r'm\.f=(\[[^\n]+?\])', header).group(1))
    arguments = re.findall(r'__vite__mapDeps\((\[[0-9,]+\])\)', body)
    assert len(arguments) == 5
    bodies.append(re.sub(r'__vite__mapDeps\(\[[0-9,]+\]\)',
                         '__vite__mapDeps(PRELOAD_INDICES)', normalize(body)))
    entries.append({'bytes': len(data), 'header': len(header.encode()),
                    'indices': sum(len(arg.encode()) for arg in arguments),
                    'files': set(map(normalize, files)),
                    'default': sorted(normalize(files[i]) for i in json.loads(arguments[-1])),
                    'totalStartupBytes': sum(c['bytes'] for c in checks['chunks'])})
assert bodies[0] == bodies[1]
assert entries[0]['default'] == entries[1]['default']
delta = lambda key: entries[1][key] - entries[0][key]
assert delta('bytes') == delta('totalStartupBytes') == diagnosis['entryDeltaBytes'] == 93
assert delta('header') == diagnosis['preloadHeaderDeltaBytes'] == 73
assert delta('indices') == diagnosis['dependencyIndexDeltaBytes'] == 20
assert delta('bytes') == delta('header') + delta('indices')
assert sorted(entries[1]['files'] - entries[0]['files']) == diagnosis['addedDormantPreloadEntries']
assert diagnosis['normalizedBodyEqual'] and diagnosis['defaultLegacyDependencyMembershipUnchanged']
print('Retained startup audit: +93 bytes = +73 preload header +20 indices; normalized body/default dependencies match.')
