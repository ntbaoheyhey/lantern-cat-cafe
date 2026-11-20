"""Consecutive encoded-film frames around Binding's 150 ms projectile flight."""
from pathlib import Path
from PIL import Image,ImageDraw
import gzip,json,math,subprocess

root=Path('reports/v4-art/REVIEW/A7/binding-thread')
out=root/'raw/projectile-review';out.mkdir(parents=True,exist_ok=True)
receipt=[]
for relative,keys in [('.', [5,6]),('tail60',[29,30,45])]:
    base=root/relative;data=json.loads(gzip.decompress((base/'boss/capture.json.gz').read_bytes()))
    for key in keys:
        p=next(p for p in data['plans'] if p['key']==key)
        launch=p['clockStart']+p['impact']/1000-.15
        frames=list(range(math.ceil(launch*30),math.ceil(launch*30)+6))
        raw=out/f'{relative.replace(".","original")}-A{key}';raw.mkdir(exist_ok=True)
        expression='+'.join(f'eq(n\\,{n})' for n in frames)
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(base/'boss.webm'),'-vf','select='+expression,'-fps_mode','vfr','-q:v','2',str(raw/'%02d.jpg')],check=True)
        sheet=Image.new('RGB',(1024,24+3*310),'#211e26');draw=ImageDraw.Draw(sheet)
        draw.text((8,4),f'A{key} {p["actorId"]} {"ultimate" if p["ultimate"] else "basic"} | consecutive30fps',fill='white')
        row={'key':key,'actor':p['actorId'],'ultimate':p['ultimate'],'videoSha256':data['videoSha256'],'frames':[]}
        for i,n in enumerate(frames):
            x=i%2*512;y=24+i//2*310
            sheet.paste(Image.open(raw/f'{i+1:02d}.jpg').resize((512,288),Image.Resampling.LANCZOS),(x,y))
            elapsed=1000*(n/30-p['clockStart']);source=data['resampled'][n]['sourceTime']
            draw.text((x+4,y+290),f'frame{n} film{n/30:.3f}s elapsed{elapsed:.1f}ms source{source:.3f}s',fill='white')
            row['frames'].append({'frame':n,'filmSeconds':n/30,'elapsedMs':elapsed,'sourceTime':source})
        path=out/f'{relative.replace(".","original")}-A{key}.jpg';sheet.save(path,quality=93);row['sheet']=str(path);receipt.append(row)
(root/'projectile-frames.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'sheets':len(receipt),'framesPerSheet':6}))
