"""Three-method evidence using unchanged fixtures and exact historical samples."""
from pathlib import Path
import base64
import datetime
import hashlib
import json
import subprocess
import sys
from text_detector_client import BINARY, CONFIG, ROOT, Detector, sha

attempt = sys.argv[1]
assert attempt.isdigit() and not (ROOT / 'STOP-V4SHIP').exists()
out = ROOT / f'reports/v4-ship/S11/history-text-detector-study-{attempt}.json'
assert not out.exists()
source = ROOT / 'reports/v4-ship/S11/history-text-object-study-1.json'
prior = json.loads(source.read_bytes());assert prior['complete'] and prior['fixtureRootChecksPass']
sign = lambda path: {'path': str(path.relative_to(ROOT)), 'sha256': sha(path.read_bytes())}
report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'learn': 'reports/v4-ship/LEARN/S11-history-text-objects.md',
          'input': sign(source), 'build': sign(ROOT / 'reports/v4-ship/S11/text-detector-build-1.json'),
          'harness': [sign(Path(__file__)), sign(Path(__file__).with_name('text_detector_client.py'))],
          'fixtures': [], 'realObjects': [], 'rejectedFrames': [], 'complete': False, 'fullHistoryPass': False}
save = lambda: out.write_text(json.dumps(report, indent=2) + '\n')
begin = b'-----BEGIN ' + b'PRIVATE ' + b'KEY-----\n'
end = b'-----END ' + b'PRIVATE ' + b'KEY-----'
marker = begin + b'PUBLIC INVALID NOT KEY MATERIAL\n' * 4 + end
yaml = b'kind: ' + b'Secret\ndata:\n  demonstration: ' + base64.b64encode(b'public-invalid-study-value') + b'\n'
fixtures = {
    'plain': marker + b'\n', 'application-header': b'%PDF-1.7\n' + marker + b'\n',
    'large-multiline': begin + b'PUBLIC INVALID NOT KEY MATERIAL\n' * 9000 + end + b'\n',
    'no-final-newline': marker, 'crlf': (marker + b'\n').replace(b'\n', b'\r\n'),
    'utf8-prefix': 'Tiếng Việt\n'.encode() + marker + b'\n',
    'ignore-inline-suppression': marker + b' # gitleaks:allow\n',
    'filename-yaml': yaml, 'negative': b'ordinary public study text\n',
}
try:
    with Detector() as detector:
        report['ready'] = detector.ready
        for baseline in prior['fixtures']:
            data = fixtures[baseline['case']];assert len(data) == baseline['bytes'] and sha(data) == baseline['sha256']
            name = baseline['patch']['verified'][0]['name']
            row = detector.scan(baseline['case'], name, data)
            row.update(case=baseline['case'], sameAsRoot=row['findings'] == baseline['rootGit']['findings'])
            report['fixtures'].append(row);save()
            print(json.dumps({'case': row['case'], 'sameAsRoot': row['sameAsRoot'], 'findings': len(row['findings'])}), flush=True)
        for baseline in prior['realObjects']:
            data = subprocess.check_output(['git', 'cat-file', 'blob', baseline['oid']], cwd=ROOT)
            assert len(data) == baseline['bytes'] and sha(data) == baseline['sha256']
            assert hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest() == baseline['oid']
            row = detector.scan(baseline['oid'], baseline['name'], data)
            expected = [f for f in prior['realComparison']['rootGit']['findings'] if f['file'] == baseline['name']]
            row.update(sameAsRoot=row['findings'] == expected)
            report['realObjects'].append(row);save()
    # Fail closed on invalid data/identity and truncated frames, with no echo.
    for case, data, declared_size, declared_hash in [
        ('invalid-utf8', b'public\xff', 7, sha(b'public\xff')),
        ('contains-nul', b'public\0', 7, sha(b'public\0')),
        ('digest-mismatch', b'public', 6, '0' * 64),
        ('truncated', b'public', 7, sha(b'public!')),
    ]:
        header = {'id': case, 'path': 'public.txt', 'bytes': declared_size, 'sha256': declared_hash}
        result = subprocess.run([str(BINARY), str(CONFIG)], input=json.dumps(header).encode() + b'\n' + data, capture_output=True, timeout=10)
        lines = result.stdout.splitlines();assert result.returncode == 1 and len(lines) == 1 and json.loads(lines[0])['ready']
        assert result.stderr == b'text detector failed; details suppressed\n'
        report['rejectedFrames'].append({'case': case, 'exitCode': 1, 'noResultOrRawEcho': True});save()
    report.update(complete=True, pass_=all(r['sameAsRoot'] for r in report['fixtures'] + report['realObjects']))
    report['pass'] = report.pop('pass_')
    report['comparison'] = {'objects': len(report['realObjects']), 'bytes': sum(r['bytes'] for r in report['realObjects']),
                            'stdinSeconds': prior['realComparison']['stdinSeconds'],
                            'rootGitSeconds': prior['realComparison']['rootGit']['seconds'],
                            'directDetectorSeconds': sum(r['seconds'] for r in report['realObjects']),
                            'directWallSeconds': sum(r['wallSeconds'] for r in report['realObjects']),
                            'findings': sum(len(r['findings']) for r in report['realObjects'])}
    report['limits'] = ['Same frozen deterministic sample; findings classify through study-review-1, never by test path alone.',
                        'Full raw fragments and explicit filename aliases only. Default content allowlists, encoded/binary/archive/submodule content and later refs remain outside a global claim.',
                        'Library/toolchain version, embedded config equality, binary and module hashes are bound. No installed product runtime or original scanner changed.']
    save();print(json.dumps({'output': str(out.relative_to(ROOT)), 'pass': report['pass'], 'comparison': report['comparison']}), flush=True)
    if not report['pass']:sys.exit(1)
except BaseException as error:
    if not report['complete']:
        report['failure'] = {'type': type(error).__name__, 'detailsSuppressed': True};save()
    raise
