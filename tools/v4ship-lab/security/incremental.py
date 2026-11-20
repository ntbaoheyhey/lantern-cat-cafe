"""Cover post-start commits and current edits without exposing detector matches.

The full-history job began after S0. This check covers its later commits plus
changed and new committable files. Values are examined only in process memory.
"""
import datetime,json,os,pathlib,subprocess,tempfile,time

root=pathlib.Path(__file__).resolve().parents[3]
base='71f2401f763f3f0d79b1a8dc6148e3c2d73600b1'
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
flags=['--no-banner','--no-color','--redact=0','--log-level=fatal','--report-format=json','--report-path=-','--ignore-gitleaks-allow']

def scan(command,prefixes=()):
    process=subprocess.run(command+flags,cwd=root,capture_output=True)
    if process.returncode not in (0,1):raise RuntimeError('Incremental scan failed; diagnostic output suppressed')
    safe=[]
    for row in json.loads(process.stdout or b'[]'):
        file=row['File']
        for prefix in prefixes:file=file.removeprefix(prefix)
        reason=None
        if file in ['tools/v4ship-lab/security/triage-candidates.py','tools/v4ship-lab/security/incremental.py'] and row['RuleID']=='generic-api-key':
            if row.get('Secret')=='RelicMarketV2':reason='comparison against public Solidity contract identifier'
            if row.get('Secret')=='primary/secondary':reason='comparison against reviewed UI category prose'
        safe.append({'file':file,'line':row['StartLine'],'commit':row.get('Commit',''),'type':row['RuleID'],'classification':'false-positive' if reason else 'unresolved','reason':reason or 'requires contextual review'})
    return safe

started=time.monotonic()
names=set()
for command in [['git','diff','--name-only','-z',base],['git','ls-files','--others','--exclude-standard','-z']]:
    names.update(os.fsdecode(p) for p in subprocess.check_output(command,cwd=root).split(b'\0') if p)
with tempfile.TemporaryDirectory(prefix='v4ship-incremental-') as temporary:
    included=[]
    for name in sorted(names):
        source=root/name
        if not source.is_file() or source.is_symlink():continue
        target=pathlib.Path(temporary)/name;target.parent.mkdir(parents=True,exist_ok=True);target.symlink_to(source);included.append(name)
    current=scan(['gitleaks','dir','--follow-symlinks',temporary],(temporary+'/',str(root)+'/'))
history=scan(['gitleaks','git',f'--log-opts={base}..{head}',str(root)],(str(root)+'/',))
unresolved=sum(row['classification']=='unresolved' for row in current+history)
report={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'base':base,'head':head,'scope':'current changed/new nonignored regular files plus every post-S0 integration commit','files':included,'elapsedSeconds':round(time.monotonic()-started,2),'findings':current,'postStartHistoryFindings':history,'postStartCommits':int(subprocess.check_output(['git','rev-list','--count',f'{base}..{head}'],cwd=root)),'rawFindingCount':len(current)+len(history),'unresolved':unresolved,'pass':unresolved==0}
(root/'reports/v4-ship/S1/secrets-incremental.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['files','findings','postStartHistoryFindings']}))
