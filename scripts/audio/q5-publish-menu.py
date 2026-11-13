#!/usr/bin/env python3
"""Publish the measured original dialogue; retain all failed probe evidence."""
import datetime, gzip, json, shutil, subprocess
import numpy as np
from callout_dsp import ROOT, RATE, decode, cat_speak
from publish_callouts import signed

B=ROOT/'reports/v3-shell/b2';OUT=ROOT/'apps/web/public/audio';source=B/'MENU-VOICE-LINES.json'
production=json.loads(source.read_text());probe_path=B/'q5/menu-delivery-probes.json';probe=json.loads(probe_path.read_text())
assert probe['sourceProduction']==signed(source)
assert len(probe['rows'])==len(production['lines'])==6
selected={r['source']['path']:(r,next(a for a in r['attempts'] if a['meetsDiagnosticCriteria'])) for r in probe['rows']}
for row in production['lines']:
 candidate,trial=selected[row['path']]
 assert candidate['source']==signed(ROOT/row['path'])
 assert signed(ROOT/trial['path'])['sha256']==trial['sha256']
 assert trial['wordAccuracy']>=.75 and -17<=trial['integratedLufs']<=-15 and trial['truePeakDbTP']<=-1
 for material in trial['sources']:assert signed(ROOT/material['path'])==material
archive=B/'q5/menu-before-delivery.json.gz'
assert not archive.exists(), 'Do not overwrite earlier publication evidence'
archive.write_bytes(gzip.compress(source.read_bytes()))
manifest=json.loads((OUT/'manifest.json').read_text());licences=json.loads((OUT/'LICENSES.json').read_text());by_path={r['path']:r for r in licences['files']}
changes=[];samples={};pieces=[];cursor=0;now=datetime.datetime.now(datetime.timezone.utc).isoformat()
for row in production['lines']:
 candidate,trial=selected[row['path']];path=ROOT/row['path'];before=signed(path)
 shutil.copyfile(ROOT/trial['path'],path);pcm=decode(path)
 row.update(**signed(path),text=candidate['text'],production=trial['production'],durationSeconds=len(pcm)/RATE,**{k:trial[k] for k in ['expected','recognized','wordAccuracy','model','prompt','beamSize','temperature','language']},**cat_speak.loudness(path))
 samples.setdefault(row['cueId'],[]).append({'pack':'menu-voices','start':cursor/RATE,'duration':len(pcm)/RATE,'bus':'voice','processedVoice':True,'variantId':path.name})
 pieces.extend([pcm,np.zeros(round(.04*RATE),dtype=np.float32)]);cursor+=len(pcm)+round(.04*RATE)
 by_path[row['path']].update(sha256=row['sha256'],date=now,prompt=row['text'],sourceFiles=trial['sources'],processing='Original menu dialogue; local Piper and CC0 grains, broader spoken formants with WORLD pitch preservation; measured -16 LUFS. No reference input.',processingEvidence='reports/v3-shell/b2/q5/menu-delivery-probes.json',formantProcessor={'tool':'pyworld 0.3.5','license':'MIT','evidence':'assets/audio-sources/license-evidence/pyworld-LICENSE.txt'})
 changes.append({'before':before,'after':signed(path),'candidate':{'path':trial['path'],'sha256':trial['sha256']},'text':row['text']})
pcm=np.concatenate(pieces).astype('<f4');encoded=[]
for ext,codec in [('webm','libopus'),('mp3','libmp3lame')]:
 path=OUT/f'menu-voices.{ext}';gain=0
 for _ in range(4):
  subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a',codec,'-b:a','64k',str(path)],input=(pcm*10**(gain/20)).astype('<f4').tobytes(),check=True)
  levels=cat_speak.loudness(path)
  if -17<=levels['integratedLufs']<=-15 and levels['truePeakDbTP']<=-1:break
  gain+=min(-16.5-levels['integratedLufs'],-1.1-levels['truePeakDbTP'])
 assert -17<=levels['integratedLufs']<=-15 and levels['truePeakDbTP']<=-1, levels
 by_path[str(path.relative_to(ROOT))].update(sha256=signed(path)['sha256'],processingEvidence='reports/v3-shell/b2/q5/menu-publication.json',spriteGainDb=gain)
 encoded.append({**signed(path),**levels,'spriteGainDb':gain})
manifest['cues'].update(samples)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(OUT/'LICENSES.json').write_text(json.dumps(licences,indent=2)+'\n')
source.write_text(json.dumps(production,indent=2)+'\n')
(B/'q5/menu-publication.json').write_text(json.dumps({'date':now,'probe':signed(probe_path),'before':signed(archive),'after':signed(source),'changes':changes,'encoded':encoded,'note':'Final mixed-render acceptance remains required.'},indent=2)+'\n')
print('Published six measured menu lines; both encoded sprites pass voice levels.',flush=True)
