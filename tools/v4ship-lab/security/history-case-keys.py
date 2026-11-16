"""Derive only exact positioned metrics case keys; all captured values stay in RAM."""
from pathlib import Path
from collections import Counter, defaultdict
import datetime
import gzip
import hashlib
import json
import os
import re
import runpy
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[3]
sha = lambda b: hashlib.sha256(b).hexdigest()
oid_for = lambda b: hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
decode = runpy.run_path(str(Path(__file__).with_name('history-text-prefix-triage.py')))['decode']
STRING = re.compile(br'"(?:\\.|[^"\\])*"')
ATOM = re.compile(br'-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?|true|false|null')
identity = lambda r: (r['line'], r['endLine'], r['type'])
captured_identity = lambda r: (r['StartLine'], r['EndLine'], r['RuleID'])


def key_spans(data):
    decode(data)  # Strict full-document validation, including duplicate names.
    found = []
    def ws(i):
        while i < len(data) and data[i] in b' \t\r\n':
            i += 1
        return i
    def value(i, path):
        i = ws(i)
        if data[i] == 123:
            i = ws(i + 1)
            if data[i] == 125:
                return i + 1
            while True:
                token = STRING.match(data, i); assert token
                key = json.loads(token.group()); i = ws(token.end()); assert data[i] == 58
                i = ws(value(i + 1, path + (key,)))
                if data[i] == 125:
                    return i + 1
                assert data[i] == 44; i = ws(i + 1)
        if data[i] == 91:
            i = ws(i + 1); index = 0
            if data[i] == 93:
                return i + 1
            while True:
                i = ws(value(i, path + (index,))); index += 1
                if data[i] == 93:
                    return i + 1
                assert data[i] == 44; i = ws(i + 1)
        if data[i] == 34:
            token = STRING.match(data, i); assert token
            if len(path) == 3 and path[0] == 'rows' and type(path[1]) is int and path[2] == 'key':
                found.append({'path': path, 'start': i + 1, 'end': token.end() - 1, 'value': json.loads(token.group())})
            return token.end()
        token = ATOM.match(data, i); assert token
        return token.end()
    assert ws(value(0, ())) == len(data)
    return found


def derived(row):
    assert row['cohort'] in ['base', 'matched']
    assert isinstance(row['crew'], str) and re.fullmatch('[a-z][a-z0-9-]{0,39}', row['crew'])
    assert type(row['encounter']) is int and 0 <= row['encounter'] <= 8
    assert type(row['seed']) is int and 1 <= row['seed'] <= 40500
    return f"{row['cohort']}/{row['crew']}/{row['encounter']}/{row['seed']}"


def capture_span(data, capture):
    newlines = [m.start() for m in re.finditer(b'\n', data)]
    base = lambda line: 0 if line == 1 else newlines[line - 2]
    start = base(capture['StartLine']) + capture['StartColumn'] - 1
    end = base(capture['EndLine']) + capture['EndColumn']
    assert capture['ExactBytes']
    assert (start, end) == (capture['MatchStart'], capture['MatchEnd'])
    scalar_start, scalar_end = capture['ScalarStart'], capture['ScalarEnd']
    assert 0 <= start <= scalar_start < scalar_end <= end <= len(data)
    return scalar_start, scalar_end


def positioned(data, document, spans, capture):
    start, end = capture_span(data, capture)
    found = spans.get((start, end))
    if not found or found['value'].encode() != data[start:end]:
        return None
    row = document['rows'][found['path'][1]]
    if row['key'] != derived(row):
        return None
    return {'line': capture['StartLine'], 'endLine': capture['EndLine'], 'startColumn': capture['StartColumn'], 'endColumn': capture['EndColumn'],
            'scalarStart': start, 'scalarEnd': end, 'jsonPath': found['path'], 'exactBytes': True, 'fourFieldDerivation': True}


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    output = ROOT / f'reports/v4-ship/S11/history-case-keys-{attempt}.json.gz'; assert not output.exists()
    prior_path = ROOT / 'reports/v4-ship/S11/history-text-prefix-2-digests-1.json.gz'
    review_path = ROOT / 'reports/v4-ship/S11/history-text-prefix-2-digests-review-2.json'
    prior = decode(gzip.decompress(prior_path.read_bytes())); review = decode(review_path.read_bytes()); assert review['pass']
    for row in review['inputs']:
        assert sha((ROOT / row['path']).read_bytes()) == row['sha256']
    target = {'0308242ced61d5333c52d4bfb38cc83f01f459db': 'design-metrics-v2.mjs', '0803601f292221e524a217a7ddd3364c2781ec7e': 'design-metrics.mjs'}
    records = prior['findings']; objects = []; proof_groups = []
    env = {k: v for k, v in os.environ.items() if not k.startswith('GITLEAKS_')}
    config = ROOT / 'work/v4ship-prep/security-rules/gitleaks-8.30.1.toml'
    build_path = ROOT / 'reports/v4-ship/S11/text-positions-build-1.json'
    build = decode(build_path.read_bytes()); assert build['pass']
    for item in build['sources'] + [build['binary'], build['config']]:
        assert sha((ROOT / item['path']).read_bytes()) == item['sha256']
    binary = ROOT / build['binary']['path']
    for oid, producer_name in target.items():
        entries = [r for r in records if r['oid'] == oid]; mapping = entries[0]['mappings'][0]
        data = subprocess.check_output(['git', 'show', mapping['commit'] + ':' + mapping['path']], cwd=ROOT); assert oid_for(data) == oid
        document = decode(data)
        registration_path = str(Path(mapping['path']).parent / 'REGISTERED-METHOD.json')
        registered_bytes = subprocess.check_output(['git', 'show', mapping['commit'] + ':' + registration_path], cwd=ROOT)
        registration = decode(registered_bytes)
        canonical = subprocess.check_output(['node', '-e', "process.stdout.write(JSON.stringify(JSON.parse(require('node:fs').readFileSync(0,'utf8'))))"], input=registered_bytes)
        assert sha(canonical) == document['methodHash']
        if 'registration' in document:
            assert document['registration'] == registration
        producer_path = 'tools/cardrpg-big/skills-v5/' + producer_name
        producer = subprocess.check_output(['git', 'show', mapping['commit'] + ':' + producer_path], cwd=ROOT)
        assert sha(producer) == registration['tools'][producer_path]
        assert b'key=`${cohort}/${crew.id}/${encounter}/${seed}`' in producer
        assert b'const row={key,cohort' in producer and b'crew:crew.id,encounter,seed' in producer
        assert all(row['key'] == derived(row) for row in document['rows'])
        assert all(registration['offset'] < row['seed'] <= registration['offset'] + registration['count'] for row in document['rows'])
        scan = subprocess.run([str(binary), str(config)], input=data, capture_output=True, env={**env, 'GOMAXPROCS': '1'})
        assert scan.returncode == 0
        captures = decode(scan.stdout or b'[]')
        assert Counter(map(captured_identity, captures)) == Counter(map(identity, entries))
        unresolved_locations = {identity(r) for r in entries if r['classification'] == 'unresolved'}
        selected = [c for c in captures if captured_identity(c) in unresolved_locations]
        start = time.monotonic(); values = {derived(row) for row in document['rows']}
        membership = [data[slice(*capture_span(data, c))].decode() in values for c in selected]; membership_seconds = time.monotonic() - start
        start = time.monotonic(); spans = {(r['start'], r['end']): r for r in key_spans(data)}
        proofs = [positioned(data, document, spans, c) for c in selected]; positioned_seconds = time.monotonic() - start
        by_location = defaultdict(list)
        for capture, proof in zip(selected, proofs):
            by_location[captured_identity(capture)].append(proof)
        for location, group in by_location.items():
            rows = [r for r in entries if identity(r) == location and r['classification'] == 'unresolved']
            assert len(rows) == len(group)
            if not all(group):
                continue
            group_id = len(proof_groups)
            proof_groups.append({'oid': oid, 'location': location, 'entries': len(rows), 'captures': group, 'producerIndex': len(objects)})
            for row in rows:
                row.update(classification='verified-generated-case-identifier', proofGroup=group_id,
                           reason='Every capture at this exact repeated location is a complete positioned row key derived from four recorded case fields by the digest-bound producer.')
        objects.append({'oid': oid, 'mapping': mapping, 'bytes': len(data), 'rows': len(document['rows']), 'allRowKeysReconstructed': True,
                        'registration': {'commit': mapping['commit'], 'path': registration_path, 'oid': oid_for(registered_bytes), 'methodHashMatches': True},
                        'producer': {'commit': mapping['commit'], 'path': producer_path, 'oid': oid_for(producer), 'registeredDigestMatches': True, 'constructorAndRowFieldsVerified': True},
                        'comparison': {'entries': len(selected), 'membership': {'seconds': membership_seconds, 'matched': sum(membership)},
                                       'positioned': {'seconds': positioned_seconds, 'matched': sum(p is not None for p in proofs)}}})
    classified = sum(r['classification'] == 'verified-generated-case-identifier' for r in records)
    unresolved = sum(r['classification'] == 'unresolved' for r in records)
    assert classified == 876 and unresolved == 47
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'learn': 'reports/v4-ship/LEARN/S11-history-semantic-keys.md',
              'harness': sign(Path(__file__)), 'inputs': [sign(p) for p in [prior_path, review_path, build_path]], 'objects': objects, 'proofGroups': proof_groups,
              'findings': records, 'exactEntries': len(records), 'previousDigests': 427, 'newCaseIdentifiers': classified, 'unresolved': unresolved,
              'completeFindingAccounting': True, 'positionedCaseDerivationsPass': True, 'fullPrefixFindingsPass': False, 'fullHistoryPass': False,
              'limits': 'Only the two metrics objects and their exact case-key captures. The registered constructor matches, but the current historical load.mjs differs from its registration; this is not a simulation replay or verification of its numeric results. All47 other entries remain unresolved. Captures and derived values stay in memory; no live scanner or runtime input changed.'}
    output.write_bytes(gzip.compress((json.dumps(report, separators=(',', ':')) + '\n').encode(), mtime=0))
    print(json.dumps({'output': str(output.relative_to(ROOT)), 'newCaseIdentifiers': classified, 'unresolved': unresolved, 'comparisons': [o['comparison'] for o in objects], 'fullHistoryPass': False}))


if __name__ == '__main__':
    try:
        main(sys.argv[1])
    except BaseException:
        print('Positioned case-key review failed; raw details suppressed', file=sys.stderr)
        raise SystemExit(1) from None
