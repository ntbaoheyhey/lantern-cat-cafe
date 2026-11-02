from pathlib import Path
import subprocess,os,json,datetime
card=Path(__file__).parent
root=Path('/Users/bao/.codex/worktrees/mega-base0-verify-280ff4b/taskbar-hero')
env=dict(os.environ,TMPDIR=str(card/'wrapper-tmp'),CI='true',SCREENSHOTS='0',VITE_ALLOW_MOCK_AUTH='0',VITE_SUPABASE_URL='',VITE_SUPABASE_ANON_KEY='',E2E_PORT_CLASSIC='4410',E2E_PORT_V2='4411',E2E_PORT_SERVER='4412',E2E_PORT_API='4413')
try:
 with (card/'checks/verify-pr-246.log').open('w') as stream:
  stream.write('EXPECTED_HEAD=280ff4bed495fd28bd489eb5f2dcfd1910f21fc0\nCOMMAND=bash scripts/verify-pr.sh 246 (no comments)\n');stream.flush()
  code=subprocess.call(['bash','scripts/verify-pr.sh','246'],cwd=root,env=env,stdout=stream,stderr=subprocess.STDOUT)
  stream.write('\nEXIT_CODE='+str(code)+'\n')
 (card/'wrapper-result.json').write_text(json.dumps({'expectedHead':'280ff4bed495fd28bd489eb5f2dcfd1910f21fc0','exit':code,'finishedAt':datetime.datetime.now().astimezone().isoformat(),'log':'checks/verify-pr-246.log'},indent=2)+'\n')
finally:Path('/tmp/taskbar-hero-coordinator-4410.lock').unlink(missing_ok=True)
