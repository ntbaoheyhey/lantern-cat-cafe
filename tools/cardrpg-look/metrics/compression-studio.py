"""Compare compressed previews to hash-matched raw studio captures."""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
from skimage.metrics import structural_similarity

p=argparse.ArgumentParser()
p.add_argument('study',type=Path)
p.add_argument('--studio',type=Path)
a=p.parse_args()
packing=json.loads((a.study/'packing.json').read_text())
studio=a.studio or a.study/'studio'
results=[]
for row in packing['rows']:
    owner=row['owner']
    candidates=list(Path('reports/cardrpg-look/rounds').glob(f'*/{owner}/round-*/views/capture-000.json'))
    matches=[path.parent for path in candidates if json.loads(path.read_text())['sourceSha256']==row['sourceSha256']]
    assert matches, f'No matching original render for {owner}'
    original=matches[-1]
    packed=studio/owner
    left=json.loads((original/'capture-000.json').read_text())
    right=json.loads((packed/'capture-000.json').read_text())
    assert right['sourceSha256']==row['previewSha256']
    assert left['camera']==right['camera']
    sheet=Image.new('RGB',(960,860),'#1d3039');draw=ImageDraw.Draw(sheet)
    pairs=[]
    for i in range(3):
        images=[]
        for j,(folder,receipt,label) in enumerate([(original,left,'raw 1024'),(packed,right,'packed 512/256 q80')]):
            path=folder/f'{i:03}.png'
            assert hashlib.sha256(path.read_bytes()).hexdigest()==receipt['rows'][i]['sha256']
            im=Image.open(path).convert('RGBA')
            images.append(im)
            im=Image.alpha_composite(Image.new('RGBA',im.size,(29,48,57,255)),im).convert('RGB')
            sheet.paste(im.resize((320,400),Image.Resampling.LANCZOS),(i*320,j*430+30))
            draw.text((i*320+8,j*430+10),f'{owner} / {label} / {i*90}deg',fill='#fff0d2')
        x,y=[np.array(im) for im in images]
        mask=(x[:,:,3]>240)|(y[:,:,3]>240)
        ys,xs=np.where(mask);box=(slice(ys.min(),ys.max()+1),slice(xs.min(),xs.max()+1))
        pairs.append({'angle':i*90,'cropSsim':float(structural_similarity(x[box][:,:,:3],y[box][:,:,:3],channel_axis=2,data_range=255)),
                      'meanSubjectChannelError':float(np.abs(x[:,:,:3].astype(float)-y[:,:,:3])[mask].mean()),
                      'alphaMismatchPixels':int(np.count_nonzero(x[:,:,3]!=y[:,:,3]))})
    sheet.save(packed/'comparison.png')
    results.append({'owner':owner,'raw':str(original),'packed':str(packed),'sourceSha256':row['sourceSha256'],'previewSha256':row['previewSha256'],'pairs':pairs})
(studio/'metrics.json').write_text(json.dumps({'scope':'Fixed studio compression fidelity; not aesthetics or runtime acceptance.','rows':results},indent=2)+'\n')
print(json.dumps({'models':len(results),'minSsim':min(p['cropSsim'] for r in results for p in r['pairs'])}))
