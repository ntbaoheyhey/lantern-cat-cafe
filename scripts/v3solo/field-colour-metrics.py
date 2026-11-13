"""Identical transient-light segmentation on rendered game and private reference pixels."""
import json,sys,datetime,hashlib,subprocess
from pathlib import Path
import cv2,numpy as np
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[2];label=sys.argv[1] if len(sys.argv)>1 else 'glow1'
out=root/'reports/v3-solo/Q7';private=root/'reports/v3-battle/a2/ref/Q7'
def luma(im):return im[:,:,0]*.0722+im[:,:,1]*.7152+im[:,:,2]*.2126
def measure(before,after,field,exclusions):
 x,y,w,h=map(round,field);a=before[y:y+h,x:x+w];b=after[y:y+h,x:x+w]
 a=cv2.resize(a,(960,480),interpolation=cv2.INTER_AREA);b=cv2.resize(b,(960,480),interpolation=cv2.INTER_AREA)
 # Positive luminance change excludes the darkened stage; RGB change excludes
 # static painted art. No saturation threshold: pale/white effects count too.
 mask=(luma(b)-luma(a)>=20)&(np.max(abs(b.astype(float)-a.astype(float)),axis=2)>=32)
 for bx,by,bw,bh in exclusions:
  xx=round((bx-x)*960/w);yy=round((by-y)*480/h);ww=round(bw*960/w);hh=round(bh*480/h)
  mask[max(0,yy):min(480,yy+hh),max(0,xx):min(960,xx+ww)]=False
 # Remove tiny codec fringes but retain the luminous strokes themselves.
 count,components,stats,_=cv2.connectedComponentsWithStats(mask.astype(np.uint8),8)
 keep=np.zeros(count,bool);keep[1:]=stats[1:,cv2.CC_STAT_AREA]>=24;mask=keep[components]
 n=int(mask.sum());assert n>=100,'Insufficient measured light pixels'
 hsv=cv2.cvtColor(b,cv2.COLOR_BGR2HSV)
 return {'pixels':n,'meanSaturation':float(hsv[:,:,1][mask].mean()/255),'peakLuminance':float(np.percentile(luma(b)[mask],99.9))},mask,b
reference=[
 {'id':'ribbon','base':40.5,'beats':[40.6,41.1],'numbers':[[390,180,250,240]]},
 {'id':'gold-strike','base':270.6,'beats':[270.9,271.0],'numbers':[[0,90,820,230]]},
 {'id':'fire-strike','base':806.6,'beats':[806.9,807.0],'numbers':[[590,70,450,345],[350,420,550,50]]},
]
refs=[]
for ref in reference:
 base=cv2.imread(str(private/f'field-{ref["base"]:.1f}.png'));assert base is not None
 for t in ref['beats']:
  p=private/f'field-{t:.1f}.png';im=cv2.imread(str(p));assert im is not None
  value,mask,b=measure(base,im,[0,48,1280,420],ref['numbers'])
  refs.append({'id':ref['id'],'baselineSeconds':ref['base'],'seconds':t,'field':[0,48,1280,420],'excludedText':ref['numbers'],'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),**value})
refmedian={key:float(np.median([r[key] for r in refs])) for key in ['meanSaturation','peakLuminance']}
cap=json.loads((out/(label+'-field')/'capture.json').read_text());fixtures={};comparisons=[]
for fixture,values in cap['fixtures'].items():
 assert values['parity'] and not values['errors'];rows=[]
 for action in range(3):
  entry=next(r for r in values['rows'] if r['action']==action and r['beat']=='entrance')
  before=cv2.imread(str(root/entry['path']))
  for row in [r for r in values['rows'] if r['action']==action and r['beat']!='entrance']:
   p=root/row['path'];assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'];im=cv2.imread(str(p))
   # First two captures recorded a bottom-anchored guess (y170). The actual
   # DOM canvas in both saved720p images spans y44..594. Retain raw metadata;
   # use the verified visible field here and the DOM rect in future captures.
   field=[row['field'][k] for k in ['x','y','width','height']]
   if field[1]==170:field=[0,44,1280,550]
   exclusions=[[n['x']-6,n['y']+field[1]-6,n['width']+12,n['height']+12] for r in [entry,row] for n in r['numbers']]
   value,mask,b=measure(before,im,field,exclusions)
   rows.append({'action':action,'beat':row['beat'],'skill':row['skill'],'path':row['path'],'sha256':row['sha256'],'field':field,'excludedText':exclusions,**value})
   overlay=b.copy();overlay[~mask]=(overlay[~mask]*.22).astype(np.uint8)
   cv2.imwrite(str(out/(label+'-field')/f'{fixture}-{action}-{row["beat"]}-mask.jpg'),overlay)
   if action==0:
    ref=refs[0 if row['beat']=='contact' else 1];rip=private/f'field-{ref["seconds"]:.1f}.png'
    sheet=Image.new('RGB',(1280,396),'#191827');d=ImageDraw.Draw(sheet)
    d.text((12,12),f'{fixture} {row["beat"]} | OURS',fill='white');d.text((652,12),'REFERENCE | field ability, private review',fill='white')
    for i,source in enumerate([p,rip]):
     view=Image.open(source);view.thumbnail((640,360));sheet.paste(view,(i*640+(640-view.width)//2,36+(360-view.height)//2))
    dest=root/'reports/v3-battle/a2/Q7'/f'compare-{fixture}-{row["beat"]}.jpg';dest.parent.mkdir(parents=True,exist_ok=True);sheet.save(dest);comparisons.append(str(dest.relative_to(root)))
 total=sum(r['pixels'] for r in rows);sat=sum(r['meanSaturation']*r['pixels'] for r in rows)/total
 peak=float(np.median([r['peakLuminance'] for r in rows]))
 fixtures[fixture]={'meanSaturation':sat,'peakEffectLuminance':peak,'saturationRatio':sat/refmedian['meanSaturation'],'luminanceRatio':peak/refmedian['peakLuminance'],'samples':rows,'parity':values['parity'],'errors':values['errors']}
 print(fixture,'saturation',round(sat,4),'ratio',round(fixtures[fixture]['saturationRatio'],4),'luminance',round(peak,2),'ratio',round(fixtures[fixture]['luminanceRatio'],4))
method='Same960x480 field-normalized transient light mask: positive Rec709 luma delta>=20 and max RGB delta>=32 vs entrance; connected components>=24px; HUD cropped and damage/callout text excluded. Mean HSV saturation includes white pixels. Peak=99.9th-percentile Rec709 luma. Six reference field-active samples; three natural actives x2 beats per fixture. No threshold tuned per build.'
result={'_meta':cap['_meta'],'method':method,'limitations':['Transient masks can include moving bright prop edges; identical detector used on both products. Reference has no isolated effect-alpha layer.','Reference gold baseline contains a cut-in; its entire banner region is excluded from both samples.','Reference is PvP; no reference boss identity is inferred.'],'reference':{'source':'V2 ua_e236yxNM user video; private measurement only','median':refmedian,'samples':refs},'fixtures':fixtures,'comparisons':comparisons}
(out/f'{label}-colour.json').write_text(json.dumps(result,indent=2)+'\n')
