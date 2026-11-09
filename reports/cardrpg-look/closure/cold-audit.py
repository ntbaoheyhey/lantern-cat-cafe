"""Recompute full-page and natural-playback intervals from the retained cold run."""
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[3]
out = root / 'reports/cardrpg-look/closure'
validation = root / 'reports/cardrpg-look/validation/closure'
load = lambda p: json.loads(p.read_text())
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
build = load(root / 'docs/cardrpg-look/build.json')
rows = []
inputs = {}
for n in [1, 2]:
    directory = validation / f'cold-batch-{n}'
    summary = load(directory / 'summary.json')
    assert summary['sha256'] == build['sha256']
    inputs[str((directory / 'summary.json').relative_to(root))] = sha(directory / 'summary.json')
    for s in summary['rows']:
        name = f"{s['width']}x{s['height']}-dpr{s['dpr']}-cpu{s['throttle']}"
        path = directory / (name + '.json')
        raw = load(path)
        inputs[str(path.relative_to(root))] = sha(path)
        peak = max(raw['frames'], key=lambda f: f['ms'])
        assert abs(peak['ms'] - s['max']) < 1e-6
        frames = [f for f in raw['frames'] if f['at'] - f['ms'] >= raw['battleReadyMs']]
        post_peak = max(frames, key=lambda f: f['ms'])
        assert abs(post_peak['ms'] - s['postReady']['max']) < 1e-6
        within20 = sum(f['ms'] <= 20 for f in frames) / len(frames)
        assert abs(within20 - s['postReady']['within20']) < 1e-12
        def overlap(frame):
            start = frame['at'] - frame['ms']
            return [f for f in raw['longFrames'] if f['startTime'] < frame['at'] and f['startTime'] + f['duration'] > start]
        rows.append(dict(name=name, cpu=s['throttle'], dpr=s['dpr'], hubMs=raw['loadToInteractiveMs'], readyMs=raw['battleReadyMs'],
                         marks=raw['marks'], peak=peak, peakBeforeReady=peak['at'] <= raw['battleReadyMs'],
                         peakLongFrames=overlap(peak), postReady=s['postReady'], postReadyPeak=post_peak,
                         postReadyPeakLongFrames=overlap(post_peak), finalQuality=raw['stats']['quality'],
                         peakTraceOverlap=next((f for f in raw.get('hitchAttribution', []) if f['at'] == peak['at']), None)))
assert len(rows) == 7
result = dict(artifact=build['sha256'], inputs=inputs, rows=rows,
              maxPageMs=max(r['peak']['ms'] for r in rows), maxPostReadyMs=max(r['postReadyPeak']['ms'] for r in rows),
              minimumPostReadyWithin20=min(r['postReady']['within20'] for r in rows),
              interpretation='Full-page cold harness includes naturally animated combat. Post-ready gaps are retained separately from targeted cast windows. The harness leaves game quality selection unchanged and records the final tier, not per-frame tier; these are not fixed-High samples. Overlapping long-frame/trace events are inclusive and do not establish the expensive source operation or exclusive-machine conditions.')
trace_path = out / 'trace-diagnosis.json'
trace = load(trace_path)
for path, want in trace['inputs'].items(): assert sha(root / path) == want
result['traceDiagnosis'] = dict(path=str(trace_path.relative_to(root)), sha256=sha(trace_path))
(out / 'cold-audit.json').write_text(json.dumps(result, indent=2) + '\n')
lines = ['# Closure cold-run review', '', f"Artifact `{build['sha256']}`; all seven raw frame arrays recomputed and hash-bound in cold-audit.json.", '',
         '|Configuration|Full page max|After ready max|After ready frames ≤20ms|Final tier|', '|---|---:|---:|---:|---|']
for r in rows:
    lines.append(f"|{r['name']}|{r['peak']['ms']:.1f}ms|{r['postReadyPeak']['ms']:.1f}ms|{r['postReady']['within20']*100:.2f}%|{r['finalQuality']}|")
lines += ['', result['interpretation'], '',
          'The first1280/DPR1/native trace places the533.3ms gap before scene-ready: a542.557ms renderer TimerFire includes538.840ms CommandBufferProxyImpl::WaitForToken, overlapping538.725ms GPU WebGL work. The250.1ms post-ready gap overlaps274.735ms CALayerTreeCoordinator::ApplyBackpressure inside the macOS GPU presentation path. These inclusive durations overlap and must not be added. They identify GPU waits/presentation backpressure, not a particular shader, source change, driver defect or external program.', '',
          'Next diagnostic: the registered Clover1 ABBA comparison uses identical viewport/tier/harness on old and current artifacts to check whether the stalls are specific to the patch. That small comparison cannot clear the original failures or prove exclusive-device conditions. Further optimization requires targeted GPU command/presentation profiling under verified machine isolation, rather than attributing these gaps to initial Hub layout.', '',
          'These observations do not replace the four historical L7 cast failures or imply that all natural battle frames meet the cast-gallery budgets. No failed sample was discarded or rerun for this review. The first streaming parser rejected the final trace footer; diagnosis-attempts/trace-parser-1.log retains that helper failure. Only the parser was corrected; no browser observation was repeated.']
(out / 'COLD-REVIEW.md').write_text('\n'.join(lines) + '\n')
print(json.dumps({k: result[k] for k in ['maxPageMs', 'maxPostReadyMs', 'minimumPostReadyWithin20']}))
