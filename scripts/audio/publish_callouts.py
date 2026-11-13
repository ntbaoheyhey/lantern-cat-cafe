"""Repack measured production takes without synthesizing successful lines again."""
import hashlib,json,subprocess
import numpy as np
from callout_dsp import ROOT,RATE,decode,features,cat_speak
REPORT=ROOT/'reports/v3-shell/b2';OUT=ROOT/'apps/web/public/audio'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
signed=lambda p:{'path':str(p.relative_to(ROOT)),'sha256':sha(p)}

def publish(production):
    manifest=json.loads((OUT/'manifest.json').read_text());licences=json.loads((OUT/'LICENSES.json').read_text())
    metadata=[];recognised=[];files=[]
    by_path={r['path']:r for r in licences['files']}
    for unit in production['units']:
        pack='callout-'+unit['unitId'];cursor=0;pieces=[]
        cues=list(dict.fromkeys(r['cueId'] for r in unit['lines']))
        for cue in cues:
            variants=[];samples=[];durations=[];logs=[];rows=[r for r in unit['lines'] if r['cueId']==cue]
            for row in rows:
                path=ROOT/row['path'];x=decode(path);levels=cat_speak.loudness(path)
                row.update(**signed(path),**levels,**features(x));files.append({**signed(path),**levels})
                by_path[row['path']]['sha256']=row['sha256']
                by_path[row['path']]['processing']='Local Piper public-domain voice + CC0 cat/mouth grains; per-character pitch/formants/EQ, effort and room tail; short-speech peak compression, two-pass -16 LUFS.'
                variants.append(signed(path));logs.append(row['recogniserLog']);durations.append(round(len(x)/RATE*1000))
                samples.append({'pack':pack,'start':cursor/RATE,'duration':len(x)/RATE,'bus':'voice','variantId':path.name,'processedVoice':True})
                pieces.extend([x,np.zeros(int(RATE*.02),dtype=np.float32)]);cursor+=len(x)+int(RATE*.02)
            manifest['cues'][cue]=samples
            first=rows[0];fields=['unitId','kind','phase','skillId','skillName','slot','cueId','text']
            metadata.append({**{k:first[k] for k in fields if k in first},'durationMs':max(durations),'syncPointMs':first['production']['firstWordMs']})
            recognised.append({'cueId':cue,'unitId':unit['unitId'],'kind':first['kind'],'text':first['text'],'variants':variants,
              'wordAccuracy':min(r['wordAccuracy'] for r in rows),'recogniserLog':logs[-1],'recogniserLogs':logs})
        data=np.concatenate(pieces).astype('<f4').tobytes()
        # 48k Opus changed short-word gating and overshot peaks non-monotonically
        # in the healer pack. 64k retains consonants and gives stable headroom.
        for fmt,codec,bitrate in [('webm','libopus','64k'),('mp3','libmp3lame','56k')]:
            path=OUT/f'{pack}.{fmt}'
            command=['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a',codec,'-b:a',bitrate,str(path)]
            subprocess.run(command,input=data,check=True)
            levels=cat_speak.loudness(path);gain_db=0
            for attempt in range(8):
                if -17 <= levels['integratedLufs'] <= -15 and levels['truePeakDbTP'] <= -1:
                    break
                # Codec/sprite boundary windows differ from isolated FLACs.
                # A constant gain trim preserves every character's spectrum.
                gain_db+=min(-16.7-levels['integratedLufs'],-1.1-levels['truePeakDbTP'])
                pcm=np.frombuffer(data,dtype='<f4')*10**(gain_db/20)
                subprocess.run(command,input=pcm.astype('<f4').tobytes(),check=True)
                levels=cat_speak.loudness(path)
                print('Encoded gain trim',path.name,attempt+1,round(gain_db,3),levels,flush=True)
            if not (-17<=levels['integratedLufs']<=-15 and levels['truePeakDbTP']<=-1):
                raise ValueError(f'Encoded sprite level repair failed: {path.name}: {levels}')
            by_path[str(path.relative_to(ROOT))]['sha256']=sha(path)
            by_path[str(path.relative_to(ROOT))]['spriteGainDb']=gain_db
            files.append({**signed(path),**levels,'spriteGainDb':gain_db})
        print('Packed',unit['unitId'],round(cursor/RATE,2),'seconds',flush=True)
    production.update(files=files,recognised=recognised)
    (REPORT/'VOICE-CALLOUTS-PRODUCTION.json').write_text(json.dumps(production,indent=2)+'\n')
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (OUT/'LICENSES.json').write_text(json.dumps(licences,indent=2)+'\n')
    (ROOT/'apps/web/src/audio/voice-callouts.json').write_text(json.dumps(metadata,indent=2)+'\n')

if __name__=='__main__':publish(json.loads((REPORT/'VOICE-CALLOUTS-PRODUCTION.json').read_text()))
