"""Hand observations from the decoded reference, never asset generation input.
Coordinates are typed from the <=1280 px review sheets. Boxes are x,y,w,h.
"""
import json
from pathlib import Path
p=Path('scripts/v3a2/ref-annotations.json');a=json.loads(p.read_text())
a['measurementUncertaintyPx']=4
frames={
('w01',21):[(182,123,82,124),(267,328,94,125),(867,116,92,131),(1009,124,90,123)],
('w03',21):[(183,123,84,125),(284,251,96,96),(418,369,82,91),(867,119,88,129)],
('w04',1):[(183,125,88,124),(285,252,96,99),(867,121,92,128),(1008,126,88,123)],
('w04',21):[(184,126,84,123),(286,251,96,101),(866,121,94,126),(1008,125,89,124)],
('w04',61):[(184,126,84,122),(286,252,98,100),(866,120,94,130),(1008,124,90,127)],
('w06',1):[(183,127,84,123),(286,254,94,99),(419,371,83,90),(1008,128,89,124)],
('w06',81):[(182,124,86,127),(284,252,96,100),(419,372,84,91),(1007,128,90,123)],
('w10',1):[(179,124,88,127),(263,328,94,132),(701,124,107,102),(935,327,90,132)],
('w10',21):[(180,125,88,126),(264,328,92,130),(867,122,89,123),(935,326,91,132)],
('w10',41):[(179,125,90,125),(264,328,93,131),(701,124,107,103),(1009,124,91,126)],
('w12',41):[(181,126,90,124),(266,329,95,133),(704,124,106,103),(936,329,90,132)]
}
a['unitBoxes']=[{'window':w,'frame':f,'actor':f'core-{i}','box':b,'note':'Head top to feet; exclude hat/weapon/aura/wing silhouette'} for (w,f),bs in frames.items() for i,b in enumerate(bs)]
# Numeric ink only, excluding CRIT labels, totals banners, and the HUD.
numbers={
('w01',81):[(254,94,229,37),(380,213,253,38),(195,278,222,36)],
('w03',1):[(258,92,210,38),(430,92,226,38)],
('w09',1):[(296,119,202,38),(420,238,234,38),(405,389,210,39)],
('w10',1):[(370,353,185,41)],
('w10',21):[(884,265,204,37)],
('w10',41):[(336,270,243,39)],
('w12',61):[(638,83,230,41),(862,67,160,30),(671,211,247,45),(903,192,152,30),(693,295,244,44),(867,275,148,29)],
('w09',31):[(369,200,259,38)],
('w09',41):[(108,267,160,29),(108,298,162,29),(384,193,229,40),(354,350,221,38),(456,150,195,26),(456,181,195,26)],
('w12',59):[(639,91,238,38),(747,54,186,29),(742,86,197,31),(670,212,236,40),(798,202,190,33),(802,167,180,28),(703,294,239,42),(821,281,163,30),(803,248,179,28)]
}
a['numberBoxes']=[{'window':w,'frame':f,'box':b,'kind':'heal' if (w,f)==('w10',41) else 'damage'} for (w,f),bs in numbers.items() for b in bs]
# All visible non-numeric words including small power labels and Skip; Chinese/Vietnamese syllables count as space-separated words.
texts=[('w01',21,26),('w03',21,7),('w04',1,11),('w04',21,15),('w04',61,17),('w06',1,18),('w06',81,10),('w10',1,10),('w10',21,24),('w10',41,10)]
a['textFrames']=[{'window':w,'frame':f,'words':n,'method':'Manual visible space-separated non-number tokens; includes tiny top HUD'} for w,f,n in texts]
# These initial observations are refined by frame-level onset/exit review before final metrics.
a['notes'].append('Typed 44 body boxes over 11 frames and 34 numeric ink boxes; uncertainty +/-4 decoded pixels. Totals excluded from number sizes. V2 is PvP, so no boss label is inferred from a large winged hero.')
p.write_text(json.dumps(a,indent=2)+'\n')
print(f'{len(a["unitBoxes"])} core boxes / {len(frames)} frames; {len(a["numberBoxes"])} numeric ink boxes')
from PIL import Image,ImageDraw
r=Path('reports/v3-battle/a2/ref')
for k,(w,ns) in enumerate([('w09',[26,29,32,35]),('w10',[51,54,57,60]),('w12',[53,56,59,62])]):
 out=Image.new('RGB',(1280,660),'#11121a');d=ImageDraw.Draw(out)
 for j,n in enumerate(ns):
  im=Image.open(r/w/f'frame-{n:03}.jpg').resize((640,296));x=(j%2)*640;y=(j//2)*330;out.paste(im,(x,y+28));d.text((x+8,y+8),f'{w} frame {n:03}',fill='white')
 out.save(r/f'track-{k}.jpg')
