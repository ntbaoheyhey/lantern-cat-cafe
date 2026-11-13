#!/usr/bin/env python3
"""B2 SFX sprite production. Source paths/hashes come from the S2 CC0 catalogue.
No reference media, network calls or temporary WAVs. Reproducible 48 kHz PCM in memory.
"""
import json,hashlib,subprocess,re,sys
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'apps/web/public/audio'; REPORT=ROOT/'reports/v3-shell/b2'
RATE=48000
catalog=json.loads((ROOT/'assets/audio-sources/CATALOG.json').read_text())['clips']
manifest=json.loads((OUT/'manifest.json').read_text())
licences=json.loads((OUT/'LICENSES.json').read_text())
plans={r['cueId']:r for r in json.loads((REPORT/'SOUND-MAP.json').read_text())['rows']}
sha=lambda b:hashlib.sha256(b).hexdigest()
chunks={};cursors={};members={};designs={};bindings={};cache={};baked_count=0

def sources(pack,*prefixes,n=6):
 rows=[r for r in catalog if '/'+pack+'/' in r['path'] and any(Path(r['path']).stem.startswith(p) for p in prefixes)]
 if len(rows)<n: raise ValueError((pack,prefixes,len(rows),n))
 return rows[:n]

def pcm(row,role):
 key=(row['path'],role)
 if key in cache:return cache[key]
 duration={'transient':.12,'body':.52,'tail':.85,'sweetener':.20,'foley':.34}.get(role,.25)
 filt={'transient':'highpass=f=650','body':'lowpass=f=1800','tail':'lowpass=f=4200,aecho=0.7:0.5:42|79:0.18|0.1','sweetener':'highpass=f=1800','foley':'highpass=f=80'}[role]
 # A useful attack must remain even for an 11 ms UI source.
 b=subprocess.check_output(['ffmpeg','-v','error','-i',str(ROOT/row['path']),'-t',str(duration),'-af',filt,'-ac','1','-ar',str(RATE),'-f','f32le','pipe:1'])
 x=np.frombuffer(b,dtype='<f4').copy(); peak=float(np.max(np.abs(x)))
 if peak>0:x*=min(2,.45/peak)
 fade=min(96,len(x)//4)
 if fade:x[:fade]*=np.linspace(0,1,fade);x[-fade:]*=np.linspace(1,0,fade)
 cache[key]=x
 return x

def append(pack,data,variant,bus='sfx',row=None):
 start=cursors.get(pack,0);chunks.setdefault(pack,[]).extend([data,np.zeros(3840,dtype=np.float32)])
 cursors[pack]=start+len(data)+3840
 if row:members.setdefault(pack,{})[row['path']]=row
 return {'pack':pack,'start':start/RATE,'duration':len(data)/RATE,'bus':bus,'variantId':variant}

def layer(pack,role,rows,offset,gain,bus='sfx'):
 variants=[]
 for row in rows:
  key=(pack,row['path'],role,bus)
  if key not in sample_cache:sample_cache[key]=append(pack,pcm(row,role),row['id']+'/'+role,bus,row)
  variants.append(sample_cache[key])
 return {'role':role,'variants':variants,'offsetMs':offset,'eq':'low-shelf-180' if role=='body' else 'high-pass-1800' if role=='sweetener' else 'high-pass-80' if role=='foley' else 'flat','gainDb':gain}

sample_cache={}
cloth=sources('rpg-audio','cloth')
wood=sources('impact-sounds','impactWood_heavy','impactWood_medium')
glass=sources('impact-sounds','impactGlass_heavy','impactGlass_medium')
punch=sources('impact-sounds','impactPunch_heavy','impactPunch_medium')
metal=sources('impact-sounds','impactMetal_heavy','impactMetal_medium')
light=sources('impact-sounds','impactGeneric_light','impactGlass_light')
whoosh=sources('rpg-audio','knifeSlice','drawKnife','clothBelt')
magic=sources('digital-audio','pepSound','phaseJump')
kind_rows={
 'blunt':[punch,wood,sources('impact-sounds','impactSoft_heavy','impactSoft_medium'),cloth],
 'slash':[light,sources('impact-sounds','impactPlank_medium','impactMining'),whoosh,sources('impact-sounds','impactGlass_light','impactGlass_medium')],
 'magic':[sources('impact-sounds','impactGlass_light','impactGlass_medium'),magic,glass,sources('interface-sounds','glass')],
 'heavy':[metal,punch,sources('impact-sounds','impactBell_heavy','impactPlate_heavy'),wood],
}
for kind,groups in kind_rows.items():
 designs['hit.'+kind]={'bus':'sfx','layers':[layer('b2-hits',role,rs,offset,gain) for role,rs,offset,gain in zip(['transient','body','tail','sweetener'],groups,[0,7,18,23],[-7,-4,-12,-16])],'pitchRange':[.94,1.06],'gainRange':[-1.5,1.5],'cooldownMs':30,'priority':60}

for element in ['magic','slash','heavy','fire','ice','nature','arcane','holy','shadow','lightning','hearth','moon','garden','tide','ember']:
 for phase in ['charge','release','impact','tail']:
  kind='slash' if element=='slash' else 'heavy' if element in ['heavy','hearth'] else 'magic'
  if phase=='impact':designs[f'kit.{element}.{phase}']=designs['hit.'+kind];continue
  rows=magic if phase=='charge' else whoosh if phase=='release' else glass
  pack='b2-magic' if phase=='charge' else 'b2-motion'
  layers=[layer(pack,'transient' if phase=='release' else 'body',rows,0,-10),layer('b2-motion','foley',cloth,9,-17),layer(pack,'tail',rows,22,-18)]
  designs[f'kit.{element}.{phase}']={'bus':'sfx','layers':layers,'pitchRange':[.94,1.06],'gainRange':[-1.5,1.5],'cooldownMs':45,'priority':45,'ducking':False}

ui_groups={
 'click':sources('ui-audio','click','mouseclick'), 'hover':sources('ui-audio','rollover'),
 'open':sources('interface-sounds','open','maximize'), 'close':sources('interface-sounds','close','minimize'),
 'tab':sources('ui-audio','switch'), 'fail':sources('interface-sounds','error'),
 'confirm':sources('interface-sounds','confirmation','maximize'), 'scroll':sources('interface-sounds','scroll','tick'),
 'toggle':sources('interface-sounds','toggle','switch'), 'coin':sources('casino-audio','chips-collide','chips-handle'),
 'reward':sources('interface-sounds','glass'), 'turn':sources('interface-sounds','tick','click'),
 'heal':sources('interface-sounds','maximize'), 'death':sources('interface-sounds','minimize'),
 'hammer':metal,'page':sources('rpg-audio','bookFlip','bookPlace'),
 'flip':sources('casino-audio','card-slide'),
}
for name,rows in ui_groups.items():
 layers=[layer('b2-ui','transient',rows,0,-7,'ui'),layer('b2-ui','sweetener',ui_groups['turn'],12,-19,'ui')]
 d={'bus':'ui','layers':layers,'pitchRange':[.97,1.03],'gainRange':[-1.5,1.5],'cooldownMs':80 if name in ['hover','scroll'] else 30,'priority':20}
 if name in ['click','hover','tab','scroll','turn']:
  baked=[]
  for i,row in enumerate(rows):
   a=pcm(row,'transient')*10**(-7/20);r2=ui_groups['turn'][(i+2)%6];b=pcm(r2,'sweetener')*10**(-19/20);shift=576
   data=np.zeros(max(len(a),len(b)+shift),dtype=np.float32);data[:len(a)]+=a;data[shift:shift+len(b)]+=b
   sample=append('b2-ui-baked',data,f'ui.{name}/{i}','ui',row);members['b2-ui-baked'][r2['path']]=r2
   baked.append({'sample':sample,'layers':[{'role':'transient','variantId':row['id']+'/transient','offsetMs':0},{'role':'sweetener','variantId':r2['id']+'/sweetener','offsetMs':12}]})
  d['baked']=baked;baked_count+=1
 designs['ui.'+name]=d

for phase in ['on','off','tick']:
 d={'bus':'sfx','layers':[layer('b2-magic','transient',magic,0,-15),layer('b2-motion','foley',cloth,12,-20)],'pitchRange':[.94,1.06],'gainRange':[-1.5,1.5],'cooldownMs':50,'priority':35}
 designs['status.default.'+phase]=d
for id,p in plans.items():
 if id.startswith(('voice.','music.','ambience.')):continue
 key=id
 if id.startswith('ult.'):key='kit.magic.'+id.split('.')[-1]
 elif id.startswith('skill.'):key='kit.magic.'+('charge' if id.endswith('.cast') else 'impact')
 elif id.startswith('status.'):key='status.default.'+id.split('.')[-1]
 elif id.startswith('move.') or id in ['dodge','miss']:key='kit.slash.release'
 elif id not in designs:
  token='fail' if re.search('fail|denied',id) else 'hammer' if 'hammer' in id else 'flip' if 'flip' in id else 'page' if 'page' in id else 'close' if re.search('close|consume|cancel',id) else 'open' if re.search('open|charge|grab',id) else 'heal' if re.search('heal|blessing',id) else 'death' if 'death' in id else 'coin' if re.search('coin|currency|withdraw|spool',id) else 'reward' if re.search('reward|reveal|star|level|pity|item.land',id) else 'confirm' if re.search('confirm|success|ready|mint|buy|list|batch',id) else 'tab' if 'tab' in id else 'toggle' if 'toggle' in id else 'scroll' if re.search('scroll|slider|quantity',id) else 'turn' if re.search('turn|round|count.tick',id) else 'click'
  key='ui.'+token
 if key not in designs:raise ValueError((id,key))
 # Keep the cue's intended bus and priority rather than inheriting UI categories for battle effects.
 if p['bus']!=designs[key]['bus'] or id=='count.tick':
  d=json.loads(json.dumps(designs[key]));d['bus']=p['bus'];d['priority']=p['priority'];d['cooldownMs']=p['cooldownMs']
  for l in d['layers']:
   for s in l['variants']:s['bus']=p['bus']
  for b in d.get('baked',[]):b['sample']['bus']=p['bus']
  designs[id]=d;key=id
 bindings[id]=key

new_packs=set(chunks)
for pack,items in chunks.items():
 data=np.concatenate(items).astype('<f4').tobytes()
 for fmt,codec in [('webm','libopus'),('mp3','libmp3lame')]:
  path=OUT/f'{pack}.{fmt}';subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(RATE),'-ac','1','-i','pipe:0','-c:a',codec,'-b:a','72k',str(path)],input=data,check=True)
  rel=str(path.relative_to(ROOT));licences['files']=[r for r in licences['files'] if r['path']!=rel]
  rows=list(members[pack].values());licences['files'].append({'path':rel,'file':path.name,'sha256':sha(path.read_bytes()),'sourceUrl':'https://kenney.nl/assets','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','license':'CC0-1.0','author':'Kenney','date':'2026-11-13','sourceFiles':[{'path':r['path'],'sha256':r['sha256'],'sourceUrl':r['sourceUrl']} for r in rows],'processing':'Original layered arrangement; filtered source cuts; 48 kHz mono sprite with 80 ms guards; Opus/MP3. No reference audio.'})
 manifest['packs'][pack]={'webm':f'/audio/{pack}.webm','mp3':f'/audio/{pack}.mp3'}
manifest.update(version=4,designs=designs,bindings=bindings)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'LICENSES.json').write_text(json.dumps(licences,indent=2)+'\n')
signed=lambda p:{'path':p,'sha256':sha((ROOT/p).read_bytes())}
def evidence(id):
 d=designs[bindings.get(id,id)]
 return {'id':id,'layers':[{'role':l['role'],'offsetMs':l['offsetMs'],'eq':l['eq'],'gainDb':l['gainDb'],'variants':[{**signed('apps/web/public/audio/'+s['pack']+'.webm'),'variantId':s['variantId'],'start':s['start'],'duration':s['duration']} for s in l['variants']]} for l in d['layers']], 'variants':[s['variantId'] for s in d['layers'][0]['variants']]}
report={'manifest':signed('apps/web/public/audio/manifest.json'),'hitCues':[evidence(i) for i in plans if i.startswith('hit.') or i.endswith('.impact')], 'uiCues':[evidence(i) for i in plans if i.startswith('ui.')], 'designCount':len(designs),'bindings':len(bindings),'bakedFrequentCues':baked_count,'spritePacks':sorted(new_packs),'newEncodedBytes':sum((OUT/f'{p}.{f}').stat().st_size for p in new_packs for f in ['webm','mp3'])}
(REPORT/'LAYERED-AUDIO.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['hitCues','uiCues']}))
