"""Group newly captured strips without reopening earlier reviews."""
from pathlib import Path
from PIL import Image,ImageDraw
import argparse,json
parser=argparse.ArgumentParser();parser.add_argument('--root',default='reports/v4-art/REVIEW/A7/binding-thread');args=parser.parse_args()
root=Path(args.root);raw=root/'raw/action-strips';out=root/'raw/review-pages';out.mkdir(exist_ok=True)
actions=json.loads((root/'film-review.json').read_text())[-1]['actions'];groups={'basic':[],'ultimate':[],'hit':[],'field':[]}
for row in actions:
    prefix=f"boss-A{row['key']}-{row['unit']}"
    group=('ultimate' if row['ultimate'] else 'basic') if row['own'] else 'hit'
    groups[group].append(raw/(prefix+'-poses.jpg'))
    if row['own']:groups['field'].append(raw/(prefix+'-field.jpg'))
for group,files in groups.items():
    per=1 if group=='ultimate' else 2 if group=='basic' else 3
    for page in range(0,len(files),per):
        images=[Image.open(p) for p in files[page:page+per]]
        sheet=Image.new('RGB',(1024,sum(i.height for i in images)+24),'#211e26');ImageDraw.Draw(sheet).text((8,4),f'Binding {group} review {page//per+1}',fill='white');y=24
        for im in images:sheet.paste(im,(0,y));y+=im.height
        name=out/f'{group}-{page//per+1}.jpg';sheet.save(name,quality=91);print(name)
