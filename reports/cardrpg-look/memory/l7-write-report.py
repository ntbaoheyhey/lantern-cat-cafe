"""Publish prose only after the final raw-data audit and personal video review."""
import hashlib,json,re,subprocess
from pathlib import Path
from urllib.parse import quote

root=Path(__file__).resolve().parents[3]
base=root/'reports/cardrpg-look'
load=lambda p:json.loads((base/p).read_text())
audit=load('validation/l7/audit.json')
freeze=load('validation/l7/freeze.json')
matrix=load('validation/l7/matrix/summary.json')
review=load('validation/l7/video-review.json')
support=load('validation/l7/support-audit.json')
intervals=load('validation/l7/matrix-interval-audit.json')
timing_context=load('validation/l7/timing-context.json')
assert timing_context['artifact']==audit['artifact'] and timing_context['isolationVerified'] is False
startup_diagnosis=load('validation/l7/flag-off/startup-diagnosis.json')
assert startup_diagnosis['artifact']==audit['artifact']
assert startup_diagnosis['entryDeltaBytes']==audit['startup']['byteDelta']==93
subprocess.run(['python3',str(base/'memory/l7-startup-audit.py')],cwd=root,check=True)
subprocess.run(['node',str(base/'memory/l7-cast-profile-audit.mjs')],cwd=root,check=True)
cast_profiles=load('validation/l7/cast-profile-audit.json')
assert cast_profiles['complete'] and cast_profiles['cases']==860
assert cast_profiles['artifact']==audit['artifact']
assert cast_profiles['budgetMisses']==audit['matrix']['misses']
cast_diagnosis=load('validation/l7/cast-diagnosis.json')
assert cast_diagnosis['artifact']==audit['artifact']
for key in ['raw','batchSummary']:
    assert hashlib.sha256((root/cast_diagnosis[key]).read_bytes()).hexdigest()==cast_diagnosis[key+'Sha256']
assert intervals['artifact']==audit['artifact'] and intervals['cases']==860
assert hashlib.sha256((base/'validation/l7/matrix/summary.json').read_bytes()).hexdigest()==intervals['matrixSummarySha256']
assert support['artifact']==audit['artifact']
for path,want in support['verifiedHashes'].items():
    assert hashlib.sha256((root/path).read_bytes()).hexdigest()==want,path
assert review['artifact']==audit['artifact'] and review['personallyViewed']
assert set(review['targets'])=={'mochi','soot','clover','yarn-giant','ultimate'}
assert hashlib.sha256((root/freeze['artifact']).read_bytes()).hexdigest()==audit['artifact']
gates=load('validation/l7/source-gates.json')
assert all(row['code']==0 for row in gates)
size=load('validation/l7/size-justification.json')
perf=audit['performance']
unitlog=(base/'validation/l7/unit-resume.log').read_text()
webtests=re.search(r'apps/web test:\s+Tests\s+(\d+) passed',unitlog).group(1)
e2elog=(base/'validation/l7/e2e-resume.log').read_text()
e2etests=re.findall(r'(\d+) passed',e2elog)[-1]
e2egate=next(row for row in gates if row['name']=='e2e')
e2etext=(f'{e2etests} passed in one suite' if e2egate.get('singleRunPass',True) else e2egate['resultDescription'])
native=[];cpu=[]
for batch in [1,2]:
    for row in load(f'validation/l7/cold-batch-{batch}/summary.json')['rows']:
        (cpu if row['throttle']==4 else native).append(row)
span=lambda rows,key:f'{min(r[key] for r in rows):.1f}–{max(r[key] for r in rows):.1f}'
historical=subprocess.check_output(['git','show','1f8d1b7c:reports/cardrpg-look/CARDRPG-LOOK-REPORT.md'],cwd=root,text=True)
rubric=historical[historical.index('| User complaint |'):historical.index('| Validation |')]
rubric=rubric.replace('L3 face checks;dark coat separation remains weak',
    '[L3](L3-CHECKPOINT.md):36 face checks; historical Soot separation .0524→.0506, below .18 target')
rubric=rubric.replace('L2 four Blender/three runtime rounds;uniform shelves/shades remain',
    '[L2](L2-CHECKPOINT.md):50,272 stage triangles/4 meshes;4 Blender/3 runtime rounds; repeated shelves remain')
rubric=rubric.replace('Compact AO;not full shadow maps/GTAO/TAA',
    '[L3](L3-CHECKPOINT.md):12-sample depth AO,16³ LUTs/3 tiers;no full shadow maps/GTAO/TAA')
units=historical[historical.index('| Unit |'):historical.index('Measured gate misses:')]
classes='; '.join(f"{key}: {value['embeddedBytes']:,}" for key,value in size['assetClasses'].items())
casts=[dict(name=row['name'],raw=row['raw'],dpr=row['dpr'],cpu=row['cpu'],quality=row['quality'],use=cast['use'],**cast['summary']) for row in matrix['rows'] for cast in row['casts']]
assert len(casts)==1720
budgets={
    'firstRepeat':('First/repeat ≤50ms',casts,lambda r:r['max']>50,'max',max),
    'highDpr1':('High/DPR1 ≥99% frames ≤20ms',[r for r in casts if r['quality']=='high' and r['dpr']==1],lambda r:r['within20']<.99,'within20',min),
    'cpu4BalancedLow':('CPU4 Balanced/Low p95 ≤33ms',[r for r in casts if r['cpu']==4 and r['quality']!='high'],lambda r:r['p95']>33,'p95',max),
    'draws':('Peak ≤250draws',casts,lambda r:r['calls']>250,'calls',max),
    'triangles':('Peak ≤150,000triangles',casts,lambda r:r['triangles']>150000,'triangles',max),
}
budget_lines=['| Final matrix budget | Missed / applicable cast windows | Worst observed window |','|---|---:|---|']
miss_lines=[item for item in audit['misses'] if not any(item.startswith(key+':') for key in budgets)]
miss_lines=[item.replace('Original24MB','Original 24 MB').replace('up to32MB','up to 32 MB')
    .replace('+93bytes','+93 bytes') for item in miss_lines]
miss_lines=[f"Cold-open maximum {perf['coldMaxMs']:.1f} ms exceeds the historical 117 ms ceiling."
    if item.startswith('Cold-open max') else item for item in miss_lines]
if audit['lifecycle']['growth']['heap']:
    miss_lines.append(f"Literal retained-heap flatness is not established: final delta {audit['lifecycle']['growth']['heap']:+,}bytes. The recorded 2MiB tolerance passes and GPU object counts remain constant; neither finding proves an absence of leaks.")
miss_lines.append('Exclusive timing isolation is unverified because A5-H0 retained an unsuspended page between shared-lock leases. Budget numbers remain observations under these conditions.')
for key,(label,applicable,fails,metric,extreme) in budgets.items():
    missed=[r for r in applicable if fails(r)]
    assert len(missed)==audit['matrix']['misses'][key]
    worst=extreme(applicable,key=lambda r:r[metric])
    value=f"{worst[metric]*100:.2f}%" if metric=='within20' else f"{worst[metric]:,.1f}ms" if metric in ['max','p95'] else f"{worst[metric]:,}"
    raw_link=str(Path(worst['raw']).relative_to('reports/cardrpg-look'))
    budget_lines.append(f"|{label}|{len(missed)}/{len(applicable)}|{value}; [{worst['name']}/{worst['use']}]({raw_link})|")
    if missed:miss_lines.append(f'{label}: {len(missed)}/{len(applicable)} applicable cast windows miss the budget.')
budget_table='\n'.join(budget_lines)
interval_lines=['| Configuration (86 cases each) | Full-page maximum | After Hub maximum | After scene-ready maximum |',
                '|---|---:|---:|---:|']
for group in intervals['groups']:
    w,h,dpr,cpu_throttle,quality=group['configuration']
    name=f'{w}×{h} DPR{dpr} CPU{cpu_throttle} '+{'medium':'Balanced','high':'High','low':'Low'}[quality]
    peaks=group['intervals']
    values=[f"{peaks[key]['maximumMs']:.1f}ms" for key in ['pageOpen','postInteractive','postReady']]
    interval_lines.append('|'+name+'|'+'|'.join(values)+'|')
interval_table='\n'.join(interval_lines)
page_worst=intervals['worstPageFrame']
page_worst_link=str(Path(page_worst['raw']).relative_to('reports/cardrpg-look'))
if page_worst['frame']['ms']>117:
    location = 'before the first cast' if page_worst['beforeFirstCast'] else 'after the first cast began'
    miss_lines.append(f"The separate gallery matrix also records a {page_worst['frame']['ms']:.1f}ms full-page frame {location}. This wider interval includes initialization and casts; it is not counted again as an independent cast failure. See interval table and raw profile below.")
misses='\n'.join('- '+item for item in miss_lines)
video_links=' · '.join(f"[{r['target']}]({Path(r['file']).relative_to('reports/cardrpg-look')})" for r in audit['videos'])
limits=' '.join(audit['reviewLimits']+review.get('limits',[]))
evidence_url='https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-cardrpg-look-l7-2026-11-07/reports/cardrpg-look/'
def portable_links(text):
    # The ledger mirrors prose only; point its evidence links at the published
    # B branch, where the actual images, videos and raw measurements live.
    def replace(match):
        label,target=match.groups()
        if '://' in target or target.startswith('#'):
            return match.group(0)
        assert (base/target).is_file(),target
        return f'[{label}]({evidence_url}{quote(target,safe="/")})'
    return re.sub(r'\[([^\]]+)\]\(([^)]+)\)',replace,text)
report=f'''# Báo cáo LOOK — checkpoint L7
Demo có 25 mô hình xoay được, 9 góc cảnh và bộ xem đủ 86 kỹ năng/chiêu cuối.
Đã kiểm tra trực tiếp 100 góc mô hình, 9 góc cảnh và 6 cấu hình kích thước/DPR.
Đã quay 5 video 25 giây; mỗi video được xem qua 6 ảnh mẫu, không phải duyệt liên tục từng khung hình.
Ma trận cuối đã đo 860 tổ hợp hợp lệ trên 25 nhân vật, 86 hành động và 10 cấu hình: 1.720 lượt thi triển.
20 lượt phát lại đã hoàn tất: heap tăng {audit['lifecycle']['growth']['heap']:,} byte; {'trong' if audit['lifecycle']['passed'] else 'ngoài'} ngưỡng 2 MiB, không phải hoàn toàn không tăng.
Typecheck/lint/unit/build qua; E2E có {e2etests} ca qua trong một lượt; {webtests} kiểm thử web qua.
Demo {audit['bytes']:,} byte: vượt 24 MB, trong giới hạn 32 MB có giải trình hình ảnh.
Các điểm chưa đạt về tải lạnh, kích thước, hiệu ứng và hiệu năng được liệt kê dưới đây; không coi chúng là đạt.
Chân dung đã có trong Collection/Team; A còn tích hợp icon/khung, B còn yêu cầu trình bày A4 chưa làm.

REFERENCE: docs/cardrpg-look/index.html; validation/l7/audit.json; validation/l7/freeze.json; validation/l7/ART-REVIEW.md; validation/l7/VIDEO-REVIEW.md; validation/l5/selection.json

L7 source `{audit['source'][:8]}`, artifact `{audit['artifact']}`, {audit['sourceInputs']} hashed inputs. Stacked on [L5 draft374](https://github.com/ntbaoheyhey/taskbar-hero/pull/374), accepted A3 `daba7d7c`; no A4 runtime adoption. Publication reference is recorded in memory/STATE.md after verification. L1–L6 measurements below retain their original artifacts.

Verdict: the LOOK demo and evidence package are delivered with measured misses and visible limitations. This is not an all-gates-pass or premium-art claim. The personal scores below are retained from the L5 art review; L7 adds inspection tools and final measurements, without rebuilding the models.

{rubric}The L7 viewer preserves account/screen state, disposes isolated scenes, works offline, and exercises live A/B plus the historical matched wipe. The skill gallery exercises quarter speed and effect-only at all six desktop configurations. Original loading-overlay captures are preserved in validation/l7/attempts/overlay-1; visible readiness was corrected before recapture. Two later harness selector failures (duplicate comparison label and exact speed-label matching) are retained in attempts/selector-1 and selector-2; only UI configurations resumed, with identical HTML and109 verified unit/stage captures retained.

| Validation | L7 measured result |
|---|---|
|Source|Five gates passed; demo-tools TypeScript passed; {webtests} web tests; inherited rules: 2 expected failures / 11 skips|
|E2E|{e2etext}; original logs and any retries retained in validation/l7|
|Viewer|25 models × 4 angles; 9 stage views; 6 desktop configurations; 34 windows; no page errors, remote requests or overflow; account/screen restored|
|Slice first/repeat|24 High/DPR1 windows; max {perf['castMaxMs']:.1f} ms; minimum {perf['castWithin20Min']*100:.2f}% of frames ≤20 ms|
|Cold7|Native max {max(r['max'] for r in native):.1f} ms; CPU4 max {max(r['max'] for r in cpu):.1f} ms|
|Final matrix|860 valid cases / 1,720 casts; 25 owners / 86 actions / 10 configurations; actual quality checked per frame; {audit['matrix']['rawFrames']:,} cast frames independently recomputed|
|Matrix active-cast maxima|Independent maxima: frame {matrix['metrics']['maxFrameMs']:.1f} ms; {matrix['metrics']['maxCalls']} draws; {matrix['metrics']['maxTriangles']:,} triangles; excludes page initialization|
|Lifecycle|20 natural replays after a baseline battle; heap delta {audit['lifecycle']['growth']['heap']:+,} bytes; GPU delta {json.dumps({k:v for k,v in audit['lifecycle']['growth'].items() if k!='heap'})}; not 20 different encounters|
|Flag-off|{audit['startup']['bytes']:,} startup bytes; 0 Three/model modules; exact byte-parity delta {audit['startup']['byteDelta']:+} bytes|
|Video|Five silent 25-second gallery recordings at native canvas size; 6 personally viewed samples each; not natural boss fights or timing evidence|
|Size|{audit['bytes']:,} bytes; {size['headroomBytes']:,} bytes below 32 MB; original 24 MB target missed|

Load-to-Hub: native {span(native,'loadToInteractiveMs')} ms / CPU4 {span(cpu,'loadToInteractiveMs')} ms. Battle-ready: native {span(native,'battleReadyMs')} ms / CPU4 {span(cpu,'battleReadyMs')} ms. These small cold samples do not establish causal regressions. Active casts measure different intervals.

The supporting audit checks every retained lifecycle snapshot: 537 geometries, 103 textures and 43 programs remain constant across all 21 snapshots. Heap peak growth is {support['lifecycle']['peakHeapGrowthBytes']:,} bytes; final growth is {support['lifecycle']['heapGrowthBytes']:,} bytes, within the harness's recorded 2 MiB tolerance but not exactly flat. The finite run does not prove the absence of leaks. Replay durations are {support['lifecycle']['replayDurationRangeMs'][0]/1000:.3f}–{support['lifecycle']['replayDurationRangeMs'][1]/1000:.3f} s at 4× speed. [Supporting audit](validation/l7/support-audit.json) also binds the previously recorded visual/video reviews to their files; it does not claim a second personal review. An overly strict RAF/start-marker assertion was corrected and retained in support-audit-initial-assertion.json; raw measurements and budgets were unchanged.

Matrix configurations: High at 1280×720 / 1440×900, DPR1–2, native CPU; Balanced at both sizes, DPR1–2, CPU4; Low at both sizes, DPR1, CPU4. Six actions per shared-lock window. Budgets: first/repeat ≤50 ms; High/DPR1 ≥99% of frames ≤20 ms; CPU4 Balanced/Low p95 ≤33 ms; ≤250 draws / 150,000 triangles. Counts in audit.json preserve each applicable window that misses its budget.

Timing isolation is NOT VERIFIED: A5-H0 kept a headless page alive between shared-lock leases and lane A reported that ambient rendering was not explicitly suspended. The lock serialized active measurement jobs; it does not prove exclusive CPU/GPU use. [Timing context](validation/l7/timing-context.json) preserves that disclosure and its source. Numeric budget comparisons remain observations under these conditions; do not infer isolated-device acceptance or causally attribute stalls. No measurements were restarted or discarded.

{budget_table}

[All missed-cast comparisons](validation/l7/CAST-PROFILE-REVIEW.md) and [raw profiles](validation/l7/cast-profile-audit.json) retain {cast_profiles['failedCastWindows']} distinct cast windows, each failed budget, exact slowest frame, overlapping long tasks/animation frames, and recorded callback locations. Every failed window has a row and a proposed next diagnostic. Matching scene-loop and Battle tick offsets are checked against the unchanged JavaScript payload and hashed source files; other callbacks remain unattributed. These are analyses of the original records, not new timing runs. Callback locations alone do not identify a costly operation or establish a cause. p95 values above the exact 33 ms threshold remain misses.

[Missed-cast diagnosis](validation/l7/cast-diagnosis.json): Panko-1 repeat at Balanced 1440×900/DPR1/CPU4 records a {cast_diagnosis['summary']['max']:.1f}ms frame and p95 {cast_diagnosis['summary']['p95']:.1f}ms. The cast reaches {cast_diagnosis['summary']['calls']} draws / {cast_diagnosis['summary']['triangles']:,} triangles; the slowest frame itself records {cast_diagnosis['peak']['calls']} draws / {cast_diagnosis['peak']['triangles']:,} triangles. That frame overlaps a155ms long task. Eight recorded long-animation-frame callbacks during this cast map to the scene loop in the exact decoded JavaScript; no long-animation-frame entry spanning the150ms peak was delivered. This identifies the broad rendering callback, not a shader/model root cause. Profile that callback with verified machine isolation; both budget misses remain counted.

[Startup diagnosis](validation/l7/flag-off/startup-diagnosis.json): the 93-byte entry delta is exactly generated preload-header and dependency-index growth; normalized entry bodies and default legacy dependency membership match. The two added dormant entries name three.core and BufferGeometryUtils, but neither was loaded in the recorded default startup. Exact byte parity remains missed. Investigate lazy-route chunk/preload generation in a separate build change; this does not explain or excuse cold-frame stalls.

The gallery matrix also records page initialization and readiness. The table below retains those wider intervals; cast-only budgets do not describe startup performance. These are separate observations from Cold7. [Interval audit](validation/l7/matrix-interval-audit.json) recomputes all 860 rows from {intervals['rawFramesIncludingInitialization']:,} raw frames.

{interval_table}

Worst full-page frame: [{page_worst['name']}]({page_worst_link}), {page_worst['frame']['ms']:.1f} ms ending at {page_worst['frame']['at']:.1f} ms; Hub marker {page_worst['firstInteractiveAt']:.1f} ms, scene-ready {page_worst['sceneReadyAt']:.1f} ms, first cast {page_worst['firstCastAt']:.1f} ms. Entirely before Hub: {page_worst['beforeHubInteractive']}; before first cast: {page_worst['beforeFirstCast']}. Overlapping long-animation-frame entries are retained in the interval audit. Anonymous blob callbacks do not identify a source component; trace loading/script evaluation separately before changing VFX.

L7 adds {size['deltaFromL5Bytes']:,} HTML bytes over L5 for the isolated viewer and comparison payload. Embedded asset classes (bytes): {classes}. L5 three-model matched compression saved 1,256,540 HTML bytes, with six runtime pairs showing SSIM ≥.978488; fine texture grain remains softer. Full raw portrait sources and L1 hero resolution are retained.

{units}Missed or unverified targets:

{misses}
- Historical L4 strict uniqueness:1162/2211 pair distances decrease,worst−.122392341;absolute separation passes but non-regression remains missed. Next fix: targeted authored per-pair silhouette/palette/timing edits, then comparable captures.

Profiles and next fixes: raw first/repeat windows are in validation/l7/matrix; startup parity remains an exact-byte discrepancy despite matching module membership. A future performance pass should use the worst named raw windows to target prewarm/render cost; evidence here is retained rather than overwritten. The worst CPU4 cold frame occurs before Hub interaction and before Fight:133.4ms, with58.4ms forced style/layout inside the overlapping callback. See validation/l7/COLD-REVIEW.md; minified callback attribution does not identify the source component. Profile initial Hub layout/initialization first, then compare equivalent samples. Further atlas/model compression requires matched visual review before accepting texture loss.

Visual limits: {limits} The obsolete L6 art-gallery footer is corrected in L7. Review samples do not establish continuous collision-free motion. Five videos: {video_links}.

L5 portable evidence remains3440files/1,018,720,566bytes;2,096,889,266bytes of local originals individually hashed. L7 publication inventory separates portable receipts/images/videos from intermediate duplicate artifacts. All authoring uses original Blender/procedural parameters; no generative model or external art imported.

Lane A retains icon/frame wiring, checkpoint adoption and the merged delivery report. A4P1/P3/P4 requests to B remain open as separate presentation compatibility work: fixed-cooldown/crew/row cues instead of legacy meters; boss phase/finish cues within400/800ms and existing action durations; optional version1 earned-reveal receipts. A4 delivery is [draft376](https://github.com/ntbaoheyhey/taskbar-hero/pull/376); A5 started separately during this matrix. No A4/A5 runtime is adopted here and compatibility is not verified. A has not announced adoption of this LOOK checkpoint. This branch does not edit A4 rules, meta/shared/protected paths. No merge/deploy/main push. Native macOS on Apple M3 Pro; no laneB Docker jobs, subagents or generative calls.
'''
report=portable_links(report)
assert len(report.splitlines())<=150,len(report.splitlines())
(base/'CARDRPG-LOOK-REPORT.md').write_text(report)
print(f'Wrote {len(report.splitlines())} lines from completed L7 audit and personal reviews')
checkpoint=f'''# L7 — isolated viewer and audited final measurements

REFERENCE: docs/cardrpg-look/index.html; validation/l7/audit.json; validation/l7/freeze.json; CARDRPG-LOOK-REPORT.md

Source `{audit['source']}`, artifact `{audit['artifact']}`, {audit['bytes']:,}bytes/{audit['sourceInputs']}hashed inputs. All25models×4angles,9stageviews and6desktop configurations personally reviewed. Offline viewer restores account/screen state and disposes its scenes; actual skill gallery exposes86actions/25owners,0.25x/effect-only. Original loading-overlay failure is preserved under attempts/overlay-1.

Five source gates passed; explicit demo-tools TypeScript passed; E2E: {e2etext}. Final matrix completed once on this artifact:860valid cases/1720casts across10configurations. Raw frames independently recomputed; actual requested quality verified. Lifecycle measured20natural replays of one encounter after a baseline fight, not20different encounters. Five silent25second gallery videos have six personally viewed sample frames each; no continuous viewing claim.

Timing isolation remains unverified: lane A retained an A5-H0 page without explicitly suspending ambient rendering between shared-lock leases. Numeric comparisons describe this run, not isolated-device acceptance; see validation/l7/timing-context.json. All raw measurements remain intact.

Missed or unverified targets:

{misses}
- Historical L4 strict1162effect-pair distance decreases remain unresolved.

See the report for full numeric results, per-unit tiers, historical/current evidence boundaries, visual limitations and next fixes. A owns icon/frame wiring and merged delivery. A4P1/P3/P4 optional presentation requests to B remain open as separate compatibility work. No A4 runtime adoption, shared/protected edits, merge or deployment. Draft publication reference is recorded in memory/STATE.md after remote verification.
'''
(base/'L7-CHECKPOINT.md').write_text(checkpoint)
