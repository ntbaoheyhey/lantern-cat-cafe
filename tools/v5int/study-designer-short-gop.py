"""Bounded 1s/2s GOP trials from pinned four-plane sources; never changes runtime assets."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import struct
import subprocess
import sys
sys.path.insert(0, '/Users/bao/taskbar-hero-cardrpg-a6/work/v5/CXV/python')
import cv2
import numpy as np

cv2.setNumThreads(1)
ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT/'work/v5/CXI/batch-m'
OUT = BASE/'short-gop-r1'
OUT.mkdir(exist_ok=False)
sha = lambda p: hashlib.sha256(Path(p).read_bytes()).hexdigest()
now = lambda: datetime.now(timezone.utc).isoformat()
report = {'utc': now(), 'studyOnly': True, 'imagesViewed': 0, 'sourceBuild': '7625b028f2e129d6f9b6a9e8c4a0096f7a0223b0',
          'hypothesis': 'Closed 1s/2s GOPs reduce independently decodable segment size without changing the 300 source frames or quality thresholds.',
          'harnessSha256': sha(__file__), 'trials': [], 'complete': False,
          'limits': ['Offline comparison against estimated premultiplied matte only.', 'No browser, stall, original matte, seam, or cold-game acceptance.']}
def save():
    (OUT/'report.json').write_text(json.dumps(report, indent=2)+'\n')
def probe(path, entries):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', entries, '-of', 'json', str(path)]))
def packets(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_packets', '-show_data_hash', 'sha256', '-of', 'json', str(path)]))['packets']
def boxes(data):
    result = []; offset = 0
    while offset < len(data):
        size, kind = struct.unpack_from('>I4s', data, offset)
        if size == 1:
            size = struct.unpack_from('>Q', data, offset+8)[0]
        if size == 0:
            size = len(data)-offset
        assert size >= 8 and offset+size <= len(data)
        result.append({'offset': offset, 'size': size, 'type': kind.decode('ascii')}); offset += size
    assert offset == len(data)
    return result
save()
for cat, source_report in [('mochi', BASE/'four-plane-local-vslow-q22-r1/report.json'), ('clover', BASE/'clover-four-plane-q21-r1/report.json')]:
    source = json.loads(source_report.read_text()); previous = source['trials'][0]
    raw_path = Path(source['sourceRgba']); assert sha(raw_path) == source['sourceRgbaSha256']
    ew, eh = previous['encodedDimensions']; w, h = ew//2, eh//2
    raw = np.memmap(raw_path, np.uint8, 'r', shape=(300, h, w, 4))
    for seconds in [2, 1]:
        for name in ['STOP-ALL', 'STOP-CXI']:
            assert not (Path('/Users/bao/taskbar-hero-mailbox')/name).exists(), 'STOP: '+name
        folder = OUT/f'{cat}-{seconds}s'; folder.mkdir()
        video = folder/'native.mp4'; command = list(previous['command'])
        command[-1:] = ['-g', str(seconds*30), '-keyint_min', str(seconds*30), '-sc_threshold', '0', '-x264-params', 'open-gop=0', str(video)]
        trial = {'utc': now(), 'cat': cat, 'gopSeconds': seconds, 'sourceReport': str(source_report), 'sourceReportSha256': sha(source_report),
                 'sourceRgba': str(raw_path), 'sourceRgbaSha256': sha(raw_path), 'logicalSize': [w, h], 'command': command, 'complete': False}
        report['trials'].append(trial); save()
        process = subprocess.Popen(command, stdin=subprocess.PIPE)
        neutral = np.full((h, w), 128, np.uint8).tobytes()
        for frame in raw:
            color = cv2.cvtColor(frame[:, :, :3], cv2.COLOR_RGB2YCrCb)
            tile = np.block([[color[:, :, 0], color[:, :, 1]], [color[:, :, 2], frame[:, :, 3]]])
            process.stdin.write(tile.tobytes()+neutral+neutral)
        process.stdin.close(); assert process.wait() == 0
        stream = probe(video, 'stream=width,height,nb_frames,r_frame_rate,duration,pix_fmt,profile,level')['streams'][0]
        assert stream['nb_frames'] == '300' and stream['r_frame_rate'] == '30/1' and float(stream['duration']) == 10
        original_packets = packets(video)
        keys = [float(p['pts_time']) for p in original_packets if 'K' in p['flags']]
        assert keys == list(range(0, 10, seconds)), keys
        decoded_path = folder/'decoded.rgb'
        decode_command = ['ffmpeg', '-y', '-nostdin', '-v', 'error', '-i', str(video), '-vf', 'scale=in_color_matrix=bt601:in_range=full:out_range=full', '-pix_fmt', 'rgb24', '-f', 'rawvideo', str(decoded_path)]
        subprocess.run(decode_command, check=True, stdin=subprocess.DEVNULL)
        decoded = np.memmap(decoded_path, np.uint8, 'r', shape=(300, h*2, w*2, 3)); rows = []
        for index, (frame, packed) in enumerate(zip(raw, decoded)):
            tile = packed[:, :, 0]
            color = cv2.cvtColor(np.dstack([tile[:h, :w], tile[:h, w:], tile[h:, :w]]), cv2.COLOR_YCrCb2RGB).astype(float)
            alpha = tile[h:, w:].astype(float); reference = frame.astype(float)
            err = np.abs(np.clip(color+255-alpha[:, :, None], 0, 255)-np.clip(reference[:, :, :3]+255-reference[:, :, 3:4], 0, 255))
            foreground = frame[:, :, 3] > 16; edge = (frame[:, :, 3] > 4) & (frame[:, :, 3] < 250)
            rows.append({'frame': index, 'whiteMAE': float(err[foreground].mean()), 'blackMAE': float(np.abs(color-reference[:, :, :3])[foreground].mean()),
                         'edgeMAE': float(err[edge].mean()), 'maskMAE': float(np.abs(alpha-reference[:, :, 3]).mean())})
        metrics_path = folder/'metrics-300.json'; metrics_path.write_text(json.dumps(rows, indent=2)+'\n')
        fragment = folder/'fragmented.mp4'
        remux_command = ['ffmpeg', '-v', 'error', '-nostdin', '-y', '-i', str(video), '-map', '0:v:0', '-c', 'copy', '-movflags', 'frag_keyframe+empty_moov+default_base_moof+negative_cts_offsets', str(fragment)]
        subprocess.run(remux_command, check=True, stdin=subprocess.DEVNULL)
        remux_packets = packets(fragment)
        assert [p['data_hash'] for p in original_packets] == [p['data_hash'] for p in remux_packets]
        data = fragment.read_bytes(); container = boxes(data); moofs = [b for b in container if b['type'] == 'moof']; assert len(moofs) == len(keys)
        init = data[:moofs[0]['offset']]; (folder/'init.mp4').write_bytes(init); segments = []
        for i, box in enumerate(moofs):
            mdat = next(b for b in container if b['offset'] == box['offset']+box['size']); assert mdat['type'] == 'mdat'
            segment = data[box['offset']:mdat['offset']+mdat['size']]; p = folder/f'{i}.m4s'; p.write_bytes(segment)
            segments.append({'path': str(p), 'bytes': len(segment), 'sha256': sha(p), 'start': keys[i], 'end': keys[i+1] if i+1 < len(keys) else 10})
        white = float(np.mean([q['whiteMAE'] for q in rows])); edge_max = max(q['edgeMAE'] for q in rows); mask = float(np.mean([q['maskMAE'] for q in rows]))
        trial.update(video=str(video), bytes=video.stat().st_size, sha256=sha(video), streams=stream, keyframes=keys,
                     metricsPath=str(metrics_path), metricsSha256=sha(metrics_path), decodeCommand=decode_command, decodedSha256=sha(decoded_path),
                     foregroundWhiteMAE=white, edgeFrameMax=edge_max, maskMAE=mask, qualityPass=white<=3 and edge_max<=15 and mask<=2,
                     priorVideoBytes=previous['bytes'], videoIntakePass=video.stat().st_size<=1000000,
                     fragmentPath=str(fragment), fragmentSha256=sha(fragment), remuxCommand=remux_command, packetPayloadsExact=True,
                     maxRemuxPtsDelta=max(abs(float(a['pts_time'])-float(b['pts_time'])) for a,b in zip(original_packets, remux_packets)),
                     initBytes=len(init), initSha256=sha(folder/'init.mp4'), segments=segments,
                     initialSegmentBytesMax=len(init)+max(s['bytes'] for s in segments), complete=True, completedUTC=now())
        save(); print(json.dumps({k: trial[k] for k in ['cat','gopSeconds','bytes','foregroundWhiteMAE','edgeFrameMax','maskMAE','qualityPass','videoIntakePass','initialSegmentBytesMax']}), flush=True)
report.update(complete=True, completedUTC=now()); save()
