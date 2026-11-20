"""Independent streaming marker review of the six signed JPEG exclusions."""
from pathlib import Path
from collections import Counter
import copy
import datetime
import gzip
import hashlib
import io
import json
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[3]
sha = lambda b: hashlib.sha256(b).hexdigest()
oid = lambda b: hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest()
sign = lambda p: {'path': str(p.resolve().relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
load = lambda p: json.loads(gzip.decompress(p.read_bytes()) if p.suffix == '.gz' else p.read_bytes())


def stream_review(data):
    stream = io.BytesIO(data)
    def take(n):
        b = stream.read(n); assert len(b) == n; return b
    assert take(2) == b'\xff\xd8'
    segments = [{'marker': 'D8', 'offset': 0, 'bytes': 2, 'payloadBytes': 0, 'fillBytes': 0}]
    entropy = []; jfif = []; frame = None; scans = 0; interval = 0; opaque = []; comments = []
    while True:
        offset = stream.tell(); assert take(1) == b'\xff'; fill = 0; code = take(1)[0]
        while code == 255: fill += 1; code = take(1)[0]
        assert code not in (0, 1, 216) and code not in range(208, 216)
        if code == 217:
            segments.append({'marker': 'D9', 'offset': offset, 'bytes': stream.tell() - offset, 'payloadBytes': 0, 'fillBytes': fill})
            assert stream.read(1) == b'' and frame and scans and len(jfif) == 1
            assert sum(s['bytes'] for s in segments) + sum(s['bytes'] for s in entropy) == len(data)
            return {'framingPass': True, 'metadataComplete': not opaque, 'bytes': len(data), 'segments': segments, 'markerCounts': dict(Counter(s['marker'] for s in segments)), 'entropy': entropy, 'unscannedEntropyBytes': sum(s['bytes'] for s in entropy), 'frame': frame, 'jfif': jfif, 'commentFields': len(comments), 'opaqueMetadata': opaque, 'trailingBytes': 0, 'pixelDecode': False}, comments
        length = int.from_bytes(take(2), 'big'); assert length >= 2; body = take(length - 2)
        segments.append({'marker': f'{code:02X}', 'offset': offset, 'bytes': stream.tell() - offset, 'payloadBytes': len(body), 'fillBytes': fill, 'payloadSha256': sha(body)})
        if code == 224 and body[:5] == b'JFIF\0':
            assert len(body) >= 14 and not frame and not scans
            major, minor, units = body[5:8]; xden = int.from_bytes(body[8:10], 'big'); yden = int.from_bytes(body[10:12], 'big'); x, y = body[12:14]
            assert major == 1 and minor <= 2 and units <= 2 and xden and yden and len(body) == 14 + 3 * x * y
            jfif.append({'version': [major, minor], 'units': units, 'density': [xden, yden], 'thumbnailDimensions': [x, y], 'unscannedThumbnailBytes': len(body) - 14})
            if x * y: opaque.append({'segment': len(segments) - 1, 'kind': 'thumbnail-pixels', 'bytes': 3 * x * y})
        elif code in range(224, 240):
            opaque.append({'segment': len(segments) - 1, 'kind': 'unsupported-APP', 'bytes': len(body)})
        elif code == 254:
            if b'\0' in body: opaque.append({'segment': len(segments) - 1, 'kind': 'NUL-comment', 'bytes': len(body)})
            else: comments.append(body)
        elif code == 192:
            assert not frame and len(body) >= 6
            n = body[5]; ids = list(body[6::3]); width = int.from_bytes(body[3:5], 'big'); height = int.from_bytes(body[1:3], 'big')
            assert body[0] == 8 and width and height and 1 <= n <= 4 and len(body) == 6 + 3 * n and len(set(ids)) == n
            frame = {'width': width, 'height': height, 'precision': 8, 'componentIds': ids, 'codec': 'mjpeg'}
        elif code == 221:
            assert len(body) == 2; interval = int.from_bytes(body, 'big')
        elif code == 218:
            assert frame and len(body) >= 4; n = body[0]; ids = list(body[1:1 + 2 * n:2])
            assert 1 <= n <= len(frame['componentIds']) and len(body) == 4 + 2 * n and len(set(ids)) == n and set(ids) <= set(frame['componentIds']) and body[-3:] == b'\0\x3f\0'
            scans += 1; begin = stream.tell(); stuffed = 0; restarts = []; next_restart = 208
            while True:
                point = stream.tell(); current = take(1)
                if current != b'\xff': continue
                next_byte = take(1)[0]; count = 1
                while next_byte == 255: count += 1; next_byte = take(1)[0]
                if next_byte == 0: assert count == 1; stuffed += 1
                elif next_byte in range(208, 216):
                    assert interval > 0 and next_byte == next_restart
                    restarts.append({'offset': point, 'bytes': stream.tell() - point, 'marker': f'{next_byte:02X}'})
                    next_restart = 208 + (next_restart - 207) % 8
                else:
                    assert point > begin
                    entropy.append({'offset': begin, 'bytes': point - begin, 'sha256': sha(data[begin:point]), 'stuffedPairs': stuffed, 'restartMarkers': restarts})
                    stream.seek(point); break
        else:
            assert code in (196, 219)


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    source = ROOT / 'reports/v4-ship/S11/history-jpeg-1.json'
    output = ROOT / f'reports/v4-ship/S11/history-jpeg-review-{attempt}.json'; assert not output.exists()
    report = load(source)
    for row in [*report['harness'], *report['inputs']]: assert sha((ROOT / row['path']).read_bytes()) == row['sha256']
    old = load(ROOT / 'reports/v4-ship/S11/history-png-1/rows.json.gz')
    selected = [r for r in old['rows'] if r['errors']]; inventory = load(ROOT / 'reports/v4-ship/S11/history-paths-1/inventory.json.gz')
    assert len(selected) == report['selectedObjects'] == len(report['objects']) == 6
    def accounting(rows):
        assert len(rows) == len(selected)
        for before, actual in zip(selected, rows):
            assert {k: actual[k] for k in ['oid', 'sha256', 'bytes', 'inventoryIndices']} == {k: before[k] for k in ['oid', 'sha256', 'bytes', 'inventoryIndices']}
            assert actual['mappings'] == [inventory[i] for i in before['inventoryIndices']] and actual['originalPngErrorsRetained'] == before['errors']
    accounting(report['objects']); controls = []; all_bytes = 0; all_entropy = 0
    def reject(name, fn):
        try: fn()
        except (AssertionError, ValueError): controls.append(name); return
        raise AssertionError('Negative control accepted')
    for row in report['objects']:
        mapping = row['mappings'][0]
        data = subprocess.check_output(['git', 'show', mapping['commit'] + ':' + mapping['path']], cwd=ROOT)
        assert oid(data) == row['oid'] and sha(data) == row['sha256'] and len(data) == row['bytes']
        parsed, comments = stream_review(data); assert parsed == row['parsed'] and not comments and not row['texts']
        assert row['probe'] == {'codec_name': 'mjpeg', 'width': parsed['frame']['width'], 'height': parsed['frame']['height']}
        all_bytes += len(data); all_entropy += parsed['unscannedEntropyBytes']
    fixture = data
    reject('independent-signature', lambda: stream_review(b'\0' + fixture[1:]))
    reject('independent-truncated-marker', lambda: stream_review(b'\xff\xd8\xff'))
    reject('independent-short-length', lambda: stream_review(fixture[:4] + b'\0\1' + fixture[6:]))
    reject('independent-length-overrun', lambda: stream_review(fixture[:4] + b'\xff\xff' + fixture[6:20]))
    reject('independent-missing-eoi', lambda: stream_review(fixture[:-2]))
    reject('independent-trailing-data', lambda: stream_review(fixture + b'x'))
    sos = next(r for r in parsed['segments'] if r['marker'] == 'DA')
    reject('independent-missing-sos', lambda: stream_review(fixture[:sos['offset']] + fixture[-2:]))
    modified, comments = stream_review(fixture[:-2] + b'\xff\xfe\0\7audit' + fixture[-2:]); assert modified['commentFields'] == 1 and comments == [b'audit']
    controls.append('independent-comment-after-entropy')
    modified, comments = stream_review(fixture[:-2] + b'\xff\xe1\0\7audit' + fixture[-2:]); assert not modified['metadataComplete'] and modified['opaqueMetadata'] and not comments
    controls.append('independent-unknown-app-gap')
    reject('missing-object', lambda: accounting(report['objects'][:-1]))
    reject('extra-object', lambda: accounting(report['objects'] + [report['objects'][0]]))
    reject('reordered-objects', lambda: accounting(list(reversed(report['objects']))))
    changed = copy.deepcopy(report['objects']); changed[0]['mappings'][0]['path'] = 'wrong/path'
    reject('wrong-source-mapping', lambda: accounting(changed))
    changed = copy.deepcopy(report['objects']); changed[0]['originalPngErrorsRetained'] = []
    reject('removed-original-png-failure', lambda: accounting(changed))
    def equal(a, b): assert a == b
    changed = copy.deepcopy(parsed); changed['segments'][1]['offset'] += 1
    reject('shifted-segment-boundary', lambda: equal(stream_review(fixture)[0], changed))
    assert all_bytes == report['bytes'] == 842227 and all_entropy == report['unscannedEntropyBytes'] == 839835
    assert report['commentFields'] == report['unknownMetadataSegments'] == report['imageOpens'] == 0
    assert report['comparison']['sameCodecAndDimensions'] and not report['textScans'] and not report['fullHistoryPass'] and not report['binaryCoveragePass']
    assert len(report['parserControls']) == 22 and all(c['pass'] for c in report['parserControls'])
    folder = ROOT / 'reports/v4-ship/S11/history-jpeg-regression-1'; baseline = ROOT / 'reports/v4-ship/S11/prefix3-residual-regression-1'
    regression = load(folder / 'check.json'); assert regression['complete']
    assert sha((ROOT / regression['log']['path']).read_bytes()) == regression['log']['sha256']
    assert {r['name']: r['exitCode'] for r in regression['rows']} == {'server': 0, 'rules': 0, 'web': 1, 'typecheck': 0, 'parity-probe': 0, 'build': 0}
    def web(path):
        logs = [json.loads(l) for l in gzip.decompress(path.read_bytes()).splitlines()]
        text = re.sub(r'\x1b\[[0-9;]*m', '', ''.join(r['text'] for r in logs if r['name'] == 'web'))
        return [l.strip() for l in text.splitlines() if re.match(r'\s*(FAIL|Tests\s|Test Files\s)', l)]
    summary = web(folder / 'log.jsonl.gz'); assert summary == web(baseline / 'log.jsonl.gz')
    assert sum(s.startswith('FAIL ') for s in summary) == 7 and 'Tests  7 failed | 2697 passed (2704)' in summary
    parity = load(folder / 'parity-probe.json'); assert parity['rows'] == load(baseline / 'parity-probe.json')['rows']
    assert parity['probePass'] and not parity['newBaseline'] and not parity['officialClassBaselineApproved']
    result = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'harness': sign(Path(__file__)), 'inputs': [sign(p) for p in [source, ROOT / 'reports/v4-ship/S11/history-png-1/rows.json.gz', folder / 'check.json', folder / 'log.jsonl.gz', folder / 'parity-probe.json', baseline / 'log.jsonl.gz', baseline / 'parity-probe.json']], 'pass': True, 'objects': 6, 'bytes': all_bytes, 'unscannedEntropyBytes': all_entropy, 'exactSegmentAndEntropyBoundaries': True, 'independentMethod': 'Buffered stream reads with byte-by-byte entropy traversal; git-show commit:path source verification.', 'originalPngErrorsPreserved': True, 'controls': controls, 'primaryParserControls': 22, 'sameSevenArtFailures': True, 'webSummary': summary, 'parityRowsUnchanged': True, 'gRegPass': False, 'fullHistoryPass': False, 'binaryCoveragePass': False, 'imageOpens': 0, 'limits': 'Only six JPEG metadata containers. No comments or unknown APP payloads exist in these exact bytes. Compressed samples, coding tables, encoded/steganographic contents and all other/later binary objects remain unreviewed; no image display or pixel output.'}
    output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ['pass', 'objects', 'bytes', 'unscannedEntropyBytes', 'sameSevenArtFailures', 'fullHistoryPass']} | {'independentControls': len(controls)}))


if __name__ == '__main__':
    try: main(sys.argv[1])
    except BaseException:
        print('Independent JPEG review failed; raw bytes suppressed', file=sys.stderr)
        raise SystemExit(1) from None
