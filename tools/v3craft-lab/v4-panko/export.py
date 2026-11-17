"""A6 own selected drawings. Lab export first; --publish after drill/comparison."""
from pathlib import Path
from PIL import Image
import numpy as np,json,hashlib,sys
P=Path('tools/v3craft-lab/v4-panko')
O=Path('apps/web/public/units/panko/poses') if '--publish' in sys.argv else P/'exported'
O.mkdir(parents=True,exist_ok=True)
sources={'K0': 'K0-normal.png', 'K1': 'K1-A1-normal.png', 'K2': 'K2-A1-normal.png', 'K4': 'K4-A2-normal.png', 'K5': 'K5-A1-normal.png'}
# Face and tool landmarks authored on own raw images, transformed by saved normalization.
landmarks={'K0': ([343, 392, 205, 105], [378, 544], [575, 555], [444, 470], [444, 470], [450, 438], [450, 566], [304, 620], [456, 662]), 'K1': [[np.float64(456.41321243523316), np.float64(398.59715025906735), np.float64(179.24870466321244), np.float64(100.16839378238342)], [np.float64(337.79274611398966), np.float64(480.84067357512953)], [np.float64(611.9378238341969), np.float64(573.6282383419689)], [np.float64(187.5401554404145), np.float64(480.84067357512953)], [np.float64(187.5401554404145), np.float64(480.84067357512953)], [np.float64(548.6735751295337), np.float64(427.59326424870466)], [np.float64(543.4015544041451), np.float64(554.1217616580311)], [np.float64(285.07253886010363), np.float64(585.7538860103627)], [np.float64(490.68134715025906), np.float64(670.1062176165804)]], 'K2': [[np.float64(423.1524310118266), np.float64(411.1524310118266), np.float64(171.1432325886991), np.float64(80.2233902759527)], [np.float64(603.92247043364), np.float64(504.7463863337714)], [np.float64(316.1879106438896), np.float64(553.9500657030223)], [np.float64(759.0210249671485), np.float64(495.65440210249676)], [np.float64(759.0210249671485), np.float64(495.65440210249676)], [np.float64(514.072273324573), np.float64(432.54533508541397)], [np.float64(456.31143232588704), np.float64(555.5545335085415)], [np.float64(246.66097240473061), np.float64(576.9474375821288)], [np.float64(428.5006570302234), np.float64(651.8226018396847)]], 'K4': [[np.float64(392.2770919067216), np.float64(401.9053497942387), np.float64(164.6982167352538), np.float64(94.91083676268862)], [np.float64(377.20301783264745), np.float64(626.3415637860082)], [np.float64(517.8943758573389), np.float64(556.5541838134432)], [np.float64(319.6982167352538), np.float64(701.1536351165981)], [np.float64(319.6982167352538), np.float64(701.1536351165981)], [np.float64(495.562414266118), np.float64(428.1454046639232)], [np.float64(512.3113854595337), np.float64(539.8052126200275)], [np.float64(309.09053497942386), np.float64(645.8820301783265)], [np.float64(506.7283950617284), np.float64(657.0480109739369)]], 'K5': [[np.float64(336.18009478672985), np.float64(412.0936018957346), np.float64(183.24644549763033), np.float64(80.04976303317535)], [np.float64(292.7796208530806), np.float64(528.3104265402844)], [np.float64(584.0450236966824), np.float64(534.0971563981043)], [np.float64(149.07582938388626), np.float64(524.9348341232228)], [np.float64(149.07582938388626), np.float64(524.9348341232228)], [np.float64(439.8590047393365), np.float64(432.3471563981043)], [np.float64(432.6255924170616), np.float64(558.6907582938388)], [np.float64(292.7796208530806), np.float64(642.1161137440758)], [np.float64(427.80331753554503), np.float64(666.2274881516588)]]}

def bbox(a):
 y,x=np.where(a[:,:,3]>=128);return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)]
def feet(a):
 b=bbox(a);y,x=np.where((a[:,:,3]>=128)&(np.indices(a.shape[:2])[0]>=b[3]-8));xs=sorted(set(x));groups=np.split(xs,np.flatnonzero(np.diff(xs)>5)+1);groups=sorted(sorted(groups,key=len,reverse=True)[:2],key=lambda g:np.mean(g))
 if len(groups)<2:groups=[np.array(xs[:len(xs)//2]),np.array(xs[len(xs)//2:])]
 return [[float(np.mean(g)),float(b[3])] for g in groups]
base=np.array(Image.open(P/'raw/K0-normal.png'));bb=bbox(base);y,x=np.where((base[:,:,3]>=128)&(np.indices(base.shape[:2])[0]>=bb[3]-5));baseline=[float(x.mean()),float(bb[3])]
manifest={'version':1,'unit':'panko','canvas':[896,896],'baseline':baseline,'opaqueHeight':bb[3]-bb[1],'poses':{}}
receipts=[]
for key,source in sources.items():
 im=Image.open(P/'raw'/source).convert('RGBA');a=np.array(im);face,hand,off,tip,origin,head,chest,tail,hem=landmarks[key]
 im.save(O/(key+'.webp'),quality=96,method=6,exact=True)
 manifest['poses'][key]={'image':key+'.webp','face':face,'opaqueBounds':bbox(a),'feet':feet(a),'sockets':{'mainHand':hand,'offHand':off,'weaponTip':tip,'vfxOrigin':origin,'head':head,'chest':chest,'feet':baseline,'hpAnchor':[head[0],bbox(a)[1]-28]},'overlap':[{'part':'tail tip','center':tail,'radius':[42,45],'travel':[2.5,-2.5],'phase':.3},{'part':'apron hem','center':hem,'radius':[75,31],'travel':[2,2],'phase':1.4}]}
 receipts.append({'key':key,'source':str(P/'raw'/source),'path':str(O/(key+'.webp')),'bytes':(O/(key+'.webp')).stat().st_size,'sha256':hashlib.sha256((O/(key+'.webp')).read_bytes()).hexdigest()})
(O/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(P/'export.json').write_text(json.dumps({'baseline':baseline,'opaqueHeight':manifest['opaqueHeight'],'assets':receipts,'production':'--publish' in sys.argv},indent=2)+'\n')
print(json.dumps({'baseline':baseline,'opaqueHeight':manifest['opaqueHeight'],'assetBytes':sum(r['bytes'] for r in receipts),'production':'--publish' in sys.argv}))
