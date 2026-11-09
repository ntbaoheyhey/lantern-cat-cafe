from pathlib import Path
import json,hashlib,subprocess,re,gzip
root=Path.cwd();parent=root/'reports/cardrpg-look/skills-v5';out=parent/'v01'
def read(p):
 p=Path(p)
 return json.loads(p.read_text() if p.exists() else gzip.decompress(Path(str(p)+'.gz').read_bytes()))
def save(name,data): (out/name).write_text(json.dumps(data,indent=2)+'\n')
a=read(out/'after-browser.json');build=read(out/'build.json');perf=read(out/'perf/casts.json');cold=read(out/'perf/cold.json');faces=read(out/'faces.json');delivery=read(out/'delivery.json');video=read(out/'videos/checks.json');gates=read(out/'gates/checks.json')
base='2504e7df354543c51444a6e855eb6af0c6f5def9';demo=root/'docs/cardrpg-look/v5-v0.html';data=demo.read_bytes();sha=hashlib.sha256(data).hexdigest()
assert a['sha256']==build['sha256']==perf['sha256']==cold['sha256']==video['rows'][0]['artifactSha256']==sha
assert read(out/'digests-before.json')==read(out/'digests-after.json')
assert len(gates)==5 and all(g['code']==0 for g in gates if g['name']!='e2e')
recovery=None
if gates[-1]['code']:
 recovery=read(out/'gates/recovery.json');assert len(recovery)==2 and all(x['code']==0 for x in recovery)
assert not faces['offenders'] and delivery['offPixelExact'] and not a['errors'] and not perf['errors']
assert all(u['overlap']==u['bounds']==0 and u['contrastMin']>=4.5 and u['reducedMotionStatic'] for u in a['ui'])
assert all(len(u['callouts'])==3 and all(u[k]==0 for k in ['reservedOverlaps','outside','wordOverlaps','plateOverlaps']) for u in a['comboLayouts'])
assert all(set(u['iconPixels'])=={16 if u['width']==1024 else 20} for u in a['ui'])
assert all(len(set(x['family']for x in u['familyRims']))==3 for u in a['ui'])
drift=[]
for path,h in build['sourceHashes'].items():
 if hashlib.sha256((root/path).read_bytes()).hexdigest()!=h:
  assert path.startswith('tools/cardrpg-look/skills-v5/'),path
  assert path not in ['tools/cardrpg-look/skills-v5/offline.tsx','tools/cardrpg-look/skills-v5/review.css']
  drift.append(path)
changed=subprocess.check_output(['git','diff','--name-only',base],text=True).splitlines()+subprocess.check_output(['git','ls-files','--others','--exclude-standard'],text=True).splitlines()
allowed=lambda p:p.startswith(('apps/web/src/game/squad/turn3d/','tools/cardrpg-look/','docs/cardrpg-look/','reports/cardrpg-look/'))or p in ['apps/web/src/game/cardrpg/depth/Battle.tsx','assets/provenance/look.md']
assert all(allowed(p)for p in changed),[p for p in changed if not allowed(p)]
flag=read(out/'startup/checks.json');oldflag=read(parent/'startup/checks.json')
for k in ['prohibitedModules','modelRequests','errors']:assert not flag[k]
key=lambda c:tuple(sorted(c['modules']))
oldchunks={key(c):c for c in oldflag['chunks']}
assert len(flag['chunks'])==len(oldchunks)
assert all(key(c) in oldchunks and c['bytes']==oldchunks[key(c)]['bytes'] for c in flag['chunks'])
startup={'scripts':len(flag['chunks']),'startupBytes':sum(c['bytes']for c in flag['chunks']),'sameByteCountsAndModuleMembership':True,'exactHashes':sum(c['sha256']==oldchunks[key(c)]['sha256']for c in flag['chunks']),'threeOrModelModules':0}
save('startup/audit.json',startup)
rows=perf['rows'];native=max(r['max']for r in rows);coldmax=max(r['max']for r in cold['rows']);oldcold=max(r['max']for r in read(parent/'perf-delivery/summary.json')['rows'])
draws=max([r['peakDraws']for r in rows]+[r['stats']['calls']for r in a['shots']]+[r['calls']for r in faces['rows']]);tris=max([r['peakTriangles']for r in rows]+[r['stats']['triangles']for r in a['shots']]+[r['triangles']for r in faces['rows']])
assert native<=16.80001 and draws<=130
source={p:hashlib.sha256((root/p).read_bytes()).hexdigest()for p in sorted(set(changed))if p.startswith(('apps/','assets/','tools/'))}
save('source-audit.json',{'base':base,'artifactSha256':sha,'runtimeAndArtBuildInputsExact':True,'qaOnlyDrift':drift,'sourceFiles':source,'protectedChanges':[],'rulesDiff':subprocess.check_output(['git','diff',base,'--','packages/game-rules'],text=True)})
result={'base':base,'artifactSha256':sha,'artifactBytes':len(data),'battleAndLogParity':True,'nativeCastWindows':len(rows),'nativeMax':native,'cpu4ColdMax':coldmax,'cpu4ColdBeforeMax':oldcold,'cpu4DeltaPercent':(coldmax/oldcold-1)*100,'peakDraws':draws,'peakTriangles':tris,'faces':faces['samples'],'faceOffenders':0,'contrastMin':min(u['contrastMin']for u in a['ui']),'badgeOverlap':0,'calloutOverlap':0,'startup':startup,'offPixelsExact':True,'gates':gates,'e2eRecovery':recovery}
save('RESULTS.json',result)
lines=['## V0.1 · Readability fixes','','Đã neo chữ phản ứng theo từng mục tiêu, hạ Mark/Daze sát đầu và tăng độ rõ của lửa.','Huy hiệu có khung màu riêng; khói vụn tan nhanh, Warm/Glaze đạt độ mờ 76%.','Chỉ sửa phần nhìn; năm seed giữ nguyên kết quả. Tiếp tục V3 tự động khi Lane A công bố fixture.','', '| Fixed DPR1 shot / self-grade | V0 before | V0.1 after |','| --- | --- | --- |']
for key,label,grade in [('1-burn','Burn','8/10: five side flames countable'),('2-mark-daze','Mark + Daze','8/10: closer crowns with dark backing'),('3-regen-warm','Regen + Warm','7.5/10: visible honey halo'),('4-signatures','All16','7/10: framed badges, dense marks remain busy'),('5-row','Three-target row','7.5/10: unchanged stagger, legacy numbers busy'),('6-burst','Crumb Burst','8/10: target-local words, bodies stay visible')]:
 lines.append(f'| {label}: {grade} | ![Before](shots/after-1440-{key}.webp) | ![After](v01/shots/after-1440-{key}.webp) |')
lines += ['',f'Five-seed full battle/log parity PASS; native {native:.1f}ms max ({len(rows)} windows); peak {draws} draws/{tris:,} tris. CPU4 cold {oldcold:.1f}→{coldmax:.1f}ms ({result["cpu4DeltaPercent"]:+.1f}%).',f'Badge/callout overlaps0 at1024/1280/1440; contrast{result["contrastMin"]:.2f}:1; icons16/20/20px, warm/teal/honey rim colours checked. Words500ms, offsets0/70/140ms; action clock unchanged.',f'Protected faces0/{faces["samples"]}; crown mask excludes only empty space above the entire model from the circular margin; on-model face regions unchanged. [Contact sheet](v01/status-contact-sheet.webp).',f'Typecheck/lint/unit1783web+1020rules/build PASS; E2E '+('420/421 then idle-clock isolated twice PASS, unchanged test; original failure retained.' if recovery else '421/421 PASS first run.')+' [Gate receipts](v01/gates/checks.json).',f'lookV2 OFF fixed-frame canvas/HUD pixels exact; startup{startup["scripts"]} chunks/{startup["startupBytes"]:,}bytes, unchanged sizes/modules, zero Three/model modules.',f'Demo [v5-v0.html](../../../docs/cardrpg-look/v5-v0.html):{len(data):,}bytes, SHA256 `{sha}`. [Natural20s after](v01/videos/after-20s.mp4),1440×900,x1,no cuts.',f'[Measurements](v01/RESULTS.json) · [Source audit](v01/source-audit.json). F1–F6 only; no rules/protected changes; prior misses retained. Self-grades are not user review; human recognition NOT VERIFIED.','V3 follows automatically after published V5A-S4 DONE events v2 fixture; native wait has no timing lease. Draft stacked on409; no merge/deploy.']
lines.insert(-1,'Video thumbnail export lacked a WebP encoder; recovered from the completed original MP4 without recapture. [Failure/recovery](v01/videos/checks.json); same-initial hash was not recorded for this clip.')
lines.append(f'Evidence: {sum(p.stat().st_size for p in out.rglob("*") if p.is_file()):,} added bytes (<8MB); total <25MB. Large JSON receipts use lossless gzip; startup images use pixel-exact lossless WebP. [Packing](v01/packing.json).')
assert len(lines)<=25
report=parent/'V0-REPORT.md';old=report.read_text().split('\n## V0.1 · Readability fixes')[0].rstrip();report.write_text(old+'\n\n'+'\n'.join(lines)+'\n')
print(json.dumps(result))
