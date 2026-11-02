# BASE0 HUD: status header and guidance context

Accepted by Codex under the scoped HUD repair authority, 2026-11-01.

## Context

At 1280×720 the intrinsic status row left about 19px for the next-action text. Error labels and fallback fonts could consume the rest. XP's intrinsic grid allocated only 8px to its track. The approved reference uses currencies, a roughly 159px green XP track, then power and wallet. The implementation also needs to retain chapter progress, sync status, the title, actionable guidance and a gated power explanation.

## Options

1. Compress the existing single row. This leaves guidance dependent on status text length and font metrics.
2. Give status and guidance separate rows, using the compact shell's existing context pattern at every size.

## Choice and rationale

Use option 2. Desktop status order is currencies → level/XP → chapter progress → power → sync/wallet. Move the existing title and unchanged action into a context row below the header. The action may wrap and gets the row's remaining width; it keeps its accessible name, focus behavior and callback. Nothing becomes a tooltip-only or hidden desktop control.

Reserve a 160px × 10px desktop XP track and retain `--good` for the fill. This dimensional allowance matches the approved track; existing font, spacing, color and border tokens remain. The normal desktop header uses the existing 56px HUD dimension. Preserve the separate gated explanation allowance (80px header), so ancestor clipping does not return. Intermediate widths may wrap the status row. The existing ≤600px grid, normal topbar ≤72px, HUD ≤88px and wallet 44×44 constraints remain.

The extra context row and the retained progress/sync/gated information are deliberate differences from the reference. Current currency names (Fish/Yarn), art and seven rail destinations remain. This decision changes no rules, backend behavior or flag default.

## Verification and reversal

`apps/web/e2e/ui/baseline-hud.spec.ts` measures the full action text, clipping ancestors, header/context/viewport containment, keyboard navigation and XP fill at two nonzero values, plus local offline/429/503 states with fallback fonts. Existing HUD, u3-layout and resize assertions retain their thresholds.

To reverse, move title/guidance back into the header and remove the desktop sizing/context rules in `shell.css`. First provide another layout that passes the complete-text and XP regressions; the former truncation is not an acceptable reversal.
