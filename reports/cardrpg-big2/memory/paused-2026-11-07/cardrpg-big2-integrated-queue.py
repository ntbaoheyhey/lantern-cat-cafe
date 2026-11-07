from pathlib import Path
import subprocess,time,os,json
root=Path('/Users/bao/taskbar-hero-cardrpg-big2')
print(json.dumps({'pid':os.getpid(),'waitForStandaloneRunner':6992,'artifact':'9a5f6ebb'}),flush=True)
while 'node tools/cardrpg-big2/review-measurements.mjs' in subprocess.run(['ps','-p','6992','-o','command='],capture_output=True,text=True).stdout:
    time.sleep(5)
result=subprocess.run(['node','tools/cardrpg-big2/integrated-measurements.mjs'],cwd=root)
print(json.dumps({'exit':result.returncode}),flush=True)
raise SystemExit(result.returncode)
