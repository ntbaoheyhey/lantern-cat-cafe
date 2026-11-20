"""Independently bind delivery evidence, exact PCM slices, offsets and raw reductions.

This is a byte/structure review, not another browser decoder or listening result.
"""
from pathlib import Path
import datetime
import gzip
import hashlib
import itertools
import json
import math
import re
import struct
import sys

ROOT = Path(__file__).resolve().parents[3]
attempt = sys.argv[1]
assert attempt.isdigit() and not (ROOT / 'STOP-V4SHIP').exists()
output = ROOT / f'reports/v4-ship/S11/ranged-delivery-review-{attempt}.json'
assert not output.exists(), 'Preserve previous evidence'


def signature(path):
    path = Path(path)
    data = (ROOT / path).read_bytes()
    return {'path': str(path), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}


def verify(record):
    data = (ROOT / record['path']).read_bytes()
    assert hashlib.sha256(data).hexdigest() == record['sha256'], record['path']
    if 'bytes' in record:
        assert len(data) == record['bytes'], record['path']
    return data


def read(path):
    return json.loads((ROOT / path).read_bytes())


def wave_pcm(data):
    assert data[:4] == b'RIFF' and data[8:12] == b'WAVE'
    assert struct.unpack_from('<I', data, 4)[0] + 8 == len(data)
    pos, chunks = 12, {}
    while pos < len(data):
        assert pos + 8 <= len(data)
        kind, size = data[pos:pos + 4], struct.unpack_from('<I', data, pos + 4)[0]
        pos += 8
        assert pos + size <= len(data) and kind not in chunks
        chunks[kind] = data[pos:pos + size]
        pos += size + size % 2
    assert pos == len(data)
    fmt = chunks[b'fmt ']
    encoding, channels, rate, byte_rate, align, bits = struct.unpack_from('<HHIIHH', fmt)
    assert (channels, rate, byte_rate, align, bits) == (1, 48000, 192000, 4, 32)
    if encoding == 65534:
        assert len(fmt) >= 40 and struct.unpack_from('<H', fmt, 16)[0] == 22
        assert fmt[24:40] == bytes.fromhex('0300000000001000800000aa00389b71')
    else:
        assert encoding == 3
    return chunks[b'data']


base = 'reports/v4-ship/S11/'
comparison_path = base + 'ranged-delivery-comparison-2.json'
cold_path = base + 'ranged-delivery-cold-1.json'
failed_path = base + 'ranged-delivery-attempt-1.json'
report, cold, failed = map(read, [comparison_path, cold_path, failed_path])
for record in report['inputs'] + report['harness'] + report['signature']:
    verify(record)
assert report['signature'] == cold['signature']
for record in [cold['input'], cold['harness'], cold['target'], cold['reference'], report['reusedCandidateAttempt']]:
    verify(record)
assert cold['input'] == {k: v for k, v in signature(comparison_path).items() if k != 'bytes'}
assert report['reusedCandidateAttempt'] == signature(failed_path)
old_source = gzip.decompress(verify(failed['preservedHarness']))
assert hashlib.sha256(old_source).hexdigest() == failed['harness']['sha256']
assert not failed['reconstructionPass'] and failed['exitCode'] == 1
assert failed['completedChromiumCasesFromProcessLog'] == 20
assert 'EncodingError' in failed['failure']
assert len(failed['candidateFiles']) == 25
for record in failed['candidateFiles']:
    verify(record)

source = read(base + 'ranged-class-bake-1.json')
pcm = verify(source['pcm'])
assert len(source['variants']) == source['uniqueSprites'] == 144
groups = {'ember': ['ember'], 'heavy': ['heavy'], 'shadow': ['shadow'], 'tide': ['tide'], 'ember-heavy': ['ember', 'heavy']}
packages = {p['id']: p for p in report['packages']}
assert len(packages) == len(report['packages']) == 5 and packages.keys() == groups.keys()
reviewed_pcm = []
for group, elements in groups.items():
    pack = packages[group]
    assert pack['elements'] == elements and pack['pack'] == 'v4-ranged-' + group
    original = [v for v in source['variants'] if v['element'] in elements]
    assert len(pack['variants']) == len(original) == 36 * len(elements)
    pieces, cursor = [], 0
    for src, target in zip(original, pack['variants']):
        start, length = round(src['sample']['start'] * 48000), round(src['sample']['duration'] * 48000)
        assert abs(start - src['sample']['start'] * 48000) < 1e-6
        assert abs(length - src['sample']['duration'] * 48000) < 1e-6
        assert 0 <= start < start + length <= len(pcm) // 4
        expected = dict(src, sample=dict(src['sample'], pack=pack['pack'], start=cursor / 48000))
        assert target == expected
        pieces.extend([pcm[start * 4:(start + length) * 4], bytes(3840 * 4)])
        cursor += length + 3840
    expected_pcm = b''.join(pieces)
    assert cursor == pack['samples'] and verify(pack['pcm']) == expected_pcm
    assert wave_pcm(verify(pack['reference'])) == expected_pcm
    padded = Path(pack['pcm']['path']).with_name('vorbis-input.f32')
    assert (ROOT / padded).read_bytes() == bytes(128 * 4) + expected_pcm
    for record in pack['files']:
        verify(record)
        assert record in [dict(format=record['format'], **f) for f in failed['candidateFiles']]
    reviewed_pcm.append({'group': group, 'sprites': len(original), 'frames': cursor, 'bytes': len(expected_pcm)})

rows = json.loads(gzip.decompress(verify(report['raw'])))
key = lambda r: (r['browser'], r['rate'], r['group'], r['format'])
expected = set(itertools.product(['chromium', 'webkit'], [48000, 44100], groups, ['webm', 'mp3']))
assert len(rows) == len(expected) == 40 and {key(r) for r in rows} == expected
assert [{k: v for k, v in r.items() if k != 'variants'} for r in rows] == report['rows']
total_sprites = 0
for row in rows:
    variants = row['variants']
    assert [r['variantId'] for r in variants] == [r['sample']['variantId'] for r in packages[row['group']]['variants']]
    assert row['decoded'] and row['channels'] == 1 and row['sampleRate'] == row['rate']
    assert row['lagSamples'] == list(dict.fromkeys(r['lagSamples'] for r in variants)) == [0]
    for variant in variants:
        assert variant['lagMs'] == 0 and variant['canonical'] == variant['aligned']
        measurement = variant['canonical']
        assert all(math.isfinite(measurement[k]) for k in ['correlation', 'rmsDeltaDb', 'errorToSignalDb'])
        assert measurement['complete'] and measurement['correlation'] >= .99 and abs(measurement['rmsDeltaDb']) <= .1
    assert row['minimumCanonicalCorrelation'] == min(v['canonical']['correlation'] for v in variants)
    assert row['minimumAlignedCorrelation'] == min(v['aligned']['correlation'] for v in variants)
    assert row['maximumAlignedRmsDeltaDb'] == max(abs(v['aligned']['rmsDeltaDb']) for v in variants)
    assert row['allComplete'] == all(v['aligned']['complete'] for v in variants)
    total_sprites += len(variants)
assert report['reconstructionPass'] and total_sprites == 1728

monolith = {r['format']: r for r in report['inputs'] if r['path'].startswith('apps/web/public/audio/v4-ranged-impacts.')}
assert monolith.keys() == {'webm', 'mp3'}
baseline = report['baselineDecodes']
assert len(baseline) == 8
assert {(r['browser'], r['rate'], r['file']['format']) for r in baseline} == set(itertools.product(['chromium', 'webkit'], [48000, 44100], monolith))
assert all(r['decoded'] and r['channels'] == 1 and r['frames'] > 0 and r['sampleRate'] == r['rate'] and r['file'] == monolith[r['file']['format']] for r in baseline)

case_elements = {k: [k] for k in ['ember', 'heavy', 'shadow', 'tide']}
case_elements.update({'observed-trial-boss': ['ember', 'heavy'], 'all-ranged-palettes': ['ember', 'heavy', 'shadow', 'tide']})
costs = report['costs']
assert len(costs) == 36
assert {(r['name'], r['format'], r['method']) for r in costs} == set(itertools.product(case_elements, monolith, ['monolith', 'palettes', 'encounter-with-fallback']))
for row in costs:
    elements = case_elements[row['name']]
    assert row['elements'] == elements
    choose = lambda group: next(f for f in packages[group]['files'] if f['format'] == row['format'])
    if row['method'] == 'monolith':
        selected = [monolith[row['format']]]
    elif row['method'] == 'palettes':
        selected = [choose(g) for g in ['ember', 'heavy', 'shadow', 'tide'] if g in elements]
    else:
        selected = ([choose('ember-heavy')] if set(elements) & {'ember', 'heavy'} else []) + ([monolith[row['format']]] if set(elements) & {'shadow', 'tide'} else [])
    assert row['requests'] == len(selected) and row['encodedPayloadBytes'] == sum(f['bytes'] for f in selected)
    assert row['files'] == [{k: f[k] for k in ['path', 'sha256']} for f in selected]

sequence = ['unprimed', 'monolith-prime', 'monolith-prime', 'unprimed', 'monolith-prime', 'unprimed', 'unprimed', 'monolith-prime']
assert cold['complete'] and cold['allFreshProcessCasesDecode'] and len(cold['rows']) == 16
assert cold['target'] == next(f for f in packages['ember']['files'] if f['format'] == 'webm')
assert cold['reference'] == packages['ember']['reference']
assert [(r['rate'], r['index']) for r in cold['rows']] == list(itertools.product([48000, 44100], range(8)))
for row in cold['rows']:
    assert row['browser'] == 'webkit' and row['decoded'] and row['channels'] == 1
    assert row['rate'] == row['sampleRate'] and row['frames'] > 0 and math.isfinite(row['elapsedMs']) and row['elapsedMs'] >= 0
    assert row['method'] == sequence[row['index']]
    assert row['steps'] == (['primer', 'primer'] if row['method'] == 'monolith-prime' else []) + ['reference', 'target']
assert cold['summary'] == [{'method': m, 'cases': 8, 'decoded': 8} for m in ['unprimed', 'monolith-prime']]

prior_log = base + 'ranged-evidence-regression-1/log.jsonl.gz'
current_log = base + 'ranged-delivery-regression-1/log.jsonl.gz'
check_path = base + 'ranged-delivery-regression-1/check.json'
check = read(check_path)
verify(check['log'])
assert check['complete'] and not check['commandsPassed'] and not check['officialClassParityGate']
assert {r['name']: r['exitCode'] for r in check['rows']} == {'server': 0, 'rules': 0, 'web': 1, 'typecheck': 0, 'parity-probe': 0, 'build': 0}


def web_summary(path):
    log = [json.loads(line) for line in gzip.decompress((ROOT / path).read_bytes()).splitlines()]
    text = ''.join(r['text'] for r in log if r['name'] == 'web')
    text = re.sub(r'\x1b\[[0-9;]*m', '', text)
    return [line.strip() for line in text.splitlines() if re.match(r'\s*(FAIL|Tests\s|Test Files\s)', line)]


prior, current = web_summary(prior_log), web_summary(current_log)
assert prior == current and sum(line.startswith('FAIL ') for line in current) == 7
assert 'Tests  7 failed | 2690 passed (2697)' in current
assert not report['runtimeChanged'] and not cold['runtimeChanged'] and not failed['runtimeChanged']
assert not report['overallTransferGatePass'] and not report['physicalOnsetVerified'] and not report['humanListeningVerified'] and not cold['overallAudioGatePass']
result = {
    'at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'harness': signature(Path(__file__).relative_to(ROOT)),
    'inputs': [signature(p) for p in [comparison_path, cold_path, failed_path, prior_log, current_log, check_path]],
    'preservedOriginalHarnessVerified': True, 'exactCandidateFilesVerified': 25,
    'pcmReconstruction': reviewed_pcm, 'browserCases': len(rows), 'spriteMeasurements': total_sprites,
    'minimumCorrelation': min(r['minimumCanonicalCorrelation'] for r in rows),
    'maximumRmsDeltaDb': max(r['maximumAlignedRmsDeltaDb'] for r in rows),
    'baselineDecodeCases': len(baseline), 'freshProcessDecodeCases': len(cold['rows']), 'costRowsVerified': len(costs),
    'sameSevenArtFailures': True, 'webSummary': current, 'gRegPass': False, 'officialClassParityPass': False,
    'runtimeChanged': False, 'pass': True,
    'limits': [
        'Independently verifies signed bytes, PCM reconstruction, WAV payloads, offsets, case completeness and raw reductions; does not rerun browser measurements.',
        'Original WebKit EncodingError remains unresolved. Later primed and unprimed fresh-process successes do not reset operating-system decoder caches or establish a cause.',
        'Encoded payload comparison only; candidates are not installed, network savings/readiness/onset/listening/global acceptance are not inferred.'
    ]
}
output.write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({k: result[k] for k in ['pass', 'browserCases', 'spriteMeasurements', 'freshProcessDecodeCases', 'sameSevenArtFailures', 'minimumCorrelation', 'maximumRmsDeltaDb']}))
