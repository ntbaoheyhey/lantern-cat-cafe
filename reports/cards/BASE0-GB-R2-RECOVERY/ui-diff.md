# Independent BASE0 visual review

Personally visited all9 manifest screens/subviews at1280×720 and1600×900, with the reference app bounds asserted at0,0 and the same width/height. Independently captured and visually inspected Home and Bag app/reference pairs at both sizes (8 local-only PNGs). Raw measured records: reference-observations.json. Capture paths are local inspection evidence; delivery-policy.md excludes them from publication. This is a BASE0 compatibility review, not certification of the future complete CXR1 redesign.

| Area | Independent observation | Disposition |
|---|---|---|
| Shared status and XP | Normal header56px, readable currencies/level/progress/power/sync/wallet;160×10px XP track. The midGame capture has0XP, while the static reference has a nonzero example. Independent repeat cases prove25% and75% fill and exact semantic color. | VERIFIED BASE0; actual fixture values are not reference constants. |
| Title/guidance | Candidate adds a distinct title/action row below the reference's single status header. It is contained and actionable at both sizes. | ACCEPTED DOCUMENTED DIFFERENCE under baseline-hud-layout.md; C4−1 for the explained retained difference. |
| Guidance wording | Decorative “NEXT” sits next to the action's “Next:” prefix, visible in both Home and Bag captures. | EXPLAINED MINOR DEBT; C4−1. This review does not call the repeated wording fixed or pixel-matched. |
| Home grid | Candidate has hero/goal on the left, stage in the center and loot on the right; reference has the larger stage left and context cards right. Battle-log sizing/spacing differs. | UNCHANGED BASELINE under the user's phased CXR1 scope; StageLayout/Home source is unchanged by BASE0. Not presented as redesign fidelity. |
| Bag | Candidate has real empty0/200 inventory, compact cells, pill filters and disabled details; reference has populated12/40 inventory, larger cells and active detail actions. Content and control spacing differ. | UNCHANGED BASELINE / DIFFERENT FIXTURE; future populated Bag design acceptance remains CXR1 work. No new BASE0 defect hidden by this disposition. |
| Reference art and values | Real Fish/Yarn names, original repository art, actual progression, sync, chapter status and wallet state differ from placeholders. | AUTHORITATIVE SOURCE DATA; reference placeholder art/data is not copied or substituted. |
| Rail | Seven destinations in the expected Home/Bag/Map/Forge/Market/Hero/Help order. Original icons and logo differ from mockup art. | VERIFIED: all7 keyboard destinations at both sizes, visible focus, Enter into panel, Escape back to rail. |
| Map, Forge subviews, Market, Hero, Help | Required surfaces are reached in both sizes; selected navigation and visible content are checked. Existing feature-specific layout/content differs from the future reference design. | VERIFIED BASE0 COMPATIBILITY; future feature cards/CXR1 retain their own acceptance. |
| Motion, clipping, overflow | Effects coverage proves actual9screen visits in normal and reduced modes; reduced motion has no transform/slide animation. Guest/local-signed audits each cover18 visits with zero layout findings or unexpected errors. | VERIFIED in effects-*/summary.json, audit-*/findings.json. |
| Accessibility | Keyboard traversal and focus ring checks pass at both sizes. Contrast tests cover restored text/XP semantic token pairs in both themes. | VERIFIED in keyboard.json and logs/contrast.log. |

No OPEN BASE0 row remains. Accepted differences and future-card baseline debt remain explicit; they are not claimed repaired.
