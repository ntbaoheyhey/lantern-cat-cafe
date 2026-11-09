# Demo integration handoff

Current milestone: U6 (recruit ceremony), branch codex/cardrpg-ui-v3-u6-2026-11-09, stacked on U5 draft #433. U7–U9 still in progress; not a final demo.

Enable via ?ui=v3 or VITE_UI_V3=1. Product defaults OFF; ?ui=legacy overrides demo default. Review tools need ?dev=1 in both shells.

Owned changes: depth/App.tsx shell integration, ui-v3/**, player-mode gating, UI reports/tools/proposal. B paths remain byte-identical; no ui-seams. Preserve B renderer files when merging, and adapt our overlay if its DOM contracts change.

Checklist for final integration: Home → Night Patrol → Prepare → Fight → Result → Home; Recruit and Odds; Relic · Fuji on every non-battle sheet; export/import; old shell with ui=legacy. Still pending: polish, final offline build and gates.

G1 PASS; U3 browser11/11, axe20screen/look pairs0serious/critical; compatibility source identity231files; G7 default entry−3B. G6 idle fallback PASS but production cold-interactive unresolved. See u2/HOME-DECISION.md for retained 3D and fallback measurements.
