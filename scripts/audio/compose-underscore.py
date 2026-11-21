#!/usr/bin/env python3
"""Original Lantern battle underscore: plucked harp, bowed pad, bass and toms.

No recordings, reference media or model calls. The 16-bar score and instruments
are authored here; all synthesis is repeatable. Loop tails wrap into the intro.
"""
from pathlib import Path
import argparse,hashlib,json,subprocess
import numpy as np
RATE=48000
ROOT=Path(__file__).resolve().parents[2]

def score(kind,stems=None):
    beat=.5 if kind=='battle' else .48
    length=round(64*beat*RATE)
    out=np.zeros((length,2),dtype=np.float64)
    rng=np.random.default_rng(173 if kind=='battle' else 211)
    chords=[[50,53,57,60],[46,50,53,57],[48,52,55,58],[45,49,52,55]]
    melody=[74,77,76,72,74,69,72,76,77,81,79,77,76,72,73,69]
    def add(signal,start,gain,pan=0):
        indices=(round(start*RATE)+np.arange(len(signal)))%length
        out[indices,0]+=signal*gain*np.sqrt((1-pan)/2)
        out[indices,1]+=signal*gain*np.sqrt((1+pan)/2)
    def note(midi,start,duration,gain,kind='harp',pan=0):
        if stems is not None and kind not in stems:return
        t=np.arange(round(duration*RATE))/RATE;hz=440*2**((midi-69)/12)
        fade=np.minimum(1,(duration-t)/(.12 if kind=='harp' else .3))
        if kind=='pad':
            env=np.minimum(1,t/.35)*fade
            y=sum(np.sin(2*np.pi*hz*h*t+np.sin(2*np.pi*.22*t)*.06)/(h**1.8) for h in range(1,25) if hz*h<8500)
            y+=.25*np.sin(2*np.pi*hz*1.002*t)
            # Bow friction follows each sustained string envelope; a quiet,
            # continuous air component keeps the quartet from sounding like organs.
            bow=np.convolve(rng.normal(size=len(t)),np.ones(2)/2,'same')
            y+=.8*bow
        elif kind=='bass':
            env=(1-np.exp(-t/.018))*np.exp(-t/1.2)*fade
            y=np.sin(2*np.pi*hz*t)+.16*np.sin(4*np.pi*hz*t)
        elif kind=='flute':
            env=np.minimum(1,t/.06)*np.minimum(1,(duration-t)/.15)
            y=np.sin(2*np.pi*hz*t)+.09*np.sin(4*np.pi*hz*t)+.04*np.sin(6*np.pi*hz*t)
        else:
            env=(1-np.exp(-t/.008))*fade
            y=sum(np.sin(2*np.pi*hz*h*t)*np.exp(-t*(2+h*.65))/(h**2.1) for h in range(1,12) if hz*h<8500)
        signal=y*env
        add(signal,start,gain,pan)
        if kind in ['harp','flute']:add(signal,start+.042,gain*.12,-pan)
    for bar in range(16):
        chord=chords[(bar//2)%4];start=bar*4*beat
        for i,midi in enumerate(chord):note(midi,start,4*beat+.4,.027,'pad',(-.7+i*.45))
        note(chord[0]-24,start,4*beat,.12,'bass')
        for tick,position in enumerate([0,1,2,3]):
            note(chord[[0,2,1,3,2,1][tick]]+12,start+position*beat,beat*1.6,.095 if tick%2==0 else .065,'harp',(-.35 if tick%2==0 else .35))
        if bar%4 in [1,3]:
            for step in range(2):note(melody[(bar+step)%16],start+step*2*beat,beat*1.7,.05,'flute',.18)
        for tick in [0,2,3.5] if kind=='boss' else [0,2]:
            if stems is not None and 'tom' not in stems:continue
            t=np.arange(round(.4*RATE))/RATE
            freq=58+60*np.exp(-t/0.045)
            tom=np.sin(2*np.pi*np.cumsum(freq)/RATE)*(1-np.exp(-t/.004))*np.exp(-t/.11)*np.minimum(1,(.4-t)/.06)
            add(tom,start+tick*beat,.13 if tick==0 else .085)
    return out.astype('<f4')

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--output',default='tmp/b2-mix');parser.add_argument('--publish',action='store_true');args=parser.parse_args()
    if args.publish:args.output='assets/audio-sources/b2/music'
    dest=ROOT/args.output;dest.mkdir(parents=True,exist_ok=True)
    catalog=json.loads((ROOT/'assets/audio-sources/CATALOG.json').read_text())
    licenses=json.loads((ROOT/'apps/web/public/audio/LICENSES.json').read_text())
    manifest=json.loads((ROOT/'apps/web/public/audio/manifest.json').read_text())
    url='https://github.com/ntbaoheyhey/lantern-cat-cafe/blob/codex/v3-shell-2026-11-13/scripts/audio/compose-underscore.py'
    for kind in ['battle','boss']:
        pcm=score(kind);path=dest/f'original-{kind}-underscore.flac'
        subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','2','-i','pipe:0','-af','loudnorm=I=-16:TP=-3.5:LRA=9','-ar',str(RATE),str(path)],input=pcm.tobytes(),check=True)
        print(json.dumps({'kind':kind,'path':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'durationSeconds':len(pcm)/RATE}))
        if not args.publish:continue
        provenance={'sourceUrl':url,'licenseUrl':url,'license':'Own synthesis','author':'Taskbar Hero project (original score and instruments)','date':'2026-11-13','licenseEvidence':'scripts/audio/compose-underscore.py','sourceHash':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'processing':'Original 16-bar music; harp, pad, flute, bass and tom synthesis. No reference audio or recordings. Room texture is on a separate ambience bus.'}
        rel=str(path.relative_to(ROOT));decoded=subprocess.check_output(['ffmpeg','-v','error','-i',str(path),'-f','f32le','pipe:1']);samples=np.frombuffer(decoded,dtype='<f4')
        quality={'samplePeakDbFS':float(20*np.log10(max(np.max(np.abs(samples)),1e-12))),
                 'rmsDbFS':float(20*np.log10(max(np.sqrt(np.mean(samples*samples)),1e-12)))}
        row={**provenance,'id':'own-underscore:'+kind,'path':rel,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'role':'music','kind':'music','durationSeconds':len(pcm)/RATE,'sampleRate':RATE,'channels':2,'codec':'flac','quality':quality}
        catalog['clips']=[r for r in catalog['clips'] if r['path']!=rel]+[row]
        licenses['files']=[r for r in licenses['files'] if r['path']!=rel]+[{**row,'file':path.name}]
        pack='score-'+kind
        for extension,codec in [('webm','libopus'),('mp3','libmp3lame')]:
            encoded=ROOT/'apps/web/public/audio'/f'{pack}.{extension}'
            subprocess.run(['ffmpeg','-v','error','-y','-i',str(path),'-c:a',codec,'-b:a','80k',str(encoded)],check=True)
            target=str(encoded.relative_to(ROOT));licenses['files']=[r for r in licenses['files'] if r['path']!=target]+[{**provenance,'path':target,'file':encoded.name,'sha256':hashlib.sha256(encoded.read_bytes()).hexdigest(),'sourceFiles':[{'path':rel,'sha256':row['sha256']}]}]
        manifest['packs'][pack]={'webm':f'/audio/{pack}.webm','mp3':f'/audio/{pack}.mp3'}
        manifest['cues']['music.'+kind]=[{'pack':pack,'start':0,'duration':len(pcm)/RATE,'bus':'music','loop':True}]
    if args.publish:
        (ROOT/'assets/audio-sources/CATALOG.json').write_text(json.dumps(catalog,indent=2)+'\n')
        (ROOT/'apps/web/public/audio/LICENSES.json').write_text(json.dumps(licenses,indent=2)+'\n')
        (ROOT/'apps/web/public/audio/manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
if __name__=='__main__':main()
