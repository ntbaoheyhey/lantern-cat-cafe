#!/usr/bin/env python3
"""Shorter original greetings with one clear spoken gesture per comment."""
import datetime
import json
from pathlib import Path
from analyse import analyse_file
from callout_dsp import ROOT, WORK, process, save, recognizer, recognize, cat_speak
from publish_callouts import signed

B = ROOT/'reports/v3-shell/b2'
source = B/'MENU-VOICE-LINES.json'
production = json.loads(source.read_text())
report = B/'q5/menu-phrase-probes.json'
result = json.loads(report.read_text()) if report.exists() else {
    'sourceProduction': signed(source),
    'method': 'Shorten two original menu lines into a single clear greeting; preserve character processing and licensed inputs. Unprompted local recognition and unchanged contour analyser; browser acceptance still required.',
    'rows': []}
assert result['sourceProduction'] == signed(source)
model = recognizer(threads=2)
for basename, phrases in [('mallow-1.flac', ['Welcome home!', 'Hello, little hero!']),
                          ('mochi-4.flac', ['Ready for tonight!', 'Ready, little hero!'])]:
    row = next(r for r in production['lines'] if Path(r['path']).name == basename)
    previous = next((r for r in result['rows'] if r['source']['path'] == row['path']), None)
    if previous is None:
        previous = {'source': signed(ROOT/row['path']), 'cueId': row['cueId'], 'unitId': row['unitId'], 'originalText': row['text'], 'attempts': [], 'complete': False}
        result['rows'].append(previous)
    if previous['complete']:
        continue
    options = [(text, pace) for text in phrases for pace in [1.1, 1.0]]
    for index, (text, pace) in enumerate(options):
        if index < len(previous['attempts']):
            continue
        settings = {**row['production']['settings'], 'paceMultiplier': pace}
        pcm, used, details = process({**row, 'text': text, 'kind': 'skill'}, 0, settings)
        path = WORK/'q5-menu-phrases'/f'{Path(basename).stem}-{index}.flac'
        save(path, pcm)
        levels = cat_speak.loudness(path)
        asr = recognize(model, path, text)
        metrics = analyse_file(path, duration=len(pcm)/24000)
        accepted = asr['wordAccuracy'] >= .75 and -17 <= levels['integratedLufs'] <= -15 and levels['truePeakDbTP'] <= -1 and len(metrics['voiceContourEvents']) == 1
        trial = {**signed(path), 'text': text, 'attempt': index+1, 'production': details,
                 'sources': [{'path': r['path'], 'sha256': r['sha256']} for r in {r['path']: r for r in used}.values()],
                 **levels, **asr, 'isolatedMetrics': metrics, 'meetsDiagnosticCriteria': accepted}
        previous['attempts'].append(trial)
        previous['complete'] = accepted or index == len(options)-1
        result['date'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        report.write_text(json.dumps(result, indent=2)+'\n')
        print(basename, text, index+1, asr['wordAccuracy'], len(metrics['voiceContourEvents']), 'CANDIDATE' if accepted else 'MISS', flush=True)
        if accepted:
            break
