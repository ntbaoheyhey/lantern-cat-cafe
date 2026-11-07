import pathlib,subprocess,time,json,hashlib,datetime
root=pathlib.Path('/Users/bao/taskbar-hero-cardrpg-big2')
while '/tools/cardrpg-big2/review-measurements.mjs' in subprocess.run(['ps','-p','6992','-o','command='],capture_output=True,text=True).stdout or 'node tools/cardrpg-big2/review-measurements.mjs' in subprocess.run(['ps','-p','6992','-o','command='],capture_output=True,text=True).stdout:
    time.sleep(5)
progress_path=root/'reports/cardrpg-big2/review/run-steps.json'
acceptance_path=root/'reports/cardrpg-big2/validation/review-source-acceptance.json'
p=json.loads(progress_path.read_text()); a=json.loads(acceptance_path.read_text())
required=['e2e','studio','gallery-controls','image-pack','loading','stage-life','mechanics','audio','audio-startup','hitstop','cold','lifecycle','navigation','flow','video','boss-battles','flag-off-prepare','flag-off-browser']
assert a['accepted'] and a['head']==p['sourceHead'] and a['sha256']==p['sha256']
assert hashlib.sha256(pathlib.Path(a['artifact']).read_bytes()).hexdigest()==p['sha256']
for row in a['rows']:
    assert row['exit']==0, row['name']
    assert hashlib.sha256((root/row['log']).read_bytes()).hexdigest()==row['sha256'], row['log']
assert {r['name'] for r in a['rows']}=={'typecheck','demo-types','lint','tests','build','e2e'}
failed={name:p['steps'].get(name) for name in required if p['steps'].get(name,{}).get('status')!='passed'}
assert not failed, failed
receipt={'recordedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'artifactSha256':p['sha256'],'sourceHead':p['sourceHead'],'functionalAccepted':True,'performanceThresholdsAccepted':False,'method':'Original runner source failure retained. Independent complete-source retry accepted only after all six receipt/log hashes match. Every required functional step completed on the pinned artifact. Timing gate values still require separate comparison; successful harness completion does not imply the performance threshold passed.','sourceAcceptance':str(acceptance_path.relative_to(root)),'sourceAcceptanceSha256':hashlib.sha256(acceptance_path.read_bytes()).hexdigest(),'runStepsSha256':hashlib.sha256(progress_path.read_bytes()).hexdigest(),'steps':required}
(root/'reports/cardrpg-big2/review/functional-acceptance.json').write_text(json.dumps(receipt,indent=2))
pathlib.Path('/tmp/cardrpg-big2-review-functional-release').write_text(json.dumps(receipt))
print(json.dumps(receipt),flush=True)
