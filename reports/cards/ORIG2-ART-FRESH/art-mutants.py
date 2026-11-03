from pathlib import Path
import hashlib,json,shutil,subprocess,sys,tempfile
root=Path(sys.argv[1]);out=Path(sys.argv[2]);out.mkdir(parents=True,exist_ok=True)
scratch=Path(tempfile.mkdtemp(prefix='tbh-orig2-art-mutants-'))
shutil.copytree(root/'tools/art',scratch/'tools/art');shutil.copytree(root/'apps/web/src/art/generated/original',scratch/'apps/web/src/art/generated/original')
sys.path.insert(0,str(scratch/'tools/art'));import pipeline
registry_path=scratch/'tools/art/original-icons.json';registry_original=registry_path.read_bytes();registry=json.loads(registry_original);row=registry['entries'][0];image_path=scratch/row['path'];image_original=image_path.read_bytes();atlas_path=scratch/registry['atlas']['metadata'];atlas_original=atlas_path.read_bytes();sheet_path=scratch/registry['atlas']['image'];sheet_original=sheet_path.read_bytes()
def run(name):
 p=subprocess.run([sys.executable,'-B','-m','unittest','discover','-s','tools/art','-p','test_original_icons.py','-v'],cwd=scratch,capture_output=True,text=True);text=p.stdout+p.stderr;(out/(name+'.log')).write_text(text+'\nEXIT '+str(p.returncode)+'\n');return p.returncode,text
try:
 code,text=run('control')
 if code:raise RuntimeError('Unmodified art control failed')
 results=[]
 for name in ['wrong-palette','fractional-alpha','lost-padding','atlas-offset']:
  registry=json.loads(registry_original);atlas=json.loads(atlas_original);image=pipeline.decode_png(image_original);sheet=pipeline.decode_png(sheet_original)
  if name=='atlas-offset':
   atlas['frames'][row['id']]['frame']['x']+=1;atlas_path.write_bytes(pipeline.json_bytes(atlas))
  else:
   pixels=bytearray(image.pixels);sheet_pixels=bytearray(sheet.pixels);index=next(i for i in range(0,len(pixels),4) if pixels[i+3]);x=(index//4)%32;y=(index//4)//32
   value=bytes([1,2,3,255]) if name=='wrong-palette' else pixels[index:index+3]+bytes([128])
   if name=='lost-padding':x=y=0;index=0;value=bytes([255,243,224,255])
   pixels[index:index+4]=value;frame=atlas['frames'][row['id']]['frame'];si=((frame['y']+y)*sheet.width+frame['x']+x)*4;sheet_pixels[si:si+4]=value
   changed=pipeline.encode_png(pipeline.Image(32,32,bytes(pixels)));image_path.write_bytes(changed);sheet_path.write_bytes(pipeline.encode_png(pipeline.Image(sheet.width,sheet.height,bytes(sheet_pixels))));registry['entries'][0]['sha256']=hashlib.sha256(changed).hexdigest();registry_path.write_bytes(pipeline.json_bytes(registry))
  code,text=run(name);killed=code!=0 and 'AssertionError' in text;results.append(dict(name=name,exit=code,killed=killed));print(name,'detected' if killed else 'SURVIVED',flush=True)
  registry_path.write_bytes(registry_original);image_path.write_bytes(image_original);atlas_path.write_bytes(atlas_original);sheet_path.write_bytes(sheet_original)
 (out/'results.json').write_text(json.dumps(results,indent=2)+'\n')
 if not all(r['killed'] for r in results):sys.exit(1)
finally:shutil.rmtree(scratch)
