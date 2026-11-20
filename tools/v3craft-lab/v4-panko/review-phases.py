"""Inspect full Panko ultimate phases from saved films; no recorder changes."""
from pathlib import Path
from PIL import Image, ImageDraw
import gzip, json, math, subprocess

root = Path('reports/v4-art/REVIEW/A6')
out = root/'raw/full-phases'
out.mkdir(parents=True, exist_ok=True)
receipt = []
for label, folder, fixture in [('wave1',root,'wave1'),('wave3',root,'wave3'),('boss',root,'boss'),('boss-tail',root/'tail36','boss')]:
    capture = folder/fixture/'capture.json.gz'
    if not capture.exists(): continue
    d = json.loads(gzip.decompress(capture.read_bytes()))
    plans = [p for p in d['plans'] if p['actorId']=='panko' and p['ultimate']]
    complete = [p for p in plans if p['clockStart']>=0 and p['clockStart']+2.3<d['videoSeconds']]
    frames = sorted({round((p['clockStart']+i*.1)*30) for p in complete for i in range(24)})
    if not frames: continue
    raw = out/label
    raw.mkdir(exist_ok=True)
    expression = '+'.join(f'eq(n\\,{n})' for n in frames)
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(folder/(fixture+'.webm')),'-vf','select='+expression,'-fps_mode','vfr','-q:v','2',str(raw/'%04d.jpg')],check=True)
    sheet = Image.new('RGB',(1024,26+len(complete)*482),'#221f29')
    draw = ImageDraw.Draw(sheet)
    draw.text((8,5),label+' | full ultimate 0–2300ms at10fps | saved film',fill='white')
    for a,p in enumerate(complete):
        top = 26+a*482
        draw.text((8,top),f'A{p["key"]} clockStart{p["clockStart"]:.3f}s | impact1100ms',fill='white')
        for i in range(24):
            n = round((p['clockStart']+i*.1)*30)
            shot = d['resampled'][min(n,len(d['resampled'])-1)]
            ordinal = shot.get('renderFrame')
            f = d['frames'][ordinal-1] if isinstance(ordinal,int) and 0<ordinal<=len(d['frames']) else min(d['frames'],key=lambda f:abs(f['t']-shot.get('sourceTime',n/30)))
            u = next(u for u in f['units'] if u['id']=='panko')
            b = u['box']; cx = b['x']+b['width']/2; cy = b['y']+b['height']/2
            im = Image.open(raw/f'{frames.index(n)+1:04d}.jpg')
            crop = im.crop((round(cx-125),round(cy-140),round(cx+125),round(cy+140))).resize((112,126),Image.Resampling.LANCZOS)
            x = 8+(i%8)*126; y = top+20+(i//8)*154
            sheet.paste(crop,(x,y));draw.text((x,y+129),f'{i*100}ms f{n}',fill='white')
    sheet.save(out/(label+'.jpg'),quality=92)
    receipt.append({'label':label,'videoSha256':d['videoSha256'],'seconds':d['videoSeconds'],'completeKeys':[p['key'] for p in complete],'excludedIncompleteKeys':[p['key'] for p in plans if p not in complete],'parity':d['parity'],'errors':d['errors'],'sheet':str(out/(label+'.jpg'))})
    for p in raw.glob('*.jpg'): p.unlink()
    raw.rmdir()
(root/'full-phases.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps(receipt))
