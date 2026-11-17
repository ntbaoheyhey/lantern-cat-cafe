# Phone Screen Legibility & Mobile QA Audit (390x844 Viewport)
> [!WARNING]
> **STATUS: INVALID: legacy surface / stale images**
> Evaluated committed screenshots from 24 Oct (`apps/web/src/boss/screenshots`, `market/screenshots`). RETRACTED per FRESHNESS RULE. Superseded by fresh live captures on the V5 demo route.

- Audit Basis: Existing mobile captures in `apps/web/src/boss/screenshots/390-*.png` and `apps/web/src/market/screenshots/market-390.png` [STALE ARTIFACTS - RETRACTED].
- Target Device: iPhone 14 / mobile webview (390 px logical width).

---

## 1. Key Visual & Layout Findings

| Component / Screen | Finding / Observation | Severity | Impact on Judge Demo | Recommended Fix / Owner |
|---|---|---|---|---|
| **Navigation Tabs** (`390-mid-fight.png`) | Rightmost tab "Market" is clipped as **"Mark"** due to flex layout overflow on 390 px width. | **MAJOR** | Judge on mobile immediately notices broken tab text. | CXI / web layout: reduce tab horizontal padding or add scroll-snapping. |
| **Damage Float Overlay** (`390-mid-fight.png`) | Combat floating damage number (`-30`) renders directly on top of the health bar label `"Yarn Giant · Level 1"`. | **MINOR** | Optical collision makes boss level and damage digits hard to parse at a glance. | CXV: offset floating text $Y$ position $+16\text{ px}$ above health bar container. |
| **Action CTA Buttons** (`390-mid-fight.png`) | Primary CTA (`TRY THE BOSS`, `FIGHT`, `BUY`) heights are $44-48\text{ px}$ with solid contrast (Orange on Dark). | **PASS** | Meets Apple HIG touch target guidelines ($44\times44\text{ px}$). | Retain current sizing. |
| **Result Modal Text** (`390-result.png`) | "Defeated" summary card has adequate 16px margins, high contrast white text on dark red-bordered surface. | **PASS** | Clear, clean, and legible without horizontal scroll. | Retain. |
| **Market Item Cards** (`market-390.png`) | Relic items stack vertically with 12px gap; prices in AVAX are prominent with gold icons. | **PASS** | Excellent readability; scroll flow is natural. | Retain. |
| **Pixel Font Glyphs** (`market-390.png`) | Minor bitmap font ambiguity: 'C' in CANCEL resembles 'O' (`OANCEL`), and 'C' in Charm resembles 'O' (`Paw Oharm`). | **MINOR** | Mild visual friction for first-time readers. | CXI / typography: verify pixel font kerning / letterforms. |

---

## 2. Summary & Readiness for Q1
- Mobile 390px layout is structurally strong: cards, inputs, and touch targets adapt properly without breaking viewport width.
- High-priority fix needed before judge evaluation: fix navigation tab clipping ("Market" cutoff).
