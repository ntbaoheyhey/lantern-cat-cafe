"""Independently reduce palette production telemetry without replaying the fixture.

LEARN: reports/v4-ship/LEARN/S11-audio-delivery.md.
Historical evidence is bound to its original Git objects, not the current harness.
"""
from pathlib import Path
from urllib.parse import urlsplit
import datetime
import gzip
import hashlib
import json
import math
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
sha = lambda b: hashlib.sha256(b).hexdigest()
read = lambda p: json.loads((ROOT / p).read_bytes())
sign = lambda p: {'path': p, 'sha256': sha((ROOT / p).read_bytes())}


def verify(row):
    data = (ROOT / row['path']).read_bytes()
    assert sha(data) == row['sha256'], row['path']
    return data


def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT)


def journey(number, width):
    path = f'reports/v4-ship/S11/scene-journey-{number}.json'
    report = read(path)
    raw = json.loads(gzip.decompress(verify(report['events'])))
    verify(report['capture'])
    for row in report['harness']:
        assert sha(git('show', report['sourceCommit'] + ':' + row['path'])) == row['sha256']
    assert report['viewport'] == {'width': width, 'height': 720 if width == 1280 else 900}
    assert report['journeyPass'] and report['rollback']
    assert not any(report[k] for k in ['errors', 'blocked', 'failedRequests'])
    assert not raw['impact']['errors']
    receipt = report['receiptVerification']
    assert receipt['pass'] and receipt['receiptCount'] == len(raw['receipts']) == 18
    assert all(row['pass'] and all(row['checks'].values()) for row in receipt['rows'])
    assert {r['hash'] for r in receipt['rows']} == {r['hash'] for r in raw['receipts']}
    controls = [c for c in raw['controls'] if c['kind'] == 'click' and not c['disabled']]
    assert len(controls) == 10
    for control in controls:
        requests = [r for r in raw['requests'] if r['control'] == control['sequence'] and r['id'].startswith('ui.')]
        durations = []
        for request in requests:
            starts = [s for s in raw['starts'] if s['request'] == request['sequence'] and not s['loop']]
            if starts:
                durations.append((max(s['when'] + s['duration'] / s['rate'] for s in starts) - min(s['when'] for s in starts)) * 1000)
        assert durations and min(durations) <= 300 + 1e-6
    for receipt_row in raw['receipts']:
        requests = [r for r in raw['requests'] if r['receipt'] == receipt_row['sequence']]
        assert len(requests) == 1
        assert any(s['request'] == requests[0]['sequence'] and not s['loop'] for s in raw['starts'])
    times = sorted(s['when'] for s in raw['starts'])
    maximum = max(sum(t <= u < t + .1 - 1e-9 for u in times) for t in times)
    assert maximum == report['audio']['maxStartsPer100ms'] and maximum <= 6
    expected = [p for p in raw['impact']['plans'] if p['expectsAction']]
    assert len(expected) == report['impact']['causallyPlayedContacts'] == 124
    seen, predecoded, ranged, healer = set(), 0, 0, 0
    for plan in expected:
        events = [e for e in raw['impact']['events'] if e['plan'] == plan['sequence']]
        impacts = [e for e in events if e['role'] == 'impact']
        assert len(impacts) == 1 and len(impacts[0]['requests']) == 1
        request = impacts[0]['requests'][0]
        assert request not in seen
        seen.add(request)
        starts = [s for s in raw['starts'] if s['request'] == request and not s['loop']]
        assert starts
        observed = [r for r in raw['scene']['requests'] if r['request'] == request]
        assert len(observed) == 1
        decoded = all(s['pack'] in observed[0]['decoded'] for s in starts)
        assert decoded
        predecoded += decoded
        if plan['owner'] in ['soot', 'binding-thread']:
            ranged += 1
            allowed = ['v4-ranged-ember', 'v4-ranged-heavy'] if number >= 9 else ['v4-ranged-impacts']
            assert all(s['pack'] in allowed for s in starts)
        if plan['owner'] == 'clover':
            healer += 1
            assert impacts[0]['cue'] == 'heal.medium' and len(starts) == 1
            assert not any(e['role'] in ['movement', 'release', 'tail'] for e in events)
    assert ranged == 58 and healer == 16
    for phase in ['intro-battle', 'finale-battle']:
        samples = [s for s in raw['scene']['samples'] if s['phase'] == phase and s['battleVisible'] and not s['loading']]
        settled = [s for s in samples if s['at'] - samples[0]['at'] >= 1000]
        assert len(settled) >= 100
        for sample in settled:
            assert sample['desired'] == {'music': 'music.boss', 'ambience': 'ambience.boss'}
            active = {s['id'] for s in sample['active'] if s['gain'] > 0}
            assert {'music.boss', 'ambience.boss'} <= active and 'music.home' not in active
    voices = [s for s in raw['starts'] if s['bus'] == 'voice']
    duckers = [s for s in raw['starts'] if s['ducking']]
    end = lambda s: s.get('endedAudioTime', s['when'] + s['duration'] / s['rate'])
    held = [s for s in raw['scene']['samples'] if s['audioTime'] and any(v['when'] + .1 <= s['audioTime'] < end(v) for v in voices)]
    assert held and all(-8.0001 <= 20 * math.log10(s['duck']) <= -3.9999 for s in held)
    recovery = []
    for sample in raw['scene']['samples']:
        t = sample['audioTime']
        if not t or any(v['when'] <= t < end(v) for v in duckers):
            continue
        ends = [end(v) for v in duckers if end(v) <= t]
        if ends and t - max(ends) >= .45:
            recovery.append(sample)
    assert recovery and all(s['duck'] >= .995 for s in recovery)
    assert all(end(v) >= v['when'] + v['duration'] / v['rate'] - .05 for v in voices)
    ordering = []
    if number >= 9:
        selected = ['v4-ranged-ember', 'v4-ranged-heavy']
        for call in raw['scene']['sceneCalls']:
            if call['method'] != 'music' or call['id'] not in ['battle', 'boss']:
                continue
            rosters = [r for r in raw['scene']['rosterCalls'] if r['at'] <= call['at']]
            assert rosters and rosters[-1]['actors'] and rosters[-1]['selected'] == call['selected'] == selected
            preloads = [p for p in raw['scene']['preloads'] if p['at'] >= call['at'] and p['screen'] == call['id']]
            assert preloads and preloads[0]['selected'] == selected and set(selected) <= set(preloads[0]['decoded'])
            ordering.append({'musicAt': call['at'], 'rosterAt': rosters[-1]['at'], 'preloadAt': preloads[0]['at'], 'readyAt': preloads[0]['readyAt'], 'selected': selected})
        assert len(ordering) == 2 and report['sceneAudio']['rosterBeforeMusicPass']
    transfer = report['rehearsal']['transfer']
    assert transfer['valid'] and not any(transfer[k] for k in ['failed', 'incomplete', 'cached'])
    assert sum(r['totalBytes'] for r in transfer['resources']) == transfer['conservativeTransferBytes']
    images = sum(r['totalBytes'] for r in transfer['resources'] if r['type'] == 'Image')
    packs = [r for r in transfer['resources'] if '/audio/v4-ranged-' in r['path']]
    if number >= 9:
        assert sorted(urlsplit(r['path']).path for r in packs) == ['/audio/v4-ranged-ember.webm', '/audio/v4-ranged-heavy.webm']
    boss = report['rehearsal']['boss']
    assert boss['valid'] and boss['medianFps'] >= 50 and not boss['hiddenFrames']
    assert report['rehearsal']['gates']['noDevelopmentPath'] and not report['rehearsal']['gates']['transfer']
    assert all(report['mixGates'].values())
    mix = report['mix']
    assert -20 <= mix['lufs'] <= -16 and mix['peak'] <= -1 and mix['lra'] >= 5
    return {'evidence': sign(path), 'events': report['events'], 'capture': report['capture'], 'sourceCommit': report['sourceCommit'],
            'viewport': report['viewport'], 'rosterBeforeMusic': ordering, 'contacts': len(seen), 'predecodedContacts': predecoded,
            'rangedContacts': ranged, 'healerContacts': healer, 'verifiedReceipts': 18, 'receiptChimes': 18, 'primaryControls': 10,
            'maxStartsPer100ms': maximum, 'duckHeldSamples': len(held), 'duckRecoverySamples': len(recovery), 'voiceInterruptions': 0,
            'mix': mix, 'mixGates': report['mixGates'], 'sceneReadyBytes': transfer['conservativeTransferBytes'], 'imageBytes': images,
            'rangedResponses': packs, 'bossMedianFps': boss['medianFps'], 'estimatedOnsetMaxMs': max(r['estimatedAudioAfterSubmissionMs'] for r in report['impact']['rows']),
            'estimatedOnsetOver33ms': sum(not r['within33msEstimate'] for r in report['impact']['rows']), 'transferPass': False}


def web_summary(folder):
    rows = [json.loads(line) for line in gzip.decompress((ROOT / folder / 'log.jsonl.gz').read_bytes()).splitlines()]
    text = re.sub(r'\x1b\[[0-9;]*m', '', ''.join(r['text'] for r in rows if r['name'] == 'web'))
    return [line.strip() for line in text.splitlines() if re.match(r'\s*(FAIL|Tests\s|Test Files\s)', line)]


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    output = ROOT / f'reports/v4-ship/S11/ranged-palette-production-review-{attempt}.json'
    assert not output.exists()
    groups = {name: [journey(n, w) for n, w in zip(numbers, [1280, 1440])] for name, numbers in [('before', [7, 8]), ('after', [9, 10])]}
    assert len({r['sourceCommit'] for r in groups['after']}) == 1
    assert git('diff', '--name-only', groups['after'][0]['sourceCommit'], '--', 'apps/web/src', 'apps/web/public', 'packages/game-rules/src', 'supabase/functions').strip() == b''
    folder = 'reports/v4-ship/S11/ranged-palette-production-regression-1'
    previous = 'reports/v4-ship/S11/ranged-roster-regression-1'
    check = read(folder + '/check.json')
    verify(check['log'])
    assert check['complete'] and {r['name']: r['exitCode'] for r in check['rows']} == {'server': 0, 'rules': 0, 'web': 1, 'typecheck': 0, 'parity-probe': 0, 'build': 0}
    web = web_summary(folder)
    assert web == web_summary(previous) and sum(line.startswith('FAIL ') for line in web) == 7
    assert 'Tests  7 failed | 2697 passed (2704)' in web
    parity = read(folder + '/parity-probe.json')
    assert parity['rows'] == read(previous + '/parity-probe.json')['rows']
    assert parity['probePass'] and not parity['newBaseline'] and not parity['officialClassBaselineApproved']
    report = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'learn': 'reports/v4-ship/LEARN/S11-audio-delivery.md',
              'harness': sign(str(Path(__file__).relative_to(ROOT))), 'groups': groups,
              'comparison': [{'width': a['viewport']['width'], 'sceneReadyByteReduction': b['sceneReadyBytes'] - a['sceneReadyBytes'],
                              'rangedResponseByteReduction': sum(r['totalBytes'] for r in b['rangedResponses']) - sum(r['totalBytes'] for r in a['rangedResponses']),
                              'imageBytesUnchanged': a['imageBytes'] == b['imageBytes']} for b, a in zip(groups['before'], groups['after'])],
              'regression': {'inputs': [sign(f + '/' + name) for f in [folder, previous] for name in ['check.json', 'log.jsonl.gz', 'parity-probe.json']],
                             'sameSevenArtFailures': True, 'webSummary': web, 'parityRowsUnchanged': True, 'gRegPass': False},
              'observedProductionIntegrationPass': True, 'physicalOnsetVerified': False, 'humanListeningVerified': False,
              'overallAudioGatePass': False, 'rehearsalGatePass': False, 'officialClassParityPass': False,
              'limits': ['Two production journeys; all ten passing rehearsals remain required after transfer repairs.',
                         'Mix values are original FFmpeg reductions of hash-verified output captures; random takes differ between runs.',
                         'CDP transfer bytes include HTTP overhead. Encoded palette payload savings are a separate measurement.',
                         'Observed contacts do not cover every unit/skill. Output timestamps estimate onset; no physical or listening acceptance.',
                         'Historical harnesses are verified against their original committed source; their coverage/endurance is not transferred to the new runtime.']}
    output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'output': str(output.relative_to(ROOT)), 'productionIntegrationPass': True, 'comparison': report['comparison'], 'sameSevenArtFailures': True, 'overallAudioGatePass': False}))


if __name__ == '__main__':
    main(sys.argv[1])
