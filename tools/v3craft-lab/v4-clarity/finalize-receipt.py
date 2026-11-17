"""Bind the completed A9 visual decisions to existing source and film evidence."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess

root = Path(__file__).resolve().parents[3]
out = root / 'reports/v4-art/REVIEW/A9/r2'
read = lambda name: json.loads((out / name).read_text())
validation, films = read('validation.json'), read('film-review.json')
layout, live, pairs = read('layout900.json'), read('live-summary.json'), read('pairwise-review.json')
ledger = read('action-ledger.json')
hashes = read('source-hashes.json')
assert validation['pass'] and validation['runtimeSourceHashes'] == hashes
assert all(hashlib.sha256((root / path).read_bytes()).hexdigest() == digest for path, digest in hashes.items())
actions = [(film, action) for film in films for action in film['actions']]
assert len(actions) == 27 and all(a['visualReview']['status'] == 'reviewed_once' for _, a in actions)
assert len(pairs['pairs']) == 28 and pairs['pass'] and all(p['count'] >= 3 for p in pairs['pairs'])
assert len(layout['fixtures']) == 3 and not layout['failures']
assert all(f['visuallyReviewed'] and f['parity'] and not f['errors'] for f in layout['fixtures'])
assert all(not f['framing']['failures'] and f['parity'] and not f['errors'] for f in films)
markers = read('encoded-markers.json') + read('encoded-markers-tail.json')
assert all(m['pass'] and m['videoHashMatches'] for m in markers)
assert sum(m['frames'] for m in markers) == 5400
assert live['liveAreaPass'] and live['liveFrontFacePass']
assert all(a['duration'] == 2200 and a['impact'] == 1100 for _, a in actions)
assert all(not a['focusAfter600'] for _, a in actions)
complete = [(f, a) for f, a in actions if a['complete']]
assert max(a['impactSamplingErrorMs'] for _, a in complete) <= 1000 / 30

head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
paths = subprocess.check_output(['git', 'diff', '--name-only', '797a3cefe', head], cwd=root, text=True).splitlines()
allowed = ['reports/v4-art/', 'tools/v3craft-lab/', 'apps/web/src/game/cardrpg/battle-v3/', 'apps/web/src/game/cardrpg/stage/', 'apps/web/src/game/cardrpg/vfx-craft/']
unexpected = [p for p in paths if not any(p.startswith(a) for a in allowed) or '/audio/' in p]
assert not unexpected, unexpected
lane = {'base': '797a3cefe', 'through': head, 'paths': paths, 'unexpected': unexpected, 'pass': True}
(out / 'lane-audit-final.json').write_text(json.dumps(lane, indent=2) + '\n')

limits = [
    'Live alpha areas and front-face coverage are corroborated by the reviewed encoded films; this is not segmentation of every encoded effect pixel.',
    'Maximum observed shake is a sampled magnitude; the first-to-last nonzero span is not a continuous120ms upper bound. Reduced-motion film remains open; no recorder changes were made.',
    'One contained Soot window starts at50ms, and three windows reach film edges. None was relabelled strict-complete.',
    'Boss Panko banner backplates touch the first portrait at main frames290/891 and tail frame892; name text remains readable. Wave3 Soot numbers cluster near frame703.',
    'Final SHIP classes/baseline announcement and production activation remain open. No SHIP merge or new baseline adoption occurred.',
    'Authoring>=50% and measurement/logging<=25% are not demonstrated by complete time records; no percentages are invented.',
    'The new framing checks cover recorded unit bounding boxes. They do not replace the separate alpha-occlusion and HUD measurements.',
    'The900p wave1 frame111 contains orange circular glows during a non-ultimate Panko window. Their acting/reflection source has not been reviewed in A9; retain an A11 attribution question without relabelling a closed per-unit receipt.',
]
area = [r['peakAreaPercent'] for r in live['rows']]
receipt = {
    'at': datetime.now(timezone.utc).isoformat(),
    'scope': 'A9 current-fixture ultimate clarity checkpoint for eight featured units; shared production gates remain open.',
    'sourceCommit': validation['sourceCommit'], 'runtimeSourceHashesVerified': len(hashes),
    'reviewedOwnWindows': len(actions), 'strictCompleteWindows': len(complete),
    'containedWindows': sum(a['containedInFilm'] for _, a in actions),
    'lateFirstSampleWindows': [{'item': f['item'], 'fixture': f['fixture'], 'key': a['key'], 'firstElapsed': a['firstElapsed']} for f, a in actions if a['containedInFilm'] and not a['firstSampleWithinOneFrame']],
    'filmEdgeWindows': [{'item': f['item'], 'fixture': f['fixture'], 'key': a['key'], 'lastElapsed': a['lastElapsed']} for f, a in actions if not a['containedInFilm']],
    'encodedMarkerFramesVerified': 5400,
    'films': [{'item': f['item'], 'fixture': f['fixture'], 'sourceCommit': f['sourceCommit'], 'videoSha256': f['videoSha256'], 'medianRenderFps': f['medianRenderFps'], 'audio': {k: v for k, v in f['audio'].items() if k != 'path'}, 'parity': f['parity'], 'errors': f['errors']} for f in films],
    'pairwise': {'pairs': 28, 'minimumIndependentAxes': min(p['count'] for p in pairs['pairs']), 'pass': True, 'details': 'pairwise-review.json'},
    'liveEffectAreaPercent': {'min': min(area), 'max': max(area), 'rows': live['rows']},
    'liveFrontFaceAt1100MaxPercent': live['maxFrontFacePercent'],
    'focusAfter600EncodedSamples': 0,
    'maxObservedShakePx': max(a['maxShakePx'] for _, a in actions),
    'maxObservedNonzeroShakeSpanMs': max(a['shakeObservedSpanMs'] for _, a in actions),
    'maxCompleteWindowImpactErrorMs': max(a['impactSamplingErrorMs'] for _, a in complete),
    'layout720': [{'item': f['item'], 'fixture': f['fixture'], **f['framing']} for f in films],
    'layout900': layout,
    'assetBudget': {'newA9ImageAssetBytes': 0, 'carriedAddedAssetUpperBoundBytes': 5076339, 'limitBytes': 6000000},
    'validation': {'webTestsPassed': 2664, 'webFilesPassed': 318, 'typecheckExit': 0, 'parityFixtures': 3, 'pass': validation['pass'], 'sourceReport': 'validation.json', 'laneReport': 'lane-audit-final.json'},
    'limits': limits,
    'scopedGates': {'pairwise3of5': 'PASS', 'namesReadable': 'PASS_TEXT_WITH_BANNER_BACKPLATE_ISSUE', 'ownSilhouetteChanges': 'PASS_IN_REVIEWED_COMPLETE_WINDOWS', 'effectAreaAndFaces': 'LIVE_PASS_FILM_CORROBORATED_NOT_ENCODED_SEGMENTATION', 'focusBy600': 'PASS', 'bboxFraming720And900': 'PASS', 'medianFps': 'PASS', 'addedAssetUpperBound': 'PASS', 'regressionAndLane': 'PASS', 'fullProductionAcceptance': 'OPEN'},
    'retainedFailures': ['../attempt-r1-retained.json: R1 Binding/Needle only two secure axes', '../REVIEW.md records the original Yarn79.350580%/77.945150% span failures without rewriting their evidence'],
}
(out / 'acceptance-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')

lines = ['# A9 — eight-ultimate clarity review', '',
    f"Validated runtime `{validation['sourceCommit']}`; all{len(hashes)} runtime/art hashes match. This is a scoped current-fixture checkpoint, not full production acceptance.", '',
    'Teacup now pours flowers downward with staggered recipient accents; Needle uses150ms rank spacing. Shared dimming ends at600ms, and fixed boss-stage offsets widen the formation. Basic/ultimate clocks, events, targets, audio and rules are unchanged.', '',
    '## Evidence and measured result', '',
    'Three30s720p30fps audio films and two45s supplements provide5400 verified encoded markers. All27 own-ultimate sheets were inspected once:23 strict-complete, one contained Soot window with a50ms first sample, and three film-edge fragments. Every featured unit has a reviewed strict-complete own ultimate. The three900p layout sheets were also inspected once.', '',
    f"Every recorded movie has parity=true, no browser errors and median{min(f['medianRenderFps'] for f in films):.6f}FPS. Regression passed2664 tests/318 files, typecheck and three-fixture parity; the lane audit contains no SHIP-owned change. No new image asset bytes were added; the carried first-battle asset upper bound is5,076,339B of6,000,000B.", '',
    f"The16 live ultimate observations span{min(area):.6f}–{max(area):.6f}% painted area; fresh front-layer face samples peak at{live['maxFrontFacePercent']:.6f}%. Film review corroborates recognizable forms and readable caster/recipient faces. These values are live readbacks, not encoded-pixel segmentation.", '',
    f"No reviewed encoded focus sample remains dim after600ms. All own ultimate plans remain2200ms with1100ms impact; maximum strict-complete contact sampling error is{receipt['maxCompleteWindowImpactErrorMs']:.6f}ms. Maximum observed shake is{receipt['maxObservedShakePx']:.6f}px and observed nonzero span100ms; continuous-duration and reduced-motion film proof remain open.", '',
    'All5400 encoded-frame bounding-box layouts and all three900p captures pass the measured size, span, gap and edge limits. Original Yarn span failures79.350580% at720p and77.945150% at900p remain retained in A7 evidence; the new A9 captures are a separate result.', '',
    '## Pairwise distinction', '',
    'S=shape, M=motion path, C=broad colour family, T=local timing accent, R=recipient response. Shared1100ms impact, names and shade differences never count. Detailed independent reasons and exact complete-film references are in `r2/pairwise-review.json`.', '',
    '| Pair | Visible independent axes | Count | Film decision |', '| --- | --- | --- | --- |']
for pair in pairs['pairs']:
    lines.append(f"| {pair['pair']} | {' '.join(pair['axes'])} | {pair['count']} | PASS R2 |")
lines += ['', 'R1 Binding/Needle failed with two secure axes. In R2, Binding has an established crossed net at1233ms; Needle keeps adding ranks through1450ms and reaches the full canopy around1550ms. Clover/Teacup separate rounded leaves from five-petal flowers, upward from downward motion, and simultaneous sprigs from sequential pours. Mochi/Panko separate facets from doors, unfolding from hinged motion, and later crest onset from the earlier sustained bread panels.', '',
    '## Own-action ledger', '',
    'Times and frames refer to the encoded movies. K5 aliases the selected K2 image for the three ranked enemies; those aliases do not create additional drawings. Full phase samples, actual visual descriptions and notes remain in `r2/action-ledger.json` and `r2/film-review.json`.', '',
    '| Film / fixture / action | Encoded time / frames | Actor / kind | Visible anticipation → contact → recovery | Effect shape | Recipient response | Coverage |', '| --- | --- | --- | --- | --- | --- | --- |']
lookup = {(f['item'], f['fixture'], a['key']): a for f, a in actions}
for row in ledger['rows']:
    a = lookup[(row['item'], row['fixture'], row['key'])]
    state = 'complete' if a['complete'] else 'contained; first sample50ms' if a['containedInFilm'] else 'film edge; missing phases not accepted'
    unit = pairs['units'][row['asset']]
    effect = unit['S'] if a['lastElapsed'] >= 800 else 'effect phase outside film'
    response = unit['R'] if a['lastElapsed'] >= 1100 else 'impact response outside film'
    lines.append(f"| {row['item'].replace('V4-A9-', '')} / {row['fixture']} / A{row['key']} | {row['firstSeconds']:.3f}–{row['lastSeconds']:.3f}s; f{row['firstFrame']}–{row['lastFrame']} | {row['asset']} / own ultimate | {row['poseLabels']} | {effect} | {response} | {state} |")
lines += ['', 'Effects and target reactions are recorded per action in the JSON ledger notes; the unit table in `r2/pairwise-review.json` supplies their concise visual vocabulary. No received-hit window substitutes for an own ultimate.', '',
    '## Defect checklist', '',
    '| Question | Answer and film reference |', '| --- | --- |',
    '| Camera moved? | No pan/zoom in reviewed sheets; small impact shake remains. Boss Yarn A12/f383 illustrates contact. Strict continuous-duration and reduced-motion proof remain open. |',
    '| Unit facing away? | No in scoped actions; Needle wave1 A14/f412 and Binding tail-boss A29/f1030 face their targets. |',
    '| Units uneven? | No measured bbox-size failure in5400 mapped frames or the three900p captures; precise extrema are in the receipt. |',
    '| Attacker silhouette unchanged? | No among23 strict-complete own windows. Wind-up, cast and recovery change visibly; e.g. Needle wave1 A14/f412 through f469. |',
    '| Main ultimate effect a blob/ring/fog? | No in the scoped own ultimates; original painted needles, crossed cords, braids, flowers, leaves, facets, doors and curled flame remain distinct. Needle A14/f449 is a selected example. Non-ultimate900p wave1/f111 glows are a separate attribution question. |',
    f'| Ultimate covers more than45%? | No flood observed; live bounds{min(area):.6f}–{max(area):.6f}%. Exact encoded-pixel area segmentation is not claimed. |',
    '| Pasted-PNG look? | No hard rectangle edge observed; long held drawings still read graphically, especially Yarn main-boss focus f359. |',
    '| Faces washed out? | No >50% wash observed; fresh live front-layer bound0.356607%. Soot main-boss A17/f589 leaves the boss face readable. |',
    '| Number clutter? | Yes, local cluster at wave3 Soot A23/f703; carry into A11 UI polish. |',
    '| Banner collision? | Yes, boss Panko backplate touches the first portrait at main f290/f891 and tail f892. Name text remains readable; carry layout repair to A11. |', '',
    '## Ten-line critique', '',
    '1. Facets, bread panels, leaves and flowers now have clearly different main silhouettes.',
    '2. The150ms Needle ranks produce a visible timing difference that the failed45ms attempt lacked.',
    '3. Clover and Teacup still share a colour family, so their opposite travel direction and release cadence do real work.',
    '4. Mochi and Panko still share a shield response; their different construction and onset keep them identifiable.',
    '5. Yarn braids fit the body material, although their shared colour makes the low fan less separated than the flame effect.',
    '6. Ending focus by600ms restores the stage before the effect grows and the contact arrives.',
    '7. Boss Panko name text survives, but its backplate touching a portrait remains unfinished composition.',
    '8. Wave3 damage numbers remain busier than the underlying character and effect staging.',
    '9. The private50.05s reference comparison supports staging only; no equivalent reference timing was available or claimed.',
    '10. Current-class films support this scoped checkpoint; final classes, reduced-motion film and the process-time split remain unproved.', '',
    '## Limits carried forward', '']
lines += ['- ' + item for item in limits]
lines += ['', 'Study, original drills and private-comparison provenance are in `LEARN/A9.md`; failed source/probe trials and R1 films remain preserved. No closed A6 or per-enemy blind review was repeated.']
(out.parent / 'REVIEW.md').write_text('\n'.join(lines) + '\n')
print(json.dumps({'receipt': str(out / 'acceptance-receipt.json'), 'reviewed': 27, 'strictComplete': len(complete), 'pairs': 28, 'layout900': len(layout['fixtures']), 'runtimeHashes': len(hashes)}))
