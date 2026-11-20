"""Extract private measurement frames from the two user-provided clips.
No generated imagery; nothing here is supplied to a generation service.
"""
from pathlib import Path
import json,subprocess
root=Path(__file__).resolve().parents[3]
private=root/'tools/v4ship-lab/classes/private';private.mkdir(parents=True,exist_ok=True)
videos=list(Path('/Users/bao/Downloads').glob('*.mp4'))
sources={'v1':next(p for p in videos if 'kiXkwkoUuY' in p.name),'v2':next(p for p in videos if 'ua_e236yxNM' in p.name)}
windows=[('v1','melee',41.4,1.8),('v1','healer',48.5,1.8),('v2','healer',57.4,1.8)]
rows=[]
for clip,label,start,duration in windows:
    target=private/f'{clip}-{label}.jpg'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',str(start),'-i',str(sources[clip]),'-t',str(duration),'-vf','fps=10/3,scale=512:-1,tile=2x3','-frames:v','1','-q:v','2',str(target)],check=True)
    rows.append({'clip':clip,'startSeconds':start,'durationSeconds':duration,'sampleFps':10/3,'file':str(target)})
(private/'windows.json').write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps(rows))
