"""Inspect exactly six PNG-review exclusions without displaying images."""
from pathlib import Path
import datetime
import gzip
import hashlib
import json
import subprocess
import sys
import time
from jpeg_metadata import inspect
from text_detector_client import Detector

ROOT = Path(__file__).resolve().parents[3]
sha = lambda b: hashlib.sha256(b).hexdigest()
sign = lambda p: {'path': str(p.resolve().relative_to(ROOT)), 'sha256': sha(p.read_bytes())}
oid = lambda b: hashlib.sha1(b'blob ' + str(len(b)).encode() + b'\0' + b).hexdigest()
load = lambda p: json.loads(gzip.decompress(p.read_bytes()) if p.suffix == '.gz' else p.read_bytes())


def controls(data):
    base, _ = inspect(data); sos = next(r for r in base['segments'] if r['marker'] == 'DA'); cases = []
    def reject(name, changed):
        try: inspect(changed)
        except ValueError as error: cases.append({'name': name, 'pass': True, 'error': str(error)}); return
        raise AssertionError('Rejected fixture was accepted: ' + name)
    reject('bad-signature', b'\0' + data[1:])
    reject('truncated-marker', b'\xff\xd8\xff')
    reject('short-length', data[:4] + b'\0\1' + data[6:])
    reject('length-overrun', data[:4] + b'\xff\xff' + data[6:20])
    reject('missing-eoi', data[:-2])
    reject('trailing-data', data + b'x')
    reject('nested-soi', data[:2] + b'\xff\xd8' + data[2:])
    reject('invalid-jfif-thumbnail', data[:18] + b'\1\1' + data[20:])
    reject('missing-sos', data[:sos['offset']] + data[-2:])
    reject('missing-jfif', data[:2] + data[20:])
    frame = next(r for r in base['segments'] if r['marker'] == 'C0')
    reject('unsupported-frame', data[:frame['offset'] + 1] + b'\xc2' + data[frame['offset'] + 2:])
    reject('standalone-restart', data[:2] + b'\xff\xd0' + data[2:])
    reject('stuffed-byte-outside-entropy', data[:2] + b'\xff\0' + data[2:])
    reject('restart-without-interval', data[:-2] + b'\xff\xd0' + data[-2:])
    def segment(marker, payload): return bytes([255, marker]) + (len(payload) + 2).to_bytes(2, 'big') + payload
    for name, payload in [('utf8-comment-after-entropy', b'audit-control'), ('embedded-eoi-in-comment', b'a\xff\xd9b')]:
        row, texts = inspect(data[:-2] + segment(254, payload) + data[-2:]); assert row['commentFields'] == 1 and row['metadataComplete']
        encoding = texts[0]['encoding']; assert texts[0]['payload'].decode().encode(encoding) == payload
        cases.append({'name': name, 'pass': True})
    row, _ = inspect(data[:-2] + b'\xff' + data[-2:]); assert row['segments'][-1]['fillBytes'] == 1; cases.append({'name': 'fill-before-eoi', 'pass': True})
    row, _ = inspect(data[:-2] + b'\xff\0' + data[-2:]); assert row['entropy'][0]['stuffedPairs'] == base['entropy'][0]['stuffedPairs'] + 1; cases.append({'name': 'stuffed-byte-in-entropy', 'pass': True})
    restarted = data[:sos['offset']] + segment(221, b'\0\1') + data[sos['offset']:-2] + b'\xff\xd0' + data[-2:]
    row, _ = inspect(restarted); assert len(row['entropy'][0]['restartMarkers']) == 1; cases.append({'name': 'bounded-restart-marker', 'pass': True})
    reject('wrong-restart-sequence', restarted[:-3] + b'\xd3' + restarted[-2:])
    for name, marker, payload in [('unknown-app-gap', 225, b'opaque'), ('nul-comment-gap', 254, b'a\0b')]:
        row, texts = inspect(data[:-2] + segment(marker, payload) + data[-2:]); assert not row['metadataComplete'] and row['opaqueMetadata'] and not texts
        cases.append({'name': name, 'pass': True, 'gapPreserved': True})
    return cases


def main(attempt):
    assert attempt.isdecimal() and not (ROOT / 'STOP-V4SHIP').exists()
    output = ROOT / f'reports/v4-ship/S11/history-jpeg-{attempt}.json'; assert not output.exists()
    check_path = ROOT / 'reports/v4-ship/S11/history-png-1/check.json'; old = load(check_path)
    for row in [*old['harness'], *old['inputs'], old['rows']]: assert sha((ROOT / row['path']).read_bytes()) == row['sha256']
    rows_path = ROOT / old['rows']['path']; original = load(rows_path)
    selected = [r for r in original['rows'] if r['errors']]; assert len(selected) == 6
    inventory_path = ROOT / 'reports/v4-ship/S11/history-paths-1/inventory.json.gz'; inventory = load(inventory_path)
    data_rows = []
    for row in selected:
        assert row['errors'] == [{'chunk': 0, 'offset': 8, 'code': 'not-png-signature'}]
        data = subprocess.check_output(['git', 'cat-file', 'blob', row['oid']], cwd=ROOT)
        assert oid(data) == row['oid'] and sha(data) == row['sha256'] and len(data) == row['bytes']
        mappings = [inventory[i] for i in row['inventoryIndices']]
        for mapping in mappings:
            assert mapping['oid'] == row['oid'] and mapping['path'].lower().endswith('.png')
            assert subprocess.check_output(['git', 'cat-file', 'blob', mapping['commit'] + ':' + mapping['path']], cwd=ROOT) == data
        data_rows.append((row, mappings, data))
    start = time.perf_counter(); parsed = [inspect(data) for _, _, data in data_rows]; parse_seconds = time.perf_counter() - start
    start = time.perf_counter(); probes = []
    command = ['ffprobe', '-v', 'error', '-f', 'mjpeg', '-i', 'pipe:0', '-show_entries', 'stream=codec_name,width,height', '-of', 'json']
    for _, _, data in data_rows:
        child = subprocess.run(command, input=data, capture_output=True); assert child.returncode == 0
        streams = json.loads(child.stdout)['streams']; assert len(streams) == 1
        probes.append({k: streams[0][k] for k in ['codec_name', 'width', 'height']})
    probe_seconds = time.perf_counter() - start
    rows = []; scans = []
    with Detector() as detector:
        for (old_row, mappings, data), (parsed_row, texts), probe in zip(data_rows, parsed, probes):
            assert probe == {'codec_name': 'mjpeg', **{k: parsed_row['frame'][k] for k in ['width', 'height']}}
            text_rows = []
            for text in texts:
                payload = text['payload']; scan = detector.scan(str(len(scans)), sha(payload) + '.txt', payload)
                record = {k: v for k, v in text.items() if k != 'payload'} | {'bytes': len(payload), 'sha256': sha(payload), 'findings': scan['findings']}
                text_rows.append(record); scans.append(record)
            rows.append({'oid': old_row['oid'], 'sha256': sha(data), 'bytes': len(data), 'inventoryIndices': old_row['inventoryIndices'], 'mappings': mappings, 'originalPngErrorsRetained': old_row['errors'], 'parsed': parsed_row, 'probe': probe, 'texts': text_rows})
        detector_ready = detector.ready
    fixtures = controls(data_rows[0][2])
    assert len(rows) == 6 and all(r['parsed']['framingPass'] and r['parsed']['metadataComplete'] for r in rows)
    assert not scans and all(not r['parsed']['opaqueMetadata'] and r['parsed']['commentFields'] == 0 for r in rows)
    result = {'at': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'learn': 'reports/v4-ship/LEARN/S11-history-jpeg.md', 'harness': [sign(Path(__file__)), sign(Path(__file__).with_name('jpeg_metadata.py'))], 'inputs': [sign(p) for p in [check_path, rows_path, inventory_path]], 'objects': rows, 'selectedObjects': 6, 'mappedPaths': sum(len(r['mappings']) for r in rows), 'bytes': sum(r['bytes'] for r in rows), 'commentFields': 0, 'unknownMetadataSegments': 0, 'unscannedEntropyBytes': sum(r['parsed']['unscannedEntropyBytes'] for r in rows), 'comparison': {'boundedMarkerSeconds': parse_seconds, 'ffprobeSeconds': probe_seconds, 'sameCodecAndDimensions': True, 'ffprobeVersion': subprocess.check_output(['ffprobe', '-version'], text=True).splitlines()[0], 'command': command, 'limits': 'Header identity/dimensions only; ffprobe is not complete metadata validation.'}, 'parserControls': fixtures, 'detector': detector_ready, 'textScans': scans, 'pass': True, 'fullHistoryPass': False, 'binaryCoveragePass': False, 'imageOpens': 0, 'pixelOutput': False, 'limits': 'Exactly six original PNG exclusions. Complete marker framing finds only fixed JFIF metadata and zero COM/other APP segments. Entropy-coded samples, coding tables, any encoded/steganographic contents, all other binary objects and later references remain excluded. No ART/runtime/scanner edits or image display.'}
    output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ['pass', 'selectedObjects', 'mappedPaths', 'bytes', 'commentFields', 'unknownMetadataSegments', 'unscannedEntropyBytes', 'fullHistoryPass']} | {'parserControls': len(fixtures), 'comparison': result['comparison']}))


if __name__ == '__main__':
    try: main(sys.argv[1])
    except BaseException:
        print('JPEG metadata inspection failed; raw bytes suppressed', file=sys.stderr)
        raise SystemExit(1) from None
