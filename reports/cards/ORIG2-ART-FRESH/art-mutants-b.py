from pathlib import Path
import json,shutil,subprocess,sys,tempfile
root=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True);scratch=Path(tempfile.mkdtemp(prefix='tbh-orig2-art-provenance-'))
shutil.copytree(root/'tools/art',scratch/'tools/art');shutil.copytree(root/'apps/web/src/art/generated/original',scratch/'apps/web/src/art/generated/original');registry=scratch/'tools/art/original-icons.json';original=registry.read_bytes()
def run(name):
 p=subprocess.run([sys.executable,'-B','-m','unittest','discover','-s','tools/art','-p','test_original_icons.py','-v'],cwd=scratch,capture_output=True,text=True);text=p.stdout+p.stderr;(out/(name+'.log')).write_text(text+'\nEXIT '+str(p.returncode)+'\n');return p.returncode,text
try:
 code,text=run('control')
 if code:raise RuntimeError('Unmodified provenance control failed')
 results=[]
 for name in ['wrong-recipe-hash','invented-image-model','missing-authoring-brief','wrong-creation-date']:
  data=json.loads(original)
  if name=='wrong-recipe-hash':data['generatorSha256']='0'*64
  elif name=='invented-image-model':data['entries'][0]['imageModel']='unrecorded-model'
  elif name=='missing-authoring-brief':data['entries'][0]['prompt']=''
  else:data['entries'][0]['date']='2026-01-01'
  registry.write_text(json.dumps(data));code,text=run(name);killed=code!=0 and 'AssertionError' in text;results.append(dict(name=name,exit=code,killed=killed));print(name,'detected' if killed else 'SURVIVED',flush=True);registry.write_bytes(original)
 (out/'results.json').write_text(json.dumps(results,indent=2)+'\n')
 if not all(r['killed'] for r in results):sys.exit(1)
finally:shutil.rmtree(scratch)
