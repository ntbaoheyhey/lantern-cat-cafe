#!/usr/bin/env python3
"""Run README installation and validation in the fresh, single-commit snapshot."""
from pathlib import Path
import datetime, json, os, re, signal, socket, subprocess, time, urllib.request

QA=Path('/Users/bao/taskbar-hero-qa')
SOURCE=Path('/Users/bao/taskbar-hero-snapshot')
REPORT=QA/'reports/v4-qa/Q3/quickstart.json'
WORK=QA/'work/v4qa/snapshot-quickstart'
assert not REPORT.exists() and not WORK.exists(), 'Preserve completed evidence'
preparation=json.loads((QA/'reports/v4-qa/Q3/snapshot-rehearsal.json').read_text())
assert preparation.get('commit',{}).get('count')==1 and preparation.get('scans',{}).get('dir',{}).get('ended'), 'Run only after snapshot commit and directory scan'
WORK.mkdir()
ENV={k:v for k,v in os.environ.items() if k in ['PATH','HOME','USER','LOGNAME','SHELL','TMPDIR','LANG','LC_ALL','PNPM_HOME']}
ENV.update({'CI':'1','GIT_TERMINAL_PROMPT':'0','GIT_CONFIG_NOSYSTEM':'1','GIT_CONFIG_GLOBAL':'/dev/null'})
START=datetime.datetime.fromisoformat(preparation['started']).timestamp()
DEADLINE=START+90*60
state={'started':datetime.datetime.now(datetime.timezone.utc).isoformat(),'pid':os.getpid(),
       'sourceSha':preparation['targetSha'],'snapshotCommit':preparation['commit']['sha'],
       'scope':'Fresh snapshot install/test/build. README frontend dev command uses allowed port6203. Full supervisor hard-codes forbidden QA ports and is not executed.',
       'timingScope':'shared-machine, indicative','phase':'initializing','steps':[]}

def now():return datetime.datetime.now(datetime.timezone.utc).isoformat()
def save():
    temp=REPORT.with_suffix('.tmp');temp.write_text(json.dumps(state,indent=2)+'\n');temp.replace(REPORT)
def check():
    assert not (QA/'STOP-V4QA').exists(),'STOP-V4QA'
    if time.time()>=DEADLINE:raise TimeoutError('Q3 timebox reached')
def guard(label):
    check();subprocess.run(['uptime'],check=True)
    while os.getloadavg()[0]>9:
        state['phase']='load-deferred: '+label;save();print(f'DEFER {label} load1={os.getloadavg()[0]:.2f}',flush=True)
        until=time.time()+300
        while time.time()<until:check();time.sleep(min(5,until-time.time()))
        subprocess.run(['uptime'],check=True)
    state['phase']=label;save();print('START '+label,flush=True)
def stop_process_group(process):
    try:os.killpg(process.pid,signal.SIGTERM)
    except ProcessLookupError:pass
    try:process.wait(timeout=8)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid,signal.SIGKILL);process.wait(timeout=5)
def command(label,args,timeout=1200):
    guard(label);log=WORK/(label+'.log');row={'label':label,'command':args,'started':now(),'log':str(log)}
    state['steps'].append(row);save()
    with log.open('x') as stream:
        process=subprocess.Popen(args,cwd=SOURCE,env=ENV,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
        row['pid']=process.pid;save()
        until=min(time.time()+timeout,DEADLINE)
        try:
            while process.poll() is None:
                check()
                if time.time()>=until:raise TimeoutError(label+' timebox')
                time.sleep(2)
            row['exitCode']=process.returncode;row['status']='PASS' if process.returncode==0 else 'FAIL'
        except Exception:
            stop_process_group(process);row['status']='INCOMPLETE';row['exitCode']=None;raise
        finally:
            row['ended']=now()
            content=re.sub(r'\x1b\[[0-9;]*m','',log.read_text(errors='replace'))
            patterns=r'Test Files|Tests\s|Test Suites|Duration|tests? passed|tests? failed|# (pass|fail)|^.*Error:|error TS|built in|Done in'
            row['summary']=[line.strip()[:240] for line in content.splitlines() if re.search(patterns,line,re.I)][-18:]
            save()
    return row

try:
    save()
    install=command('frozen-install',['pnpm','install','--frozen-lockfile'],1800)
    if install['exitCode']!=0:raise RuntimeError('Fresh installation failed')
    commands=[('playwright-browser',['pnpm','--filter','@taskbar-hero/web','exec','playwright','install','chromium'],600),
        ('typecheck',['pnpm','typecheck'],900),('root-tests',['pnpm','test'],1200),
        ('supabase-tests',['pnpm','--filter','@taskbar-hero/supabase-tests','test'],600),
        ('build',['pnpm','build'],1200),('forge-tests',['forge','test','--root','contracts','-vv'],600),
        ('receipt-check-tests',['node','--test','tools/v4ship-lab/proof/receipt-check.test.mjs'],300)]
    for label,args,timeout in commands:command(label,args,timeout)
    guard('frontend-dev-start')
    probe=socket.socket();probe.bind(('127.0.0.1',6203));probe.close()
    args=['pnpm','--filter','@taskbar-hero/web','dev','--host','127.0.0.1','--port','6203','--strictPort']
    log=WORK/'frontend-dev.log'
    with log.open('x') as stream:
        process=subprocess.Popen(args,cwd=SOURCE,env=ENV,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
        row={'label':'frontend-dev-start','command':args,'started':now(),'pid':process.pid,'log':str(log),'port':6203}
        state['steps'].append(row);save()
        try:
            until=min(time.time()+90,DEADLINE)
            while time.time()<until:
                check()
                if process.poll() is not None:raise RuntimeError('Dev server exited before HTTP response')
                try:
                    with urllib.request.urlopen('http://127.0.0.1:6203/',timeout=2) as reply:
                        body=reply.read().decode();row['httpStatus']=reply.status
                    if row['httpStatus']==200 and 'vite' in body.lower():break
                except OSError:pass
                time.sleep(1)
            else:raise TimeoutError('Dev server startup')
            with urllib.request.urlopen('http://127.0.0.1:6203/@vite/client',timeout=5) as reply:row['viteClientStatus']=reply.status
            row['status']='PASS' if row['httpStatus']==row['viteClientStatus']==200 else 'FAIL'
        finally:
            stop_process_group(process);row['ended']=now();save()
    state['gitStatus']=subprocess.check_output(['git','status','--porcelain'],cwd=SOURCE,env=ENV,text=True).splitlines()
    state['commitCount']=int(subprocess.check_output(['git','rev-list','--count','HEAD'],cwd=SOURCE,env=ENV,text=True))
    state['remotes']=subprocess.check_output(['git','remote'],cwd=SOURCE,env=ENV,text=True).splitlines()
    state['phase']='complete';state['ended']=now();save()
    print(json.dumps({'phase':state['phase'],'steps':[{k:r.get(k) for k in ['label','status','exitCode']} for r in state['steps']]}),flush=True)
except Exception as error:
    state['phase']='incomplete';state['ended']=now();state['error']=type(error).__name__+': '+str(error);save()
    print(json.dumps({'phase':state['phase'],'error':state['error']}),flush=True)
    raise SystemExit(1)
