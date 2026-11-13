"""Full Q6 acceptance with durable subprocess logs; no model or network deployment."""
import datetime,json,os,subprocess
from pathlib import Path
root=Path(__file__).resolve().parents[2]
base=root/'reports/v3-shell/b2'
label=os.environ.get('Q6_RUN','final2')
states=[row['id'] for row in json.loads((base/'UI-REBUILD.json').read_text())['screens']]
chain=[s for s in states if s.startswith(('wallet-','market-'))]
shell=[s for s in states if s not in chain]
receipt=base/f'q6/acceptance-{label}.json'
results=json.loads(receipt.read_text()) if receipt.exists() else []
def run(name,command,extra=None):
    if any(r['name']==name and r['exitCode']==0 for r in results):
        print(f'Reusing completed step {name}',flush=True)
        return
    if extra is not None:extra=dict(extra,CAPTURE_RESUME='1')
    env=dict(os.environ,**(extra or {}));log=base/'tests'/f'q6-{label}-{name}.log'
    if log.exists():log.rename(log.with_name(log.stem+'-attempt'+str(sum(r['name']==name for r in results))+log.suffix))
    started=datetime.datetime.now(datetime.timezone.utc).isoformat()
    with log.open('w') as output:
        child=subprocess.Popen(command,cwd=root,env=env,stdout=output,stderr=subprocess.STDOUT)
        print(json.dumps({'name':name,'pid':child.pid,'log':str(log)}),flush=True)
        code=child.wait()
    results.append({'name':name,'command':command,'environment':extra,'exitCode':code,'started':started,'ended':datetime.datetime.now(datetime.timezone.utc).isoformat(),'log':str(log.relative_to(root))})
    receipt.write_text(json.dumps(results,indent=2)+'\n')
    if code:raise SystemExit(f'{name} failed with exit {code}; inspect its log before retry')
for width in [1280,1440]:
    run(f'shell-{width}',['node','scripts/ui/q6-capture.mjs'],{'SCREENS':','.join(shell),'CAPTURE_WIDTH':str(width),'CAPTURE_LABEL':label})
    run(f'chain-{width}',['node','scripts/ui/q6-chain-capture.mjs'],{'SCREENS':','.join(chain),'CAPTURE_WIDTH':str(width),'CAPTURE_LABEL':'chain-'+label})
run('shell-phone',['node','scripts/ui/q6-capture.mjs'],{'SCREENS':'cats-list,hero-level-star,hero-skills,hero-bonds,hero-gear,hero-awakening,bag-item-detail,bag-manage,bag-consumables,invitations-rates,season-track-countdown-edition,season-guide,economy-odds,settings,settings-audio,chapter-map,battle-prep,victory,defeat','CAPTURE_WIDTH':'390','CAPTURE_LABEL':label+'-phone'})
run('chain-phone',['node','scripts/ui/q6-chain-capture.mjs'],{'SCREENS':'wallet-panel,wallet-fusion,wallet-history,wallet-ornament-forge,wallet-offline','CAPTURE_WIDTH':'390','CAPTURE_LABEL':'chain-'+label+'-phone'})
run('suite',['node','scripts/v3b2/run-solo-unit-suite.mjs','q6-'+label])
run('browser',['python3','scripts/v3b2/run-solo-browser-suite.py','q6-'+label])
print('All Q6 captures and full local suites passed',flush=True)
