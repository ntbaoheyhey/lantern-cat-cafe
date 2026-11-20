"""Independently review character-decoded scalars, source provenance and multiplicity."""
from pathlib import Path
from collections import Counter, defaultdict
import copy
import datetime
import gzip
import hashlib
import json
import os
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
sha = lambda b: hashlib.sha256(b).hexdigest()
oid_for = lambda b: hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest()
sign = lambda p: {'path': str(p.relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
identity = lambda r: (r['oid'], r['line'], r['endLine'], r['type'])
location = lambda r: (r['StartLine'], r['EndLine'], r['RuleID'])


def unique(pairs):
    assert len({k for k, _ in pairs}) == len(pairs)
    return dict(pairs)


def invalid(_):
    raise ValueError('Non-JSON constant')


DECODER = json.JSONDecoder(object_pairs_hook=unique, parse_constant=invalid)


def load(path):
    data = path.read_bytes()
    return DECODER.decode((gzip.decompress(data) if path.suffix == '.gz' else data).decode())


def verify(item):
    assert sha((ROOT / item['path']).read_bytes()) == item['sha256']


def git_bytes(commit, path):
    return subprocess.check_output(['git', 'show', commit + ':' + path], cwd=ROOT)


def correspondence(before, after):
    assert len(before) == len(after)
    for old, new in zip(before, after):
        assert identity(old) == identity(new)
        assert {k: v for k, v in old.items() if k not in ['reason', 'classification']} == {
            k: v for k, v in new.items() if k not in ['reason', 'classification', 'proofGroup']}
        if old['classification'] != 'unresolved':
            assert old == new
        elif new['classification'] == 'unresolved':
            assert old == new
        else:
            assert new['classification'] == 'verified-generated-case-identifier'


def scalars(data):
    # This parser uses JSONDecoder character positions, independently of the
    # classifier's byte regular expressions. Then convert to UTF-8 offsets.
    text = data.decode('utf-8'); document = DECODER.decode(text)
    byte_offsets = [0]
    for char in text:
        byte_offsets.append(byte_offsets[-1] + len(char.encode('utf-8')))
    found = {}

    def whitespace(index):
        while index < len(text) and text[index] in ' \t\r\n':
            index += 1
        return index

    def walk(index, path):
        index = whitespace(index)
        if text[index] == '{':
            index = whitespace(index + 1)
            if text[index] == '}':
                return index + 1
            while True:
                key, index = DECODER.raw_decode(text, index); assert type(key) is str
                index = whitespace(index); assert text[index] == ':'
                index = whitespace(walk(index + 1, path + (key,)))
                if text[index] == '}':
                    return index + 1
                assert text[index] == ','; index = whitespace(index + 1)
        if text[index] == '[':
            index = whitespace(index + 1); row = 0
            if text[index] == ']':
                return index + 1
            while True:
                index = whitespace(walk(index, path + (row,))); row += 1
                if text[index] == ']':
                    return index + 1
                assert text[index] == ','; index = whitespace(index + 1)
        value, end = DECODER.raw_decode(text, index)
        if type(value) is str:
            found[(byte_offsets[index + 1], byte_offsets[end - 1])] = (path, value)
        return end

    assert whitespace(walk(0, ())) == len(text)
    return document, found


def reconstructed(row):
    if row['cohort'] not in ('base', 'matched') or type(row['crew']) is not str:
        return None
    if not re.fullmatch(r'[a-z][a-z0-9-]{0,39}', row['crew']):
        return None
    if type(row['seed']) is not int or type(row['encounter']) is not int:
        return None
    if not (1 <= row['seed'] <= 40500 and 0 <= row['encounter'] <= 8):
        return None
    return '/'.join(str(row[k]) for k in ('cohort', 'crew', 'encounter', 'seed'))


def semantic(data, document, tokens, capture):
    if not capture['ExactBytes']:
        return None
    start, end = capture['ScalarStart'], capture['ScalarEnd']
    selected = tokens.get((start, end))
    if selected is None:
        return None
    path, value = selected
    if len(path) != 3 or path[0] != 'rows' or type(path[1]) is not int or path[2] != 'key':
        return None
    row = document['rows'][path[1]]
    if data[start:end] != value.encode() or value != row['key'] or value != reconstructed(row):
        return None
    # Compute coordinates separately from the Go helper, including its pinned
    # preceding-newline convention. Do not accept a shifted matching location.
    a, b = capture['MatchStart'], capture['MatchEnd']
    if not (0 <= a <= start < end <= b <= len(data)):
        return None
    start_line = data.count(b'\n', 0, a) + 1
    end_line = data.count(b'\n', 0, b) + 1
    start_base = max(0, data.rfind(b'\n', 0, a))
    end_base = max(0, data.rfind(b'\n', 0, b))
    if (start_line, end_line, a - start_base + 1, b - end_base) != (
            capture['StartLine'], capture['EndLine'], capture['StartColumn'], capture['EndColumn']):
        return None
    return {'line': capture['StartLine'], 'endLine': capture['EndLine'],
            'startColumn': capture['StartColumn'], 'endColumn': capture['EndColumn'],
            'scalarStart': start, 'scalarEnd': end, 'jsonPath': list(path),
            'exactBytes': True, 'fourFieldDerivation': True}


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    output = ROOT / f'reports/v4-ship/S11/history-case-keys-review-{attempt}.json'; assert not output.exists()
    input_path = ROOT / 'reports/v4-ship/S11/history-case-keys-2.json.gz'; report = load(input_path)
    verify(report['harness'])
    for item in report['inputs']:
        verify(item)
    prior_path = ROOT / 'reports/v4-ship/S11/history-text-prefix-2-digests-1.json.gz'; prior = load(prior_path)
    correspondence(prior['findings'], report['findings'])
    build_path = ROOT / 'reports/v4-ship/S11/text-positions-build-1.json'; build = load(build_path); assert build['pass']
    for item in build['sources'] + [build['binary'], build['config']]:
        verify(item)
    binary, config = (ROOT / build[k]['path'] for k in ['binary', 'config'])
    env = {**{k: v for k, v in os.environ.items() if not k.startswith('GITLEAKS_')}, 'GOMAXPROCS': '1'}

    def scan(data):
        child = subprocess.run([str(binary), str(config)], input=data, capture_output=True, env=env)
        assert child.returncode == 0
        return DECODER.decode(child.stdout.decode())

    total = 0; object_reviews = []; fixture = None
    for obj_index, obj in enumerate(report['objects']):
        oid = obj['oid']; mapping = obj['mapping']; data = git_bytes(mapping['commit'], mapping['path']); assert oid_for(data) == oid
        document, tokens = scalars(data)
        registration_bytes = git_bytes(mapping['commit'], obj['registration']['path'])
        registration = DECODER.decode(registration_bytes.decode()); assert oid_for(registration_bytes) == obj['registration']['oid']
        canonical = subprocess.check_output(['node', '-e', "process.stdout.write(JSON.stringify(JSON.parse(require('node:fs').readFileSync(0,'utf8'))))"], input=registration_bytes)
        assert sha(canonical) == document['methodHash']
        if 'registration' in document:
            assert document['registration'] == registration
        producer = git_bytes(mapping['commit'], obj['producer']['path'])
        assert oid_for(producer) == obj['producer']['oid'] and sha(producer) == registration['tools'][obj['producer']['path']]
        assert re.search(rb'key\s*=\s*`\$\{cohort\}/\$\{crew\.id\}/\$\{encounter\}/\$\{seed\}`', producer)
        assert re.search(rb'const\s+row\s*=\s*\{key,cohort.*?crew:crew\.id,encounter,seed', producer)
        assert all(row['key'] == reconstructed(row) and registration['offset'] < row['seed'] <= registration['offset'] + registration['count'] for row in document['rows'])
        loader_path = 'tools/cardrpg-big/skills-v5/load.mjs'
        loader = git_bytes(mapping['commit'], loader_path)
        loader_matches = sha(loader) == registration['tools'][loader_path]
        assert not loader_matches  # Explicit limitation, never claim replay.
        captures = scan(data); entries = [r for r in prior['findings'] if r['oid'] == oid]
        assert Counter(location(c) for c in captures) == Counter((r['line'], r['endLine'], r['type']) for r in entries)
        unresolved = {(r['line'], r['endLine'], r['type']) for r in entries if r['classification'] == 'unresolved'}
        by_location = defaultdict(list)
        for capture in captures:
            if location(capture) in unresolved:
                proof = semantic(data, document, tokens, capture); assert proof is not None
                by_location[location(capture)].append(proof)
                if fixture is None:
                    fixture = (document['rows'][proof['jsonPath'][1]], data, document, tokens, capture)
        actual_groups = [g for g in report['proofGroups'] if g['oid'] == oid]
        assert len(actual_groups) == len(by_location)
        for group in actual_groups:
            loc = tuple(group['location']); proofs = by_location.pop(loc)
            assert group['producerIndex'] == obj_index and group['entries'] == len(proofs)
            assert sorted(group['captures'], key=lambda p: p['scalarStart']) == sorted(proofs, key=lambda p: p['scalarStart'])
            group_id = report['proofGroups'].index(group)
            rows = [r for r in report['findings'] if r.get('proofGroup') == group_id]
            assert len(rows) == len(proofs)
            assert all(r['classification'] == 'verified-generated-case-identifier' and identity(r) == (oid, *loc) for r in rows)
            total += len(proofs)
        assert not by_location
        object_reviews.append({'oid': oid, 'rows': len(document['rows']), 'entries': sum(g['entries'] for g in actual_groups),
                               'producerBound': True, 'registrationBound': True, 'allKeysReconstructed': True,
                               'independentCharacterPositionsMatch': True, 'loaderRegisteredDigestMatches': loader_matches,
                               'simulationReplayed': False, 'numericResultsVerified': False})
    assert total == report['newCaseIdentifiers'] == 876
    counts = Counter(r['classification'] for r in report['findings'])
    assert counts == {'verified-source-digest': 427, 'verified-generated-case-identifier': 876, 'unresolved': 47}
    controls = []

    def rejects(name, operation):
        try:
            operation()
        except (AssertionError, ValueError, KeyError):
            controls.append({'name': name, 'rejected': True}); return
        raise AssertionError('Negative control was accepted')

    rejects('removed-finding', lambda: correspondence(prior['findings'], report['findings'][:-1]))
    rejects('added-finding', lambda: correspondence(prior['findings'], report['findings'] + [report['findings'][0]]))
    rejects('duplicate-object-property', lambda: DECODER.decode('{"rows":[],"rows":[]}'))
    row, data, document, tokens, original_capture = fixture
    shifted = {**original_capture, 'ScalarStart': original_capture['ScalarStart'] + 1}
    assert semantic(data, document, tokens, shifted) is None
    controls.append({'name': 'shifted-scalar-position', 'rejected': True})
    bad_document = copy.deepcopy(document); index = tokens[(original_capture['ScalarStart'], original_capture['ScalarEnd'])][0][1]
    bad_document['rows'][index]['seed'] += 1
    assert semantic(data, bad_document, tokens, original_capture) is None
    controls.append({'name': 'changed-seed', 'rejected': True})
    wrong_property = json.dumps({'rows': [row], 'api_key': row['key']}, ensure_ascii=False, indent=2).encode()
    control_document, control_tokens = scalars(wrong_property); control_captures = scan(wrong_property)
    same_value = [c for c in control_captures if c['ExactBytes'] and wrong_property[c['ScalarStart']:c['ScalarEnd']] == row['key'].encode()]
    accepted = [c for c in same_value if semantic(wrong_property, control_document, control_tokens, c) is not None]
    assert len(same_value) == 2 and len(accepted) == 1
    controls.append({'name': 'matching-value-wrong-property', 'membershipAccepted': len(same_value), 'positionedAccepted': len(accepted), 'rejected': True})
    for obj in report['objects']:
        assert obj['comparison']['entries'] == obj['comparison']['membership']['matched'] == obj['comparison']['positioned']['matched'] == 438
    folder = ROOT / 'reports/v4-ship/S11/history-case-keys-regression-1'
    baseline = ROOT / 'reports/v4-ship/S11/history-text-prefix2-regression-1'
    regression = load(folder / 'check.json'); verify(regression['log'])
    assert regression['complete'] and not regression['commandsPassed'] and not regression['officialClassParityGate']
    assert {r['name']: r['exitCode'] for r in regression['rows']} == {'server': 0, 'rules': 0, 'web': 1, 'typecheck': 0, 'parity-probe': 0, 'build': 0}

    def summary(path):
        rows = [DECODER.decode(line) for line in gzip.decompress(path.read_bytes()).decode().splitlines()]
        text = re.sub(r'\x1b\[[0-9;]*m', '', ''.join(r['text'] for r in rows if r['name'] == 'web'))
        return [line.strip() for line in text.splitlines() if re.match(r'\s*(FAIL|Tests\s|Test Files\s)', line)]

    web_summary = summary(folder / 'log.jsonl.gz')
    assert web_summary == summary(baseline / 'log.jsonl.gz') and sum(s.startswith('FAIL ') for s in web_summary) == 7
    assert 'Tests  7 failed | 2697 passed (2704)' in web_summary
    parity = load(folder / 'parity-probe.json')
    assert parity['rows'] == load(baseline / 'parity-probe.json')['rows'] and parity['probePass']
    assert not parity['newBaseline'] and not parity['officialClassBaselineApproved']
    multiplicity = Counter(identity(r) for r in report['findings'])
    result = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'pass': True, 'harness': sign(Path(__file__)),
              'inputs': [sign(p) for p in [input_path, prior_path, build_path, folder / 'check.json', folder / 'log.jsonl.gz', folder / 'parity-probe.json', baseline / 'log.jsonl.gz', baseline / 'parity-probe.json']],
              'findingEntries': len(report['findings']), 'distinctLocations': len(multiplicity), 'repeatedLocationEntriesPreserved': sum(n - 1 for n in multiplicity.values()),
              'previousSourceDigests': 427, 'verifiedCaseIdentifiers': total, 'unresolved': 47, 'objects': object_reviews,
              'negativeControls': controls, 'comparison': [o['comparison'] for o in report['objects']],
              'regression': {'sameSevenArtFailures': True, 'webSummary': web_summary, 'parityRowsUnchanged': True, 'gRegPass': False},
              'fullPrefixFindingsPass': False, 'fullHistoryPass': False,
              'limits': 'Only source-bound case-key semantics. No simulation replay or numeric metric verification. All other unresolved entries remain open. No captures or matching source digests emitted.'}
    output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ['pass', 'findingEntries', 'verifiedCaseIdentifiers', 'unresolved', 'negativeControls', 'fullHistoryPass']}))


if __name__ == '__main__':
    try:
        main(sys.argv[1])
    except BaseException:
        print('Independent semantic review failed; raw details suppressed', file=sys.stderr)
        raise SystemExit(1) from None
