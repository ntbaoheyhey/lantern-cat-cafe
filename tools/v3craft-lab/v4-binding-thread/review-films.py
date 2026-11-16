"""Every Binding action and hit, both boss enemies, from encoded film at10fps."""
from pathlib import Path
from PIL import Image,ImageDraw
import argparse,gzip,json,math,statistics,subprocess
parser=argparse.ArgumentParser();parser.add_argument('--root',default='reports/v4-art/REVIEW/A7/binding-thread');parser.add_argument('--duration',type=float,default=30);parser.add_argument('--after',type=float,default=0);parser.add_argument('--fixtures',nargs='+',default=['wave1','wave3','boss']);args=parser.parse_args()
root=Path(args.root);duration=args.duration;out=root/'raw/action-strips';out.mkdir(parents=True,exist_ok=True);results=[]
for fixture in args.fixtures:
    data=json.loads(gzip.decompress((root/fixture/'capture.json.gz').read_bytes()));actions=[]
    for plan in data['plans']:
        own='binding-thread' in plan['actorId'];victims={i for e in plan['events'] if e['type']=='damage' and e.get('amount',0)>0 for i in e['targetIds'] if 'binding-thread' in i}
        units=({plan['actorId']} if own else set())|victims
        for unit in sorted(units):
            start=plan.get('clockStart',plan['at']);impact=start+plan['impact']/1000
            times=[start+i*.1 for i in range(23 if plan['ultimate'] else 9)] if unit==plan['actorId'] else [impact-.1+i*.1 for i in range(5)]
            if max(times)<args.after:continue
            actions.append({'key':plan['key'],'actor':plan['actorId'],'unit':unit,'own':unit==plan['actorId'],'hit':unit in victims,'ultimate':plan['ultimate'],'impact':impact,'times':times,'complete':min(times)>=0 and max(times)<duration})
    frames=sorted({round(t*30) for a in actions for t in a['times']+[a['impact']-.1,a['impact'],a['impact']+.2] if 0<=t<duration})
    if not frames:
        results.append({'fixture':fixture,'actions':[],'parity':data['parity'],'errors':data['errors'],'videoSha256':data['videoSha256']});continue
    raw=out/fixture;raw.mkdir(exist_ok=True)
    def balanced(parts):
        if len(parts)==1:return parts[0]
        mid=len(parts)//2;return '('+balanced(parts[:mid])+'+'+balanced(parts[mid:])+')'
    expression=balanced([f'eq(n\\,{n})' for n in frames])
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(root/(fixture+'.webm')),'-vf','select='+expression,'-fps_mode','vfr','-q:v','2',str(raw/'%04d.jpg')],check=True)
    for a in actions:
        lines=math.ceil(len(a['times'])/8);sheet=Image.new('RGB',(1024,lines*170+24),'#211e26');draw=ImageDraw.Draw(sheet)
        draw.text((8,4),f"A{a['key']} {a['unit']} {'own' if a['own'] else 'hit'} {'ult' if a['ultimate'] else 'basic'}",fill='white')
        for i,t in enumerate(a['times']):
            n=round(t*30)
            if not 0<=t<duration or n not in frames:continue
            shot=data['resampled'][min(n,len(data['resampled'])-1)];ordinal=shot.get('renderFrame');f=data['frames'][ordinal-1] if isinstance(ordinal,int) and 0<ordinal<=len(data['frames']) else min(data['frames'],key=lambda f:abs(f['t']-t))
            u=next((u for u in f['units'] if u['id']==a['unit']),None)
            if not u:continue
            b=u['box'];cx=b['x']+b['width']/2;cy=b['y']+b['height']/2;im=Image.open(raw/f'{frames.index(n)+1:04d}.jpg')
            crop=im.crop((round(cx-120),round(cy-140),round(cx+120),round(cy+140))).resize((128,149),Image.Resampling.LANCZOS)
            x=i%8*128;y=24+i//8*170;sheet.paste(crop,(x,y));draw.text((x+4,y+151),f'{t:.2f}s',fill='white')
        name=f"{fixture}-A{a['key']}-{a['unit']}";sheet.save(out/(name+'-poses.jpg'),quality=92)
        if a['own']:
            field=Image.new('RGB',(960,198),'#211e26');fd=ImageDraw.Draw(field)
            for i,dt in enumerate([-.1,0,.2]):
                n=round((a['impact']+dt)*30)
                if n not in frames:continue
                field.paste(Image.open(raw/f'{frames.index(n)+1:04d}.jpg').resize((320,180),Image.Resampling.LANCZOS),(i*320,18));fd.text((i*320+4,3),f'A{a["key"]} impact{dt:+.1f}s',fill='white')
            field.save(out/(name+'-field.jpg'),quality=92)
            if a['ultimate']:
                full=Image.new('RGB',(1024,24+math.ceil(len(a['times'])/4)*164),'#211e26');fd=ImageDraw.Draw(full);fd.text((8,4),name+(' COMPLETE' if a['complete'] else ' TRUNCATED'),fill='white')
                for i,t in enumerate(a['times']):
                    n=round(t*30)
                    if not 0<=t<duration or n not in frames:continue
                    x=i%4*256;y=24+i//4*164;full.paste(Image.open(raw/f'{frames.index(n)+1:04d}.jpg').resize((256,144),Image.Resampling.LANCZOS),(x,y));fd.text((x+3,y+146),f'{t:.2f}s',fill='white')
                full.save(out/(name+'-ultimate-field.jpg'),quality=92)
    actual=[f for f in data['frames'] if 0<=f['t']<duration];gaps=[b['t']-a['t'] for a,b in zip(actual,actual[1:])]
    results.append({'fixture':fixture,'actions':actions,'videoSha256':data['videoSha256'],'parity':data['parity'],'errors':data['errors'],'medianRenderFps':1/statistics.median(gaps),'audio':data['audio']})
    print(fixture,len(actions),'scoped windows;',sum(a['own'] for a in actions),'own;',sum(not a['complete'] for a in actions),'incomplete')
(root/'film-review.json').write_text(json.dumps(results,indent=2)+'\n')
