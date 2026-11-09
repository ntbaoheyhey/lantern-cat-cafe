"""Add the targeted closure results while retaining the original L7 evidence."""
import json
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[3]
out = root / 'reports/cardrpg-look/closure'
a = json.loads((out / 'audit.json').read_text())
p = a['phase']
life = a['lifecycle']
paired = a['pairedCasts']['observations']
pair_note = '; '.join(f"{r['order']}-{r['variant']}:" + '/'.join(f"{c['max']:.1f}" for c in r['casts']) + 'ms' for r in paired)
url = 'https://github.com/ntbaoheyhey/taskbar-hero/blob/codex/cardrpg-look-closure-2026-11-08/'
original = subprocess.check_output(['git', 'show', '29699ca45:reports/cardrpg-look/CARDRPG-LOOK-REPORT.md'], cwd=root, text=True)
lines = original.splitlines()
lines[:10] = [
    '# Báo cáo LOOK — bàn giao B và kiểm chứng bổ sung',
    'Đã hoàn tất phần trình bày B cho hồi chiêu/đội hình, chuyển pha boss và thông báo nhận mèo theo dữ liệu A4.',
    'Đã kiểm tra thao tác trên ba kích thước desktop; không tràn hàng kỹ năng và không thay đổi tài khoản.',
    'Cả 1.770 kiểm thử web và 421 kiểm thử thao tác qua; typecheck, lint và bản dựng cũng qua.',
    'Kích thước mã tải lúc mở ứng dụng đã về đúng 3.522.500 byte; không tải mô hình/Three ở màn hình mặc định.',
    f"Clover cải thiện 66/66 so sánh liên quan với L4; vẫn còn {a['effectPairs']['originalRegressions']}/2.211 so sánh giảm so với bản gốc.",
    f"24 lượt chiêu mẫu: khung hình chậm nhất {p['castMaxMs']:.1f} ms; tám lượt kiểm tra bốn kỹ năng từng chậm tối đa {max(r['after']['max'] for r in a['targetedCasts']):.1f} ms.",
    f"20 trận phát lại: heap tăng {life['growth']['heap']:,} byte; số tài nguyên GPU không tăng. Đây không phải bằng chứng không có rò rỉ.",
    f"Demo {a['bytes']:,} byte, trong mức 32 MB đã giải trình; khung hình khi tải lạnh chậm nhất {p['coldMaxMs']:.1f} ms vẫn vượt mục tiêu.",
    'Phần B đã bàn giao; A còn nối thông báo nhận mèo vào Invitations, icon/khung và tích hợp bản chung. Các hạn chế được giữ rõ dưới đây.',
]
lines[lines.index(next(s for s in lines if s.startswith('REFERENCE:')))] = 'REFERENCE: docs/cardrpg-look/index.html; closure/audit.json; closure/REVIEW.md; closure/CONTRACT.md; validation/l7/audit.json; validation/l7/freeze.json'
for i, line in enumerate(lines):
    if line.startswith('L7 source '):
        lines[i] = 'Historical ' + line
    elif line.startswith('Verdict:'):
        lines[i] = 'Verdict: B implementation, targeted validation and handoff are complete with measured misses and visible limitations. This is not an all-gates-pass or premium-art claim. Personal art scores below remain from L5; closure changes presentation, startup imports, label allocation and the Clover greenhouse silhouette.'
    elif '|Effects quality|' in line:
        lines[i] = line.replace('1162 strict pair decreases remain', '1162 historical strict decreases; closure reduces this to1140 through66 Clover improvements')
    elif line == '| Validation | L7 measured result |':
        lines[i] = '| Validation | Historical L7 measured result (original artifact retained) |'
    elif line == 'Missed or unverified targets:':
        lines[i] = 'Missed or unverified targets (L7 history retained; closure status above):'
    elif line == '- Exact startup byte parity +93 bytes.':
        lines[i] = '- Historical L7 startup +93bytes; repaired in closure to0byte delta. Loaded module/byte counts match, not all binary hashes.'
    elif line.startswith('Profiles and next fixes:'):
        lines[i] = 'Historical profiles remain in validation/l7/matrix and validation/l7/COLD-REVIEW.md. Closure repairs the startup byte discrepancy, but the new cold traces show GPU token waits and macOS presentation backpressure, including post-ready gaps; they do not establish a source, driver or external-load cause. Further performance work needs isolated GPU/presentation profiling. The registered ABBA comparison retains stalls in both artifacts and cannot establish a causal improvement. Further atlas/model compression requires matched visual review before accepting texture loss.'
    elif line.startswith('Lane A retains icon/frame wiring, checkpoint adoption'):
        lines[i] = 'Lane A owns icon/frame wiring, exact earned-reveal forwarding through Invitations/CompanionPreview, adoption and merged delivery. B A4P1/P3/P4 renderer work is now implemented and verified against published version1 fixtures; live A meta/combat integration is not claimed. See [contract](' + url + 'reports/cardrpg-look/closure/CONTRACT.md). A has not announced adoption of this checkpoint. No A4/A5 rules runtime, shared/protected edits, merge/deploy/main push. Native macOS Apple M3 Pro; no B Docker jobs, subagents or generative calls.'

native = [r for r in a['cold'] if r['throttle'] == 1]
cpu4 = [r for r in a['cold'] if r['throttle'] == 4]
span = lambda rows, key: f"{min(r[key] for r in rows):.1f}–{max(r[key] for r in rows):.1f}"
extra = [
    '',
    '## Closure checkpoint — current artifact',
    '',
    f"Source `{a['source'][:9]}`, artifact `{a['artifact']}`, {a['sourceInputs']} source hashes verified before/after. [Audit]({url}reports/cardrpg-look/closure/audit.json) · [personal review]({url}reports/cardrpg-look/closure/REVIEW.md). Original860cases/1720casts were not repeated or overwritten.",
    '',
    '| Targeted check | Current measured result |',
    '|---|---|',
    '|Presentation|1024×600,1280×720,1440×900;12 skill rows; phase400ms/finish432ms inside1173ms action; receipt dedup/cancel/account invariance;12 focused tests|',
    '|Startup|3,522,500bytes/11scripts;0Three/model modules/requests;all loaded chunk byte counts/module memberships and normalized entry/preload branches match;8/11scripts binary-identical|',
    f"|Cast checks|24hero windows max{p['castMaxMs']:.1f}ms, minimum{p['castWithin20Min']*100:.2f}%≤20ms;8 targeted CPU4 windows max{max(r['after']['max'] for r in a['targetedCasts']):.1f}ms/p95{max(r['after']['p95'] for r in a['targetedCasts']):.1f}ms. The eight pre-change targeted windows peaked at16.8ms; no causal stall-fix claim|",
    f"|Cold7|Hub native {span(native,'loadToInteractiveMs')} ms / CPU4 {span(cpu4,'loadToInteractiveMs')}ms;ready native {span(native,'battleReadyMs')} ms / CPU4 {span(cpu4,'battleReadyMs')}ms;peak{p['coldMaxMs']:.1f}ms. Targeted gallery page max{a['targetedPageMaxAfter']:.1f}ms, separate from casts|",
    f"|Lifecycle|20natural replays/21snapshots;heap+{life['growth']['heap']:,}bytes;GPU geometries/textures/programs unchanged;within2MiB tolerance, not literal flatness|",
    f"|Effects|6fresh captures/15pairs;minimum{a['effectPairs']['minimumDistance']:.6f};no absolute/face/overdraw offenders. Incremental Clover row compared with66 retained L4 rows:66improved/0new decreases;{a['effectPairs']['originalRegressions']}/2211original-baseline decreases remain, not a fresh full-effect run|",
    '',
    'Current missed/unverified gates: ' + ' '.join(a['missedOrUnverified']) + ' Historical L7 misses remain valid. Registered Clover1 ABBA first/repeat: ' + pair_note + '. This small comparison does not clear any failed window or establish a causal patch/driver diagnosis. See closure/COLD-REVIEW.md for GPU-wait evidence. Art scores below are unchanged.',
    '',
    f"[1024 cooldown layout]({url}reports/cardrpg-look/closure/presentation/reviewed/1024-cooldowns.png) · [bounded boss cue]({url}reports/cardrpg-look/closure/presentation/reviewed/1280-boss-phase.png) · [Clover effect]({url}reports/cardrpg-look/closure/effects/reviewed/clover-runtime-1.png). Receipt smoke is B's renderer with A fixtures, not A's live Invitations. Original failed layout/fixture/effect pilot attempts are preserved.",
]
insert = next(i for i, s in enumerate(lines) if s.startswith('| User complaint'))
lines[insert:insert] = extra + ['']
assert len(lines) <= 150, len(lines)
(root / 'reports/cardrpg-look/CARDRPG-LOOK-REPORT.md').write_text('\n'.join(lines) + '\n')
print(json.dumps({'reportLines': len(lines), 'artifact': a['artifact']}))
