"""Private UI baseline review sheets. Reference art never enters the repository."""
import json
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[2]
OUT=Path('/Users/bao/tools/omg-ref-2026-11-12/compare/b2-ui-review')
OUT.mkdir(parents=True,exist_ok=True)
rows=[]
for name in ['UI-AUDIT-RAW.json','UI-AUDIT-CHAIN-RAW.json']:
    rows.extend(json.loads((ROOT/'reports/v3-shell/b2'/name).read_text())['screens'])
for start in range(0,len(rows),4):
    sheet=Image.new('RGB',(1280,768),'#131223');d=ImageDraw.Draw(sheet)
    for n,row in enumerate(rows[start:start+4]):
        x=(n%2)*640;y=(n//2)*384
        shot=Image.open(ROOT/row['screenshot']['path']).convert('RGB');shot.thumbnail((640,360))
        sheet.paste(shot,(x,y+24));d.text((x+8,y+6),f"{start+n+1}: {row['id']} | {row['visibleWords']} words / {row['plainTextButtons']} plain",fill='white')
    sheet.save(OUT/f'survey-{start//4+1:02d}.jpg',quality=88)
print(f'{len(rows)} states; {(len(rows)+3)//4} sheets at {OUT}')
audit=ROOT/'reports/v3-shell/b2/UI-AUDIT.json'
if audit.exists():
    for row in json.loads(audit.read_text())['screens']:
        sheet=Image.new('RGB',(1280,470),'#131223');d=ImageDraw.Draw(sheet)
        for n,path in enumerate([ROOT/row['screenshot']['path'],Path(row['referenceFrames'][0])]):
            shot=Image.open(path).convert('RGB');shot.thumbnail((640,426))
            sheet.paste(shot,(n*640+(640-shot.width)//2,35+(426-shot.height)//2))
        d.text((10,10),row['id']+' | OUR BASELINE',fill='white')
        d.text((650,10),'REFERENCE: layout/hierarchy only; never generator input',fill='white')
        sheet.save(row['comparisonSheet'],quality=90)
    print('Private per-state comparisons complete.')
