"""Report observed reference timing without inventing x1 or sub-frame precision."""
import json
from pathlib import Path
root=Path(__file__).resolve().parents[2]
base=root/'reports/v3-feel';p=json.loads((base/'REF-EFFECTS.json').read_text())
lines=['# Reference deconstruction','',
'Sixteen actions: eight visually inferred basics and eight visually inferred ultimates from both reference videos. Frame n is zero-based, inclusive, sampled at 10 fps. v1 displays x2 and v2 x3. Timing uncertainty is at least 100 ms; observed wall times are not x1 design targets. Layer blend modes are inferred, not recovered engine data.', '',
'B08 replaces a mislabelled ultimate follow-up. B01/B07/U05 windows were extended to observe recovery; old windows and corrected phase fields are retained in the source JSON. The prior session inspected the full selection, and the three extended recovery strips were directly inspected on resume.', '',
'Sound has not been heard. Waveform analysis cannot establish a listening verdict; 10 fps frames cannot establish +/-33 ms sync. This limitation remains OPEN, never PASS.', '',
'Pixel method: positive max-RGB difference within observed effect regions; threshold 0.18 with 0.10/0.26 sensitivity. This estimates changing bright pixels, not isolated alpha. Moving actors, damage text, background changes and compression can contaminate it. Saturation is mean HSV; luminance is p95 linear Rec.709. `../REF-EFFECTS.json` contains every measured value, region and source path. Private sheets are gitignored and never shipped.', '']
for a in p['actions']:
 lines += [f"## {a['id']} - {a['description']}", '', f"Source {a['source']}, {a['start']:.1f}-{a['end']:.1f} s, {a['tier']} (visual inference).",'', '| Phase | Observed frames | Wall time |','|---|---|---|']
 for phase,ns in a['phases'].items():
  lines += [f"| {phase} | "+(f"n{ns[0]}-n{ns[1]} | {a['start']+ns[0]/10:.1f}-{a['start']+(ns[1]+1)/10:.1f} s |" if ns else 'Unknown / clipped | Not measured |')]
 lines += ['', '| Layer / contour | Blend (inferred) | Colour | Lifetime frames | Motion |','|---|---|---|---|---|']
 for name,blend,col,ns,motion in a['layers']:lines += [f'| {name} | {blend} | {col} | n{ns[0]}-n{ns[1]} | {motion} |']
 lines += ['',f"Camera: {a['camera']}",f"Target: {a['reaction']}",f"Peak n{round((a['peak']-a['start'])*10)} ({a['peak']:.1f} s): estimated area {a['estimatedPeakAreaFraction']*100:.2f}%; sensitivity {min(a['areaSensitivityRange'])*100:.2f}-{max(a['areaSensitivityRange'])*100:.2f}%; directional streaks >= {a['streakCountMinimum']}; observed action/effect span {a['effectSpanSeconds']:.1f} s (includes focus/hold where present).",'Sound sync: unverified.','Private evidence: '+', '.join(f'`{s}`' for s in a['sheetPaths'])+'.','']
lines += ['## Ranges and limits','',
'Basic anticipation spans 2-3 reference samples, contact 2-3, recovery 1-5; ultimate focus 1-7 samples, anticipation 2-5, contact 2-5, recovery 1-5. Multiple contacts, cinematic replacement and obscured reactions are identified above. Phase order is transferable; exact timing is not. S01-S08 in sources.json support the pipeline, while R01/R02 provide these observations.', '',
f"Estimated medians: saturation {p['referenceMedianSaturation']}; p95 luminance {p['referenceMedianPeakLuminance']}. U04 whiteout is retained as an honestly measured extreme, not a recommendation. Our ultimate footprint remains 25-60% regardless of this sample.", '',
'Reject reference walk-ups, field replacement, noisy text, action overlap and target-obscuring whiteouts. Retain clear key poses, directional travel, contact contrast and ordered fallout.']
(base/'CRAFT/REFERENCE-BREAKDOWN.md').write_text('\n'.join(lines)+'\n')
