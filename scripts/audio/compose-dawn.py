"""Original dawn strings for the boss wave, following its authored D-minor score.

Two octaves of slow bowed harmonics open above the existing night score. No
recordings, reference media, paid tools or model calls are used.
"""
from pathlib import Path
import datetime,hashlib,json,subprocess
import numpy as np

ROOT=Path(__file__).resolve().parents[2]
RATE=48000
beat=.48
length=round(64*beat*RATE)
pcm=np.zeros(length,dtype=np.float64)
chords=[[50,53,57,60],[46,50,53,57],[48,52,55,58],[45,49,52,55]]
for bar in range(8):
    chord=chords[bar%4]
    duration=8*beat+.8
    t=np.arange(round(duration*RATE))/RATE
    envelope=np.minimum(1,t/1.4)*np.minimum(1,(duration-t)/1.2)
    tone=np.zeros(len(t))
    for i,midi in enumerate(chord):
        hz=440*2**((midi+12-69)/12)
        tone+=(np.sin(2*np.pi*hz*t+.025*np.sin(t*1.7))+.17*np.sin(4*np.pi*hz*t))*.055
        tone+=np.sin(2*np.pi*hz*1.0018*t+i*.7)*.018
    indices=(round(bar*8*beat*RATE)+np.arange(len(t)))%length
    np.add.at(pcm,indices,tone*envelope)

out=ROOT/'apps/web/public/audio'
manifest=json.loads((out/'manifest.json').read_text())
licences=json.loads((out/'LICENSES.json').read_text())
script=Path(__file__)
url='https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/v3-shell-2026-11-13/scripts/audio/compose-dawn.py'
for extension,codec in [('webm','libopus'),('mp3','libmp3lame')]:
    path=out/f'score-dawn.{extension}'
    subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0',
        '-af','loudnorm=I=-23:TP=-7:LRA=8','-ar',str(RATE),'-c:a',codec,'-b:a','48k',str(path)],
        input=pcm.astype('<f4').tobytes(),check=True)
    relative=str(path.relative_to(ROOT))
    licences['files']=[r for r in licences['files'] if r['path']!=relative]
    licences['files'].append({'path':relative,'file':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
        'sourceUrl':url,'licenseUrl':url,'license':'Own synthesis','author':'Taskbar Hero original synthesis',
        'date':datetime.datetime.now(datetime.timezone.utc).date().isoformat(),'tool':'Python NumPy + ffmpeg',
        'prompt':__doc__,'script':{'path':str(script.relative_to(ROOT)),'sha256':hashlib.sha256(script.read_bytes()).hexdigest()},
        'processing':'Mono 16-bar bowed harmonic score; same chord progression and tempo as original boss score; no reference media.'})
manifest['packs']['score-dawn']={e:f'/audio/score-dawn.{e}' for e in ['webm','mp3']}
manifest['cues']['music.boss.dawn']=[{'pack':'score-dawn','start':0,'duration':length/RATE,'bus':'music','loop':True}]
for chapter,kind in [(1,'night'),(2,'rain'),(3,'workshop')]:
    manifest['cues'][f'ambience.chapter-{chapter}']=[{'pack':f'scene-{kind}','start':0,'duration':24,'bus':'ambience','loop':True}]
(out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(out/'LICENSES.json').write_text(json.dumps(licences,indent=2)+'\n')
print(json.dumps({'dawnSeconds':length/RATE,'chapters':3,'encodedBytes':sum(p.stat().st_size for p in out.iterdir() if p.suffix in ['.mp3','.webm','.opus'])}))
