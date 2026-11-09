# M2 — battle-language readability
Chữ và số đã tách rõ: 1.176 khung kiểm tra không chồng lấn, tràn hay thiếu nhãn.
Ưu tiên tối đa ba dấu trên thân; mọi trạng thái vẫn có trong huy hiệu và mục +N.
Độ sáng quái so với sàn đạt 0,262–0,364, nhưng chất liệu còn nhạt/phẳng và cần xem lại.
Kích thước trùm còn PARTIAL 1,52–1,84 lần; giữ khung an toàn sau khi bản lớn hơn bị cắt đầu.
Tiếp tục bộ VFX rồi tích hợp luật S5; video hiện tại là fixture, chưa phải trận Skills V5 thật.

Source `2e6ee6425`, stacked on M1 #416. Artifact SHA256 `f618aabdde185ba23398dcdf65b59c7fb737349d0eab04618cd3e01f821da0b3`,29,153,560bytes.
Body priority is highest-stack debuff, then control, then buffs; badge content is unchanged. Narrow numeric reservations cure the inherited P6/1024 unplaced pair. Gallery/earned slots keep Sorrel clear of Soot. First-seen keyword hints are closable, last2s, and disabled in the dev harness.
Wildfire travels in staggered fronts, Rupture tensions/snaps, Spread flies status-specific motifs. Rupture/Spread still need stronger material/motion identity in MX.

| Gate | Result | Evidence |
|---|---|---|
| Five seeds ON/OFF/base parity |Exact;10fixture plans unmutated|[parity](parity4/parity.json.gz)|
| Text collision windows |1176frames/30windows;0overlap/outside/unplaced|[receipt](collide4/collisions.json.gz)|
| P1–P17 at3widths |51shots;0layout failures;contrast≥4.618:1|[shots](shots4/shots.json.gz)|
| Protected faces |90P-shot masks+48ultimate masks,0offenders|[faces](faces4/faces.json.gz),[ultimate checks](extras4/extras.json.gz)|
| Material separation |18masks,min0.262 vs0.18;surface depthPARTIAL|[readability](readability4/readability.json.gz)|
| Boss hierarchy |1.517–1.843x vs2x;allvertices inside;PARTIAL|[full13enemy roster](roster4/roster.json.gz)|
| Casts first+repeat |168windows;native16.8ms/CPU4 33.3ms;125draws/173949tris|[casts](casts4/casts.json.gz)|
| Typecheck/lint/unit/build |PASS;1798web tests;full workspace checks retained|[logs](gates)|
| Full E2E |421/421 PASS; no retries|[log](gates/e2e5.log)|
| Keyboard/Escape/reduced motion |12casesPASS;hint close/gallery bounds3widthsPASS|[UI](ui2/ui.json.gz),[extras](extras4/extras.json.gz)|
| OFF startup |11loaded chunks same bytes+members;0Three/models|[comparison](startup-comparison.json)|

[1440 review](review4-1440.webp),[1024 review](review4-1024.webp),[continuous20s fixture clip](https://github.com/ntbaoheyhey/taskbar-hero/blob/3a8ed4c08f2dd0b7032d25259631a5132e4cb804/reports/cardrpg-look/skills-v5/full/m2/video/M2-after-20s.mp4),[clip samples](video/clip-review.webp),[five concrete flaws](FRESH-EYES.md). Original failed material/framing samples remain in readability1/2/3 and roster2/3; no sample replaced. Material polish and boss scale reached3attempt cap and revisit inM4. M1 single-upload51.5ms miss remains for MX atlases.
No rule/default/A-owned changes. Live integration remains unverified. M3 will consume published S5 #417, including ally-splash; early skill-use feedback posted to B-OUTBOX.

| Self-score criterion | Weight | Score | Evidence / assessment |
|---|---|---|---|
| Skill VFX beauty |22%|4.5|[MX0 audit](../VFX-AUDIT.md):4.517mean; several sparse skills.|
| Status readability |15%|8|[shots](shots4/shots.json.gz):body cap,framed badges,0layout failures.|
| Combo/reaction legibility |12%|7|[motion strips](reactions1):words clear;Rupture/Spread motion still small.|
| Multi-target clarity |8%|7.5|[clip](https://github.com/ntbaoheyhey/taskbar-hero/blob/3a8ed4c08f2dd0b7032d25259631a5132e4cb804/reports/cardrpg-look/skills-v5/full/m2/video/M2-after-20s.mp4):separate landings/numbers.|
| Unit/monster readability |8%|6|[review](review4-1440.webp):value pass;flat materials and boss ratio miss.|
| Performance |15%|8|[summary](summary.json):cast pass;M1cold pass,texture upload remains.|
| Live integration correctness |15%|2|Fixture only;S5 source is available forM3.|
| Size/startup/compatibility |5%|8|29.15MB,OFF bytes/membership and reduced-motion pass.|
Weighted self-score **6.01/10**,not a human playtest. Lowest lines VFX/live: MX1toolkit and M3 input/schema preparation are the next queued work; no manual handoff.
