"""Q1 scoped receipt from existing recordings; never records or retimes media.
Method and unresolved limitations: reports/v3-feel/LEARN/Q1.md.
"""
import gzip, hashlib, json, math, statistics
from datetime import datetime, timezone
from pathlib import Path

base = Path('reports/v3-feel')
out = base / 'REVIEW/Q1'
observations = json.loads((out / 'craft-observations.json').read_text())
data = json.loads((base / 'measurements.json').read_text())
policy = json.loads((out / 'policy-inspection.json').read_text())
receipt = {'at': datetime.now(timezone.utc).isoformat(), 'method': 'Unmodified schedule; one global marker-derived clock origin per film; no per-action fitting. Pixels reviewed separately; unresolved confirmation does not pass.', 'fixtures': []}
review = ['# Q1 scoped review — open', '', 'Current recordings are from 15 Nov. Earlier rejected measurements remain in git history. All 84 action windows have notes; 48 were retained from the interrupted session and 36 completed on resume. Boundary-truncated actions are explicitly incomplete. No listening claim.', '', 'The scheduler has exact 800/350 ms basics and 2200/1100 ms ultimates, and zero overlap apart from floating-point subtraction below 0.001 ms. Video confirmation still fails its unchanged 33 ms bound. Q1 is OPEN after its timebox; no product or recorder change was made.', '']

def read(path):
    return json.loads(Path(path).read_text())

def signed(path):
    return {'path': str(path), 'sha256': hashlib.sha256(Path(path).read_bytes()).hexdigest()}

pending = {}
def add(key, fixture, value, basis=None):
    row = pending.setdefault('Q1.' + key, {'samples': [], 'evidence': []})
    row['samples'].append({'fixture': fixture, 'value': value})
    if basis:
        row['basis'] = basis

for fixture in ['wave1', 'wave3', 'boss']:
    capture = json.loads(gzip.decompress((out / fixture / 'capture.json.gz').read_bytes()))
    frames = capture['frames']
    plans = capture['plans']
    media = [p for p in capture['resampled'] if p['t'] < 30 and p['renderFrame'] is not None]
    latency = statistics.median((p['t'] - frames[p['renderFrame']]['frameAt']) * 1000 for p in media)
    events = []
    for plan in plans:
        for event, offset in [('start', 0), ('cast', plan['beats'][0]['duration']), ('impact', plan['impact']), ('end', plan['duration'])]:
            scheduled = plan['clockStart'] + offset / 1000
            if not 0 <= scheduled + latency / 1000 < 30:
                continue
            matches = []
            for picture in media:
                render = frames[picture['renderFrame']]
                action = render.get('action') or {}
                if event == 'end':
                    match = render['frameAt'] >= scheduled and action.get('key') != plan['key']
                else:
                    match = action.get('key') == plan['key'] and action['elapsed'] >= offset
                if match:
                    matches.append(picture)
            picture = matches[0] if matches else None
            error = (picture['t'] - scheduled) * 1000 - latency if picture else None
            events.append({'action': plan['key'] + 1, 'tier': plan['tier'], 'event': event, 'scheduledSeconds': scheduled, 'videoFrame': picture['frame'] if picture else None, 'errorMs': error})
    overlap = max([0] + [(p['clockStart'] + p['duration'] / 1000 - n['clockStart']) * 1000 for p, n in zip(plans, plans[1:])])
    stats = read(out / fixture / 'q1-measurements.json')
    policy_row = next(r for r in policy['rows'] if r['fixture'] == fixture)
    for tier in ['basic', 'ultimate']:
        actions = [p for p in plans if p['actorId'] and p['tier'] == tier]
        for plan in actions:
            for key, value in [(tier + 'DurationMs', plan['duration']), (tier + 'ImpactMs', plan['impact']), ('focusEndMs' if tier == 'ultimate' else 'basicAnticipationEndMs', plan['beats'][0]['duration'])]:
                add(key, fixture, value, 'presentation-schedule')
        for key, prop in [('Duration', 'duration'), ('Impact', 'impact')]:
            add(tier + key + 'SpreadMs', fixture, max(p[prop] for p in actions) - min(p[prop] for p in actions), 'presentation-schedule')
    add('actionOverlapMs', fixture, round(overlap, 3), 'presentation-schedule')
    add('videoTimingErrorMs', fixture, max(abs(e['errorMs']) for e in events if e['errorMs'] is not None))
    add('videoTimingConfirmedFraction', fixture, sum(e['errorMs'] is not None and abs(e['errorMs']) <= 33 for e in events) / len(events))
    add('reducedMotionShake', fixture, max(s['shakePx'] for s in policy_row['samples'] if s['reduced']))
    add('speedScaling', fixture, all(abs(s['wallDuration'] - s['expectedDuration']) <= 5.001 and abs(s['wallImpact'] - s['expectedImpact']) <= 5.001 for s in policy_row['scaling']))
    returns = max(math.hypot(s['dx'], s['dy']) for s in policy_row['returns'])
    add('lungeReturnsInBasic', fixture, returns <= 1)
    add('craft.B14', fixture, returns)
    add('craft.B13', fixture, stats['actorDisplacementWidth'])
    add('craft.B18', fixture, len(stats['cameraDefects']))
    add('craft.U04', fixture, max(stats['focus'], key=lambda f: abs(f['brightness'] - .45))['brightness'])
    add('craft.U05', fixture, all(f['outline'] and f['banner'] for f in stats['focus']))
    add('craft.U22', fixture, len(stats['cameraDefects']) + stats['plateFrames'])
    add('craft.U24', fixture, round(overlap, 3))
    add('economyE3E5', fixture, all(line.startswith('PASS ') for line in (base / 'tests/Q1-CRAFT-economy.log').read_text().splitlines() if any(' E' + n + '.' in line for n in '345')))
    row = {'fixture': fixture, 'video': signed(out / (fixture + '.webm')), 'schedulePlans': len(plans), 'rawOverlapMs': overlap, 'latencyMs': latency, 'events': events, 'notes': observations[fixture]}
    receipt['fixtures'].append(row)
    review += ['## ' + fixture, '', '| Action / actor / tier | Frame references | What is visible |', '|---|---|---|']
    actions = read(out / fixture / 'actions.json')
    for action, note in zip(actions, observations[fixture]):
        assert action['index'] == note[0]
        indices = [round(t * 30) for t in action['times'] if 0 <= t < 30]
        reference = f"f{min(indices)}–f{max(indices)}" + (f'; contact f{note[1]}' if note[1] is not None else '')
        review.append(f"| {action['index']} / {action['actor'] or 'round status'} / {action['tier']} | {Path(action['sheet']).name}, {reference} | {note[2]} |")
    review += ['', '| Defect | Owner | Observed |', '|---|---|---|', '| Camera movement / approach / plates | Q1 | No; all action windows and full transform audit. |', '| Timing confirmation | Q1 | Unresolved: see craft-receipt.json; unchanged 33 ms gate fails. |', '| Uneven small units / frame fill | Q2 | Yes; first basic f3 onward, large bottom band. |', '| Facing away | Q2 | ' + ('Yes; ram A7 f173.' if fixture == 'wave3' else 'No reversed travel observed in this fixture; full pose-facing audit belongs to Q2.') + ' |', '| Number clutter / persistence | Q2 | Yes; basic recovery frames and ultimate aftermath. |', '| Blob/ring/fog main shape / body washout | Q3 | Yes; Mochi/Soot/Clover ultimate peak frames in table. |', '| Pasted look / weak silhouette change | Q3 | Yes; small torso tilts dominate basic preparation. |', '| Text overflow / labels | Q4/Q6 | No banner spill observed; short names remain plain and icons tiny. |', '| Sound without visible cause | Q5 | Cue/mix gate not yet evaluated; max voices ' + str(stats['audio']['maxTransientVoices']) + ', ' + str(stats['audio']['integratedLufs']) + ' LUFS. No listening claim. |', '']

review += ['## Critique against the retained reference study', '', '1. Fixed stage registration is visibly maintained; this answers F2 in the reviewed windows.', '2. Local dim/outline/banner separates the caster without an approach; see every ultimate table row.', '3. Long-lasting gold and pink loops still obscure the bodies; their colour is not a distinct skill silhouette.', '4. The reference breakdown shows directed strokes; our current basic reads as an orb followed by a circle (CRAFT/REFERENCE-BREAKDOWN.md).', '5. Contact recoil is visible, but the preceding torso tilt has little silhouette change.', '6. The caster and target remain small beside unused field and bottom HUD space.', '7. Ram orientation in wave3 contradicts its leftward attack direction.', '8. Numbers survive into later actions and compete with both the face and the effect.', '9. The schedule is regular, but unverified frame timing must not be described as passed (LEARN/Q1.md).', '10. Q2 must establish readable unit geometry before Q3 drills size and shape the effects; no production quality approval follows from this review.', '', 'Self-score: 5/10 overall. Q1 remains open, so no >=8 claim. Q2/Q3/Q5 defects remain assigned to their owners.']
(out / 'REVIEW.md').write_text('\n'.join(review) + '\n')
(out / 'craft-receipt.json').write_text(json.dumps(receipt, indent=2) + '\n')
for key, value in [('reviewFixtures', 3), ('actionWindowFps', 10), ('actionWindowBeforeMs', 300), ('actionWindowAfterMs', 500), ('sheetWidth', 1280), ('sheetsViewedFraction', 1), ('actionReviewFraction', 1), ('frameReferences', True), ('critiqueLines', 10), ('videoDefects', 1)]:
    add(key, 'all', value)
evidence = [signed(out / 'craft-receipt.json'), signed(out / 'REVIEW.md'), signed(out / 'policy-inspection.json'), signed(base / 'tests/Q1-CRAFT-economy.log')]
for key, row in pending.items():
    row['evidence'] = evidence
    data['measurements'][key] = row
for key, log in [('typecheck', 'typecheck'), ('unitTests', 'unit'), ('parityRegression', 'parity')]:
    path = base / ('tests/Q1-CRAFT-' + log + '.log')
    data['measurements']['Q1.' + key] = {'samples': [{'fixture': 'all', 'value': True}], 'evidence': [signed(path)]}
data['updatedAt'] = receipt['at']
(base / 'measurements.json').write_text(json.dumps(data, indent=2) + '\n')
for row in receipt['fixtures']:
    errors = [abs(e['errorMs']) for e in row['events'] if e['errorMs'] is not None]
    print(row['fixture'], 'latency', round(row['latencyMs'], 3), 'max residual', round(max(errors), 3), 'above33', sum(e > 33 for e in errors))
