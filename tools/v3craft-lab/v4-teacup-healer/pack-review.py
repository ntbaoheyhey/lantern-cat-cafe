"""Pack only newly generated film windows for a single first-look review."""
from pathlib import Path
from PIL import Image,ImageDraw
import argparse,json
p=argparse.ArgumentParser();p.add_argument('--root',default='reports/v4-art/REVIEW/A7/teacup-healer');a=p.parse_args()
root=Path(a.root);raw=root/'raw/action-strips';out=root/'raw/review-pages';out.mkdir(exist_ok=True)
groups={'basic':[],'ultimate':[],'hit':[],'field':[],'ultimate-field':[]};pages=[]
for fixture in json.loads((root/'film-review.json').read_text()):
    for row in fixture['actions']:
        prefix=f"{fixture['fixture']}-A{row['key']}-{row['unit']}"
        group=('ultimate' if row['ultimate'] else 'basic') if row['own'] else 'hit'
        groups[group].append(raw/(prefix+'-poses.jpg'))
        if row['own']:groups['field'].append(raw/(prefix+'-field.jpg'))
        if row['own'] and row['ultimate']:groups['ultimate-field'].append(raw/(prefix+'-ultimate-field.jpg'))
for group,files in groups.items():
    per=1 if group in ['ultimate','ultimate-field'] else 2 if group=='basic' else 3
    for offset in range(0,len(files),per):
        subset=files[offset:offset+per];images=[Image.open(p) for p in subset]
        sheet=Image.new('RGB',(1024,sum(i.height for i in images)+24),'#211e26');ImageDraw.Draw(sheet).text((8,4),f'Teacup {group} review {offset//per+1}',fill='white');y=24
        for im in images:sheet.paste(im,(0,y));y+=im.height
        name=out/f'{group}-{offset//per+1}.jpg';assert not name.exists(),'Do not overwrite reviewed sheets'
        sheet.save(name,quality=91);pages.append({'path':str(name),'strips':[str(f) for f in subset]});print(name)
(root/'review-pages.json').write_text(json.dumps(pages,indent=2)+'\n')
