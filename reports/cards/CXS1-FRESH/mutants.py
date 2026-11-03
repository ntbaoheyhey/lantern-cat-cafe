from pathlib import Path
import sys,subprocess,json,hashlib
root=Path(sys.argv[1]);out=Path(sys.argv[2]);which=sys.argv[3];out.mkdir(parents=True,exist_ok=True);(out/'logs').mkdir(exist_ok=True)
script=Path(__file__).with_name('check-docs.py');file=root/'docs/security-overview.md';original=file.read_bytes();source=original.decode()
def run(name):
 with (out/'logs'/f'{name}.log').open('w') as log:r=subprocess.run(['python3',str(script),str(root)],stdout=log,stderr=subprocess.STDOUT)
 (out/'logs'/f'{name}.exit').write_text(str(r.returncode)+'\n');return r.returncode
assert run('control')==0,'control failed'
a=[('wrong-chain','chain 43113','chain 43114'),('inflated-body-cap','to 8,192','to 65,536'),('cleared-backup','PR #244 remains unmerged','PR #244 is cleared for deployment'),('invented-test','replaying a funded craft must reuse the original result rather than charge again','a made-up craft test proves retries'),('missing-test-link','../supabase/tests/src/auth-wrappers.test.ts','../supabase/tests/src/not-a-test.test.ts'),('word-limit',None,'\n'+'extra ' * 1201)]
b=[('session-unbounded','at most 24 hours','unlimited hours'),('nonce-window','ten minute nonce','one-day nonce'),('counter-fails-open','fails closed with 503','continues with 200'),('per-ip-overclaim','per-IP limits and human uniqueness remain gaps','all rate limits deployed'),('fake-live-receipt','not a mint/list/buy receipt','a verified mint/list/buy receipt'),('wrong-contract','0x10fcC46e439d3E31Fb1720B337C45CadB9b2ff93','0xB1a1edb7A75Db6e7067E747ddee32B39c2296f2D')]
results=[]
for name,old,new in (a if which=='a' else b):
 assert old is None or source.count(old)==1,name+' anchor'
 try:
  file.write_text(source+new if old is None else source.replace(old,new,1));rc=run(name);log=(out/'logs'/f'{name}.log').read_text();killed=rc==1 and 'DOC_VALIDATION_FAIL' in log;results.append(dict(name=name,killed=killed,exit=rc));print(name,'KILLED' if killed else 'NOT_KILLED',flush=True);assert killed
 finally:file.write_bytes(original)
(out/'results.json').write_text(json.dumps(dict(head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),passName=which,control='PASS',originalSha256=hashlib.sha256(original).hexdigest(),results=results),indent=2)+'\n')
subprocess.run(['git','diff','--exit-code'],cwd=root,check=True,stdout=subprocess.DEVNULL)
