#!/usr/bin/env python3
"""Two original result-screen scores; no samples, references, or external models."""
from pathlib import Path
import hashlib,json,runpy
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
LIB=runpy.run_path(str(Path(__file__).with_name('build-source-library.py')))
RATE=LIB['RATE']
AUTHOR='Taskbar Hero project (original synthesis)'
URL='https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/v3-shell-2026-11-13/scripts/audio/synthesize-result-music.py'


def score(kind):
    beat=.6 if kind=='victory' else .8
    total=16*4*beat
    data=np.zeros(round((total+2)*RATE),dtype=np.float32)
    chords=[[48,52,55],[53,57,60],[55,59,62],[48,52,55]] if kind=='victory' else [[45,48,52],[41,45,48],[50,53,57],[45,48,52]]
    melody=[72,76,79,76,77,76,74,72] if kind=='victory' else [69,67,64,62,65,64,62,57]
    def note(midi,start,duration,gain,soft=False):
        at=round(start*RATE);n=min(round(duration*RATE),len(data)-at)
        t=np.arange(n)/RATE;hz=440*2**((midi-69)/12)
        envelope=(1-np.exp(-t/.012))*np.exp(-t/(.8 if soft else .25))*np.minimum(1,np.maximum(0,(duration-t)/.12))
        tone=np.sin(2*np.pi*hz*t)+.21*np.sin(4*np.pi*hz*t)+.07*np.sin(6*np.pi*hz*t)
        data[at:at+n]+=(tone*envelope*gain).astype(np.float32)
    for bar in range(16):
        chord=chords[bar%4]
        note(chord[0]-12,bar*4*beat,3*beat,.12,True)
        for tick in range(8):
            note(chord[[0,1,2,1][tick%4]],(bar*4+tick*.5)*beat,beat,.065,True)
        for tick in range(4):
            note(melody[(bar*4+tick)%len(melody)],(bar*4+tick)*beat,beat*1.6,.11,kind=='defeat')
    data[-RATE*2:]*=np.linspace(1,0,RATE*2)
    return data


def main():
    source=Path(__file__)
    catpath=ROOT/'assets/audio-sources/CATALOG.json'
    catalog=json.loads(catpath.read_text())
    for kind in ['victory','defeat']:
        candidate={'id':'own-score:'+kind,'kind':'music','license':'Own synthesis','licenseUrl':URL,'sourceUrl':URL,
            'author':AUTHOR,'date':'2026-11-13','licenseEvidence':str(source.relative_to(ROOT)),
            'sourceHash':hashlib.sha256(source.read_bytes()).hexdigest()}
        data=score(kind)
        row=LIB['emit'](candidate,data,'music/original-'+kind+'.flac','music',trimmed=[0,len(data)/RATE],tags=[kind,'original-score'])
        catalog['clips']=[r for r in catalog['clips'] if r['path']!=row['path']]+[row]
    catalog['clips'].sort(key=lambda r:r['path'])
    catpath.write_text(json.dumps(catalog,indent=2)+'\n')
    count=LIB['licences'](catalog['clips'])
    summarypath=ROOT/'reports/v3-shell/b2/SOURCE-QUALITY.json'
    summary=json.loads(summarypath.read_text())
    summary.update({'clips':len(catalog['clips']),'licensedFiles':count,
        'music':sum(r['role']=='music' for r in catalog['clips']),
        'sourceBytes':sum((ROOT/r['path']).stat().st_size for r in catalog['clips'])})
    summarypath.write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps({'originalScores':2,'clips':summary['clips'],'music':summary['music'],'licensedFiles':count}))


if __name__=='__main__':main()
