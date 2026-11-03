#!/usr/bin/env python3
"""Build the standalone UI review and its repo demo copy; never replace an image."""
import hashlib
import html
import json
import re
import struct
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'reports/ui'


def png_size(path):
    raw = path.read_bytes()
    assert raw[:8] == b'\x89PNG\r\n\x1a\n', path
    return struct.unpack('>II', raw[16:24])


def collect():
    rows = []
    cxr = json.loads((OUT / 'cards/CXR2/captures.json').read_text())
    for row in cxr['captures']:
        path = row['path'].replace('screenshots/ui-2026-11-03/', 'screenshots/ui/2026-11-03/')
        rows.append({'card': 'CXR2', 'path': path, 'phase': row['phase'], 'label': row['label']})
    folders = [
        ('ART2', 'screenshots/ui/art2-builder', 'local sample'),
        ('MOTION', 'reports/ui/cards/MOTION/performance-release', 'normal / reduced sample'),
        ('MOTION', 'screenshots/ui/motion-release-review', 'final corrected UI'),
        ('MOTION', 'screenshots/ui/gallery-before-motion', 'before maximum-value repair'),
        ('PREVIEWS', 'screenshots/ui/previews-final-review', 'final UI regression'),
        ('PREVIEWS', 'screenshots/ui/previews-samples-review', 'Sample / Unavailable'),
        ('FIRSTPLAY', 'screenshots/ui/firstplay-final-review', 'local verified journey'),
        ('FIRSTPLAY', 'screenshots/ui/gallery-before-firstplay', 'before reward-heading contrast repair'),
    ]
    for card, folder, phase in folders:
        for path in sorted((ROOT / folder).glob('*.png')):
            if folder.endswith('motion-release-review') and path.stem.startswith('motion-'):
                continue
            if folder.endswith('previews-final-review') and path.stem.startswith(('runes-', 'companions-', 'skills-')):
                continue
            rows.append({'card': card, 'path': str(path.relative_to(ROOT)), 'phase': phase, 'label': path.stem})
    for row in rows:
        path = ROOT / row['path']
        row['width'], row['height'] = png_size(path)
        row['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
        assert (row['width'], row['height']) in [(1280, 720), (1600, 900)], row
        row['label'] = re.sub(r'-(1280|1600)(x(720|900))?', '', row['label']).replace('-', ' ')
    assert len({row['path'] for row in rows}) == len(rows)
    for card in ['CXR2', 'ART2', 'MOTION', 'PREVIEWS', 'FIRSTPLAY']:
        assert {row['width'] for row in rows if row['card'] == card} == {1280, 1600}, card
    coverage = {}
    for row in rows:
        coverage.setdefault((row['card'], row['phase'], row['label']), set()).add(row['width'])
    assert all(widths == {1280, 1600} for widths in coverage.values()), {
        '/'.join(key): sorted(widths) for key, widths in coverage.items() if widths != {1280, 1600}
    }
    return rows


CSS = '''
:root{color-scheme:dark;font:16px/1.5 system-ui,sans-serif;background:#120b19;color:#fff3e0}
*{box-sizing:border-box}body{max-width:1500px;margin:auto;padding:28px}h1,h2{color:#ffb86b;line-height:1.2}h1{margin:0}h2{margin-top:40px}a{color:#ffb86b}p{max-width:95ch}.muted,small{color:#c3aed0}.notice{border:2px solid #ffb86b;background:#2a1f36;padding:16px}
.table-wrap{overflow:auto}table{border-collapse:collapse;width:100%;font-size:14px}th,td{padding:10px;text-align:left;border:1px solid #72578d}th{background:#3a2c4a}td{background:#2a1f36}code{font-size:12px;overflow-wrap:anywhere}
.controls{display:flex;flex-wrap:wrap;gap:18px;margin:24px 0;padding:14px;background:#2a1f36;border:2px solid #72578d}.controls label{display:grid;gap:4px}select,input,button{font:inherit;color:#fff3e0;background:#120b19;border:1px solid #72578d;min-height:44px;padding:8px 12px}button{cursor:pointer}a:focus-visible,button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #ffd75e;outline-offset:3px}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.capture{margin:0;border:2px solid #72578d;background:#2a1f36;box-shadow:3px 3px #000}.capture[hidden]{display:none}.capture img{display:block;width:100%;height:auto;image-rendering:pixelated}figcaption{padding:12px 14px}figcaption strong,figcaption small{display:block}video{width:100%;max-height:700px;background:#120b19}.video-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}.video-grid figure{margin:0;background:#2a1f36;border:2px solid #72578d;padding:12px}.links{display:flex;flex-wrap:wrap;gap:18px}footer{border-top:1px solid #72578d;padding-top:20px;margin-top:40px}@media(max-width:800px){body{padding:16px}.grid,.video-grid{grid-template-columns:1fr}}
'''
JS = '''
const cards=document.querySelector('#card-filter'),sizes=document.querySelector('#size-filter'),search=document.querySelector('#search');
function filter(){let visible=0;document.querySelectorAll('.capture').forEach(row=>{row.hidden=(cards.value!=='all'&&row.dataset.card!==cards.value)||(sizes.value!=='all'&&row.dataset.width!==sizes.value)||!row.dataset.label.includes(search.value.toLowerCase());if(!row.hidden)visible++});document.querySelector('#result-count').textContent=visible+' captures shown'}
[cards,sizes,search].forEach(control=>control.addEventListener('input',filter));document.querySelector('#clear').addEventListener('click',()=>{cards.value='all';sizes.value='all';search.value='';filter()});filter();
'''


def measurements():
    source = json.loads((ROOT / 'screenshots/ui/firstplay-final-review/capture-source.json').read_text())
    firstplay = next(card for card in json.loads((OUT / 'programme.json').read_text())['cards'] if card['id'] == 'FIRSTPLAY')
    assert source['head'].startswith(firstplay['head']), 'Journey captures are from a different candidate'
    for row in source['files']:
        assert hashlib.sha256((ROOT / row['path']).read_bytes()).hexdigest() == row['sha256'], row['path']
    performance = json.loads((OUT / 'cards/MOTION/performance-release/fps.json').read_text())['samples']
    assert len(performance) == 4 and all(row['cls'] == 0 and not row['errors'] and not row['writes'] for row in performance)
    fps = [row['fps'] for row in performance]
    timing_files = sorted((ROOT / 'screenshots/ui/firstplay-final-review').glob('timing-*.json'))
    assert timing_files, 'Missing fresh natural-reward timing evidence'
    timing = [json.loads(path.read_text()) for path in timing_files]
    for row in timing:
        assert not row['blankFrames'] and not row['errors'] and not row['writes']
        assert all(color['ratio'] >= 4.5 for color in row['contrast'])
    assert {row['width'] for row in timing} == {1280, 1600}
    def span(key):
        values = [row['timing'][key] / 1000 for row in timing]
        return f"{min(values):.2f}–{max(values):.2f}"
    return {'homeSeconds': span('homeMs'), 'earnSeconds': span('firstEarnMs'),
            'timingRuns': len(timing), 'fpsMin': min(fps), 'fpsMax': max(fps),
            'p95MaxMs': max(row['p95Ms'] for row in performance), 'cls': 0}


def render(rows, cards, prefix, measured):
    esc = html.escape
    link = lambda path: prefix + quote(path, safe='/')
    body = ['<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Taskbar Hero · Six-card UI review</title><style>' + CSS + '</style></head><body>',
            '<header><h1>Taskbar Hero · Six-card UI review</h1><p>Original art, stable motion and a visible guest journey. Desktop evidence at 1280×720 and 1600×900; every image opens at native size.</p>',
            '<p class="notice"><strong>Release status is listed below.</strong> Captures are local review evidence. Sample screens do not grant ownership, and no wallet transaction is demonstrated here. ART2 and conditional previews keep the existing production flag OFF. Before-repair captures intentionally show earlier defects.</p></header>',
            '<div class="table-wrap"><table aria-label="Card release index"><thead><tr><th>Card / report</th><th>PR</th><th>Fresh self-grade</th><th>Reviewed head</th><th>Main / live state</th></tr></thead><tbody>']
    for card in cards:
        pr = f'<a href="{esc(card["pr"])}">#{card["pr"].rsplit("/",1)[-1]}</a>' if card.get('pr') else '<a href="https://github.com/ntbaoheyhey/taskbar-hero/blob/ai/codex-ui-ledger/reports/ui/FINAL-REPORT.md">Release receipt</a>'
        body.append(f'<tr><th scope="row"><a href="{link(card["report"])}">{esc(card["id"])} · {esc(card["name"])}</a></th><td>{pr}</td><td>{esc(card["grade"])}</td><td><code>{esc(card["head"])}</code></td><td>{esc(card["state"])}</td></tr>')
    body += ['</tbody></table></div>', '<p class="links"><a href="' + link('reports/ui/FINAL-REPORT.md') + '">Final report</a><a href="' + link('reports/ui/cards/index.html') + '">Card reports</a><a href="' + link('docs/ui/art/art2.html') + '">All 33 original assets</a><a href="' + link('reports/ui/gallery-manifest.json') + '">Capture hashes and provenance</a><a href="' + link('screenshots/ui/firstplay-final-review/capture-source.json') + '">Guest timing provenance</a><a href="' + link('reports/ui/cards/MOTION/performance-release/fps.json') + '">Raw motion timing</a></p>',
             f'<section aria-labelledby="journey-title"><h2 id="journey-title">Guest journey</h2><p>Fresh local measurements across {measured["timingRuns"]} runs, including first-visit Help: Home in {measured["homeSeconds"]} seconds; first natural reward in {measured["earnSeconds"]} seconds. No seeded save, manual claim or accelerated clock. The existing 30-second claim interval remains unchanged. Zero blank frames and reward text contrast of at least 4.5:1 in every measured run. Raw timings stay with the final journey captures.</p></section>',
             '<h2>Screen and state evidence</h2><div class="controls"><label>Card<select id="card-filter" aria-label="Card"><option value="all">All cards</option>' + ''.join(f'<option>{esc(card)}</option>' for card in ['CXR2','ART2','MOTION','PREVIEWS','FIRSTPLAY']) + '</select></label><label>Viewport<select id="size-filter" aria-label="Viewport"><option value="all">Both sizes</option><option value="1280">1280 ×720</option><option value="1600">1600 ×900</option></select></label><label>Find a screen or state<input id="search" type="search" placeholder="Home, offline, empty, before…"></label><button type="button" id="clear">Show all</button></div><p id="result-count" role="status"></p><main class="grid">']
    for row in rows:
        label = f'{row["card"]} · {row["phase"]} · {row["label"]}'
        body.append(f'<figure class="capture" data-card="{row["card"]}" data-width="{row["width"]}" data-label="{esc(label.lower())}"><a href="{link(row["path"])}"><img loading="lazy" src="{link(row["path"])}" width="{row["width"]}" height="{row["height"]}" alt="{esc(label)} at {row["width"]} by {row["height"]}"></a><figcaption><strong>{esc(label)}</strong><small>{row["width"]} ×{row["height"]} · SHA-256 {row["sha256"][:12]}</small></figcaption></figure>')
    body += [f'</main><section><h2>Motion recordings</h2><p>Four isolated UI timing samples average {measured["fpsMin"]:.3f}–{measured["fpsMax"]:.3f} fps, with maximum p95 frame time {measured["p95MaxMs"]:.1f} ms and CLS 0. Normal and reduced motion reach the same final state. Separate full-stage recordings include screenshot and video overhead; their raw timing is kept with the motion report.</p><div class="video-grid">']
    for size in ['1280x720','1600x900']:
        for mode in ['normal','reduced']:
            videos = list((ROOT / f'screenshots/ui/motion-effects-release-{size}/video-motion-{mode}').glob('*.webm'))
            assert len(videos) == 1
            path = str(videos[0].relative_to(ROOT))
            body.append(f'<figure><video controls preload="none" aria-label="Stage motion {mode} at {size}"><source src="{link(path)}" type="video/webm"></video><figcaption>{size} · {mode} motion · local sample</figcaption></figure>')
    body += ['</div></section><footer><p>Original images are preserved. Superseded drafts <a href="https://github.com/ntbaoheyhey/taskbar-hero/pull/257">#257</a> and <a href="https://github.com/ntbaoheyhey/taskbar-hero/pull/252">#252</a> remain open and must not be merged.</p><p class="muted">Standalone HTML. No remote scripts, fonts, network fetches or server are needed to view captures and play the local recordings.</p></footer><script>' + JS + '</script></body></html>']
    return '\n'.join(body) + '\n'


def final_report(rows, cards, measured):
    lines = ['# Taskbar Hero — six-card UI report', '',
             '| Card | PR | Self-graded (fresh pass) | Merged commit | Live state |',
             '| --- | --- | --- | --- | --- |']
    for card in cards:
        pr = f'[#{card["pr"].rsplit("/", 1)[-1]}]({card["pr"]})' if card.get('pr') else 'See UI ledger release receipt'
        merged = '340f88b' if card['id'] == 'CXR2' else '—'
        lines.append(f'| {card["id"]} | {pr} | {card["grade"]} | {merged} | {card["state"]} |')
    lines += ['', f'The gallery indexes {len(rows)} captures at 1280×720 and 1600×900, with native-size links, screen/state filters and four playable local motion recordings. Original captures and before-repair evidence remain intact.', '',
              f'Across {measured["timingRuns"]} fresh local guest runs, Home appears in {measured["homeSeconds"]} seconds and the first natural reward in {measured["earnSeconds"]} seconds. Tests use the real claim interval without seeded saves, manual claims or accelerated clocks. Every measured run has zero blank frames, errors and network writes; reward text passes 4.5:1 contrast.', '',
              f'Four isolated motion samples measure {measured["fpsMin"]:.3f}–{measured["fpsMax"]:.3f} fps, p95 ≤ {measured["p95MaxMs"]:.1f}ms and CLS 0. Reduced motion reaches the same final state instantly. Stage recordings are local samples, not funded mints.', '',
              'Release blocker: Vercel reported more than 100 deployments on 2026-11-03 UTC. The nonce health hold cleared after two HTTP 200 responses 628.63 seconds apart on 2026-11-04 Vietnam time; no backend deployment or migration was performed. Main/live remains 340f88b. ART2 and later cards remain parked drafts under the deployment-capacity rule. Recheck capacity after 2026-11-04T00:00Z; the provider 24-hour window may last longer. The overnight report and optional owner steps are on ai/codex-ui-ledger. Scores and measurements below belong to the named accepted candidate heads, not this documentation refresh or the current live build.', '',
              'The authoritative rune/companion/skill ownership selector remains absent. Conditional previews use only the existing default-OFF flag and label every entry Sample/Unavailable, without ownership or persistence writes.', '',
              'Superseded drafts [#257](https://github.com/ntbaoheyhey/taskbar-hero/pull/257) and [#252](https://github.com/ntbaoheyhey/taskbar-hero/pull/252) remain open untouched and must not be merged.', '',
              'Review: [gallery](gallery.html), [one-page card index](cards/index.html), [static repo demo](../../docs/ui/demo/index.html), [capture hashes and raw measurements](gallery-manifest.json). Exact-head fresh grades, failure history, scope and release receipts are maintained on [ai/codex-ui-ledger](https://github.com/ntbaoheyhey/taskbar-hero/tree/ai/codex-ui-ledger/reports/ui).', '']
    return '\n'.join(lines)


def main():
    cards = json.loads((OUT / 'programme.json').read_text())['cards']
    for card in cards:
        assert (ROOT / card['report']).is_file(), card
    required = ['reports/ui/cards/MOTION/performance-release', 'screenshots/ui/motion-release-review', 'screenshots/ui/previews-final-review', 'screenshots/ui/firstplay-final-review']
    for folder in required:
        assert any((ROOT / folder).glob('*.png')), 'Missing final evidence: ' + folder
    rows = collect()
    measured = measurements()
    (OUT / 'gallery-manifest.json').write_text(json.dumps({'cards': cards, 'measurements': measured, 'captures': rows}, indent=2) + '\n')
    (OUT / 'FINAL-REPORT.md').write_text(final_report(rows, cards, measured))
    (OUT / 'gallery.html').write_text(render(rows, cards, '../../', measured))
    demo = ROOT / 'docs/ui/demo/index.html'; demo.parent.mkdir(parents=True, exist_ok=True)
    demo.write_text(render(rows, cards, '../../../', measured))
    gallery = ROOT / 'docs/ui/gallery/index.html'; gallery.parent.mkdir(parents=True, exist_ok=True)
    gallery.write_text(render(rows, cards, '../../../', measured))
    index = ['<!doctype html><html lang="en"><meta charset="utf-8"><title>Taskbar Hero UI card index</title><style>' + CSS + '</style><h1>UI card index</h1><p><a href="../gallery.html">Open the complete static gallery</a></p><ol>']
    for card in cards:
        index.append(f'<li><a href="../../../{quote(card["report"], safe="/")}">{html.escape(card["id"])} · {html.escape(card["name"])}</a> — {html.escape(card["state"])}</li>')
    index.append('</ol>'); (OUT / 'cards/index.html').write_text('\n'.join(index) + '\n')
    print(json.dumps({'captures': len(rows), 'cards': len(cards), 'outputs': ['reports/ui/gallery.html', 'docs/ui/demo/index.html', 'docs/ui/gallery/index.html', 'reports/ui/cards/index.html']}))


if __name__ == '__main__': main()
