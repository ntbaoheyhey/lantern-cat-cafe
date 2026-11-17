#!/usr/bin/env python3
"""Build one exact local snapshot commit and scan it with fully redacted output."""
from pathlib import Path
import collections, datetime, json, os, re, shutil, subprocess, sys, tarfile, time

QA = Path('/Users/bao/taskbar-hero-qa')
SOURCE = Path('/Users/bao/taskbar-hero')
SNAPSHOT = Path('/Users/bao/taskbar-hero-snapshot')
TARGET = sys.argv[1]
assert re.fullmatch(r'[0-9a-f]{40}', TARGET)
REPORT = QA / 'reports/v4-qa/Q3/snapshot-rehearsal.json'
WORK = QA / 'work/v4qa/snapshot'
assert not SNAPSHOT.exists() and not REPORT.exists(), 'Preserve existing work'
WORK.mkdir(parents=True, exist_ok=True)
START = time.time()
DEADLINE = START + 90 * 60
ENV = {k:v for k,v in os.environ.items() if k in ['PATH','HOME','USER','LOGNAME','SHELL','TMPDIR','LANG','LC_ALL','PNPM_HOME']}
ENV.update({'GIT_TERMINAL_PROMPT':'0','GIT_CONFIG_NOSYSTEM':'1','GIT_CONFIG_GLOBAL':'/dev/null'})
state = {'started':datetime.datetime.now(datetime.timezone.utc).isoformat(), 'targetSha':TARGET,
         'pid':os.getpid(), 'snapshot':str(SNAPSHOT), 'phase':'initializing', 'steps':[], 'scans':{},
         'scope':'One local parent commit, no parent remote or push. Pinned public submodule histories are separate.',
         'scanLimitations':['Default built-in gitleaks rules unless repository config is present.',
                            'No archive traversal; maximum recursive decode depth 5.',
                            'A scan result is not a guarantee that no sensitive material exists.']}

def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()

def save():
    temp = REPORT.with_suffix('.tmp')
    temp.write_text(json.dumps(state,indent=2)+'\n')
    temp.replace(REPORT)

def check():
    assert not (QA/'STOP-V4QA').exists(), 'STOP-V4QA'
    if time.time() >= DEADLINE:
        raise TimeoutError('Q3 90-minute job timebox reached')

def guard(label):
    check()
    subprocess.run(['uptime'],check=True)
    while os.getloadavg()[0] > 9:
        state['phase']='load-deferred: '+label; save()
        print(f'DEFER {label} load1={os.getloadavg()[0]:.2f}',flush=True)
        until = time.time()+300
        while time.time() < until:
            check(); time.sleep(min(5,until-time.time()))
        subprocess.run(['uptime'],check=True)
    state['phase']=label; save()
    print(f'START {label} load1={os.getloadavg()[0]:.2f}',flush=True)

def command(label,args,cwd=SNAPSHOT,timeout=1800,required=True):
    guard(label)
    log=WORK/(label+'.log')
    item={'label':label,'command':args,'started':now(),'log':str(log)}
    state['steps'].append(item); save()
    try:
        with log.open('x') as stream:
            p=subprocess.run(args,cwd=cwd,env=ENV,stdout=stream,stderr=subprocess.STDOUT,
                             timeout=max(1,min(timeout,DEADLINE-time.time())))
        item.update({'ended':now(),'exitCode':p.returncode})
    except subprocess.TimeoutExpired:
        item.update({'ended':now(),'status':'TIMEBOX','exitCode':None}); save(); raise
    save()
    if required and item['exitCode'] != 0:
        raise RuntimeError(label+' failed; inspect only safe summaries')
    return item

try:
    save(); guard('source-inventory')
    raw=subprocess.check_output(['git','ls-tree','-r','-l','-z',TARGET],cwd=SOURCE,env=ENV)
    rows=[]; links=[]; groups=collections.Counter(); counts=collections.Counter(); flags=[]
    source_index={}
    for entry in raw.split(b'\0'):
        if not entry: continue
        header,name=entry.split(b'\t',1); mode,kind,oid,size=header.decode().split(); name=name.decode()
        source_index[name]=(mode,oid)
        if kind=='commit': links.append({'path':name,'sha':oid,'mode':mode}); continue
        size=int(size); rows.append((size,name)); group=name.split('/')[0]
        groups[group]+=size;counts[group]+=1
        if any(x in name.split('/') for x in ['private','raw','.DS_Store']) or name.endswith(('.psd','.psb','.blend','.kra','.aep')):
            flags.append(name)
    state['inventory']={'blobCount':len(rows),'blobBytes':sum(s for s,p in rows),
        'groups':[{'path':p,'bytes':s,'files':counts[p]} for p,s in groups.most_common()],
        'largest':[{'bytes':s,'path':p} for s,p in sorted(rows,reverse=True)[:30]],
        'gitlinks':links,'flaggedPaths':flags,'diskFreeBefore':shutil.disk_usage(SOURCE).free}
    save(); guard('archive-export')
    SNAPSHOT.mkdir()
    files=0; total=0; archive_log=WORK/'archive-stderr.log'
    with archive_log.open('x') as errors:
        archive=subprocess.Popen(['git','archive','--format=tar',TARGET],cwd=SOURCE,env=ENV,stdout=subprocess.PIPE,stderr=errors)
        try:
            with tarfile.open(fileobj=archive.stdout,mode='r|') as tar:
                for member in tar:
                    check(); output=SNAPSHOT/member.name
                    assert output.resolve().is_relative_to(SNAPSHOT.resolve()),'Unsafe archive path'
                    if member.isdir(): output.mkdir(parents=True,exist_ok=True)
                    elif member.isfile():
                        output.parent.mkdir(parents=True,exist_ok=True)
                        with tar.extractfile(member) as src,output.open('wb') as dst:
                            shutil.copyfileobj(src,dst,length=1024*1024)
                        output.chmod(member.mode & 0o777);files+=1;total+=member.size
                    elif member.issym():
                        assert not Path(member.linkname).is_absolute(),'Absolute symlink'
                        assert (output.parent/member.linkname).resolve().is_relative_to(SNAPSHOT.resolve()),'External symlink'
                        output.parent.mkdir(parents=True,exist_ok=True);output.symlink_to(member.linkname);files+=1
                    else: raise RuntimeError('Unexpected archive member type')
                    if files and files%5000==0:
                        state['exportProgress']={'files':files,'bytes':total,'at':now()};save()
            assert archive.wait(timeout=30)==0,'Git archive failed'
        finally:
            if archive.poll() is None: archive.terminate();archive.wait(timeout=10)
    state['export']={'ended':now(),'files':files,'bytes':total};save()
    command('git-init',['git','init','--initial-branch=codex/v4-snapshot-local','--template='],timeout=30)
    command('git-stage',['git','-c','core.autocrlf=false','add','--force','--all'],timeout=1800)
    for link in links:
        subprocess.run(['git','update-index','--add','--cacheinfo',f"160000,{link['sha']},{link['path']}"],cwd=SNAPSHOT,env=ENV,check=True)
    tree=subprocess.check_output(['git','write-tree'],cwd=SNAPSHOT,env=ENV,text=True).strip()
    expected=subprocess.check_output(['git','rev-parse',TARGET+'^{tree}'],cwd=SOURCE,env=ENV,text=True).strip()
    state['treeCheck']={'sourceTree':expected,'snapshotIndexTree':tree,'identical':tree==expected};save()
    assert tree==expected,'Snapshot tree differs; do not claim exact export'
    command('single-local-commit',['git','-c','core.hooksPath=/dev/null','-c','commit.gpgsign=false',
        '-c','user.name=V4 QA Snapshot','-c','user.email=v4-qa@local.invalid','commit','-m',f'Snapshot of SHIP {TARGET}'],timeout=1800)
    state['commit']={'sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=SNAPSHOT,env=ENV,text=True).strip(),
        'count':int(subprocess.check_output(['git','rev-list','--count','HEAD'],cwd=SNAPSHOT,env=ENV,text=True)),
        'remotes':subprocess.check_output(['git','remote'],cwd=SNAPSHOT,env=ENV,text=True).splitlines()}
    assert state['commit']['count']==1 and not state['commit']['remotes'];save()
    command('public-pinned-submodules',['git','submodule','update','--init','--recursive'],timeout=600,required=False)
    state['submodules']=subprocess.check_output(['git','submodule','status','--recursive'],cwd=SNAPSHOT,env=ENV,text=True).splitlines();save()
    for kind in ['dir','git']:
        raw_report=WORK/f'gitleaks-{kind}-redacted.json'
        args=['gitleaks',kind,str(SNAPSHOT),'--redact=100','--no-banner','--no-color',
              '--report-format=json','--report-path='+str(raw_report),'--timeout=1500']
        if kind=='git':args.append('--log-opts=--all')
        result=command('gitleaks-'+kind,args,timeout=1530,required=False)
        findings=json.loads(raw_report.read_text()) if raw_report.exists() else None
        safe=[{'file':f.get('File'),'line':f.get('StartLine'),'rule':f.get('RuleID')} for f in findings] if isinstance(findings,list) else []
        state['scans'][kind]={'started':result['started'],'ended':result['ended'],'exitCode':result['exitCode'],
            'findingCount':len(safe),'findings':safe,'reportProduced':raw_report.exists(),
            'status':'PASS' if result['exitCode']==0 and findings==[] else ('FINDINGS' if result['exitCode']==1 and safe else 'INCOMPLETE')}
        save()
    state['phase']='snapshot-and-scans-complete';state['ended']=now();save()
    print(json.dumps({'phase':state['phase'],'commit':state['commit'],'scans':{k:{x:v[x] for x in ['status','findingCount','exitCode']} for k,v in state['scans'].items()}}),flush=True)
except Exception as error:
    state['phase']='incomplete';state['ended']=now();state['error']=type(error).__name__+': '+str(error);save()
    print(json.dumps({'phase':state['phase'],'error':state['error']}),flush=True)
    sys.exit(1)
