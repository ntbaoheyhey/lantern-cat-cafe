"""Diagnostic treble balance from actual invitation output; never acceptance."""
from pathlib import Path
import json,subprocess,hashlib
from analyse import analyse_file
root=Path.cwd();base=root/'reports/v3-shell/b2';source=base/'renders/38-element-kits-gacha.opus';out=root/'tmp/p2-gacha';out.mkdir(parents=True,exist_ok=True)
rows=[]
for gain in [1.5,3,4.5]:
 target=out/f'treble-{gain}.flac'
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af',f'treble=g={gain}:f=1500',str(target)],check=True)
 metrics=analyse_file(target,duration=60.2)
 rows.append({'trebleDb':gain,'path':str(target.relative_to(root)),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'metrics':metrics})
 (base/'polish/P2/gacha-tone-probes.json').write_text(json.dumps({'diagnostic':True,'source':{'path':str(source.relative_to(root)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest()},'method':'Treble balance applied to saved real output for diagnosis only. Production change targets music only and requires a new real UI capture. No gate evidence replacement.','rows':rows},indent=2)+'\n')
 print(json.dumps({'trebleDb':gain,**{k:metrics[k] for k in ['voiceContoursPerMinute','tickTransientsPerSecond','integratedLufs','truePeakDbTP','onsetsPerSecond']}}),flush=True)
