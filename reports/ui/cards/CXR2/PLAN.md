# CXR2 build preparation
- Import only owned paths from partial c49421f; retain docs decisions and old PR257 untouched.
- Preserve every timeout/assertion. Fix portal queries with dialog-scoped assertions, retain heading names and aria linkage. Initialize helpStore from the already-seeded seen flag in the Relic-specific fixture.
- Correct v2 first-visit guidance from current shared rules (SYSTEM SYS-UI-003).
- Review all desktop screens plus applicable loading/empty/error/offline/wallet/long text/zero/max states. Record N/A for states a screen cannot expose, rather than fabricate gameplay fields.
- Visual polish candidates from CXU3 A: unframed Forge side groups; implementation-oriented odds footnote; rounded rail/Next surfaces; make intended scroll regions keyboard reachable.
- Stress Market with unknown long token IDs and maximum bigint quantities; ensure contained wrapping and truthful loading states.
- Keep screenshots/ui-2026-11-03/cxu3-a-audit as before evidence; capture missing landing/class/shared states on the merged base.
- CXR2 13 inherited failures are acknowledged, not waived. Full A/B gate remains mandatory.

## Verified before-state findings
- HIGH: offline WelcomeBack with a one-hour strong fixture grows above the 1280 viewport; heading and duration are offscreen while the OK button receives focus. The old dialog lacks a bounded keyboard-scroll region.
- MEDIUM: WelcomeBack and ChestReveal use pale fallback surfaces inside the dark desktop app; shared modal tokens need to apply consistently at both desktop sizes.
- HIGH: first-visit v2 Help still describes classic five-fights/Cat-Key forging rules.
- Before images captured from a compiled local candidate (16f940f), not a live wallet path. The two dev-capture attempts and middleware HMR warning remain in source logs; final capture uses the built preview on5360 and explicitly assigns the fixture-loader HMR port5361; clean capture log is cxr2-before-final.log.

## Further implementation notes
- Shared Modal alone does not fix pale loot surfaces: loot.css has hard-coded light selectors. Override them for .ui-modal.loot-dialog using existing dark semantic tokens and verify computed text contrast; preserve all sprites/backdrops.
- Update the WelcomeBack a11y Tab boundary assertions for its newly focusable scroll region, retaining the focus/escape/aria checks.
- First-visit v2 Help should restore focus to the landing/class/Home action if there is no explicit opener; preserve the classic Menu return target.
- Consider adding the existing unchanged CatPortrait to the large first-run class cards; the current class capture has very sparse artwork. Keep original weapon icons/swatch art.
