from pathlib import Path
import subprocess,json,datetime,shlex,sys
cfg=json.loads(Path(sys.argv[1]).read_text());root=Path(cfg['root']);out=Path(cfg['out']);results=[]
for name,cmd in cfg['commands']:
 assert subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()==cfg['head']
 log=out/'logs'/f'{name}.log';start=datetime.datetime.now(datetime.timezone.utc).isoformat()
 p=subprocess.run(['/bin/zsh','-c','('+cmd+') > '+shlex.quote(str(log))+' 2>&1; task_rc=$?; echo exit=$task_rc; exit $task_rc'],cwd=root,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
 (out/'logs'/f'{name}.exit').write_text(str(p.returncode)+'\n')
 results.append(dict(name=name,command=cmd,head=cfg['head'],exit=p.returncode,startedAt=start,endedAt=datetime.datetime.now(datetime.timezone.utc).isoformat()))
 (out/'commands.json').write_text(json.dumps(results,indent=2)+'\n');print(name,p.stdout.strip(),flush=True)
 if p.returncode: sys.exit(p.returncode)
