#!/usr/bin/env python3
"""Publish loopable scene beds from the verified CC0 source catalogue."""
import hashlib,json,subprocess
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
RATE=48000
OUT=ROOT/'apps/web/public/audio'
catalog=json.loads((ROOT/'assets/audio-sources/CATALOG.json').read_text())['clips']
manifest=json.loads((OUT/'manifest.json').read_text())
licenses=json.loads((OUT/'LICENSES.json').read_text())
groups={
 'room':('empty-cafe-568356.flac',-25),
 'workshop':('kitchen-hum-637622.flac',-26),
 'night':('night-street-726615.flac',-24),
 'rain':('rain-window-872403.flac',-25),
}
hashfile=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
for kind,(filename,lufs) in groups.items():
 row=next(r for r in catalog if r['path'].endswith('/'+filename))
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/row['path']),'-t','25','-ac','1','-ar',str(RATE),'-f','f32le','pipe:1'])
 pcm=np.frombuffer(raw,dtype='<f4').copy();fade=RATE
 # Crossfade the last second into the first, keeping a continuous 24s loop.
 curve=np.linspace(0,1,fade)
 pcm[:fade]=pcm[:fade]*curve+pcm[-fade:]*(1-curve)
 pcm=pcm[:-fade];pack='scene-'+kind
 for extension,codec in [('webm','libopus'),('mp3','libmp3lame')]:
  target=OUT/f'{pack}.{extension}'
  subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-af',f'loudnorm=I={lufs}:TP=-5:LRA=9','-ar',str(RATE),'-c:a',codec,'-b:a','48k',str(target)],input=pcm.astype('<f4').tobytes(),check=True)
  rel=str(target.relative_to(ROOT));licenses['files']=[r for r in licenses['files'] if r['path']!=rel]
  licenses['files'].append({k:row[k] for k in ['sourceUrl','licenseUrl','license','author','date'] }|{'path':rel,'file':target.name,'sha256':hashfile(target),'sourceFiles':[{'path':row['path'],'sha256':row['sha256']}],'processing':'24s mono room-tone loop, one-second wrap crossfade, EBU loudness normalization; no reference media.'})
 manifest['packs'][pack]={'webm':f'/audio/{pack}.webm','mp3':f'/audio/{pack}.mp3'}
 print(pack,row['path'],len(pcm)/RATE)
screens={r['screen'] for r in json.loads((ROOT/'reports/v3-shell/b2/SOUND-MAP.json').read_text())['rows']}
for screen in screens:
 kind='night' if screen in ['battle','chapter-map','stage-select','battle-prep','landing','sign-in','season','season-supply'] else 'rain' if screen=='boss' else 'workshop' if 'forge' in screen or screen in ['bag','item-detail','batch-use','chain-fusion'] else 'room'
 manifest['cues']['ambience.'+screen]=[{'pack':'scene-'+kind,'start':0,'duration':24,'bus':'ambience','loop':True}]
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'LICENSES.json').write_text(json.dumps(licenses,indent=2)+'\n')
