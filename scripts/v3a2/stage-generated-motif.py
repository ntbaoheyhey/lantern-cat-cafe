"""Copy a returned built-in imagegen artifact into this project with its exact prompt."""
from pathlib import Path
import json,sys,shutil,datetime
id,src,prompt=sys.argv[1:];root=Path(__file__).resolve().parents[2]
assert id in ['mochi','soot','clover','panko','biscuit','mallow','sorrel','inkcap','cinnamon','brioche','velvet','marigold','yarn-giant']
dst=root/'tools/cinematic-compositor/motifs'/(id+'.png');dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dst)
p=root/'reports/v3-battle/a2/V1/prompts.json';j=json.loads(p.read_text()) if p.exists() else {};j[id]=prompt;p.write_text(json.dumps(j,indent=2)+'\n')
p=root/'assets/provenance.json';j=json.loads(p.read_text());j['assets'].append({'id':'v3a2-motif-'+id,'tool':'image_gen built-in','date':datetime.datetime.now(datetime.timezone.utc).isoformat(),'prompt':prompt,'output':str(dst.relative_to(root)),'referenceInput':False});p.write_text(json.dumps(j,indent=2)+'\n')
print('Staged original motif:',id)
