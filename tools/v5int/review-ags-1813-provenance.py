"""Snapshot the revised claim and preserve previously accepted timestamp artifacts."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json

root = Path(__file__).resolve().parents[2]
base = root/'work/v5/CXI/batch-m/ags-1813-review'
assert not base.exists()
base.mkdir()
now = datetime.now(timezone.utc).isoformat()
prior_review = json.loads((root/'reports/v5/CXI/evidence/v8-ags-1751-update-review.json').read_text())
artifacts = []
for row in prior_review['artifacts']:
    path = Path(row['path'])
    data = path.read_bytes()
    snapshot = base/path.name
    snapshot.write_bytes(data)
    digest = hashlib.sha256(data).hexdigest()
    artifacts.append(dict(path=str(path), snapshot=str(snapshot), bytes=len(data), sha256=digest,
                          changedSince1751=digest != row['sha256']))
prior = json.loads((root/'reports/v5/CXI/evidence/v8-ags-593-review.json').read_text())
verified = []
for run in prior['runs']:
    row = dict(name=run['name'], clip=run['clip'])
    for field in ['submitted', 'independentPacketRaw']:
        item = run[field]
        data = Path(item['path']).read_bytes()
        assert hashlib.sha256(data).hexdigest() == item['sha256']
        row[field] = item
        if field == 'independentPacketRaw':
            row['retainedPacketCount'] = len(json.loads(data)['packets'])
    verified.append(row)
sources = [
    dict(url='https://www.matroska.org/technical/cues.html', finding='Cues index Cluster positions for seeking; the document does not establish missing frame PTS from absent Cues.'),
    dict(url='https://www.matroska.org/technical/notes.html#block-timestamps', finding='Block timestamps derive from block-relative and Cluster timestamps, scales and codec delay; this storage is distinct from the seek index.'),
    dict(url='https://ffmpeg.org/ffmpeg-formats.html', finding='genpts generates absent PTS from available DTS; cues_to_front relocates an output index. Neither proves the blank-field cause in these MP4 trials.'),
    dict(url='https://ffmpeg.org/ffprobe.html', finding='show_entries selects fields per section; frames and packets are different records. A placeholder command is not executed provenance.'),
    dict(url='https://www.ffmpeg.org/doxygen/trunk/structAVFrame.html', finding='best_effort_timestamp is estimated decoded-frame timing using heuristics; do not substitute its meaning for unqualified source PTS.'),
]
receipt = root/'reports/v5/CXI/evidence/v8-ags-1813-provenance-review.json'
assert not receipt.exists()
result = dict(utc=now, trigger='Checkpoint found731-byte replacement timestamp assertion; no new DONE line.',
              artifacts=artifacts, retainedActualJSON=verified, sourceVerification=sources,
              accepted=['Four300-value raw JSONs and independent packet metadata still match recorded hashes;1200PTS partial acceptance preserved.'],
              rejected=['Missing-Cues explanation is unsupported and does not address the four MP4 trial inputs.',
                        'Prior29150-byte numeric summary was replaced by731-byte generic prose; old snapshot retained.',
                        'No executed before/after argv, version, original blank output, exit status or input hashes.',
                        'CPU source report and374-byte method unchanged; prior REDO remains open.'],
              tasksOpen=['T-CXI-13', 'T-M5', 'T-CXI-14', 'T-CXI-15'], productionAcceptance=False,
              method='Read-only snapshots and existing JSON hashes; no ffprobe/decode/conversion/browser during reserved host time.')
receipt.write_text(json.dumps(result, indent=2)+'\n')
note = Path('/Users/bao/taskbar-hero-mailbox/LEARN/CXI-staged-video-20261118.md')
paragraph = '\n\n'+now+' — Incremental timestamp review: four actual inputs are MP4 and prior no-genpts packets already contain1200numericPTS. Missing-Matroska-Cues cause remains unsupported. Exact blank-field cause still needs original versioned argv/output. No decode or conversion performed during CXV reservation.\n'
paragraph += '\n'.join('- '+s['url']+' — '+s['finding'] for s in sources)
paragraph += '\nEvidence: '+str(receipt)+'. EN/ZH searches performed;Chinese Matroska search returned official English sources,so AGS bilingual research remains open.\n'
note.write_text(note.read_text()+paragraph)
progress = root/'reports/v5/CXI/PROGRESS.log'
progress.write_text(progress.read_text()+now+' CXI two inline receipt attempts failed Python parsing before execution (literal newline escape). Switched to inspectable file script;no evidence or originals altered by failures. AGS numeric artifacts retained;new Cues claim rejected;CPU15 unchanged.\n')
print(json.dumps(dict(receipt=str(receipt), bytes=receipt.stat().st_size, packets=sum(r['retainedPacketCount'] for r in verified))))
