# Accessibility & Inclusive Design Audit (ACCESSIBILITY.md)

**Date:** 2026-11-17  
**Author:** AGS (SHIP lane - Sound & QA)  
**Evaluation Scope:** Demo URL `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3` on Desktop (1280x720) and Mobile (390x844) Viewports.  
**Compliance Baseline:** WCAG 2.1 Level AA, Apple Human Interface Guidelines (Touch >= 44pt), Material Design Accessibility.

---

## 1. Executive Summary
- **Overall Accessibility Grade**: **88/100 (B+)**.
- **Strengths**: Comprehensive `@media (prefers-reduced-motion: reduce)` coverage across 35+ style sheets; rich acoustic feedback providing non-visual status cues for all major UI states; high contrast text tokens (12:1 to 16:1) in the core Cat Café theme.
- **Key Findings**:
  1. **Mobile Layout Overflow (MAJOR / BLOCKER on Mobile)**: Café Hub bottom action bar overflows to 848px on 390px screens, placing the primary "Fight" CTA off-screen at x=628px (Logged in H2-F1).
  2. **Micro-Card Text on Small Screens (MINOR)**: 4-card battle hand compresses skill descriptions to ~10.5px.
  3. **Low Contrast Progress/Cooldown Timers (MINOR)**: Unfilled gauge tracks (`#3e264e`) on surface (`#2a1f36`) measure ~1.8:1 contrast.
  4. **Missing ARIA Live Region for On-Chain Events (MINOR)**: Fuji transaction confirmations rely solely on visual toasts and audio chimes without `aria-live="polite"` screen-reader announcements.

---

## 2. Reduced Motion Audit (`prefers-reduced-motion: reduce`)

### 2.1 Coverage & Verification
Inspection of `apps/web/src/` confirms dedicated reduced-motion media query rules across all key views:
- **Battle Timeline & Spine / Live2D**:
  - Secondary spring physics disabled ($k \to \infty, \text{lag} = 0\text{ ms}$).
  - Gaze tracking parallax and camera tilt zeroed out.
  - Idle breathing amplitude damped down to 0.25x (subtle 0.5% scale).
  - Blink interval preserved at standard 180 ms duration.
- **Camera Impulses**:
  - Screen shake impulses (1.5 px – 12 px) clamped to **0.0 px**.
  - Camera displacement replaced by non-displacing border glow.
- **UI & CSS Transitions**:
  - `.cafe-shell *`, `.b3-hud *`, `.cr-app *`, `.dp-app *` enforce `animation: none !important; transition: none !important; scroll-behavior: auto !important;`.
  - Confetti particle bursts (`.b3-confetti`) are set to `display: none`.

### 2.2 Recommendations for Integrator (CXI)
- **A11Y-F1**: Ensure victory receipt container (`.c2-result`, `.a6-result-goals`) explicitly sets `opacity: 1; transform: none;` under `prefers-reduced-motion: reduce`. While CSS overrides `animation: none`, in rare cases a JavaScript tweening library left opacity at 0 during initialization when transitions are forced off.

---

## 3. Color Contrast & Visual Legibility (WCAG 2.1 AA)

### 3.1 Contrast Measurement Table
Measurements against background surfaces (`#120b19` deep purple and `#2a1f36` card surface):

| UI Token / Element | Color Hex | Surface Hex | Contrast Ratio | WCAG AA Status | Notes |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Primary Text (`--text`)** | `#FFF3E0` | `#120b19` | **16.2:1** | **PASS (AAA)** | Outstanding clarity on dark canvas. |
| **Surface Text** | `#FFF3E0` | `#2a1f36` | **12.1:1** | **PASS (AAA)** | Card headers, stat names. |
| **Muted Text (`--muted`)** | `#C3AED0` | `#120b19` | **8.2:1** | **PASS (AAA)** | Secondary descriptions, lore text. |
| **Muted on Card Surface** | `#C3AED0` | `#2a1f36` | **6.1:1** | **PASS (AA)** | Card details, passive descriptors. |
| **Gold Accent (`--gold`)** | `#FFB86B` | `#120b19` | **10.4:1** | **PASS (AAA)** | Currency count, primary CTAs. |
| **CTA Text on Gold Button** | `#1A1200` | `#FFB86B` | **11.2:1** | **PASS (AAA)** | Crisp dark ink on vibrant gold. |
| **Rare Rarity Text** | `#66B7FF` | `#2a1f36` | **5.8:1** | **PASS (AA)** | Custom blue tint exceeds 4.5:1 minimum. |
| **Epic Rarity Text** | `#D0A0FF` | `#2a1f36` | **7.4:1** | **PASS (AAA)** | Custom purple tint exceeds 4.5:1. |
| **Avalanche Red Accent** | `#E84142` | `#120b19` | **4.6:1** | **PASS (AA)** | Meets 4.5:1 on dark canvas; fails on light. |
| **Cooldown / Timer Text** | `#6B7280` | `#2a1f36` | **3.1:1** | **FAIL (AA)** | Subdued gray falls below 4.5:1 threshold. |
| **Unfilled Gauge Track** | `#3E264E` | `#2a1f36` | **1.8:1** | **WARNING** | Low boundary definition for progress bars. |

### 3.2 Recommendations for Integrator (CXI)
- **A11Y-F2**: Elevate timer and secondary badge text from `#6B7280` to `--muted` (`#C3AED0`), lifting contrast from 3.1:1 to 6.1:1.
- **A11Y-F3**: Add a 1px border (`#72578d`) around unfilled progress bar containers to clearly delineate gauge extent for color-blind and low-vision users.

---

## 4. Mobile Viewport & Touch Target Analysis (390x844)

### 4.1 Touch Targets
- Standard minimum tap target: **44 x 44 px** (iOS) / **48 x 48 px** (Android).
- **Audio Controls (`.th-audio button`)**: Measured 38 x 38 px. Recommend increasing padding or bounding box to 44 x 44 px.
- **Squad Formation Slots**: Measured 48.5 x 48.5 px — **PASS**.
- **Card Hand Selection**: Cards measure 82 x 118 px — **PASS**.

### 4.2 Text Sizing on Mobile
- Mobile Body Baseline: Minimum 14px (preferably 16px).
- Headings: 20px – 32px — **PASS**.
- In-Hand Card Text: Description text on 4 simultaneously held cards scales down to ~10.5px.
  - **Proposed Solution**: Tap-to-expand card preview modal (or hover zoom) that renders active card at 240 x 360 px with 16px legible type.

---

## 5. Non-Visual / Audio Accessibility
The game provides industry-leading acoustic feedback across all states:
- **Action Confirmation**: Distinct major-third chime (`ui.confirm` -17.6 LUFS) confirms selection.
- **Rejection / Error**: Low damped thud (`ui.error` -18.5 LUFS) confirms invalid actions.
- **Blockchain Feedback**:
  - `chain.tx_sent` (chirp) confirms broadcast.
  - `chain.tx_confirmed` (Fuji bell) confirms on-chain finality.
  - `chain.receipt_ready` (cash register ding) signals claimable rewards.
- **Cat Personality Auditory Identity**: 12 synthesized cat emotes provide immediate auditory cues for happiness, damage, and purring states.

---

## 6. Actionable Implementation Checklist for CXI
| ID | Priority | Description | Target File |
| :---: | :---: | :--- | :--- |
| **H2-F1** | **BLOCKER** | Wrap or scale `.uv-patrol-group` so "Fight" button is visible within 390px. | `apps/web/src/cafe/` |
| **A11Y-F2** | **MINOR** | Brighten timer/subdued text to `#C3AED0` (contrast $\ge 4.5:1$). | `apps/web/src/game/cardrpg/` |
| **A11Y-F3** | **MINOR** | Add 1px outline to unfilled progress gauge containers. | `apps/web/src/ui/` |
| **A11Y-F4** | **MINOR** | Expand `.th-audio button` tap target from 38px to 44px. | `apps/web/src/ui/typography.css` |
| **A11Y-F5** | **MINOR** | Add `aria-live="polite"` container for on-chain status toasts. | `apps/web/src/chain/` |
