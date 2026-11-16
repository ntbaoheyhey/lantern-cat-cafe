"""Supplemental 900p layout evidence from the unchanged fixed-clock recorder."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,statistics
root=Path('reports/v4-art/REVIEW/A7/needle-moth')
folder=root/'raw/wave3-900/wave3';d=json.loads((folder/'capture.json').read_text());values=[]
for f in d['frames']:
    units=f['units'];cats=[u for u in units if u['side']=='party'];foes=[u for u in units if u['side']=='enemy']
    if not cats or not foes:continue
    hs=[u['box']['height']/d['height'] for u in cats];median=statistics.median(hs)
    left=min(u['box']['x'] for u in units)/d['width'];right=1-max(u['box']['x']+u['box']['width'] for u in units)/d['width']
    values.append({'t':f['t'],'index':f['index'],'catMedian':median,'catDeviation':max(abs(h/median-1) for h in hs),'left':left,'right':right,'span':1-left-right,'gap':(min(u['box']['x'] for u in foes)-max(u['box']['x']+u['box']['width'] for u in cats))/d['width']})
limits={'catMedian':('min',.30),'catDeviation':('max',.08),'left':('min',.03),'right':('min',.03),'span':('min',.80),'gap':('max',.20)}
extrema={};failures=[]
for key,(direction,limit) in limits.items():
    worst=(min if direction=='min' else max)(values,key=lambda v:v[key]);extrema[key]={k:worst[k] for k in [key,'t','index']}
    failing=[v for v in values if (v[key]<limit if direction=='min' else v[key]>limit)]
    if failing:failures.append({'metric':key,'count':len(failing),'worst':extrema[key]})
indices=[0]+[f['index'] for f in d['frames'] if f['action'] and 'needle-moth' in f['action']['actorId'] and 350<=f['action']['elapsed']<384][:1]
indices += [extrema['catDeviation']['index'],extrema['gap']['index']]
indices=list(dict.fromkeys(round(i/3)*3 for i in indices));sheet=Image.new('RGB',(1024,2*344),'#211e26');draw=ImageDraw.Draw(sheet)
for slot,index in enumerate(indices):
    im=Image.open(folder/f'frame-{index:05}.png').resize((512,320),Image.Resampling.LANCZOS);x=slot%2*512;y=slot//2*344
    sheet.paste(im,(x,y+24));draw.text((x+8,y+6),f'900p fixed-clock wave3 | {index/d["fps"]:.2f}s',fill='white')
sheet.save(root/'raw/layout900-review.jpg',quality=92)
result={'method':'Existing silent fixed-clock 1440x900 capture; supplemental layout only, not audio or performance proof.','frames':len(d['frames']),'seconds':d['seconds'],'parity':d['parity'],'errors':d['errors'],'extrema':extrema,'failures':failures,'reviewFrameIndices':indices}
(root/'layout900.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
