from pathlib import Path
import hashlib,json,subprocess
root=Path.cwd();out=root/'reports/cardrpg-look/skills-v5'
read=lambda p:json.loads((out/p).read_text())
a=read('after-browser.json');b=read('before-browser.json');perf=read('perf-delivery/casts.json');cold=read('perf-delivery/summary.json');oldcold=read('perf-before/summary.json');oldperf=read('perf-before/casts.json');faces=read('faces.json');startup=read('startup/audit.json');delivery=read('delivery.json');videos=read('videos/checks.json');gates=read('gates/checks.json');demo=root/'docs/cardrpg-look/v5-v0.html';data=demo.read_bytes();sha=hashlib.sha256(data).hexdigest()
recovery=read('gates/recovery.json')
assert len(gates)==5 and all(c['code']==0 for c in gates if c['name']!='e2e')
assert gates[-1]['name']=='e2e' and gates[-1]['code']==1 and recovery['code']==0
assert a['sha256']==perf['sha256']==cold['sha256']==sha
assert videos['rows'][1]['artifactSha256']==sha
assert read('digests-before.json')==read('digests-after.json')
build=read('build.json')
assert build['sha256']==sha
buildInputDrift=[]
for path,expected in build['sourceHashes'].items():
    actual=hashlib.sha256((root/path).read_bytes()).hexdigest()
    if actual!=expected:
        # The retained selector failure changed the QA tool, not a demo input.
        assert path=='tools/cardrpg-look/skills-v5/delivery.mjs',path
        buildInputDrift.append({'path':path,'before':expected,'after':actual,'reason':'QA-only stable select locator; no runtime/art asset change'})
rows=perf['rows'];maxcast=max(r['max']for r in rows);oldcast=max(r['max']for r in oldperf['rows'])
# The inherited cold summary reports all page frames from before navigation.
maxcold=max(r['summary']['max']for r in cold['rows']) if 'summary' in cold['rows'][0] else max(r['max']for r in cold['rows'])
oldmax=max(r['summary']['max']for r in oldcold['rows']) if 'summary' in oldcold['rows'][0] else max(r['max']for r in oldcold['rows'])
peakdraw=max([r['peakDraws']for r in rows]+[r['stats']['calls']for r in a['shots']]+[r['calls']for r in faces['rows']]);peaktri=max([r['peakTriangles']for r in rows]+[r['stats']['triangles']for r in a['shots']]+[r['triangles']for r in faces['rows']])
base='598fd8019e62b7203dcfac4033f74bb64ba0dac5'
changed=subprocess.check_output(['git','diff','--name-only',base],text=True).splitlines()+subprocess.check_output(['git','ls-files','--others','--exclude-standard'],text=True).splitlines()
allowed=lambda p:p.startswith(('apps/web/src/game/squad/turn3d/','assets/cardrpg-look/statuses/','tools/cardrpg-look/','docs/cardrpg-look/','reports/cardrpg-look/'))or p in ['apps/web/src/game/cardrpg/depth/Battle.tsx','assets/provenance/look.md','docs/design/cardrpg/LOOK-BIBLE.md']
assert all(allowed(p)for p in changed),[p for p in changed if not allowed(p)]
sourcepaths=sorted(p for p in set(changed) if p.startswith(('apps/web/','assets/','tools/')))
audit={'base':base,'artifactSha256':sha,'artifactBytes':len(data),'sourceFiles':{p:hashlib.sha256((root/p).read_bytes()).hexdigest() for p in sourcepaths},'buildInputDrift':buildInputDrift,'runtimeAndArtBuildInputsExact':True,'changedOutsideScope':[],'protectedChanges':[],'rulesTreeBefore':subprocess.check_output(['git','rev-parse',base+':packages/game-rules'],text=True).strip(),'rulesTrackedDiff':subprocess.check_output(['git','diff',base,'--','packages/game-rules'],text=True),'evidenceSource':'Native macOS headless Chromium/Metal; no model calls or desktop control.'}
(out/'source-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
result={'base':base,'artifactSha256':sha,'artifactBytes':len(data),'demoDeltaBytes':len(data)-Path('docs/cardrpg-look/b2.html').stat().st_size,'seeds':[r['seed']for r in read('digests-after.json')],'battleAndLogParity':True,'nativeCastWindows':len(rows),'nativeMax':maxcast,'nativeBeforeMax':oldcast,'cpu4ColdMax':maxcold,'cpu4ColdBeforeMax':oldmax,'cpu4DeltaPercent':(maxcold/oldmax-1)*100,'peakDraws':peakdraw,'peakTriangles':peaktri,'faces':faces['samples'],'faceOffenders':len(faces['offenders']),'overlaps':{r['width']:r['overlap']for r in a['ui']},'contrastMin':min(r['contrastMin']for r in a['ui']),'comboLayouts':a['comboLayouts'],'startup':startup,'offFixedFramePixelsExact':delivery['offPixelExact'],'gates':gates,'e2eRecovery':recovery,'sameVideoInitial':videos['sameInitial'],'evidenceBytes':sum(p.stat().st_size for p in out.rglob('*')if p.is_file())}
(out/'RESULTS.json').write_text(json.dumps(result,indent=2)+'\n')
lines=[
'Đã thêm huy hiệu, số cộng dồn và vòng thời hạn cho đủ 16 trạng thái hiện có.',
'Dấu trên nhân vật rõ hơn; Mark/Daze không còn bị vùng bảo vệ mặt che mất.',
'Đòn nhiều mục tiêu lệch nhau 70 ms; Crumb Burst có chữ báo 500 ms, không đổi nhịp luật.',
'Demo và hai video 20 giây được lưu kèm bằng chứng; chỉ tạo PR nháp, chưa merge hay triển khai.',
'V0 có kiểm chứng kỹ thuật; khả năng người xem nhận diện trạng thái vẫn CHƯA ĐƯỢC KIỂM CHỨNG.',
'', '# V0 · Statuses and visible combinations','',
f'Base `{base}`; B2 report checkpoint was `f4cd0da0b`, then a documentation-only handoff tip. Branch `codex/cardrpg-v5look-v0-2026-11-09`.',
f'Demo [v5-v0.html](../../../docs/cardrpg-look/v5-v0.html): {len(data):,} bytes; SHA256 `{sha}`. [Integration](INTEGRATION.md).',
'REFERENCE: [user prompt](PROMPT.txt), [approved spec](SPEC.md), [B2 report](../b2/B2-REPORT.md), [LOOK-BIBLE](../../../docs/design/cardrpg/LOOK-BIBLE.md).','',
'| Fixed shot | Before | After | Self-grade / reason |','| --- | --- | --- | --- |']
cases=[('1-burn','Burn','5→7/10; shoulder flames plus a numeric badge; rear flames can be occluded.'),('2-mark-daze','Mark + Daze','3→8/10; cup and clouds are visible above both heads.'),('3-regen-warm','Regen + Warm','4→6.5/10; green leaves and badges help; honey halo remains subtle.'),('4-signatures','All16 / overflow','3→6.5/10; four badges and focusable +12 expose the vocabulary; simultaneous body marks are busy.'),('5-row','Three-target row','6→7.5/10; 0/70/140ms impacts spread; legacy large result text can crowd plates.'),('6-burst','Three-target Crumb Burst','5→8/10; distinct words/explosion, arranged away from HP and other words.')]
for key,name,grade in cases:lines.append(f'| {name} | ![Before](shots/before-1440-{key}.webp) | ![After](shots/after-1440-{key}.webp) | {grade} |')
lines += ['', 'The six DPR1 shots are labelled presentation fixtures (existing R.act resolves row/detonation). Self-grades are not user review. [16×2 contact sheet](status-contact-sheet.webp).', '', '| Measured item | Result |','| --- | --- |',
'| Five seeds 7,17,71,1808,20261108 | Full battle JSON and log hashes byte-identical; adapters leave plan and battle unmutated. |',
f'| Native cast max | {oldcast:.1f}→{maxcast:.1f}ms; 16 first/repeat windows per artifact, four actions at1280/1440. |',
f'| CPU4 cold page max | {oldmax:.1f}→{maxcold:.1f}ms ({(maxcold/oldmax-1)*100:+.1f}%); one fresh context per artifact, CPU-only throttle. |',
f'| Observed peak draws / tris | {peakdraw} / {peaktri:,}; draw budget130. |',
f'| Demo bytes | {len(data):,}; B2 delta{result["demoDeltaBytes"]:+,}, within+1,500,000. |',
f'| Protected faces | {faces["samples"]} samples, {len(faces["offenders"])} threshold offenders; each current status on Mochi and Button Guard. |',
f'| Badge overlaps / contrast | 0 at1440×900,1280×720,1024×600; minimum{result["contrastMin"]:.2f}:1. |',
f'| OFF startup | {startup["scripts"]} scripts/{startup["startupBytes"]:,}bytes; per-chunk byte counts/modules unchanged; 8/11 content hashes exact, entry references normalize equal; zero Three/model startup modules. |',
'', '[Raw numbers](RESULTS.json) · [source audit](source-audit.json) · [UI](after-browser.json) · [performance](perf-delivery/casts.json) · [cold](perf-delivery/summary.json).',
'Typecheck/lint/unit (1782 web/1020 rules)/build PASS. E2E:420/421 first run; the one idle-clock test passed an isolated retry on unchanged source. Cause unproven; [first failure](gates/e2e.log) and [recovery](gates/recovery.json) retained.',
'Keyboard hover/focus tooltip, Escape, +N overflow, static reduced-motion matrices, three-size guide mouse controls and OFF fixed-frame renderer/HUD pixel parity PASS. [Delivery](delivery.json).',
'Natural chapter-1 x1,1440×900, continuous20s H.264: [before](videos/before-20s.mp4) / [after](videos/after-20s.mp4); same initial battle, no cuts or injected actions. [Receipt](videos/checks.json).',
'New artwork:16 original SVG paths; no textures/dependencies added. All look changes remain behind lookV2; rules/protected paths unchanged; action-clock delta0ms. [Provenance](../../../assets/provenance/look.md).',
'', 'LIMITS: Human 4/5 status recognition is NOT VERIFIED; the natural20s clips do not cover every status/reaction. Existing warm/glaze marks are subtle; all16 simultaneous marks and legacy large row-hit numbers remain visually busy. OFF pixel check isolates a fixed battle surface from the standalone demos’ differing chrome; startup audit covers the ordinary app route.',
'Iteration1 native/cold results, earlier overlaps, crown-mask clipping and selector/capture failures are retained, not substituted for delivery results. No causal claim about historical macOS driver stalls; timing coverage is deliberately bounded.',
'V3 NOT STARTED: no published “skillsV5 events v2 fixture” DONE at this handoff. Lane A REQUEST records the needed schema; stop at V0 per the task contract.',
f'Evidence currently {result["evidenceBytes"]:,}bytes (<25MB); raw PNGs/frames in /tmp/cardrpg-v5look-*. DRAFT only; no merge, deployment, A5 worktree access or rule edits.' ]
assert len(lines)<=60
(out/'V0-REPORT.md').write_text('\n'.join(lines)+'\n')
print(json.dumps({k:result[k]for k in ['artifactBytes','nativeMax','cpu4ColdMax','peakDraws','peakTriangles','evidenceBytes']}))
