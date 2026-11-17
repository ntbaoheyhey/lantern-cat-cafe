# REFILL-R2: Finding Re-Verification Audit on Milestone v5-m1

- **URL**: `http://127.0.0.1:6301/?demo=1&squad=1&cardrpg2=1&a6=1&ui=v3`
- **Baseline Tag**: `v5-m1` @ commit `b26cf0e3c`
- **Re-Verification UTC**: `2026-11-17T08:19:59Z`
- **Harness**: Headless Chrome CDP via `work/v5/AGS/qa_r1.mjs`

---

## Re-Verification Audit Matrix

### 1. H2-F1: Mobile 390px Café Hub Bottom Bar Overflow (MAJOR)
- **Original Measurement**: `.uv-patrol` CTA at `x: 628px`, viewport width `390px`, `isPatrolVisibleInViewport: false`.
- **Re-Verification Measurement**:
  - Viewport Width: `390px`
  - `.uv-patrol` Bounding Rect: `{ x: 628, y: 715, width: 220, height: 103 }`
  - Visible in Viewport: `false`
  - Group Scroll Width: `220px` (child element overflow inside scroll container)
- **Determination**: **RECONFIRMED OPEN (MAJOR)**. CXI has accepted this finding and queued it for the `v5-m2` integration merge.

### 2. H2-F2: Battle Receipt Lacks Avalanche Blockchain Proof (MAJOR)
- **Original Measurement**: Receipt text search returned `hasTxHash: false, hasFuji: false, links: []`.
- **Re-Verification Measurement**:
  - `hasTxHash`: `false` (no `0x[a-fA-F0-9]{40,64}` string rendered)
  - `hasFuji`: `false` (no Avalanche Fuji reference)
  - `hasGasFee`: `false` (no gas sponsorship badge)
  - `links`: `[]` (no Snowtrace / Routescan URL)
- **Determination**: **RECONFIRMED OPEN (MAJOR)**. CXI has accepted this finding and queued it for the `v5-m2` integration merge to expose real/local proof distinctions.

### 3. H2-F3: Mobile Prepare Squad Seats Compressed to 48.5px Width (MINOR)
- **Original Measurement**: 4 cat seats compressed to `48.55px` wide slivers.
- **Re-Verification Measurement**: 4 cat seats measure `width: 48.546875px, height: 140.171875px`.
- **Determination**: **RECONFIRMED OPEN (MINOR)**.

### 4. H2-F4: Cold Start Ellipsis Placeholder on Landing Stat Chips (MINOR)
- **Original Measurement**: Landing stat chips show `…` placeholder before backend data loads.
- **Re-Verification Measurement**: `hasEllipsis: true` (`chips: ['… Deeds', '… YARN burned', '… Fused', '… Fuji tx']`).
- **Determination**: **RECONFIRMED OPEN (MINOR)**.

---

## Conclusion & Next Actions
Both MAJOR findings (H2-F1 and H2-F2) remain cleanly reproduced with fresh visual and numerical evidence on `v5-m1`. Because CXI owns game UI wiring and styles, fixes are queued in `codex/v5-int-2026-11-17` for the next milestone tag (`v5-m2` / `v5-m1.N`). Fresh sheets and telemetry are preserved in `reports/v5/AGS/r1/`.
