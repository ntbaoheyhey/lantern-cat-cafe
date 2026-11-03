from pathlib import Path
import hashlib,json,subprocess,sys
root=Path(sys.argv[1]);out=Path(sys.argv[2]);which=sys.argv[3];(out/'logs').mkdir(parents=True,exist_ok=True);checker=Path(__file__).with_name('check-pack.py');results=[]
def run(name):
 with (out/'logs'/f'{name}.log').open('w') as log:proc=subprocess.run(['python3',str(checker),str(root)],stdout=log,stderr=subprocess.STDOUT)
 (out/'logs'/f'{name}.exit').write_text(str(proc.returncode)+'\n');return proc.returncode
assert run('control')==0,'control not green'
A=[('fake-wallet-proof','docs/submission.md','Fresh funded wallet proof is NOT VERIFIED','Fresh funded wallet proof is verified'),('public-repo','README.md','repository remains **private**','repository is now **public**'),('video-too-long','docs/video-script.md','02:25','02:45'),('wrong-chain','docs/submission.md','Fuji, 43113','Fuji, 43114'),('backup-cleared','docs/submission.md','PR #244 remains unmerged','PR #244 backup complete'),('missing-slide-outline','docs/pitch-slides.md','## Slide ','### Slide ')]
B=[('not-a-draft','docs/submission.md','DRAFT, not submitted','READY, submitted'),('fake-timed-completion','docs/judge-walkthrough.md','not a completed timed demo','a completed timed demo'),('wrong-contract','docs/submission.md','0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93','0x0000000000000000000000000000000000000001'),('broken-pitch-link','docs/submission.md','pitch-slides.md','missing-pitch-slides.md'),('preview-enabled','docs/submission.md','original-economy flag remains false','original-economy flag is enabled'),('forged-media-hash','reports/submission/evidence/media-manifest.json',None,None)]
for name,relative,old,new in (A if which=='a' else B):
 path=root/relative;original=path.read_bytes();text=original.decode()
 try:
  if old is None:
   data=json.loads(text);data['images'][0]['sha256']='0'*64;path.write_text(json.dumps(data))
  else:
   assert old in text,(name,'anchor absent');path.write_text(text.replace(old,new))
  rc=run(name);killed=rc==1 and 'PACK_VALIDATION_FAIL' in (out/'logs'/f'{name}.log').read_text();results.append(dict(name=name,killed=killed,exit=rc,originalSha256=hashlib.sha256(original).hexdigest()));print(name,'KILLED' if killed else 'NOT_KILLED',flush=True);assert killed
 finally:path.write_bytes(original)
(out/'results.json').write_text(json.dumps(dict(head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),passName=which,control='PASS',results=results),indent=2)+'\n')
subprocess.run(['git','diff','--exit-code'],cwd=root,check=True,stdout=subprocess.DEVNULL)
